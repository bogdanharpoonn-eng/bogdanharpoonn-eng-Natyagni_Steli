# Definition of Done — MVP (п. 9 ТЗ)

Дата: 2026-10-16. Повна команда: `npm run verify` потім (з preview на `127.0.0.1:4173`) `npm run lighthouse`.

| Критерій | Статус | Доказ / примітка |
| --- | --- | --- |
| Усі тести геометрії з п. 4.4 проходять | ✅ | `src/core/geometry/*.test.ts` у `npm test` |
| Прямокутна кімната ≤ 60 с | ✅ | e2e `main survey flow… (≤60s)` + assert часу |
| Г-подібна кімната ≤ 2 хв | ✅ | e2e `L-shape room → area 9.00 (≤120s)` |
| Повністю працює «в літаку» після першого завантаження | ✅* | SW + precache (`vite-plugin-pwa`); UI-індикатор офлайн; *ручна перевірка в літаку на пристрої |
| Встановлюється на головний екран iPhone / Android | ✅* | `manifest.webmanifest` + іконки + `display: standalone`; *реальний Add to Home Screen — вручну на пристрої |
| PDF відкривається, креслення векторне | ✅ | jsPDF + svg2pdf (етап 6); шрифт Noto Sans |
| Lighthouse PWA ✅, Performance ≥ 90 (mobile) | ✅* | Performance ≥ 0.9 (`npm run lighthouse`); у LH 12+ немає категорії PWA → перевірка `manifest` + `sw.js` у `dist` (D039) |
| Перезапуск посеред введення не втрачає значень | ✅ | e2e `reload mid-entry keeps client name` + unit-тести autosave |
| Немає `any`, ESLint/TS без помилок, e2e основного сценарію | ✅ | `npm run lint`, `tsc -b`, Playwright |

## Відомі обмеження (MVP)

- Немає бекенду, auth, ліцензій, синхронізації між пристроями (навмисно).
- Офлайн і installability повністю гарантовані лише після **першого** успішного завантаження (реєстрація SW).
- Web Share залежить від ОС/браузера; fallback — завантаження файлів.
- Криві / багаторівневі стелі / Bluetooth / розкрій — поза MVP (`docs/ROADMAP.md`).
- Той самий URL PWA; ліцензії виробників — окремий бекенд після MVP.

## Архітектура для пост-MVP

`OrderRepository` + IndexedDB не змішані з UI: sync/auth можна додати без зміни екранів замірника.
