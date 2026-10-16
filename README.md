# Замір натяжних стель

Офлайн-first PWA для замірників натяжних стель (MVP).

## Стек

React 18 · TypeScript · Vite · Tailwind · Zustand · Dexie · Zod · Vitest · vite-plugin-pwa

## Команди

```bash
npm install
npx playwright install chromium
npm run dev
npm run build
npm test
npm run test:e2e
npm run lint
# Lighthouse (спочатку: npm run preview -- --host 127.0.0.1 --port 4173)
npm run lighthouse
```

## Етапи

Див. `docs/ROADMAP.md`, `docs/DECISIONS.md`. Приймання MVP: `docs/DOD.md`.

```bash
npm run lint
npm test
npm run build
npm run test:e2e
# npm run preview -- --host 127.0.0.1 --port 4173
npm run lighthouse
```
