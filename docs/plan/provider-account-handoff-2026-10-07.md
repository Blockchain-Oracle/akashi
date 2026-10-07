# Provider account setup handoff — 2026-10-07

## Result

All six provider credentials are saved in `akashi/.env` and passed live API checks. Setup used the user's Zen browser. Four new accounts were created: Groq, Serper, Jina, and IPinfo. Existing Firecrawl and OpenWeather credentials were reused. No paid plan, domain purchase, or runtime deployment was made.

The user approved the provider terms and credential creation, then explicitly approved the Groq, Serper, and OpenWeather human-verification checks. These checks were completed. No additional signup approval remains pending.

## Accounts, plans, and validation

| Provider | Account/result | Local variable | Verified API result |
|---|---|---|---|
| Groq | New Blockchain Oracle Google login; Personal organization / Default Project. Created “Akashi Tool Router” key without expiration. Free access; no paid upgrade. | `GROQ_API_KEY` | Models list HTTP 200; `openai/gpt-oss-20b` chat completion HTTP 200 with a returned choice. |
| Serper | New account for `blockchainoracle.dev@gmail.com`; email verified. Default API key. Dashboard initially showed 2,500 free credits. | `SERPER_API_KEY` | One Google search for “Pocket Network”, `num: 1`: HTTP 200 with one organic result. This consumes a search credit. |
| Jina | New Blockchain Oracle Google login; account key manager showed 10,000,000 tokens available before probe. | `JINA_API_KEY` | Reader request for `https://example.com`, token budget 2,000: HTTP 200 and expected Example Domain content. |
| IPinfo | New Blockchain Oracle Google login; Lite plan, no card. Country-level geolocation and ASN. | `IPINFO_TOKEN` | Lite lookup for `8.8.8.8`: HTTP 200, United States / AS15169. |
| OpenWeather | Existing Blockchain Oracle email account. Signup retry reported “Email is already taken”; proposed signup password did not log in. Original April 3 API Instruction email contained the existing key. No password was reset. | `OPENWEATHER_API_KEY` | Current weather for Lagos, NG: HTTP 200 with city and temperature data. No activation delay. |
| Firecrawl | Existing personal workspace under the user's other Gmail account. Existing key reused; no new account or rotation. | `FIRECRAWL_API_KEY` | Credit usage HTTP 200: 146 remaining of 1,000; period ends 2026-10-29 11:44:13 UTC / 12:44:13 Africa/Lagos. Balance check did not use scrape/search credits. |

Serper briefly displayed “It is not possible to register at this moment, try again later.” The account email nevertheless arrived. Completing email verification and logging in succeeded; this is resolved.

Groq's default Python urllib User-Agent received HTTP 403. The same credential succeeded with `User-Agent: Akashi/0.1`; use an explicit application User-Agent when probing or integrating.

## Local credential storage

- Absolute file: `/Users/abu/dev/hackathon/portnetwork/akashi/.env`.
- Owner read/write only (`0600`); verified ignored by the Akashi Git repository.
- Six API variables listed above, plus `SERPER_ACCOUNT_PASSWORD` for the newly created Serper login.
- Unused signup password candidates were removed. OpenWeather's existing password remains unknown; the API key is usable.
- Do not paste values into chat, docs, commits, or `NEXT_PUBLIC_*` variables. Keep these server-side.
- Firecrawl and Serper key displays were hidden after collection; the temporary credential editor was closed. Jina key was collected via its Copy control.
- No Coolify environment was changed. The S14 connector framework still needs implementation/runtime wiring; saving `.env` alone does not connect these APIs to the product.

## Continuation

Use these credentials for the S14 connectors and cited-answer pipeline. The existing dirty application changes were left alone. Domain/Namecheap funding, Pocket configuration or staking, deployment, and any paid plan decision remain separate tasks.

Provider signup does not establish resale rights. The S14 vendor permission and licensing work remains open; do not infer that testnet alone exempts the project from provider terms.

Useful dashboards: [Groq](https://console.groq.com/keys), [Serper](https://serper.dev/api-keys), [Jina](https://jina.ai/api-dashboard/key-manager), [IPinfo](https://ipinfo.io/dashboard), [OpenWeather](https://home.openweathermap.org/), [Firecrawl](https://firecrawl.dev/app).
