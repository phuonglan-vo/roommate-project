import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  storageService
} from './storage-service.js';

import {
  assertServiceCodeUnique,
  getCurrentServicePrice,
  normalizeServiceCalculationType,
  SERVICE_CONFIG_STATUS,
  validateServiceConfig
} from '../business/service-config-validator.js';

import {
  compareIsoDates,
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  createUniqueId
} from '../utils/id-utils.js';

/**
 * Kiểm tra giá trị có phải object thông thường hay không.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean}
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

/**
 * Sao chép sâu dữ liệu JSON.
 *
 * @template T
 * @param {T} value Giá trị cần sao chép.
 * @returns {T}
 */
function cloneJson(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

/**
 * Lấy ngày hiện tại tại Việt Nam theo YYYY-MM-DD.
 *
 * @returns {string}
 */
function getCurrentDateInVietnam() {
  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
  ).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [
        part.type,
        part.value
      ])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

/**
 * Cộng hoặc trừ ngày từ chuỗi YYYY-MM-DD.
 *
 * @param {string} dateValue Ngày ban đầu.
 * @param {number} days Số ngày cần cộng.
 * @returns {string}
 */
function addDays(dateValue, days) {
  if (!isValidIsoDate(dateValue)) {
    throw new Error(
      'Ngày hiệu lực đơn giá không hợp lệ.'
    );
  }

  const [year, month, day] = dateValue
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date.toISOString().slice(0, 10);
}

/**
 * Chuẩn hóa chuỗi dùng cho tìm kiếm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Service quản lý cấu hình dịch vụ.
 */
