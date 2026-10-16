# Рішення (ADR-лайт)

## 2026-10-16 — Етап 1: каркас

| ID | Рішення | Чому |
| --- | --- | --- |
| D001 | Vite 6 + React 18 + TypeScript strict | Обовʼязковий стек MVP; швидкий dev/build для PWA |
| D002 | Tailwind 3 + PostCSS | Стабільний стек для mobile-first UI; v4 відкладено |
| D003 | `vite-plugin-pwa` з `registerType: 'autoUpdate'` | Offline-first і оновлення без ручної дії замірника |
| D004 | Alias `@/` → `src/` | Коротші імпорти між шарами |
| D005 | Zustand / Dexie / Zod у dependencies з етапу 1 | Зафіксовані в стеку; підключення — на етапах 3–4 |
| D006 | jsPDF / svg2pdf / Playwright ще не встановлені | Потрібні на етапах 6–7; не роздуваємо каркас |
| D007 | Placeholder UI українською через `src/i18n/uk.ts` | Підготовка до i18n без зайвих бібліотек |
| D008 | Геометричне ядро — порожній модуль + smoke-тест | Реалізація лише на етапі 2 |
| D009 | Remote GitHub: `bogdanharpoonn-eng/bogdanharpoonn-eng-Natyagni_Steli` | Єдине місце коду; дані замовлень у IndexedDB на пристрої |
