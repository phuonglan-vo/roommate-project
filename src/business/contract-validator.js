import {
  CONTRACT_STATUS,
  ROOM_STATUS
} from '../constants/statuses.js';

import {
  toSafeNumber
} from '../utils/number-utils.js';

import {
  compareIsoDates,
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  isDateRangeOverlap
} from './contract-utils.js';

const CONTRACT_STATUS_VALUES = Object.freeze(
  Object.values(CONTRACT_STATUS)
);

const BLOCKED_ROOM_STATUSES = Object.freeze([
  ROOM_STATUS.MAINTENANCE,
  ROOM_STATUS.INACTIVE
]);

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
 * Chuẩn hóa chuỗi bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
function normalizeRequiredString(
  value,
  fieldName
) {
  if (typeof value !== 'string') {
    throw new TypeError(
      `${fieldName} phải là một chuỗi.`
    );
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(
      `${fieldName} không được để trống.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa ngày YYYY-MM-DD.
 *
 * @param {*} value Giá trị ngày.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 */
function normalizeDate(value, fieldName) {
  const normalizedValue =
    normalizeRequiredString(
      value,
      fieldName
    );

  if (!isValidIsoDate(normalizedValue)) {
    throw new Error(
      `${fieldName} không phải ngày hợp lệ theo định dạng YYYY-MM-DD.`
    );
  }

  return normalizedValue;
}

/**
 * Chuẩn hóa số tiền không âm.
 *
 * @param {*} value Giá trị tiền.
 * @param {string} fieldName Tên trường.
 * @returns {number}
 */
function normalizeNonNegativeAmount(
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

  const numericValue = toSafeNumber(value);

  if (numericValue < 0) {
    throw new Error(
      `${fieldName} không được là số âm.`
    );
  }

  return numericValue;
}

/**
 * Chuẩn hóa danh sách ID người thuê.
 *
 * @param {*} tenantIds Danh sách ID người thuê.
 * @returns {string[]}
 */
function normalizeTenantIds(tenantIds) {
  if (!Array.isArray(tenantIds)) {
    throw new TypeError(
      'Danh sách người thuê phải là một mảng.'
    );
  }

  if (tenantIds.length === 0) {
    throw new Error(
      'Hợp đồng phải có ít nhất một người thuê.'
    );
  }

  const normalizedTenantIds = tenantIds.map(
    (tenantId, index) =>
      normalizeRequiredString(
        tenantId,
        `ID người thuê thứ ${index + 1}`
      )
  );

  const uniqueTenantIds = new Set(
    normalizedTenantIds
  );

  if (
    uniqueTenantIds.size !==
    normalizedTenantIds.length
  ) {
    throw new Error(
      'Danh sách người thuê không được chứa ID trùng nhau.'
    );
  }

  return normalizedTenantIds;
}

/**
 * Kiểm tra trạng thái phòng có cho phép ký hợp đồng hay không.
 *
 * @param {*} roomStatus Trạng thái phòng.
 * @returns {true}
 * @throws {Error} Khi phòng đang sửa chữa hoặc ngừng sử dụng.
 */
function assertRoomStatusAllowsContract(
  roomStatus
) {
  if (roomStatus === undefined) {
    return true;
  }

  if (
    !Object.values(ROOM_STATUS).includes(
      roomStatus
    )
  ) {
    throw new Error(
      'Trạng thái phòng không hợp lệ.'
    );
  }

  if (
    roomStatus === ROOM_STATUS.MAINTENANCE
  ) {
    throw new Error(
      '[CONTRACT-02] Phòng đang sửa chữa nên không thể ký hợp đồng.'
    );
  }

  if (
    roomStatus === ROOM_STATUS.INACTIVE
  ) {
    throw new Error(
      '[CONTRACT-02] Phòng đang tạm ngưng nên không thể ký hợp đồng.'
    );
  }

  return true;
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu hợp đồng.
 *
 * Hàm không thay đổi object đầu vào.
 *
 * Để kiểm tra trạng thái phòng, caller có thể truyền một trong hai:
 * - `contract.roomStatus`
 * - `contract.room.status`
 *
 * @param {object} contract Dữ liệu hợp đồng.
 * @returns {object} Bản sao hợp đồng đã chuẩn hóa.
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function validateContract(contract) {
  if (!isPlainObject(contract)) {
    throw new TypeError(
      'Hợp đồng phải là một object.'
    );
  }

  const roomId = normalizeRequiredString(
    contract.roomId,
    'ID phòng'
  );

  const tenantIds = normalizeTenantIds(
    contract.tenantIds
  );

  const startDate = normalizeDate(
    contract.startDate,
    'Ngày bắt đầu'
  );

  const endDate = normalizeDate(
    contract.endDate,
    'Ngày kết thúc'
  );

  if (
    compareIsoDates(
      endDate,
      startDate
    ) <= 0
  ) {
    throw new Error(
      '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
    );
  }

  const rentAmount =
    normalizeNonNegativeAmount(
      contract.rentAmount,
      'Giá thuê'
    );

  const depositAmount =
    normalizeNonNegativeAmount(
      contract.depositAmount,
      'Tiền cọc'
    );

  const status =
    contract.status ??
    CONTRACT_STATUS.DRAFT;

  if (
    !CONTRACT_STATUS_VALUES.includes(status)
  ) {
    throw new Error(
      'Trạng thái hợp đồng không hợp lệ.'
    );
  }

  const roomStatus =
    contract.room?.status ??
    contract.roomStatus;

  assertRoomStatusAllowsContract(
    roomStatus
  );

  const representativeTenantId =
    contract.representativeTenantId ===
      undefined ||
    contract.representativeTenantId ===
      null ||
    contract.representativeTenantId === ''
      ? null
      : normalizeRequiredString(
          contract.representativeTenantId,
          'ID người đại diện'
        );

  if (
    representativeTenantId &&
    !tenantIds.includes(
      representativeTenantId
    )
  ) {
    throw new Error(
      'Người đại diện phải thuộc danh sách người thuê của hợp đồng.'
    );
  }

  return {
    ...contract,
    roomId,
    tenantIds: [...tenantIds],
    representativeTenantId,
    startDate,
    endDate,
    rentAmount,
    depositAmount,
    status
  };
}

/**
 * Kiểm tra hợp đồng mới có trùng thời gian với hợp đồng hiện có
 * trên cùng một phòng hay không.
 *
 * Hàm:
 * - Chỉ so sánh hợp đồng cùng roomId.
 * - Bỏ qua hợp đồng đã hủy.
 * - Bỏ qua chính hợp đồng đang cập nhật nếu ID giống nhau.
 *
 * @param {object} newContract Hợp đồng cần kiểm tra.
 * @param {object[]} existingContracts Danh sách hợp đồng hiện có.
 * @returns {boolean} `true` nếu có hợp đồng bị trùng thời gian.
 * @throws {TypeError|Error} Khi dữ liệu đầu vào không hợp lệ.
 */
export function hasOverlappingContract(
  newContract,
  existingContracts
) {
  if (!isPlainObject(newContract)) {
    throw new TypeError(
      'Hợp đồng mới phải là một object.'
    );
  }

  if (!Array.isArray(existingContracts)) {
    throw new TypeError(
      'Danh sách hợp đồng hiện có phải là một mảng.'
    );
  }

  const roomId = normalizeRequiredString(
    newContract.roomId,
    'ID phòng'
  );

  const startDate = normalizeDate(
    newContract.startDate,
    'Ngày bắt đầu'
  );

  const endDate = normalizeDate(
    newContract.endDate,
    'Ngày kết thúc'
  );

  if (
    compareIsoDates(
      endDate,
      startDate
    ) <= 0
  ) {
    throw new Error(
      '[CONTRACT-05] Ngày kết thúc phải sau ngày bắt đầu.'
    );
  }

  if (
    newContract.status ===
    CONTRACT_STATUS.CANCELLED
  ) {
    return false;
  }

  return existingContracts.some(
    (existingContract, index) => {
      if (!isPlainObject(existingContract)) {
        throw new TypeError(
          `Hợp đồng thứ ${index + 1} trong danh sách không hợp lệ.`
        );
      }

      if (
        existingContract.id &&
        newContract.id &&
        existingContract.id ===
          newContract.id
      ) {
        return false;
      }

      if (
        existingContract.status ===
        CONTRACT_STATUS.CANCELLED
      ) {
        return false;
      }

      if (
        existingContract.roomId !== roomId
      ) {
        return false;
      }

      const existingStartDate =
        normalizeDate(
          existingContract.startDate,
          `Ngày bắt đầu của hợp đồng thứ ${index + 1}`
        );

      const existingEndDate =
        normalizeDate(
          existingContract.endDate,
          `Ngày kết thúc của hợp đồng thứ ${index + 1}`
        );

      return isDateRangeOverlap(
        startDate,
        endDate,
        existingStartDate,
        existingEndDate
      );
    }
  );
}

/**
 * Kiểm tra số người thuê không vượt quá sức chứa phòng.
 *
 * Hàm đồng thời kiểm tra phòng sửa chữa hoặc tạm ngưng
 * không được dùng để ký hợp đồng.
 *
 * @param {object} room Thông tin phòng.
 * @param {string[]} tenantIds Danh sách ID người thuê.
 * @returns {true}
 * @throws {TypeError|Error} Khi vượt sức chứa hoặc dữ liệu không hợp lệ.
 */
export function validateOccupancyLimit(
  room,
  tenantIds
) {
  if (!isPlainObject(room)) {
    throw new TypeError(
      'Thông tin phòng phải là một object.'
    );
  }

  assertRoomStatusAllowsContract(
    room.status
  );

  const normalizedTenantIds =
    normalizeTenantIds(tenantIds);

  const maxOccupants = toSafeNumber(
    room.maxOccupants
  );

  if (
    !Number.isInteger(maxOccupants) ||
    maxOccupants <= 0
  ) {
    throw new Error(
      'Số người tối đa của phòng phải là số nguyên lớn hơn 0.'
    );
  }

  if (
    normalizedTenantIds.length >
    maxOccupants
  ) {
    throw new Error(
      `[CONTRACT-04] Số người thuê (${normalizedTenantIds.length}) vượt quá sức chứa phòng (${maxOccupants}).`
    );
  }

  return true;
}