import {
  STORAGE_KEYS
} from '../constants/storage-keys.js';

import {
  CONTRACT_STATUS,
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS
} from '../constants/statuses.js';

import {
  storageService
} from './storage-service.js';

import {
  calculateDiscount,
  calculateElectricAmount,
  calculateFixedServiceAmount,
  calculateInvoiceTotal,
  calculatePerPersonAmount,
  calculatePerVehicleAmount,
  calculateRemainingDebt,
  calculateSubtotal,
  calculateWaterAmount,
  determineInvoiceStatus
} from '../business/invoice-calculator.js';

import {
  validateInvoice
} from '../business/invoice-validator.js';

import {
  isDateRangeOverlap
} from '../business/contract-utils.js';

import {
  getCurrentServicePrice,
  normalizeServiceCalculationType,
  SERVICE_CALCULATION_TYPE
} from '../business/service-config-validator.js';

import {
  calculateElectricUsage,
  calculateWaterUsage
} from '../business/meter-calculator.js';

import {
  createUniqueId
} from '../utils/id-utils.js';

const CONTRACT_STATUSES_WITH_RENTAL_HISTORY = Object.freeze([
  CONTRACT_STATUS.ACTIVE,
  CONTRACT_STATUS.ENDED
]);

const DOCUMENT_STATUS_VALUES = Object.freeze(
  Object.values(INVOICE_DOCUMENT_STATUS)
);

const PAYMENT_STATUS_VALUES = Object.freeze(
  Object.values(INVOICE_PAYMENT_STATUS)
);

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
 * Chuẩn hóa ID.
 *
 * @param {*} id Giá trị ID.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeId(
  id,
  fieldName = 'ID'
) {
  if (typeof id !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedId = id.trim();

  if (!normalizedId) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  return normalizedId;
}

/**
 * Chuẩn hóa khóa tháng YYYY-MM.
 *
 * @param {*} month Khóa tháng.
 * @returns {string}
 */
function normalizeMonthKey(month) {
  if (typeof month !== 'string') {
    throw new TypeError(
      'Tháng hóa đơn phải là một chuỗi YYYY-MM.'
    );
  }

  const normalizedMonth = month.trim();

  const match =
    /^(\d{4})-(\d{2})$/.exec(
      normalizedMonth
    );

  if (!match) {
    throw new Error(
      'Tháng hóa đơn phải đúng định dạng YYYY-MM.'
    );
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    year < 1
  ) {
    throw new Error(
      'Năm hóa đơn không hợp lệ.'
    );
  }

  if (
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new Error(
      'Tháng hóa đơn phải nằm trong khoảng từ 01 đến 12.'
    );
  }

  return normalizedMonth;
}

/**
 * Chuẩn hóa số không âm.
 *
 * @param {*} value Giá trị.
 * @param {string} fieldName Tên trường.
 * @returns {number}
 */
function normalizeNonNegativeNumber(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  const numberValue = Number(value);

  if (
    Number.isNaN(numberValue) ||
    !Number.isFinite(numberValue)
  ) {
    throw new TypeError(
      `${fieldName} phải là một số hợp lệ.`
    );
  }

  if (numberValue < 0) {
    throw new Error(
      `${fieldName} không được là số âm.`
    );
  }

  return numberValue;
}

/**
 * Chuẩn hóa văn bản dùng cho tìm kiếm.
 *
 * @param {*} value Giá trị.
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
 * Lấy ngày hiện tại tại Việt Nam.
 *
 * @returns {string} Ngày YYYY-MM-DD.
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
      .filter(
        (part) =>
          part.type !== 'literal'
      )
      .map(
        (part) => [
          part.type,
          part.value
        ]
      )
  );

  return (
    `${values.year}-` +
    `${values.month}-` +
    `${values.day}`
  );
}

/**
 * Lấy ngày cuối cùng của tháng.
 *
 * @param {string} month Khóa tháng YYYY-MM.
 * @returns {string}
 */
function getLastDateOfMonth(month) {
  const normalizedMonth =
    normalizeMonthKey(month);

  const [year, monthNumber] =
    normalizedMonth
      .split('-')
      .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      monthNumber,
      0
    )
  );

  return date.toISOString().slice(0, 10);
}

/**
 * Lấy tháng kế tiếp.
 *
 * @param {string} month Khóa tháng YYYY-MM.
 * @returns {string}
 */
function getNextMonthKey(month) {
  const normalizedMonth =
    normalizeMonthKey(month);

  let [year, monthNumber] =
    normalizedMonth
      .split('-')
      .map(Number);

  monthNumber += 1;

  if (monthNumber === 13) {
    monthNumber = 1;
    year += 1;
  }

  return (
    `${String(year).padStart(4, '0')}-` +
    `${String(monthNumber).padStart(2, '0')}`
  );
}

/**
 * Tạo ngày đến hạn ở tháng kế tiếp.
 *
 * @param {string} invoiceMonth Tháng hóa đơn.
 * @param {*} dueDay Ngày thanh toán trong tháng.
 * @returns {string}
 */
function createDefaultDueDate(
  invoiceMonth,
  dueDay
) {
  const nextMonth =
    getNextMonthKey(invoiceMonth);

  const normalizedDueDay =
    Number.isInteger(Number(dueDay)) &&
    Number(dueDay) >= 1
      ? Number(dueDay)
      : 10;

  const [year, monthNumber] =
    nextMonth
      .split('-')
      .map(Number);

  const lastDay = new Date(
    Date.UTC(
      year,
      monthNumber,
      0
    )
  ).getUTCDate();

  const day = Math.min(
    normalizedDueDay,
    lastDay
  );

  return (
    `${nextMonth}-` +
    `${String(day).padStart(2, '0')}`
  );
}

