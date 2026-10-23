# Third-party notices

This file records the earlier work and the attribution for the data it serves. It does not
grant a licence to Akashi as a whole, change any upstream terms, or imply endorsement by the projects named.
File-level notices and each dependency's own licence still apply.

## The author's earlier work

Parts of the chat interface reuse components from the author's own earlier open-source projects, built before this
one: KeeperHub Copilot v2 (tool timeline, composer, conversation history, receipt card), Portaldot (the inline pay
card flow), DeepBookie (payment states) and a wallet-setup flow. Each file names its source in a comment. Some of
those components started from 21st.dev community components, named in their comments. Akashi's connector framework
and design tokens (`packages/brand/tokens/paint.css`) are its own.

## Fonts

| Font | Terms | Where |
| --- | --- | --- |
| Outfit | SIL Open Font License 1.1 | `packages/brand/assets/fonts/`, through `next/font`; embedded in the README banner |
| Inter | SIL Open Font License 1.1 | the same |
| JetBrains Mono | SIL Open Font License 1.1 | the same; embedded in the README banner |

## Data served by the tools

Every answer names its sources, with the licence and attribution each provider asks for (`sources[]` in the run
envelope; set per provider in `packages/tools/src/akashi_tools/connectors/*/provider.py`). Among them:

- Wikipedia and Wikidata: CC BY-SA 4.0 and CC0, Wikipedia contributors.
- OpenStreetMap: © OpenStreetMap contributors, ODbL 1.0; geocoding by Nominatim.
- Open-Meteo: weather data CC BY 4.0, Open-Meteo.com; geocoding from GeoNames (CC BY 4.0).
- Frankfurter: reference rates published by the European Central Bank and other central banks.
- CoinGecko: "Data provided by CoinGecko".
- NASA and USGS: US Government works, public domain (image credits as stated per image).
- OpenAlex (CC0), Crossref and arXiv metadata; Open Food Facts (ODbL); PubChem (NCBI).

Provider logos in `apps/web/public/logos/` are the providers' own icons, used only to identify each integration.

## Packaged libraries

Packaged libraries keep their own notices. Among them: React and Next.js (MIT), the AI SDK (Apache-2.0), x402
(Apache-2.0), wagmi, viem and RainbowKit (MIT), the Model Context Protocol SDK (MIT), Hono (MIT), FastAPI and
pydantic (MIT), Fumadocs (MIT) and Lucide (ISC). This list is a guide to attribution. It does not replace the
lockfiles or the full licence text shipped with each dependency.
