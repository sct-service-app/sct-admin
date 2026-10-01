# SCT Admin — админ-панель

> Обновлено: 2026-07-19

Staff-панель сервиса SCT (Алматы): пакеты услуг, справочник автомобилей,
записи на сервис, Telegram VIN-заявки. Доступ только для сотрудников.

Выделена из `../sct-web` **2026-07-19**, чтобы деплоиться на отдельный домен.
Клиентский сайт остался в `sct-web`. Бэкенд общий (Django + DRF + JWT,
демо: `https://sct-back-demo.topcoder.kz`), поэтому слой `src/shared/` в обоих
проектах почти идентичен — при правках в общих файлах держите их в синхроне.

Общие доки (архитектура, статус, контракт бэка) — в `sct-web`:
[README](../sct-web/README.md) · [PROJECT_STATUS](../sct-web/PROJECT_STATUS.md) ·
[BACKEND_NOTES](../sct-web/BACKEND_NOTES.md) · [HANDOFF](../sct-web/HANDOFF.md).

---

## Стек

Тот же, что у `sct-web`: Vite 8 · TypeScript 5.7 · React 19 + Tailwind 3 ·
React Router v7 (`createBrowserRouter`) · TanStack Query v5 + axios + JWT-refresh ·
React Hook Form + Zod · Zustand · `openapi-typescript` (типы из `schema.yml`).

---

## Быстрый старт

```bash
npm install                        # один раз
echo 'VITE_API_BASE_URL=https://sct-back-demo.topcoder.kz' > .env.local
npm run dev                        # http://localhost:5174
```

Порт **5174** (у клиентского `sct-web` — 5173), так что оба dev-сервера можно
держать поднятыми одновременно.

### Скрипты

| Скрипт            | Что делает                                              |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Vite dev-сервер с HMR (порт 5174)                      |
| `npm run build`   | tsc + Vite production build → `dist/`                  |
| `npm run preview` | Отдать собранное локально                              |
| `npm run lint`    | ESLint по всему `src/`                                 |
| `npm run gen:api` | Перегенерировать TS-типы из `src/shared/api/schema.yml`|

### ⚠️ Если `npm run build` падает на `@rolldown/binding-*`

Vite 8 собирает через **rolldown**, которому нужен нативный бинарник
(`node_modules/@rolldown/binding-darwin-arm64` на Apple Silicon). У npm есть
давний баг с optionalDependencies — при установке этот бинарник иногда
молча пропускается, и `build` падает с `Cannot find module
'@rolldown/binding-...'`. Фикс — доставить бинарник той же версии, что в
lockfile (обычно берётся из соседнего рабочего проекта):

```bash
cp -R ../sct-web/node_modules/@rolldown/binding-darwin-arm64 node_modules/@rolldown/
```

На чистом CI (Vercel и т. п.) обычно ставится корректно; проблема локальная.

---

## Структура проекта (FSD-light)

```
src/
├── app/         # роутер, StaffLayout, RequireStaff, query-client, ErrorBoundary
├── pages/admin/ # страницы админки (по одной на роут, lazy-loaded)
├── features/
│   ├── staff-auth/    # вход стаффа, staff auth-store
│   ├── admin-*/       # пакеты, авто, записи, Telegram-заявки
│   ├── auth/errors.ts # parseApiError (общий с sct-web)
│   └── garage/add-car # конфигуратор авто (используется в карточке пакета)
└── shared/      # axios (http + staffHttp), endpoints, типы, ui, lib, config
```

Staff-сессия хранится под ключами `sct_staff_access` / `sct_staff_refresh`
(`shared/api/token-storage.ts`), запросы идут через `staffHttp`
(`shared/api/staff-http.ts`) с рефрешем на `/staff_endpoints/auth/refresh/`.

---

## Маршруты

Отдаются **с корня**, без префикса `/admin`:

| Экран                     | Маршрут              |
| ------------------------- | -------------------- |
| Вход стаффа               | `/login`             |
| Пакеты услуг              | `/packages`          |
| Создание / редактирование | `/packages/new`, `/packages/:id/edit` |
| Справочник авто           | `/cars`, `/cars/:sourceId` |
| Записи на сервис          | `/bookings`, `/bookings/:id` |
| Telegram VIN-заявки       | `/telegram`, `/telegram/:id` |

Корень `/` редиректит на `/packages`; неавторизованных `RequireStaff`
уводит на `/login?next=…`.

Учётку стаффа для входа запрашивай у бэкендщика — в репозитории она не
хранится (репозиторий публичный, а те же данные подходят и к боевой админке).

---

## Деплой

SPA — собранный `dist/` отдаётся любым статикером с fallback на `index.html`
(конфиг для Vercel — в `vercel.json`). На проде укажите свой
`VITE_API_BASE_URL`; CORS на бэке должен пропускать домен админки.