export class ServiceConfigService {
  /**
   * @param {import('./storage-service.js').StorageService} service
   * StorageService được sử dụng.
   */
  constructor(service = storageService) {
    const requiredMethods = [
      'getAll',
      'getById',
      'create',
      'update',
      'remove'
    ];

    const validService =
      service &&
      requiredMethods.every(
        (methodName) =>
          typeof service[methodName] ===
          'function'
      );

    if (!validService) {
      throw new TypeError(
        'ServiceConfigService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Chuyển bản ghi lưu trữ thành dữ liệu tiện dùng cho giao diện.
   *
   * @param {object} serviceConfig Dịch vụ lưu trong StorageService.
   * @returns {object}
   */
  _createViewModel(serviceConfig) {
    const today =
      getCurrentDateInVietnam();

    const currentPrice =
      getCurrentServicePrice(
        serviceConfig,
        today
      ) ??
      getCurrentServicePrice(
        serviceConfig
      ) ??
      0;

    return {
      ...cloneJson(serviceConfig),

      calculationType:
        normalizeServiceCalculationType(
          serviceConfig.calculationType
        ),

      unitPrice: currentPrice,

      isActive:
        serviceConfig.isActive !== false
    };
  }

  /**
   * Lấy toàn bộ cấu hình dịch vụ.
   *
   * @param {{includeInactive?: boolean}} [options={}] Tùy chọn.
   * @returns {object[]}
   */
  getServiceConfigs({
    includeInactive = true
  } = {}) {
    if (
      typeof includeInactive !==
      'boolean'
    ) {
      throw new TypeError(
        'includeInactive phải là boolean.'
      );
    }

    const serviceConfigs =
      this.storageService.getAll(
        STORAGE_KEYS.SERVICE_CONFIGS
      );

    return serviceConfigs
      .filter(
        (serviceConfig) =>
          includeInactive ||
          serviceConfig.isActive !== false
      )
      .map((serviceConfig) =>
        this._createViewModel(
          serviceConfig
        )
      );
  }

  /**
   * Lấy cấu hình dịch vụ theo ID.
   *
   * @param {string} id ID dịch vụ.
   * @returns {object|null}
   */
  getServiceConfigById(id) {
    const serviceConfig =
      this.storageService.getById(
        STORAGE_KEYS.SERVICE_CONFIGS,
        id
      );

    return serviceConfig
      ? this._createViewModel(
          serviceConfig
        )
      : null;
  }

  /**
   * Tạo cấu hình dịch vụ mới.
   *
   * @param {object} data Dữ liệu dịch vụ.
   * @returns {object}
   */
  createServiceConfig(data) {
    const normalizedData =
      validateServiceConfig(data);

    const existingServices =
      this.storageService.getAll(
        STORAGE_KEYS.SERVICE_CONFIGS
      );

    assertServiceCodeUnique(
      normalizedData.code,
      existingServices
    );

    const effectiveFrom =
      data?.effectiveFrom ??
      getCurrentDateInVietnam();

    if (!isValidIsoDate(effectiveFrom)) {
      throw new Error(
        'Ngày áp dụng đơn giá không hợp lệ.'
      );
    }

    const serviceToCreate = {
      code: normalizedData.code,
      name: normalizedData.name,
      unit: normalizedData.unit,

      calculationType:
        normalizedData.calculationType,

      prices: [
        {
          id: createUniqueId('price'),
          unitPrice:
            normalizedData.unitPrice,
          effectiveFrom,
          effectiveTo: null
        }
      ],

      isActive:
        normalizedData.isActive,

      description:
        normalizedData.description
    };

    const created =
      this.storageService.create(
        STORAGE_KEYS.SERVICE_CONFIGS,
        serviceToCreate
      );

    return this._createViewModel(created);
  }

  /**
   * Cập nhật lịch sử đơn giá.
   *
   * Hóa đơn cũ không bị thay đổi vì đơn giá đã được lưu
   * trực tiếp trong từng dòng hóa đơn.
   *
   * @param {object[]} currentPrices Lịch sử giá hiện tại.
   * @param {number} newUnitPrice Đơn giá mới.
   * @param {string} effectiveFrom Ngày bắt đầu áp dụng.
   * @returns {object[]}
   */
  _updatePriceHistory(
    currentPrices,
    newUnitPrice,
    effectiveFrom
  ) {
    const prices = Array.isArray(
      currentPrices
    )
      ? cloneJson(currentPrices)
      : [];

    if (prices.length === 0) {
      return [
        {
          id: createUniqueId('price'),
          unitPrice: newUnitPrice,
          effectiveFrom,
          effectiveTo: null
        }
      ];
    }

    prices.sort(
      (firstPrice, secondPrice) =>
        firstPrice.effectiveFrom.localeCompare(
          secondPrice.effectiveFrom
        )
    );

    const latestPrice =
      prices[prices.length - 1];

    if (
      latestPrice.effectiveFrom ===
      effectiveFrom
    ) {
      latestPrice.unitPrice =
        newUnitPrice;

      latestPrice.effectiveTo = null;

      return prices;
    }

    if (
      compareIsoDates(
        effectiveFrom,
        latestPrice.effectiveFrom
      ) < 0
    ) {
      throw new Error(
        'Ngày áp dụng đơn giá mới không được trước mức giá gần nhất.'
      );
    }

    latestPrice.effectiveTo =
      addDays(effectiveFrom, -1);

    prices.push({
      id: createUniqueId('price'),
      unitPrice: newUnitPrice,
      effectiveFrom,
      effectiveTo: null
    });

    return prices;
  }

  /**
   * Cập nhật cấu hình dịch vụ.
   *
   * Khi đơn giá thay đổi, một mốc giá mới được thêm vào lịch sử.
   *
   * @param {string} id ID dịch vụ.
   * @param {object} data Dữ liệu cập nhật.
   * @returns {object}
   */
  updateServiceConfig(id, data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu cập nhật dịch vụ phải là một object.'
      );
    }

    const currentRaw =
      this.storageService.getById(
        STORAGE_KEYS.SERVICE_CONFIGS,
        id
      );

    if (!currentRaw) {
      throw new Error(
        `Không tìm thấy dịch vụ có ID "${id}".`
      );
    }

    const currentView =
      this._createViewModel(currentRaw);

    const mergedData = {
      ...currentView,
      ...data,
      id: currentRaw.id
    };

    const normalizedData =
      validateServiceConfig(
        mergedData
      );

    const existingServices =
      this.storageService.getAll(
        STORAGE_KEYS.SERVICE_CONFIGS
      );

    assertServiceCodeUnique(
      normalizedData.code,
      existingServices,
      currentRaw.id
    );

    let prices = Array.isArray(
      currentRaw.prices
    )
      ? cloneJson(currentRaw.prices)
      : [];

    if (
      normalizedData.unitPrice !==
      currentView.unitPrice
    ) {
      const effectiveFrom =
        data.effectiveFrom ??
        getCurrentDateInVietnam();

      if (!isValidIsoDate(effectiveFrom)) {
        throw new Error(
          'Ngày áp dụng đơn giá mới không hợp lệ.'
        );
      }

      prices = this._updatePriceHistory(
        prices,
        normalizedData.unitPrice,
        effectiveFrom
      );
    }

    const updated =
      this.storageService.update(
        STORAGE_KEYS.SERVICE_CONFIGS,
        currentRaw.id,
        {
          code: normalizedData.code,
          name: normalizedData.name,
          unit: normalizedData.unit,

          calculationType:
            normalizedData.calculationType,

          prices,

          isActive:
            normalizedData.isActive,

          description:
            normalizedData.description
        }
      );

    return this._createViewModel(updated);
  }

  /**
   * Ngưng áp dụng một dịch vụ.
   *
   * @param {string} id ID dịch vụ.
   * @returns {object}
   */
  deactivateServiceConfig(id) {
    const serviceConfig =
      this.getServiceConfigById(id);

    if (!serviceConfig) {
      throw new Error(
        `Không tìm thấy dịch vụ có ID "${id}".`
      );
    }

    if (!serviceConfig.isActive) {
      return serviceConfig;
    }

    const updated =
      this.storageService.update(
        STORAGE_KEYS.SERVICE_CONFIGS,
        serviceConfig.id,
        {
          isActive: false
        }
      );

    return this._createViewModel(updated);
  }

  /**
   * Kích hoạt lại một dịch vụ.
   *
   * @param {string} id ID dịch vụ.
   * @returns {object}
   */
  activateServiceConfig(id) {
    const serviceConfig =
      this.getServiceConfigById(id);

    if (!serviceConfig) {
      throw new Error(
        `Không tìm thấy dịch vụ có ID "${id}".`
      );
    }

    if (serviceConfig.isActive) {
      return serviceConfig;
    }

    const updated =
      this.storageService.update(
        STORAGE_KEYS.SERVICE_CONFIGS,
        serviceConfig.id,
        {
          isActive: true
        }
      );

    return this._createViewModel(updated);
  }

  /**
   * Kiểm tra dịch vụ đã được dùng trong hóa đơn hay chưa.
   *
   * @param {string} id ID dịch vụ.
   * @returns {boolean}
   */
  isServiceUsedInInvoices(id) {
    const invoices =
      this.storageService.getAll(
        STORAGE_KEYS.INVOICES
      );

    return invoices.some(
      (invoice) =>
        Array.isArray(invoice.items) &&
        invoice.items.some(
          (item) =>
            item?.serviceConfigId === id ||
            (
              item?.sourceType ===
                'serviceConfig' &&
              item?.sourceId === id
            )
        )
    );
  }

  /**
   * Xóa cứng một dịch vụ chưa từng được dùng.
   *
   * Dịch vụ đã xuất hiện trong hóa đơn chỉ được ngưng áp dụng.
   *
   * @param {string} id ID dịch vụ.
   * @returns {object}
   */
  deleteServiceConfig(id) {
    const serviceConfig =
      this.getServiceConfigById(id);

    if (!serviceConfig) {
      throw new Error(
        `Không tìm thấy dịch vụ có ID "${id}".`
      );
    }

    if (
      this.isServiceUsedInInvoices(id)
    ) {
      throw new Error(
        'Dịch vụ đã được sử dụng trong hóa đơn nên không thể xóa. Hãy ngưng áp dụng dịch vụ.'
      );
    }

    const removed =
      this.storageService.remove(
        STORAGE_KEYS.SERVICE_CONFIGS,
        id
      );

    if (!removed) {
      throw new Error(
        `Không thể xóa dịch vụ có ID "${id}".`
      );
    }

    return this._createViewModel(removed);
  }

  /**
   * Tìm kiếm dịch vụ theo mã, tên, đơn vị hoặc mô tả.
   *
   * @param {string} keyword Từ khóa.
   * @returns {object[]}
   */
  searchServiceConfigs(keyword) {
    if (typeof keyword !== 'string') {
      throw new TypeError(
        'Từ khóa tìm kiếm phải là một chuỗi.'
      );
    }

    const normalizedKeyword =
      normalizeSearchText(keyword);

    const services =
      this.getServiceConfigs();

    if (!normalizedKeyword) {
      return services;
    }

    return services.filter(
      (serviceConfig) => {
        const searchableText =
          normalizeSearchText([
            serviceConfig.code,
            serviceConfig.name,
            serviceConfig.unit,
            serviceConfig.description
          ].join(' '));

        return searchableText.includes(
          normalizedKeyword
        );
      }
    );
  }

  /**
   * Lọc danh sách dịch vụ.
   *
   * Các bộ lọc:
   * - keyword
   * - status: active, inactive hoặc all
   * - calculationType
   *
   * @param {object} [filters={}] Bộ lọc.
   * @returns {object[]}
   */
  filterServiceConfigs(filters = {}) {
    if (!isPlainObject(filters)) {
      throw new TypeError(
        'Bộ lọc dịch vụ phải là một object.'
      );
    }

    const status =
      filters.status ?? 'all';

    if (
      ![
        'all',
        SERVICE_CONFIG_STATUS.ACTIVE,
        SERVICE_CONFIG_STATUS.INACTIVE
      ].includes(status)
    ) {
      throw new Error(
        'Trạng thái lọc dịch vụ không hợp lệ.'
      );
    }

    const calculationType =
      filters.calculationType
        ? normalizeServiceCalculationType(
            filters.calculationType
          )
        : null;

    let services =
      typeof filters.keyword === 'string'
        ? this.searchServiceConfigs(
            filters.keyword
          )
        : this.getServiceConfigs();

    services = services.filter(
      (serviceConfig) => {
        if (
          status ===
            SERVICE_CONFIG_STATUS.ACTIVE &&
          !serviceConfig.isActive
        ) {
          return false;
        }

        if (
          status ===
            SERVICE_CONFIG_STATUS.INACTIVE &&
          serviceConfig.isActive
        ) {
          return false;
        }

        if (
          calculationType &&
          serviceConfig.calculationType !==
            calculationType
        ) {
          return false;
        }

        return true;
      }
    );

    return services;
  }
}

export const serviceConfigService =
  new ServiceConfigService();

export default serviceConfigService;