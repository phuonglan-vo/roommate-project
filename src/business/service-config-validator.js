import {
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

/**
 * Các cách tính dịch vụ được RoomMate hỗ trợ.
 */
export const SERVICE_CALCULATION_TYPE = Object.freeze({
  USAGE: 'usage',
  FIXED: 'fixed',
  PER_PERSON: 'perPerson',
  PER_VEHICLE: 'perVehicle',
  MANUAL: 'manual'
});

/**
 * Nhãn tiếng Việt của từng cách tính dịch vụ.
 */
export const SERVICE_CALCULATION_TYPE_LABELS = Object.freeze({
  [SERVICE_CALCULATION_TYPE.USAGE]:
    'Theo lượng sử dụng',

  [SERVICE_CALCULATION_TYPE.FIXED]:
    'Cố định theo phòng',

  [SERVICE_CALCULATION_TYPE.PER_PERSON]:
    'Theo số người',

  [SERVICE_CALCULATION_TYPE.PER_VEHICLE]:
    'Theo số xe',

  [SERVICE_CALCULATION_TYPE.MANUAL]:
    'Nhập thủ công'
});

/**
 * Trạng thái dùng khi lọc danh sách dịch vụ.
 */
export const SERVICE_CONFIG_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive'
});

export const SERVICE_CONFIG_STATUS_LABELS = Object.freeze({
  [SERVICE_CONFIG_STATUS.ACTIVE]:
    'Đang áp dụng',

  [SERVICE_CONFIG_STATUS.INACTIVE]:
    'Ngưng áp dụng'
});

/*
 * Hỗ trợ dữ liệu seed được tạo từ mô hình cũ.
 */
const LEGACY_CALCULATION_TYPE_MAP = Object.freeze({
  metered_electricity:
    SERVICE_CALCULATION_TYPE.USAGE,

  metered_water:
    SERVICE_CALCULATION_TYPE.USAGE,

  per_room:
    SERVICE_CALCULATION_TYPE.FIXED,

  per_person:
    SERVICE_CALCULATION_TYPE.PER_PERSON,

  per_vehicle:
    SERVICE_CALCULATION_TYPE.PER_VEHICLE,

  manual_quantity:
    SERVICE_CALCULATION_TYPE.MANUAL
});