/**
 * Lấy khoảng ngày của một tháng.
 *
 * @param {string} month Khóa tháng.
 * @returns {{startDate: string, endDate: string}}
 */
function getMonthDateRange(month) {
  const normalizedMonth =
    normalizeMonthKey(month);

  return {
    startDate:
      `${normalizedMonth}-01`,

    endDate:
      getLastDateOfMonth(
        normalizedMonth
      )
  };
}

/**
 * Lấy trạng thái chứng từ của hóa đơn.
 *
 * Hỗ trợ dữ liệu cũ lưu trạng thái trong trường status.
 *
 * @param {object} invoice Hóa đơn.
 * @returns {string}
 */
function getInvoiceDocumentStatus(invoice) {
  const status =
    invoice?.documentStatus ??
    invoice?.status;

  return DOCUMENT_STATUS_VALUES.includes(
    status
  )
    ? status
    : INVOICE_DOCUMENT_STATUS.DRAFT;
}

/**
 * Nhận diện dịch vụ usage là điện hay nước.
 *
 * Ưu tiên các thuộc tính usageType và meterType.
 * Sau đó kiểm tra mã, tên và đơn vị.
 *
 * @param {object} serviceConfig Cấu hình dịch vụ.
 * @returns {'electricity'|'water'|null}
 */
function detectUsageType(serviceConfig) {
  const explicitType =
    serviceConfig.usageType ??
    serviceConfig.meterType;

  const normalizedExplicitType =
    normalizeSearchText(explicitType);

  if (
    [
      'electricity',
      'electric',
      'dien'
    ].includes(normalizedExplicitType)
  ) {
    return 'electricity';
  }

  if (
    [
      'water',
      'nuoc'
    ].includes(normalizedExplicitType)
  ) {
    return 'water';
  }

  const searchableText =
    normalizeSearchText([
      serviceConfig.code,
      serviceConfig.name,
      serviceConfig.unit
    ].join(' '));

  if (
    searchableText.includes('electric') ||
    searchableText.includes('dien') ||
    searchableText.includes('kwh')
  ) {
    return 'electricity';
  }

  if (
    searchableText.includes('water') ||
    searchableText.includes('nuoc') ||
    searchableText.includes('m3') ||
    searchableText.includes('m³')
  ) {
    return 'water';
  }

  return null;
}

/**
 * Tính thành tiền bằng số lượng nhân đơn giá.
 *
 * @param {*} quantity Số lượng.
 * @param {*} unitPrice Đơn giá.
 * @param {string} label Nhãn.
 * @returns {number}
 */
function calculateQuantityAmount(
  quantity,
  unitPrice,
  label
) {
  const normalizedQuantity =
    normalizeNonNegativeNumber(
      quantity,
      `Số lượng ${label}`
    );

  const normalizedUnitPrice =
    normalizeNonNegativeNumber(
      unitPrice,
      `Đơn giá ${label}`
    );

  const amount =
    normalizedQuantity *
    normalizedUnitPrice;

  if (
    Number.isNaN(amount) ||
    !Number.isFinite(amount)
  ) {
    throw new Error(
      `Không thể tính thành tiền ${label}.`
    );
  }

  return amount;
}

/**
 * Service quản lý hóa đơn.
 *
 * Giá thuê và giá dịch vụ được lưu trực tiếp trong từng
 * dòng hóa đơn để không bị ảnh hưởng bởi thay đổi sau này.
 */
export class InvoiceService {
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

    const validStorageService =
      service &&
      requiredMethods.every(
        (methodName) =>
          typeof service[methodName] ===
          'function'
      );

    if (!validStorageService) {
      throw new TypeError(
        'InvoiceService cần một StorageService hợp lệ.'
      );
    }

