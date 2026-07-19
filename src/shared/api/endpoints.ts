/**
 * Единое место со всеми URL'ами API. Если бэк переименует ручку — правим
 * только тут.
 *
 * Источник: additional/schema.yml + ответы бэкендщика.
 * Список синхронизирован с реальной schema OpenAPI на момент запуска проекта.
 */

export const endpoints = {
  // --- Клиент: авторизация ---
  clientLogin: '/api/v1/client_endpoints/auth/login/',
  clientRegister: '/api/v1/client_endpoints/auth/register/',
  clientRefresh: '/api/v1/client_endpoints/auth/refresh/',
  clientProfile: '/api/v1/client_endpoints/auth/profile/',

  // --- Клиент: гараж ---
  garageCars: '/api/v1/client_endpoints/garage/cars/',
  garageCar: (id: number) => `/api/v1/client_endpoints/garage/cars/${id}/`,
  garageCarSetDefault: (id: number) =>
    `/api/v1/client_endpoints/garage/cars/${id}/set-default/`,
  garageFormPageData: '/api/v1/client_endpoints/garage/form-page-data/',

  // --- Клиент: пакеты ---
  packages: '/api/v1/client_endpoints/packages/',
  package: (id: number) => `/api/v1/client_endpoints/packages/${id}/`,
  defaultService: (id: number) =>
    `/api/v1/client_endpoints/packages/default-services/${id}/`,

  // --- Клиент: сервисная книжка ---
  serviceBookPageData: '/api/v1/client_endpoints/service-book/page-data/',

  // --- Клиент: записи на сервис (booking) ---
  // list/detail/create/edit/cancel — все ручки в бэке есть и работают.
  bookings: '/api/v1/client_endpoints/service-book/bookings/',
  booking: (id: number) => `/api/v1/client_endpoints/service-book/bookings/${id}/`,
  bookingCancel: (id: number) =>
    `/api/v1/client_endpoints/service-book/bookings/${id}/cancel/`,
  createBooking: '/api/v1/client_endpoints/service-book/create_booking/',

  // --- Клиент: филиалы (service stations) ---
  // Возвращают список с встроенным расписанием на N дней (по умолчанию 7).
  serviceStations: '/api/v1/client_endpoints/service_stations/',
  serviceStation: (id: number) =>
    `/api/v1/client_endpoints/service_stations/${id}/`,

  // --- Публичный конфигуратор авто (используется в add_car / change) ---
  carsMarks: '/api/v1/cars/marks/',
  carsModels: '/api/v1/cars/models/',
  carsFilters: '/api/v1/cars/filters/',
  carsModifications: '/api/v1/cars/modifications/',
  carsTrims: '/api/v1/cars/trims/',

  // --- Staff (для админки пакетов) ---
  staffLogin: '/api/v1/staff_endpoints/auth/login/',
  staffLogout: '/api/v1/staff_endpoints/auth/logout/',
  staffRefresh: '/api/v1/staff_endpoints/auth/refresh/',
  staffProfile: '/api/v1/staff_endpoints/auth/profile/',
  staffPackages: '/api/v1/staff_endpoints/packages/',
  staffPackagesListPageData:
    '/api/v1/staff_endpoints/packages/list-page-data/',
  staffPackagesCreate: '/api/v1/staff_endpoints/packages/create/',
  staffPackage: (id: number) => `/api/v1/staff_endpoints/packages/${id}/`,
  staffPackageEdit: (id: number) =>
    `/api/v1/staff_endpoints/packages/${id}/edit/`,
  staffPackageDelete: (id: number) =>
    `/api/v1/staff_endpoints/packages/${id}/delete/`,
  staffPackageDuplicate: (id: number) =>
    `/api/v1/staff_endpoints/packages/${id}/duplicate/`,
  staffPackageDetailPageData: (id: number) =>
    `/api/v1/staff_endpoints/packages/${id}/detail-page-data/`,
  staffPackagesCarsListPageData:
    '/api/v1/staff_endpoints/packages/cars-list-page-data/',
  staffCarsListPageData: '/api/v1/staff_endpoints/cars/cars-list-page-data/',
  staffCarDetailPageData: (sourceId: string) =>
    `/api/v1/staff_endpoints/cars/${sourceId}/detail-page-data/`,
  staffPackageItems: '/api/v1/staff_endpoints/packages/package-items/',
  // Fuzzy-поиск товаров/услуг (нормализация + опечатки на бэке).
  // Ответ: { query, normalized_query, count, results[] }.
  staffPackageItemsSearch:
    '/api/v1/staff_endpoints/packages/package-items/search/',

  // --- Staff: записи на сервис (admin bookings) ---
  // Бэк объединил все действия в один PATCH /staff/bookings/{id}/.
  // Cancel остался отдельным POST. Options отдаёт справочники (СТО,
  // пакеты, default-услуги) для модалок действий.
  staffBookings: '/api/v1/staff_endpoints/bookings/',
  staffBooking: (id: number) => `/api/v1/staff_endpoints/bookings/${id}/`,
  staffBookingCancel: (id: number) =>
    `/api/v1/staff_endpoints/bookings/${id}/cancel/`,
  staffBookingsOptions: '/api/v1/staff_endpoints/bookings/options/',

  // --- Staff: Telegram VIN-заявки (telegram_vehicle_requests) ---
  // Касса шлёт через TG-бота фото госномера/VIN; менеджер вводит данные,
  // ищет авто клиента (find-client-car) и присваивает VIN (assign-vin).
  staffTelegramRequests: '/api/v1/staff_endpoints/telegram_vehicle_requests/',
  staffTelegramRequest: (id: number) =>
    `/api/v1/staff_endpoints/telegram_vehicle_requests/${id}/`,
  staffTelegramRequestFindCar: (id: number) =>
    `/api/v1/staff_endpoints/telegram_vehicle_requests/${id}/find-client-car/`,
  staffTelegramRequestAssignVin: (id: number) =>
    `/api/v1/staff_endpoints/telegram_vehicle_requests/${id}/assign-vin/`,
  staffTelegramRequestsStats:
    '/api/v1/staff_endpoints/telegram_vehicle_requests/stats/',
} as const
