/**
 * Удобные re-export'ы из схемы для часто используемых типов.
 * Все типы автогенерируются из additional/schema.yml через `npm run gen:api`.
 * НЕ редактируй schema.ts руками — он перезаписывается.
 */
import type { components } from './schema'

type Schemas = components['schemas']

// --- Клиент: авторизация / профиль ---
export type ClientLoginRequest = Schemas['ClientLoginRequest']
export type ClientRegisterRequest = Schemas['ClientRegisterRequest']
export type ClientTokenResponse = Schemas['ClientTokenResponse']
export type ClientProfile = Schemas['ClientProfile']
export type ClientProfileStatus = Schemas['ClientProfileStatusEnum']

// --- Клиент: гараж ---
export type ClientGarageCar = Schemas['ClientGarageCar']
export type ClientGarageCarWriteRequest = Schemas['ClientGarageCarWriteRequest']
export type PatchedClientGarageCarWriteRequest =
  Schemas['PatchedClientGarageCarWriteRequest']
// drf-spectacular переименовал enum статуса машины в StatusBe2Enum
// (автогенерируемое имя). Раньше был ClientGarageCarStatusEnum.
export type ClientGarageCarStatus = Schemas['StatusBe2Enum']
export type ClientGarageFormPageData = Schemas['ClientGarageFormPageData']
export type ClientActiveCar = Schemas['ClientActiveCar']

// --- Клиент: пакеты ---
export type ClientServicePackage = Schemas['ClientServicePackage']
export type ClientPackagesPage = Schemas['ClientPackagesPage']
export type ClientPackageItem = Schemas['ClientPackageItem']
export type ClientPackageCategory = Schemas['ClientPackageCategory']

// --- Клиент: сервисная книжка ---
export type ClientServiceBookPageData = Schemas['ClientServiceBookPageData']

// --- Общие ---
export type TokenRefreshRequest = Schemas['TokenRefreshRequest']
export type TokenRefresh = Schemas['TokenRefresh']
export type DiscountType = Schemas['DiscountTypeEnum']
export type ItemType = Schemas['ItemTypeEnum']

// --- Staff (для админки пакетов) ---
export type StaffUser = Schemas['StaffUser']
export type StaffLogin = Schemas['StaffLogin']
export type StaffLoginRequest = Schemas['StaffLoginRequest']
export type StaffServicePackageDetail = Schemas['StaffServicePackageDetail']
export type StaffServicePackageList = Schemas['StaffServicePackageList']
export type StaffServicePackageWriteRequest =
  Schemas['StaffServicePackageWriteRequest']
export type PatchedStaffServicePackageWriteRequest =
  Schemas['PatchedStaffServicePackageWriteRequest']
export type StaffPackageItemList = Schemas['StaffPackageItemList']
export type StaffPackageItemDetail = Schemas['StaffPackageItemDetail']
export type StaffCarDetailPageDataResponse =
  Schemas['StaffCarDetailPageDataResponse']
export type StaffCarsListPageDataResponse =
  Schemas['StaffCarsListPageDataResponse']