    this.storageService = service;
  }

  /**
   * Kiểm tra mã hóa đơn không bị trùng.
   *
   * @param {string} code Mã hóa đơn.
   * @param {string|null} excludedInvoiceId ID được bỏ qua.
   * @returns {true}
   */
  _assertInvoiceCodeUnique(
    code,
    excludedInvoiceId = null
  ) {
    if (
      typeof code !== 'string' ||
      !code.trim()
    ) {
      throw new Error(
        'Mã hóa đơn không được để trống.'
      );
    }

    const normalizedCode =
      code.trim().toUpperCase();

    const duplicatedInvoice =
      this.storageService
        .getAll(STORAGE_KEYS.INVOICES)
        .find(
          (invoice) =>
            invoice?.id !==
              excludedInvoiceId &&
            typeof invoice?.code ===
              'string' &&
            invoice.code
              .trim()
              .toUpperCase() ===
              normalizedCode
        );

    if (duplicatedInvoice) {
      throw new Error(
        `Mã hóa đơn "${normalizedCode}" đã tồn tại.`
      );
    }

    return true;
  }

  /**
   * Kiểm tra mỗi phòng chỉ có một hóa đơn trong tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @param {string|null} excludedInvoiceId ID được bỏ qua.
   * @returns {true}
   */
  _assertUniqueRoomAndMonth(
    roomId,
    month,
    excludedInvoiceId = null
  ) {
    const duplicatedInvoice =
      this.storageService
        .getAll(STORAGE_KEYS.INVOICES)
        .find(
          (invoice) =>
            invoice?.id !==
              excludedInvoiceId &&
            invoice?.roomId === roomId &&
            (
              invoice?.period ??
              invoice?.month
            ) === month
        );

    if (duplicatedInvoice) {
      throw new Error(
        `Phòng đã có hóa đơn trong tháng ${month}.`
      );
    }

    return true;
  }

  /**
   * Lấy hợp đồng có hiệu lực trong tháng của phòng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {object}
   */
  _getContractForRoomAndMonth(
    roomId,
    month
  ) {
    const { startDate, endDate } =
      getMonthDateRange(month);

    const matchingContracts =
      this.storageService
        .getAll(STORAGE_KEYS.CONTRACTS)
        .filter((contract) => {
          if (
            contract?.roomId !== roomId ||
            !CONTRACT_STATUSES_WITH_RENTAL_HISTORY
              .includes(contract.status)
          ) {
            return false;
          }

          return isDateRangeOverlap(
            contract.startDate,
            contract.endDate,
            startDate,
            endDate
          );
        });

    if (matchingContracts.length === 0) {
      throw new Error(
        `Phòng không có hợp đồng hiệu lực trong tháng ${month}.`
      );
    }

    if (matchingContracts.length > 1) {
      throw new Error(
        `Phòng có nhiều hơn một hợp đồng trong tháng ${month}. Không thể tự động xác định hợp đồng lập hóa đơn.`
      );
    }

    return cloneJson(
      matchingContracts[0]
    );
  }

  /**
   * Lấy bản ghi điện nước tương ứng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {object}
   */
  _getMeterReading(
    roomId,
    month
  ) {
    const reading =
      this.storageService
        .getAll(
          STORAGE_KEYS.METER_READINGS
        )
        .find(
          (item) =>
            item?.roomId === roomId &&
            (
              item?.period ??
              item?.monthKey
            ) === month
        );

    if (!reading) {
      throw new Error(
        `Phòng chưa có bản ghi điện nước trong tháng ${month}.`
      );
    }

    return {
      ...cloneJson(reading),

      period:
        reading.period ??
        reading.monthKey,

      electricityUsage:
        calculateElectricUsage(
          reading.electricityPrevious,
          reading.electricityCurrent
        ),

      waterUsage:
        calculateWaterUsage(
          reading.waterPrevious,
          reading.waterCurrent
        )
    };
  }

  /**
   * Lấy các người thuê thuộc hợp đồng.
   *
   * @param {object} contract Hợp đồng.
   * @returns {object[]}
   */
  _getContractTenants(contract) {
    const tenantIds = Array.isArray(
      contract.tenantIds
    )
      ? contract.tenantIds
      : [];

    const tenantIdSet = new Set(
      tenantIds
    );

    return this.storageService
      .getAll(STORAGE_KEYS.TENANTS)
      .filter(
        (tenant) =>
          tenantIdSet.has(tenant.id)
      )
      .map(cloneJson);
  }

  /**
   * Đếm số xe của những người thuộc hợp đồng.
   *
   * Các biển số trùng nhau chỉ được tính một lần.
   *
   * @param {object[]} tenants Danh sách người thuê.
   * @returns {number}
   */
  _countVehicles(tenants) {
    const vehiclePlates = new Set();

    tenants.forEach((tenant) => {
      const values = Array.isArray(
        tenant.vehiclePlates
      )
        ? tenant.vehiclePlates
        : [tenant.vehiclePlate];

      values.forEach((vehiclePlate) => {
        const normalizedPlate =
          normalizeSearchText(
            vehiclePlate
          );

        if (normalizedPlate) {
          vehiclePlates.add(
            normalizedPlate
          );
        }
      });
    });

    return vehiclePlates.size;
  }

  /**
   * Lấy các dịch vụ đang được áp dụng.
   *
   * @returns {object[]}
   */
  _getActiveServiceConfigs() {
    return this.storageService
      .getAll(
        STORAGE_KEYS.SERVICE_CONFIGS
      )
      .filter(
        (serviceConfig) =>
          serviceConfig?.isActive !== false
      )
      .map(cloneJson);
  }

  /**
   * Tạo dòng tiền phòng.
   *
   * @param {object} contract Hợp đồng.
   * @returns {object}
   */
  _createRentItem(contract) {
    const rentAmount =
      calculateFixedServiceAmount(
        contract.rentAmount ??
        contract.monthlyRent
      );

    return {
      id:
        createUniqueId('invoice-item'),

      type: 'rent',

      sourceType: 'contract',

      sourceId: contract.id,

      name: 'Tiền phòng',

      unit: 'phòng',

      calculationType:
        SERVICE_CALCULATION_TYPE.FIXED,

      quantity: 1,

      unitPrice: rentAmount,

      amount: rentAmount
    };
  }

  /**
   * Tạo dòng hóa đơn từ cấu hình dịch vụ.
   *
   * @param {object} serviceConfig Cấu hình dịch vụ.
   * @param {object} context Dữ liệu tính toán.
   * @returns {object}
   */
  _createServiceItem(
    serviceConfig,
    {
      month,
      reading,
      personCount,
      vehicleCount,
      manualServiceQuantities
    }
  ) {
    const calculationType =
      normalizeServiceCalculationType(
        serviceConfig.calculationType
      );

    const priceDate =
      getLastDateOfMonth(month);

    const unitPrice =
      getCurrentServicePrice(
        serviceConfig,
        priceDate
      );

    if (unitPrice === null) {
      throw new Error(
        `Dịch vụ "${serviceConfig.name}" không có đơn giá áp dụng trong tháng ${month}.`
      );
    }

    let quantity;
    let amount;
    let usageType = null;
    let requiresManualInput = false;

    switch (calculationType) {
      case SERVICE_CALCULATION_TYPE.USAGE: {
        usageType =
          detectUsageType(
            serviceConfig
          );

        if (usageType === 'electricity') {
          quantity =
            reading.electricityUsage;

          amount =
            calculateElectricAmount(
              quantity,
              unitPrice
            );

          break;
        }

        if (usageType === 'water') {
          quantity =
            reading.waterUsage;

          amount =
            calculateWaterAmount(
              quantity,
              unitPrice
            );

          break;
        }

        throw new Error(
          `Không xác định được dịch vụ usage "${serviceConfig.name}" là điện hay nước. Hãy cấu hình usageType hoặc meterType.`
        );
      }

      case SERVICE_CALCULATION_TYPE.FIXED:
        quantity = 1;

        amount =
          calculateFixedServiceAmount(
            unitPrice
          );
        break;

      case SERVICE_CALCULATION_TYPE.PER_PERSON:
        quantity = personCount;

        amount =
          calculatePerPersonAmount(
            quantity,
            unitPrice
          );
        break;

      case SERVICE_CALCULATION_TYPE.PER_VEHICLE:
        quantity = vehicleCount;

        amount =
          calculatePerVehicleAmount(
            quantity,
            unitPrice
          );
        break;

      case SERVICE_CALCULATION_TYPE.MANUAL: {
        const manualQuantity =
          manualServiceQuantities?.[
            serviceConfig.id
          ] ?? 0;

        quantity =
          normalizeNonNegativeNumber(
            manualQuantity,
            `Số lượng dịch vụ ${serviceConfig.name}`
          );

        amount =
          calculateQuantityAmount(
            quantity,
            unitPrice,
            serviceConfig.name
          );

        requiresManualInput =
          manualServiceQuantities?.[
            serviceConfig.id
          ] === undefined;

        break;
      }

      default:
        throw new Error(
          `Cách tính của dịch vụ "${serviceConfig.name}" không hợp lệ.`
        );
    }

    return {
      id:
        createUniqueId('invoice-item'),

      type:
        usageType ??
        'service',

      sourceType:
        'serviceConfig',

      sourceId:
        serviceConfig.id,

      serviceConfigId:
        serviceConfig.id,

      name:
        serviceConfig.name,

      unit:
        serviceConfig.unit,

      calculationType,

      usageType,

      quantity,

      unitPrice,

      amount,

      requiresManualInput
    };
  }

  /**
   * Tạo toàn bộ dòng hóa đơn từ dữ liệu nguồn.
   *
   * @param {object} contract Hợp đồng.
   * @param {object} reading Bản ghi chỉ số.
   * @param {string} month Khóa tháng.
   * @param {object} options Tùy chọn.
   * @returns {object[]}
   */
  _createGeneratedItems(
    contract,
    reading,
    month,
    options = {}
  ) {
    const tenants =
      this._getContractTenants(
        contract
      );

    const personCount =
      Array.isArray(contract.tenantIds)
        ? new Set(
            contract.tenantIds
          ).size
        : tenants.length;

    const vehicleCount =
      this._countVehicles(tenants);

    const serviceConfigs =
      this._getActiveServiceConfigs();

    const items = [
      this._createRentItem(contract)
    ];

    serviceConfigs.forEach(
      (serviceConfig) => {
        items.push(
          this._createServiceItem(
            serviceConfig,
            {
              month,
              reading,
              personCount,
              vehicleCount,

              manualServiceQuantities:
                options
                  .manualServiceQuantities
            }
          )
        );
      }
    );

    return items;
  }

  /**
   * Tạo dữ liệu hóa đơn nháp từ các dữ liệu nguồn.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @param {object} options Các tùy chọn.
   * @returns {object}
   */
  _buildGeneratedInvoiceData(
    roomId,
    month,
    options = {}
  ) {
    const room =
      this.storageService.getById(
        STORAGE_KEYS.ROOMS,
        roomId
      );

    if (!room) {
      throw new Error(
        `Không tìm thấy phòng có ID "${roomId}".`
      );
    }

    const contract =
      this._getContractForRoomAndMonth(
        roomId,
        month
      );

    const reading =
      this._getMeterReading(
        roomId,
        month
      );

    const items =
      this._createGeneratedItems(
        contract,
        reading,
        month,
        options
      );

    const issueDate =
      options.issueDate ??
      getLastDateOfMonth(month);

    const dueDate =
      options.dueDate ??
      createDefaultDueDate(
        month,
        contract.dueDay
      );

    const code =
      (
        options.code ??
        `HD-${room.code}-${month.replace('-', '')}`
      )
        .trim()
        .toUpperCase();

    return {
      code,
      roomId,
      contractId: contract.id,
      meterReadingId: reading.id,
      period: month,
      issueDate,
      dueDate,
      items,

      discount:
        options.discount ?? 0,

      paidAmount: 0,

      documentStatus:
        INVOICE_DOCUMENT_STATUS.DRAFT,

      note:
        typeof options.note === 'string'
          ? options.note.trim()
          : '',

      roomSnapshot: {
        id: room.id,
        code: room.code,
        name: room.name
      },

      contractSnapshot: {
        id: contract.id,
        code:
          contract.code ??
          contract.id,

        representativeTenantId:
          contract
            .representativeTenantId,

        tenantIds: [
          ...(contract.tenantIds ?? [])
        ],

        rentAmount:
          contract.rentAmount ??
          contract.monthlyRent
      },

      meterReadingSnapshot: {
        id: reading.id,

        electricityPrevious:
          reading.electricityPrevious,

        electricityCurrent:
          reading.electricityCurrent,

        electricityUsage:
          reading.electricityUsage,

        waterPrevious:
          reading.waterPrevious,

        waterCurrent:
          reading.waterCurrent,

        waterUsage:
          reading.waterUsage
      }
    };
  }

  /**
   * Tính lại từng dòng hóa đơn từ snapshot số lượng và đơn giá.
   *
   * Không lấy đơn giá hiện tại từ cấu hình dịch vụ.
   *
   * @param {object[]} items Các dòng hóa đơn.
   * @returns {object[]}
   */
  _recalculateItems(items) {
    if (!Array.isArray(items)) {
      throw new TypeError(
        'Danh sách dòng hóa đơn phải là một mảng.'
      );
    }

    return items.map(
      (item, index) => {
        if (!isPlainObject(item)) {
          throw new TypeError(
            `Dòng hóa đơn thứ ${index + 1} phải là một object.`
          );
        }

        /*
         * Hỗ trợ dòng dữ liệu cũ chỉ lưu amount.
         */
        if (
          item.quantity === undefined ||
          item.unitPrice === undefined
        ) {
          return {
            ...cloneJson(item),

            amount:
              normalizeNonNegativeNumber(
                item.amount,
                `Thành tiền dòng thứ ${index + 1}`
              )
          };
        }

        const quantity =
          normalizeNonNegativeNumber(
            item.quantity,
            `Số lượng dòng thứ ${index + 1}`
          );

        const unitPrice =
          normalizeNonNegativeNumber(
            item.unitPrice,
            `Đơn giá dòng thứ ${index + 1}`
          );

        const calculationType =
          item.calculationType ??
          SERVICE_CALCULATION_TYPE.MANUAL;

        let amount;

        if (
          item.type === 'rent' ||
          calculationType ===
            SERVICE_CALCULATION_TYPE.FIXED
        ) {
          amount =
            calculateFixedServiceAmount(
              unitPrice
            );
        } else if (
          calculationType ===
          SERVICE_CALCULATION_TYPE.PER_PERSON
        ) {
          amount =
            calculatePerPersonAmount(
              quantity,
              unitPrice
            );
        } else if (
          calculationType ===
          SERVICE_CALCULATION_TYPE.PER_VEHICLE
        ) {
          amount =
            calculatePerVehicleAmount(
              quantity,
              unitPrice
            );
        } else if (
          calculationType ===
          SERVICE_CALCULATION_TYPE.USAGE &&
          (
            item.usageType ===
              'electricity' ||
            item.type ===
              'electricity'
          )
        ) {
          amount =
            calculateElectricAmount(
              quantity,
              unitPrice
            );
        } else if (
          calculationType ===
          SERVICE_CALCULATION_TYPE.USAGE &&
          (
            item.usageType === 'water' ||
            item.type === 'water'
          )
        ) {
          amount =
            calculateWaterAmount(
              quantity,
              unitPrice
            );
        } else {
          amount =
            calculateQuantityAmount(
              quantity,
              unitPrice,
              item.name ??
                `dòng thứ ${index + 1}`
            );
        }

        return {
          ...cloneJson(item),
          quantity,
          unitPrice,
          amount
        };
      }
    );
  }

  /**
   * Tính lại tổng tiền và trạng thái thanh toán.
   *
   * @param {object} invoice Hóa đơn.
   * @returns {object}
   */
  _prepareRecalculatedInvoice(invoice) {
    const items =
      this._recalculateItems(
        invoice.items
      );

    const subtotal =
      calculateSubtotal(items);

    const discount =
      calculateDiscount(
        subtotal,
        invoice.discount ??
        invoice.discountAmount ??
        0
      );

    const total =
      calculateInvoiceTotal(
        items,
        discount
      );

    const paidAmount =
      normalizeNonNegativeNumber(
        invoice.paidAmount ?? 0,
        'Số tiền đã trả'
      );

    const remainingDebt =
      calculateRemainingDebt(
        total,
        paidAmount
      );

    const paymentStatus =
      determineInvoiceStatus(
        total,
        paidAmount,
        invoice.dueDate,
        getCurrentDateInVietnam()
      );

    return {
      ...cloneJson(invoice),
      items,
      subtotal,
      discount,
      total,
      paidAmount,
      remainingDebt,
      paymentStatus,

      documentStatus:
        getInvoiceDocumentStatus(
          invoice
        )
    };
  }

  /**
   * Tạo dữ liệu hóa đơn dùng để trả về.
   *
   * @param {object} invoice Hóa đơn lưu trữ.
   * @returns {object}
   */
  _createInvoiceView(invoice) {
    const recalculated =
      this._prepareRecalculatedInvoice(
        invoice
      );

    if (
      getInvoiceDocumentStatus(
        invoice
      ) ===
      INVOICE_DOCUMENT_STATUS.CANCELLED
    ) {
      return {
        ...recalculated,

        documentStatus:
          INVOICE_DOCUMENT_STATUS.CANCELLED
      };
    }

    return recalculated;
  }

  /**
   * Kiểm tra hóa đơn đang là bản nháp.
   *
   * @param {object} invoice Hóa đơn.
   * @returns {true}
   */
  _assertDraftInvoice(invoice) {
    if (
      getInvoiceDocumentStatus(
        invoice
      ) !==
      INVOICE_DOCUMENT_STATUS.DRAFT
    ) {
      throw new Error(
        'Chỉ hóa đơn nháp mới được chỉnh sửa.'
      );
    }

    return true;
  }

  /**
   * Lấy toàn bộ hóa đơn.
   *
   * @returns {object[]}
   */
  getInvoices() {
    return this.storageService
      .getAll(STORAGE_KEYS.INVOICES)
      .map(
        (invoice) =>
          this._createInvoiceView(
            invoice
          )
      );
  }

  /**
   * Lấy hóa đơn theo ID.
   *
   * @param {string} id ID hóa đơn.
   * @returns {object|null}
   */
  getInvoiceById(id) {
    const invoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        id
      );

    return invoice
      ? this._createInvoiceView(
          invoice
        )
      : null;
  }

  /**
   * Lấy hóa đơn của một phòng trong một tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {object|null}
   */
  getInvoiceByRoomAndMonth(
    roomId,
    month
  ) {
    const normalizedRoomId =
      normalizeId(roomId, 'ID phòng');

    const normalizedMonth =
      normalizeMonthKey(month);

    const invoice =
      this.storageService
        .getAll(STORAGE_KEYS.INVOICES)
        .find(
          (item) =>
            item?.roomId ===
              normalizedRoomId &&
            (
              item?.period ??
              item?.month
            ) === normalizedMonth
        );

    return invoice
      ? this._createInvoiceView(
          invoice
        )
      : null;
  }

  /**
   * Tạo hóa đơn nháp.
   *
   * Các dòng hóa đơn được tự động tạo từ:
   * - Giá thuê trong hợp đồng.
   * - Bản ghi điện nước.
   * - Dịch vụ đang áp dụng.
   *
   * @param {object} data Thông tin tạo hóa đơn.
   * @returns {object}
   */
  createInvoice(data) {
    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu tạo hóa đơn phải là một object.'
      );
    }

    const roomId =
      normalizeId(
        data.roomId,
        'ID phòng'
      );

    const month =
      normalizeMonthKey(
        data.period ??
        data.month
      );

    this._assertUniqueRoomAndMonth(
      roomId,
      month
    );

    if (
      data.paidAmount !== undefined &&
      Number(data.paidAmount) !== 0
    ) {
      throw new Error(
        'Hóa đơn mới chưa được phép có số tiền đã trả.'
      );
    }

    if (
      data.documentStatus !== undefined &&
      data.documentStatus !==
        INVOICE_DOCUMENT_STATUS.DRAFT
    ) {
      throw new Error(
        'Hóa đơn mới phải được tạo ở trạng thái nháp.'
      );
    }

    const generatedData =
      this._buildGeneratedInvoiceData(
        roomId,
        month,
        data
      );

    this._assertInvoiceCodeUnique(
      generatedData.code
    );

    const validatedInvoice =
      validateInvoice({
        ...generatedData,

        currentDate:
          getCurrentDateInVietnam()
      });

    const createdInvoice =
      this.storageService.create(
        STORAGE_KEYS.INVOICES,
        validatedInvoice
      );

    return this._createInvoiceView(
      createdInvoice
    );
  }

  /**
   * Tạo hóa đơn cho một phòng trong tháng.
   *
   * @param {string} roomId ID phòng.
   * @param {string} month Khóa tháng.
   * @returns {object}
   */
  generateInvoiceForRoom(
    roomId,
    month
  ) {
    return this.createInvoice({
      roomId,
      period: month
    });
  }

  /**
   * Tạo hóa đơn cho các phòng có hợp đồng trong tháng.
   *
   * Hàm tiếp tục xử lý các phòng còn lại khi một phòng lỗi.
   *
   * @param {string} month Khóa tháng.
   * @returns {{
   *   created: object[],
   *   skipped: Array<{roomId: string, reason: string}>,
   *   errors: Array<{roomId: string, message: string}>
   * }}
   */
  generateInvoicesForMonth(month) {
    const normalizedMonth =
      normalizeMonthKey(month);

    const { startDate, endDate } =
      getMonthDateRange(
        normalizedMonth
      );

    const contracts =
      this.storageService.getAll(
        STORAGE_KEYS.CONTRACTS
      );

    const eligibleRoomIds =
      new Set(
        contracts
          .filter((contract) => {
            if (
              !CONTRACT_STATUSES_WITH_RENTAL_HISTORY
                .includes(
                  contract?.status
                )
            ) {
              return false;
            }

            return isDateRangeOverlap(
              contract.startDate,
              contract.endDate,
              startDate,
              endDate
            );
          })
          .map(
            (contract) =>
              contract.roomId
          )
          .filter(Boolean)
      );

    const result = {
      created: [],
      skipped: [],
      errors: []
    };

    eligibleRoomIds.forEach((roomId) => {
      const existingInvoice =
        this.getInvoiceByRoomAndMonth(
          roomId,
          normalizedMonth
        );

      if (existingInvoice) {
        result.skipped.push({
          roomId,
          reason:
            'Phòng đã có hóa đơn trong tháng.'
        });

        return;
      }

      try {
        result.created.push(
          this.generateInvoiceForRoom(
            roomId,
            normalizedMonth
          )
        );
      } catch (error) {
        result.errors.push({
          roomId,

          message:
            error instanceof Error
              ? error.message
              : 'Không thể tạo hóa đơn.'
        });
      }
    });

    return result;
  }

  /**
   * Cập nhật hóa đơn nháp.
   *
   * Không cho phép thay đổi phòng, tháng, hợp đồng hoặc
   * bản ghi chỉ số của hóa đơn hiện có.
   *
   * @param {string} id ID hóa đơn.
   * @param {object} data Dữ liệu cập nhật.
   * @returns {object}
   */
  updateDraftInvoice(id, data) {
    const normalizedId =
      normalizeId(
        id,
        'ID hóa đơn'
      );

    if (!isPlainObject(data)) {
      throw new TypeError(
        'Dữ liệu cập nhật hóa đơn phải là một object.'
      );
    }

    const currentInvoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        normalizedId
      );

    if (!currentInvoice) {
      throw new Error(
        `Không tìm thấy hóa đơn có ID "${normalizedId}".`
      );
    }

    this._assertDraftInvoice(
      currentInvoice
    );

    const immutableFields = [
      'roomId',
      'period',
      'month',
      'contractId',
      'meterReadingId'
    ];

    immutableFields.forEach(
      (fieldName) => {
        if (
          data[fieldName] !== undefined &&
          data[fieldName] !==
            currentInvoice[fieldName]
        ) {
          throw new Error(
            `Không được thay đổi trường "${fieldName}" của hóa đơn đã tạo.`
          );
        }
      }
    );

    if (
      data.paidAmount !== undefined &&
      Number(data.paidAmount) !==
        Number(
          currentInvoice.paidAmount ?? 0
        )
    ) {
      throw new Error(
        'Không được thay đổi số tiền đã trả bằng updateDraftInvoice().'
      );
    }

    if (
      data.documentStatus !== undefined &&
      data.documentStatus !==
        INVOICE_DOCUMENT_STATUS.DRAFT
    ) {
      throw new Error(
        'Không được đổi trạng thái bằng updateDraftInvoice().'
      );
    }

    const mergedInvoice = {
      ...cloneJson(currentInvoice),
      ...cloneJson(data),

      id: currentInvoice.id,

      roomId:
        currentInvoice.roomId,

      period:
        currentInvoice.period ??
        currentInvoice.month,

      contractId:
        currentInvoice.contractId,

      meterReadingId:
        currentInvoice.meterReadingId,

      paidAmount:
        currentInvoice.paidAmount ?? 0,

      documentStatus:
        INVOICE_DOCUMENT_STATUS.DRAFT
    };

    if (
      data.code !== undefined
    ) {
      this._assertInvoiceCodeUnique(
        data.code,
        currentInvoice.id
      );
    }

    const recalculated =
      this._prepareRecalculatedInvoice(
        mergedInvoice
      );

    const validated =
      validateInvoice({
        ...recalculated,

        currentDate:
          getCurrentDateInVietnam()
      });

    const {
      id: ignoredId,
      createdAt,
      updatedAt,
      ...changes
    } = validated;

    const updatedInvoice =
      this.storageService.update(
        STORAGE_KEYS.INVOICES,
        currentInvoice.id,
        changes
      );

    return this._createInvoiceView(
      updatedInvoice
    );
  }

  /**
   * Chốt hóa đơn nháp.
   *
   * Sau khi chốt, hóa đơn không còn được sửa tùy ý.
   *
   * @param {string} id ID hóa đơn.
   * @returns {object}
   */
  finalizeInvoice(id) {
    const normalizedId =
      normalizeId(
        id,
        'ID hóa đơn'
      );

    const currentInvoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        normalizedId
      );

    if (!currentInvoice) {
      throw new Error(
        `Không tìm thấy hóa đơn có ID "${normalizedId}".`
      );
    }

    this._assertDraftInvoice(
      currentInvoice
    );

    const recalculated =
      this._prepareRecalculatedInvoice(
        currentInvoice
      );

    const validated =
      validateInvoice({
        ...recalculated,

        documentStatus:
          INVOICE_DOCUMENT_STATUS.FINALIZED,

        currentDate:
          getCurrentDateInVietnam()
      });

    const {
      id: ignoredId,
      createdAt,
      updatedAt,
      ...changes
    } = validated;

    const finalizedInvoice =
      this.storageService.update(
        STORAGE_KEYS.INVOICES,
        currentInvoice.id,
        {
          ...changes,

          documentStatus:
            INVOICE_DOCUMENT_STATUS.FINALIZED,

          finalizedAt:
            new Date().toISOString()
        }
      );

    return this._createInvoiceView(
      finalizedInvoice
    );
  }

  /**
   * Hủy hóa đơn.
   *
   * Hóa đơn đã có thanh toán không được hủy.
   *
   * @param {string} id ID hóa đơn.
   * @returns {object}
   */
  cancelInvoice(id) {
    const normalizedId =
      normalizeId(
        id,
        'ID hóa đơn'
      );

    const currentInvoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        normalizedId
      );

    if (!currentInvoice) {
      throw new Error(
        `Không tìm thấy hóa đơn có ID "${normalizedId}".`
      );
    }

    const documentStatus =
      getInvoiceDocumentStatus(
        currentInvoice
      );

    if (
      documentStatus ===
      INVOICE_DOCUMENT_STATUS.CANCELLED
    ) {
      return this._createInvoiceView(
        currentInvoice
      );
    }

    const paidAmount =
      normalizeNonNegativeNumber(
        currentInvoice.paidAmount ?? 0,
        'Số tiền đã trả'
      );

    if (paidAmount > 0) {
      throw new Error(
        'Không thể hủy hóa đơn đã có thanh toán.'
      );
    }

    const cancelledInvoice =
      this.storageService.update(
        STORAGE_KEYS.INVOICES,
        currentInvoice.id,
        {
          documentStatus:
            INVOICE_DOCUMENT_STATUS.CANCELLED,

          paymentStatus:
            INVOICE_PAYMENT_STATUS.UNPAID,

          cancelledAt:
            new Date().toISOString()
        }
      );

    return this._createInvoiceView(
      cancelledInvoice
    );
  }

  /**
   * Xóa hóa đơn nháp.
   *
   * Hóa đơn đã chốt, đã hủy hoặc đã thanh toán không được xóa.
   *
   * @param {string} id ID hóa đơn.
   * @returns {object}
   */
  deleteDraftInvoice(id) {
    const normalizedId =
      normalizeId(
        id,
        'ID hóa đơn'
      );

    const invoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        normalizedId
      );

    if (!invoice) {
      throw new Error(
        `Không tìm thấy hóa đơn có ID "${normalizedId}".`
      );
    }

    this._assertDraftInvoice(invoice);

    const paidAmount =
      normalizeNonNegativeNumber(
        invoice.paidAmount ?? 0,
        'Số tiền đã trả'
      );

    if (paidAmount > 0) {
      throw new Error(
        'Không thể xóa hóa đơn đã thanh toán.'
      );
    }

    const removedInvoice =
      this.storageService.remove(
        STORAGE_KEYS.INVOICES,
        normalizedId
      );

    if (!removedInvoice) {
      throw new Error(
        `Không thể xóa hóa đơn có ID "${normalizedId}".`
      );
    }

    return this._createInvoiceView(
      removedInvoice
    );
  }

  /**
   * Tính lại hóa đơn từ snapshot hiện có.
   *
   * Không lấy giá thuê hoặc đơn giá dịch vụ hiện tại.
   *
   * @param {string} id ID hóa đơn.
   * @returns {object}
   */
  recalculateInvoice(id) {
    const normalizedId =
      normalizeId(
        id,
        'ID hóa đơn'
      );

    const currentInvoice =
      this.storageService.getById(
        STORAGE_KEYS.INVOICES,
        normalizedId
      );

    if (!currentInvoice) {
      throw new Error(
        `Không tìm thấy hóa đơn có ID "${normalizedId}".`
      );
    }

    this._assertDraftInvoice(
      currentInvoice
    );

    const recalculated =
      this._prepareRecalculatedInvoice(
        currentInvoice
      );

    const validated =
      validateInvoice({
        ...recalculated,

        currentDate:
          getCurrentDateInVietnam()
      });

    const {
      id: ignoredId,
      createdAt,
      updatedAt,
      ...changes
    } = validated;

    const updatedInvoice =
      this.storageService.update(
        STORAGE_KEYS.INVOICES,
        currentInvoice.id,
        changes
      );

    return this._createInvoiceView(
      updatedInvoice
    );
  }

  /**
   * Lọc danh sách hóa đơn.
   *
   * Các bộ lọc được hỗ trợ:
   * - keyword: mã hóa đơn hoặc mã/tên phòng snapshot.
   * - roomId.
   * - month hoặc period.
   * - fromMonth.
   * - toMonth.
   * - documentStatus hoặc status.
   * - paymentStatus.
   * - overdueOnly.
   *
   * @param {object} [filters={}] Bộ lọc.
   * @returns {object[]}
   */
  filterInvoices(filters = {}) {
    if (!isPlainObject(filters)) {
      throw new TypeError(
        'Bộ lọc hóa đơn phải là một object.'
      );
    }

    const keyword =
      filters.keyword === undefined
        ? ''
        : normalizeSearchText(
            filters.keyword
          );

    const roomId =
      filters.roomId === undefined ||
      filters.roomId === ''
        ? null
        : normalizeId(
            filters.roomId,
            'ID phòng'
          );

    const monthValue =
      filters.month ??
      filters.period;

    const month =
      monthValue === undefined ||
      monthValue === ''
        ? null
        : normalizeMonthKey(
            monthValue
          );

    const fromMonth =
      filters.fromMonth === undefined ||
      filters.fromMonth === ''
        ? null
        : normalizeMonthKey(
            filters.fromMonth
          );

    const toMonth =
      filters.toMonth === undefined ||
      filters.toMonth === ''
        ? null
        : normalizeMonthKey(
            filters.toMonth
          );

    if (
      fromMonth &&
      toMonth &&
      fromMonth > toMonth
    ) {
      throw new Error(
        'Tháng bắt đầu không được sau tháng kết thúc.'
      );
    }

    const documentStatus =
      filters.documentStatus ??
      filters.status ??
      null;

    if (
      documentStatus !== null &&
      documentStatus !== '' &&
      !DOCUMENT_STATUS_VALUES.includes(
        documentStatus
      )
    ) {
      throw new Error(
        'Trạng thái chứng từ hóa đơn không hợp lệ.'
      );
    }

    const paymentStatus =
      filters.paymentStatus ?? null;

    if (
      paymentStatus !== null &&
      paymentStatus !== '' &&
      !PAYMENT_STATUS_VALUES.includes(
        paymentStatus
      )
    ) {
      throw new Error(
        'Trạng thái thanh toán không hợp lệ.'
      );
    }

    if (
      filters.overdueOnly !== undefined &&
      typeof filters.overdueOnly !==
        'boolean'
    ) {
      throw new TypeError(
        'overdueOnly phải là boolean.'
      );
    }

    return this.getInvoices()
      .filter((invoice) => {
        if (keyword) {
          const searchableText =
            normalizeSearchText([
              invoice.code,
              invoice.roomSnapshot?.code,
              invoice.roomSnapshot?.name
            ].join(' '));

          if (
            !searchableText.includes(
              keyword
            )
          ) {
            return false;
          }
        }

        if (
          roomId &&
          invoice.roomId !== roomId
        ) {
          return false;
        }

        if (
          month &&
          invoice.period !== month
        ) {
          return false;
        }

        if (
          fromMonth &&
          invoice.period < fromMonth
        ) {
          return false;
        }

        if (
          toMonth &&
          invoice.period > toMonth
        ) {
          return false;
        }

        if (
          documentStatus &&
          invoice.documentStatus !==
            documentStatus
        ) {
          return false;
        }

        if (
          paymentStatus &&
          invoice.paymentStatus !==
            paymentStatus
        ) {
          return false;
        }

        if (
          filters.overdueOnly === true &&
          invoice.paymentStatus !==
            INVOICE_PAYMENT_STATUS.OVERDUE
        ) {
          return false;
        }

        return true;
      })
      .sort(
        (firstInvoice, secondInvoice) => {
          const periodComparison =
            String(secondInvoice.period)
              .localeCompare(
                String(
                  firstInvoice.period
                )
              );

          if (periodComparison !== 0) {
            return periodComparison;
          }

          return String(
            secondInvoice.issueDate
          ).localeCompare(
            String(
              firstInvoice.issueDate
            )
          );
        }
      );
  }
}

/**
 * Instance InvoiceService dùng chung.
 */
export const invoiceService =
  new InvoiceService();

export default invoiceService;