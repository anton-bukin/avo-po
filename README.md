# PS Pay (avo-po)

Демо-платформа международных денежных переводов: документация продукта, веб-приложение для клиентов и админ-панель.

Стек: **React 18 + TypeScript + Vite** (фронтенд), **Java 17 + Spring Boot 3.4** (бэкенд), **PostgreSQL 16**.

## Структура репозитория

```
avo-po/
├── src/                    # React-фронтенд (Vite)
│   ├── sections/           # Страницы документации платформы
│   ├── app/                # Клиентское приложение PS Pay
│   │   ├── LoginPage.tsx
│   │   ├── NewTransfer.tsx     # Wizard перевода (amount → sender → receiver → review)
│   │   ├── TransferList.tsx
│   │   ├── TransferDetail.tsx
│   │   ├── admin/              # Админ-панель (users, transfers, directions, export)
│   │   ├── api.ts              # HTTP-клиент, JWT, нормализация ответов
│   │   └── store.ts            # Zustand store
│   └── data/               # Справочники для документации
├── api-java/               # Spring Boot бэкенд
│   ├── src/main/java/com/pspay/
│   │   ├── controller/     # AuthController, TransferController, AdminController, ...
│   │   ├── service/        # CbrRateService (курсы ЦБ РФ), JwtService, ...
│   │   ├── entity/         # JPA-сущности (User, Direction, Transfer, ...)
│   │   ├── repository/     # Spring Data репозитории
│   │   └── config/         # Security, JWT interceptor, web config
│   ├── Dockerfile          # Multi-stage: maven build → JRE alpine
│   └── pom.xml
├── docker/
│   └── initdb/             # SQL-скрипты для docker-entrypoint-initdb.d
│       ├── 01-schema.sql
│       └── 02-seed.sql
├── docker-compose.yml      # postgres + api
└── deploy.sh               # Билд фронта + бэка, рестарт systemd-сервиса
```

## Возможности

**Документация платформы** (`/avo-po/`)
- Описание архитектуры PS Pay, модулей и зависимостей
- Раздельные руководства для пользователей и администраторов

**Клиентское приложение** (`/avo-po/app/`)
- Регистрация / вход (JWT, BCrypt)
- Создание перевода в Wise/Revolut-стиле: amount-first флоу со степпером
- Live-калькулятор с актуальными курсами ЦБ РФ (cbr.ru)
- Маски ввода для карты и телефона (+7)
- История переводов с relative dates и timeline статусов
- Повтор перевода в один клик

**Админ-панель** (`/avo-po/app/admin/`)
- Дашборд (метрики, объёмы)
- Пользователи, переводы (фильтры, CSV-экспорт)
- Управление направлениями: маржа, комиссия, мин. комиссия, активность

## Запуск через docker-compose

```bash
docker compose up -d
```

Поднимется PostgreSQL (с инициализацией схемы и сидов из `docker/initdb/`) и Java API на порту `3100`.

Демо-аккаунты:
- Пользователь: `demo@pspay.ru` / `demo123`
- Админ: `admin@pspay.ru` / `admin123`

## Локальная разработка

**Фронтенд:**
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # сборка в dist/
```

**Бэкенд:**
```bash
cd api-java
mvn spring-boot:run  # http://localhost:3100
```

Бэкенду нужен запущенный PostgreSQL. Параметры подключения — в `api-java/src/main/resources/application.yml` или через переменные `SPRING_DATASOURCE_*`.

## Деплой

```bash
./deploy.sh
```

Скрипт собирает фронт (`npm run build` → `/var/www/avo-po/`) и бэк (`mvn clean package` → рестарт `pspay-api` через systemd). Nginx проксирует `/avo-po/api/` на `localhost:3100`.

## API

Базовый путь: `/avo-po/api/v1`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/login` | Логин, возвращает JWT |
| POST | `/auth/register` | Регистрация |
| GET | `/directions` | Доступные направления переводов |
| GET | `/countries`, `/providers`, `/payment-methods`, `/rates` | Справочники |
| POST | `/transfers` | Создать перевод |
| POST | `/transfers/{id}/calculate` | Рассчитать сумму получения |
| POST | `/transfers/{id}/confirm` | Подтвердить и отправить |
| GET | `/transfers`, `/transfers/{id}` | История / детали |
| GET | `/admin/stats`, `/admin/users`, `/admin/transfers` | Админка |
| GET | `/admin/transfers/export` | CSV-экспорт |
| GET/PATCH | `/admin/directions`, `/admin/directions/{id}` | Управление направлениями |

Авторизация: `Authorization: Bearer <jwt>`. Ответы нормализуются в camelCase на стороне фронта (`src/app/api.ts`).
