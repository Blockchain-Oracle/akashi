// Streaming .tgz reader: keeps only the entries we want, so a 185 MB package never sits in memory.
// Handles ustar prefix+name, pax extended headers ('x') and GNU long names ('L').
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";

const BLOCK = 512;
const NAME_END = 100;
const SIZE_START = 124;
const SIZE_END = 136;
const TYPE_FLAG = 156;
const MAGIC_START = 257;
const PREFIX_START = 345;
const PREFIX_END = 500;
const OCTAL = 8;
const TYPE_FILE = new Set(["0", "\0", "7"]);
const TYPE_PAX = "x";
const TYPE_GNU_LONGNAME = "L";

function cstr(buf: Buffer, start: number, end: number): string {
  const slice = buf.subarray(start, end);
  const zero = slice.indexOf(0);
  return slice.subarray(0, zero === -1 ? slice.length : zero).toString("utf8");
}

function paxPath(data: Buffer): string | undefined {
  for (const line of data.toString("utf8").split("\n")) {
    const match = /^\d+ path=(.*)$/.exec(line);
    if (match) return match[1];
  }
  return undefined;
}

/** Read `url`'s gzip tarball, returning entries whose path matches `keep` (paths as stored in the archive). */
export async function extract(body: ReadableStream<Uint8Array>, keep: (path: string) => boolean): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let buffer: Buffer = Buffer.alloc(0);
  let pending: { path: string; size: number; wanted: boolean; kind: string } | null = null;
  let longName: string | undefined;
  const stream = Readable.fromWeb(body as never).pipe(createGunzip());
  for await (const chunk of stream) {
    buffer = buffer.length ? Buffer.concat([buffer, chunk as Buffer]) : (chunk as Buffer);
    for (;;) {
      if (!pending) {
        if (buffer.length < BLOCK) break;
        const header = buffer.subarray(0, BLOCK);
        buffer = buffer.subarray(BLOCK);
        if (header.every((b) => b === 0)) continue; // end-of-archive padding
        const size = parseInt(cstr(header, SIZE_START, SIZE_END).trim() || "0", OCTAL);
        const kind = String.fromCharCode(header[TYPE_FLAG]);
        const ustar = cstr(header, MAGIC_START, MAGIC_START + 5) === "ustar";
        const prefix = ustar ? cstr(header, PREFIX_START, PREFIX_END) : "";
        let path = longName ?? (prefix ? `${prefix}/${cstr(header, 0, NAME_END)}` : cstr(header, 0, NAME_END));
        longName = undefined;
        const meta = kind === TYPE_PAX || kind === TYPE_GNU_LONGNAME;
        pending = { path, size, kind, wanted: meta || (TYPE_FILE.has(kind) && keep(path)) };
      }
      const padded = Math.ceil(pending.size / BLOCK) * BLOCK;
      if (buffer.length < padded) break;
      const data = buffer.subarray(0, pending.size);
      if (pending.kind === TYPE_PAX) longName = paxPath(data);
      else if (pending.kind === TYPE_GNU_LONGNAME) longName = cstr(data, 0, data.length);
      else if (pending.wanted) out.set(pending.path, data.toString("utf8"));
      buffer = buffer.subarray(padded);
      pending = null;
    }
  }
  return out;
}
