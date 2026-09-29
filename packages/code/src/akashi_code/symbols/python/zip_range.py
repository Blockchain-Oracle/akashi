"""Read individual members of a remote ZIP (a wheel) using HTTP range requests.

Measured (sources-code-reality-check.md): a 65 KB wheel fits one read; pandas/numpy (12–16 MB) need a second read
for the central directory. PyPI's CDN answers 416 to suffix ranges larger than the file, so ranges are explicit.
"""

import struct
import zlib
from dataclasses import dataclass

from akashi_core.errors import UpstreamFailure
from akashi_core.http.client import UpstreamClient

TAIL_BYTES = 65_536
LOCAL_HEADER_SLACK = 1_024  # local extra field may differ from the central directory's
EOCD_SIG = b"PK\x05\x06"
ZIP64_LOCATOR_SIG = b"PK\x06\x07"
CD_ENTRY_SIG = 0x02014B50
LOCAL_HEADER_SIG = 0x04034B50
EOCD_LEN = 22
ZIP64_LOCATOR_LEN = 20
CD_FIXED_LEN = 46
LOCAL_FIXED_LEN = 30
METHOD_STORED = 0
METHOD_DEFLATED = 8
RAW_DEFLATE_WBITS = -15
ZIP64_MARKER = 0xFFFFFFFF
HTTP_PARTIAL = 206
HTTP_OK = 200


@dataclass(frozen=True, slots=True)
class Member:
    name: str
    method: int
    csize: int
    usize: int
    offset: int


class RemoteZip:
    def __init__(self, client: UpstreamClient, url: str, size: int) -> None:
        self.client, self.url, self.size = client, url, size
        self.members: dict[str, Member] = {}

    async def _range(self, start: int, end_inclusive: int) -> bytes:
        resp = await self.client.request("GET", self.url, headers={"range": f"bytes={start}-{end_inclusive}"})
        if resp.status_code not in {HTTP_PARTIAL, HTTP_OK}:
            raise UpstreamFailure(self.client.spec.name, "unavailable", str(resp.status_code))
        body = resp.content
        # A server may ignore Range and send the whole file; slice it ourselves.
        return body[start : end_inclusive + 1] if resp.status_code == HTTP_OK else body

    async def open(self) -> None:
        start = max(0, self.size - TAIL_BYTES)
        tail = await self._range(start, self.size - 1)
        at = tail.rfind(EOCD_SIG)
        if at < 0:
            raise UpstreamFailure(self.client.spec.name, "decode", "no end-of-central-directory record")
        _, _, _, _, _, cd_size, cd_off, _ = struct.unpack("<IHHHHIIH", tail[at : at + EOCD_LEN])
        if cd_off == ZIP64_MARKER and tail.rfind(ZIP64_LOCATOR_SIG, 0, at) >= 0:
            raise UpstreamFailure(self.client.spec.name, "decode", "zip64 wheels are not supported")
        if cd_off >= start:
            cd = tail[cd_off - start : cd_off - start + cd_size]
        else:
            cd = await self._range(cd_off, cd_off + cd_size - 1)
        self.members = _parse_cd(cd)

    async def read(self, name: str) -> bytes:
        m = self.members[name]
        chunk = await self._range(
            m.offset, min(self.size - 1, m.offset + LOCAL_FIXED_LEN + len(name) + LOCAL_HEADER_SLACK + m.csize)
        )
        sig, *_rest = struct.unpack("<I", chunk[:4])
        if sig != LOCAL_HEADER_SIG:
            raise UpstreamFailure(self.client.spec.name, "decode", "bad local header")
        name_len, extra_len = struct.unpack("<HH", chunk[26:30])
        data_start = LOCAL_FIXED_LEN + name_len + extra_len
        if data_start + m.csize > len(chunk):  # extra field larger than our slack: fetch exactly
            chunk = await self._range(m.offset, m.offset + data_start + m.csize - 1)
        payload = chunk[data_start : data_start + m.csize]
        if m.method == METHOD_STORED:
            return payload
        if m.method == METHOD_DEFLATED:
            return zlib.decompressobj(RAW_DEFLATE_WBITS).decompress(payload)
        raise UpstreamFailure(self.client.spec.name, "decode", f"compression method {m.method}")


def _parse_cd(cd: bytes) -> dict[str, Member]:
    members: dict[str, Member] = {}
    pos = 0
    while pos + CD_FIXED_LEN <= len(cd):
        (sig, _vm, _vn, _flags, method, _t, _d, _crc, csize, usize, n_len, e_len, c_len, _disk, _ia, _ea, offset) = (
            struct.unpack("<IHHHHHHIIIHHHHHII", cd[pos : pos + CD_FIXED_LEN])
        )
        if sig != CD_ENTRY_SIG:
            break
        name = cd[pos + CD_FIXED_LEN : pos + CD_FIXED_LEN + n_len].decode("utf-8", errors="replace")
        members[name] = Member(name, method, csize, usize, offset)
        pos += CD_FIXED_LEN + n_len + e_len + c_len
    return members
