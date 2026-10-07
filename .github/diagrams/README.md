# README diagrams

The README pictures are rendered from `readme-system.mmd` and `readme-paid-run.mmd`. Edit the Mermaid source, then render light and dark PNGs into `.github/assets/` with Mermaid CLI at 2× scale:

```sh
for d in system paid-run; do
  mmdc -i .github/diagrams/readme-$d.mmd -o .github/assets/$d-light.png -c .github/diagrams/mermaid-light.json -b '#FFFFFF' -s 2
  mmdc -i .github/diagrams/readme-$d.mmd -o .github/assets/$d-dark.png  -c .github/diagrams/mermaid-dark.json  -b '#121212' -s 2
done
```

Mermaid CLI needs a local Chromium. If Puppeteer cannot find one, pass `-p` with a Puppeteer config that sets `executablePath`.
