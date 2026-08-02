/**
 * Tên các khóa được sử dụng để lưu dữ liệu trong LocalStorage.
 *
 * Không viết trực tiếp các chuỗi như "rooms" hoặc "invoices"
 * ở service, business hoặc page.
 */
export const STORAGE_KEYS = Object.freeze({
  ROOMS: 'rooms',
  TENANTS: 'tenants',
  CONTRACTS: 'contracts',
  METER_READINGS: 'meterReadings',
  SERVICE_CONFIGS: 'serviceConfigs',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  APP_SETTINGS: 'appSettings'
});

/**
 * Các khóa chứa dữ liệu dạng mảng.
 *
 * appSettings không nằm trong danh sách này vì được lưu dưới dạng object.
 */
export const STORAGE_COLLECTION_KEYS = Object.freeze([
  STORAGE_KEYS.ROOMS,
  STORAGE_KEYS.TENANTS,
  STORAGE_KEYS.CONTRACTS,
  STORAGE_KEYS.METER_READINGS,
  STORAGE_KEYS.SERVICE_CONFIGS,
  STORAGE_KEYS.INVOICES,
  STORAGE_KEYS.PAYMENTS
]);