const CALCULATION_TYPE_VALUES = Object.freeze(
  Object.values(SERVICE_CALCULATION_TYPE)
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
 * Chuẩn hóa trường văn bản bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 * @throws {TypeError|Error} Khi giá trị không hợp lệ.
 */
function normalizeRequiredText(
  value,
  fieldName
) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedValue = value
    .trim()
    .replace(/\s+/g, ' ');

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  if (/<[^>]*>/u.test(normalizedValue)) {
    throw new Error(
      `${fieldName} không được chứa HTML.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa trường văn bản không bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeOptionalText(
  value,
  fieldName
) {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedValue = value.trim();

  if (/<[^>]*>/u.test(normalizedValue)) {
    throw new Error(
      `${fieldName} không được chứa HTML.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa mã dịch vụ.
 *
 * @param {*} code Mã dịch vụ.
 * @returns {string} Mã đã chuyển thành chữ hoa.
 */
export function normalizeServiceCode(code) {
  const normalizedCode =
    normalizeRequiredText(
      code,
      'Mã dịch vụ'
    )
      .toUpperCase()
      .replace(/\s+/g, '_');

  if (
    !/^[A-Z0-9_-]+$/.test(
      normalizedCode
    )
  ) {
    throw new Error(
      'Mã dịch vụ chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.'
    );
  }

  return normalizedCode;
}

/**
 * Chuẩn hóa cách tính dịch vụ.
 *
 * Hàm hỗ trợ cả các giá trị cũ trong dữ liệu seed.
 *
 * @param {*} calculationType Cách tính cần chuẩn hóa.
 * @returns {string}
 */
export function normalizeServiceCalculationType(
  calculationType
) {
  if (typeof calculationType !== 'string') {
    throw new TypeError(
      'Cách tính dịch vụ phải là một chuỗi.'
    );
  }

  const normalizedValue =
    calculationType.trim();

  const mappedValue =
    LEGACY_CALCULATION_TYPE_MAP[
      normalizedValue
    ] ?? normalizedValue;

  if (
    !CALCULATION_TYPE_VALUES.includes(
      mappedValue
    )
  ) {
    throw new Error(
      'Cách tính dịch vụ không hợp lệ.'
    );
  }

  return mappedValue;
}

/**
 * Kiểm tra cách tính dịch vụ có hợp lệ hay không.
 *
 * @param {*} calculationType Cách tính cần kiểm tra.
 * @returns {boolean}
 */
export function isValidServiceCalculationType(
  calculationType
) {
  try {
    normalizeServiceCalculationType(
      calculationType
    );

    return true;
  } catch {
    return false;
  }
}

/**
 * Lấy đơn giá đang áp dụng từ lịch sử giá.
 *
 * Nếu không truyền ngày, hàm lấy mức giá mới nhất.
 *
 * @param {object} serviceConfig Cấu hình dịch vụ.
 * @param {string|null} [date=null] Ngày YYYY-MM-DD.
 * @returns {number|null}
 */
export function getCurrentServicePrice(
  serviceConfig,
  date = null
) {
  if (!isPlainObject(serviceConfig)) {
    throw new TypeError(
      'Cấu hình dịch vụ phải là một object.'
    );
  }

  if (
    date !== null &&
    !isValidIsoDate(date)
  ) {
    throw new Error(
      'Ngày lấy đơn giá không hợp lệ.'
    );
  }

  if (
    !Array.isArray(serviceConfig.prices) ||
    serviceConfig.prices.length === 0
  ) {
    if (
      serviceConfig.unitPrice ===
      undefined
    ) {
      return null;
    }

    const unitPrice = toSafeNumber(
      serviceConfig.unitPrice
    );

    return unitPrice >= 0
      ? unitPrice
      : null;
  }

  const validPrices =
    serviceConfig.prices
      .filter((price) => {
        if (!isPlainObject(price)) {
          return false;
        }

        if (
          !isValidIsoDate(
            price.effectiveFrom
          )
        ) {
          return false;
        }

        if (
          price.effectiveTo !== null &&
          price.effectiveTo !== undefined &&
          !isValidIsoDate(
            price.effectiveTo
          )
        ) {
          return false;
        }

        try {
          return (
            toSafeNumber(
              price.unitPrice
            ) >= 0
          );
        } catch {
          return false;
        }
      })
      .sort((firstPrice, secondPrice) =>
        secondPrice.effectiveFrom.localeCompare(
          firstPrice.effectiveFrom
        )
      );

  if (validPrices.length === 0) {
    return null;
  }

  if (date === null) {
    return toSafeNumber(
      validPrices[0].unitPrice
    );
  }

  const matchingPrice =
    validPrices.find((price) => {
      const started =
        price.effectiveFrom <= date;

      const notEnded =
        !price.effectiveTo ||
        price.effectiveTo >= date;

      return started && notEnded;
    });

  return matchingPrice
    ? toSafeNumber(
        matchingPrice.unitPrice
      )
    : null;
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu cấu hình dịch vụ.
 *
 * Hàm không làm thay đổi object đầu vào.
 *
 * @param {object} data Dữ liệu dịch vụ.
 * @returns {{
 *   code: string,
 *   name: string,
 *   unit: string,
 *   calculationType: string,
 *   unitPrice: number,
 *   isActive: boolean,
 *   description: string,
 *   id?: string
 * }}
 */
export function validateServiceConfig(data) {
  if (!isPlainObject(data)) {
    throw new TypeError(
      'Dữ liệu dịch vụ phải là một object.'
    );
  }

  const priceValue =
    data.unitPrice !== undefined
      ? data.unitPrice
      : getCurrentServicePrice(data);

  if (
    priceValue === null ||
    priceValue === undefined
  ) {
    throw new Error(
      'Đơn giá không được để trống.'
    );
  }

  const unitPrice =
    toSafeNumber(priceValue);

  if (unitPrice < 0) {
    throw new Error(
      'Đơn giá không được là số âm.'
    );
  }

  const isActive =
    data.isActive === undefined
      ? true
      : data.isActive;

  if (typeof isActive !== 'boolean') {
    throw new TypeError(
      'Trạng thái dịch vụ phải là boolean.'
    );
  }

  const normalizedData = {
    code: normalizeServiceCode(
      data.code
    ),

    name: normalizeRequiredText(
      data.name,
      'Tên dịch vụ'
    ),

    unit: normalizeRequiredText(
      data.unit,
      'Đơn vị tính'
    ),

    calculationType:
      normalizeServiceCalculationType(
        data.calculationType
      ),

    unitPrice,
    isActive,

    description: normalizeOptionalText(
      data.description,
      'Mô tả'
    )
  };

  if (data.id !== undefined) {
    if (
      typeof data.id !== 'string' ||
      !data.id.trim()
    ) {
      throw new TypeError(
        'ID dịch vụ phải là chuỗi không rỗng.'
      );
    }

    normalizedData.id = data.id.trim();
  }

  return normalizedData;
}

/**
 * Kiểm tra mã dịch vụ không bị trùng.
 *
 * @param {string} code Mã dịch vụ.
 * @param {object[]} serviceConfigs Danh sách dịch vụ.
 * @param {string|null} [excludedId=null] ID được bỏ qua khi sửa.
 * @returns {true}
 */
export function assertServiceCodeUnique(
  code,
  serviceConfigs,
  excludedId = null
) {
  if (!Array.isArray(serviceConfigs)) {
    throw new TypeError(
      'Danh sách dịch vụ phải là một mảng.'
    );
  }

  const normalizedCode =
    normalizeServiceCode(code);

  const duplicatedService =
    serviceConfigs.find((serviceConfig) => {
      if (
        !serviceConfig ||
        serviceConfig.id === excludedId
      ) {
        return false;
      }

      try {
        return (
          normalizeServiceCode(
            serviceConfig.code
          ) === normalizedCode
        );
      } catch {
        return false;
      }
    });

  if (duplicatedService) {
    throw new Error(
      `Mã dịch vụ "${normalizedCode}" đã tồn tại.`
    );
  }

  return true;
}