import { Desk } from "@/features/desk/Desk";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { SiteHeader } from "@/components/shell/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <section className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">証 akashi · proof</p>
          <h1 className="mt-5 text-balance font-display text-5xl leading-[1.05] md:text-6xl">
            Is this real, and is it <em>current</em>?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">Paste a citation, code, or a question. Akashi checks the records.</p>
        </section>
        <section className="mt-10" aria-label="Evidence desk">
          <Desk />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
