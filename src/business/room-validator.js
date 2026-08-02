import {
  CONTRACT_STATUS,
  ROOM_STATUS
} from '../constants/statuses.js';

import { toSafeNumber } from '../utils/number-utils.js';
import { isEmptyString } from '../utils/validation-utils.js';

const ROOM_STATUS_VALUES = Object.freeze(
  Object.values(ROOM_STATUS)
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
 * Chuẩn hóa mã phòng trước khi lưu và kiểm tra trùng.
 *
 * Quy tắc chuẩn hóa:
 * - Loại bỏ khoảng trắng đầu và cuối.
 * - Gộp nhiều khoảng trắng liên tiếp.
 * - Chuyển thành chữ hoa.
 *
 * @param {*} code Mã phòng cần chuẩn hóa.
 * @returns {string} Mã phòng đã chuẩn hóa.
 * @throws {TypeError} Khi mã phòng không hợp lệ.
 */
export function normalizeRoomCode(code) {
  if (typeof code !== 'string') {
    throw new TypeError(
      '[ROOM-02] Mã phòng phải là một chuỗi.'
    );
  }

  const normalizedCode = code
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      '[ROOM-02] Mã phòng không được để trống.'
    );
  }

  return normalizedCode;
}

/**
 * Chuẩn hóa một trường văn bản bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường dùng trong thông báo lỗi.
 * @returns {string}
 */
function normalizeRequiredText(value, fieldName) {
  if (isEmptyString(value)) {
    throw new Error(
      `[ROOM-02] ${fieldName} không được để trống.`
    );
  }

  return value.trim();
}

/**
 * Chuẩn hóa một trường văn bản không bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường dùng trong thông báo lỗi.
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
      `[ROOM-02] ${fieldName} phải là một chuỗi.`
    );
  }

  return value.trim();
}

/**
 * Chuẩn hóa số không bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @param {{minimum?: number, integer?: boolean}} options Quy tắc số.
 * @returns {number|null}
 */
function normalizeOptionalNumber(
  value,
  fieldName,
  {
    minimum,
    integer = false
  } = {}
) {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const numericValue = toSafeNumber(value);

  if (
    integer &&
    !Number.isInteger(numericValue)
  ) {
    throw new Error(
      `[ROOM-02] ${fieldName} phải là số nguyên.`
    );
  }

  if (
    minimum !== undefined &&
    numericValue < minimum
  ) {
    throw new Error(
      `[ROOM-02] ${fieldName} phải lớn hơn hoặc bằng ${minimum}.`
    );
  }

  return numericValue;
}

/**
 * Kiểm tra và chuẩn hóa toàn bộ dữ liệu phòng.
 *
 * Hàm không làm thay đổi object đầu vào.
 *
 * @param {object} data Dữ liệu phòng.
 * @returns {object} Dữ liệu phòng đã được chuẩn hóa.
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function validateRoomData(data) {
  if (!isPlainObject(data)) {
    throw new TypeError(
      '[ROOM-02] Dữ liệu phòng phải là một object.'
    );
  }

  const monthlyRent =
    data.monthlyRent === undefined
      ? 0
      : toSafeNumber(data.monthlyRent);

  if (monthlyRent < 0) {
    throw new Error(
      '[ROOM-02] Giá thuê không được là số âm.'
    );
  }

  const maxOccupants =
    data.maxOccupants === undefined
      ? 1
      : toSafeNumber(data.maxOccupants);

  if (
    !Number.isInteger(maxOccupants) ||
    maxOccupants <= 0
  ) {
    throw new Error(
      '[ROOM-02] Số người tối đa phải là số nguyên lớn hơn 0.'
    );
  }

  const status =
    data.status ?? ROOM_STATUS.VACANT;

  if (
    typeof status !== 'string' ||
    !ROOM_STATUS_VALUES.includes(status)
  ) {
    throw new Error(
      '[ROOM-02] Trạng thái phòng không hợp lệ.'
    );
  }

  const roomType =
    data.roomType === undefined
      ? 'standard'
      : normalizeRequiredText(
          data.roomType,
          'Loại phòng'
        );

  const normalizedRoom = {
    code: normalizeRoomCode(data.code),
    name: normalizeRequiredText(
      data.name,
      'Tên phòng'
    ),
    area: normalizeOptionalText(
      data.area,
      'Khu vực'
    ),
    floor: normalizeOptionalNumber(
      data.floor,
      'Tầng',
      {
        minimum: 0,
        integer: true
      }
    ),
    roomType,
    areaM2: normalizeOptionalNumber(
      data.areaM2,
      'Diện tích',
      {
        minimum: 0
      }
    ),
    monthlyRent,
    maxOccupants,
    status,
    description: normalizeOptionalText(
      data.description,
      'Mô tả'
    )
  };

  if (
    normalizedRoom.areaM2 !== null &&
    normalizedRoom.areaM2 <= 0
  ) {
    throw new Error(
      '[ROOM-02] Diện tích phòng phải lớn hơn 0.'
    );
  }

  if (data.id !== undefined) {
    if (
      typeof data.id !== 'string' ||
      !data.id.trim()
    ) {
      throw new TypeError(
        '[ROOM-02] ID phòng phải là chuỗi không rỗng.'
      );
    }

    normalizedRoom.id = data.id.trim();
  }

  return normalizedRoom;
}

/**
 * Kiểm tra mã phòng có bị trùng hay không.
 *
 * @param {string} code Mã phòng.
 * @param {object[]} rooms Danh sách phòng hiện tại.
 * @param {string|null} [excludedRoomId=null] ID phòng bỏ qua khi cập nhật.
 * @returns {true}
 * @throws {Error} Khi mã phòng bị trùng.
 */
export function assertRoomCodeUnique(
  code,
  rooms,
  excludedRoomId = null
) {
  if (!Array.isArray(rooms)) {
    throw new TypeError(
      'Danh sách phòng phải là một mảng.'
    );
  }

  const normalizedCode =
    normalizeRoomCode(code);

  const duplicatedRoom = rooms.find(
    (room) =>
      room &&
      room.id !== excludedRoomId &&
      typeof room.code === 'string' &&
      normalizeRoomCode(room.code) ===
        normalizedCode
  );

  if (duplicatedRoom) {
    throw new Error(
      `[ROOM-01] Mã phòng "${normalizedCode}" đã tồn tại.`
    );
  }

  return true;
}

/**
 * Lấy các hợp đồng đang hiệu lực của một phòng.
 *
 * @param {string} roomId ID phòng.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {object[]} Các hợp đồng đang hiệu lực.
 */
export function getActiveRoomContracts(
  roomId,
  contracts
) {
  if (
    typeof roomId !== 'string' ||
    !roomId.trim()
  ) {
    throw new TypeError(
      'ID phòng phải là chuỗi không rỗng.'
    );
  }

  if (!Array.isArray(contracts)) {
    throw new TypeError(
      'Danh sách hợp đồng phải là một mảng.'
    );
  }

  const normalizedRoomId = roomId.trim();

  return contracts.filter(
    (contract) =>
      contract?.roomId === normalizedRoomId &&
      contract?.status ===
        CONTRACT_STATUS.ACTIVE
  );
}

/**
 * Kiểm tra phòng có hợp đồng đang hiệu lực hay không.
 *
 * @param {string} roomId ID phòng.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {boolean}
 */
export function hasActiveRoomContract(
  roomId,
  contracts
) {
  return (
    getActiveRoomContracts(
      roomId,
      contracts
    ).length > 0
  );
}

/**
 * Kiểm tra phòng có được phép xóa hay không.
 *
 * @param {string} roomId ID phòng.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {true}
 * @throws {Error} Khi phòng có hợp đồng đang hiệu lực.
 */
export function assertRoomCanBeDeleted(
  roomId,
  contracts
) {
  if (
    hasActiveRoomContract(
      roomId,
      contracts
    )
  ) {
    throw new Error(
      '[ROOM-05] Không thể xóa phòng đang có hợp đồng hiệu lực.'
    );
  }

  return true;
}

/**
 * Kiểm tra việc thay đổi trạng thái phòng.
 *
 * @param {object} currentRoom Phòng hiện tại.
 * @param {string} nextStatus Trạng thái mới.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {true}
 * @throws {Error} Khi thay đổi trạng thái không hợp lệ.
 */
export function assertRoomStatusChange(
  currentRoom,
  nextStatus,
  contracts
) {
  if (!isPlainObject(currentRoom)) {
    throw new TypeError(
      'Thông tin phòng hiện tại không hợp lệ.'
    );
  }

  if (!ROOM_STATUS_VALUES.includes(nextStatus)) {
    throw new Error(
      '[ROOM-02] Trạng thái phòng không hợp lệ.'
    );
  }

  if (
    nextStatus === ROOM_STATUS.VACANT &&
    hasActiveRoomContract(
      currentRoom.id,
      contracts
    )
  ) {
    throw new Error(
      '[ROOM-04] Không thể chuyển phòng thành trống khi đang có hợp đồng hiệu lực.'
    );
  }

  if (
    currentRoom.status ===
      ROOM_STATUS.MAINTENANCE &&
    nextStatus === ROOM_STATUS.OCCUPIED
  ) {
    throw new Error(
      '[ROOM-03] Phòng đang sửa chữa nên không thể chuyển sang trạng thái đang thuê.'
    );
  }

  return true;
}

/**
 * Kiểm tra phòng có thể được cho thuê hay không.
 *
 * Hàm này có thể được dùng lại khi xây dựng module hợp đồng.
 *
 * @param {object} room Thông tin phòng.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {true}
 * @throws {Error} Khi phòng không thể cho thuê.
 */
export function assertRoomCanBeRented(
  room,
  contracts
) {
  if (!isPlainObject(room)) {
    throw new TypeError(
      'Thông tin phòng không hợp lệ.'
    );
  }

  if (
    room.status ===
    ROOM_STATUS.MAINTENANCE
  ) {
    throw new Error(
      '[ROOM-03] Phòng đang sửa chữa nên không thể cho thuê.'
    );
  }

  if (
    room.status === ROOM_STATUS.INACTIVE
  ) {
    throw new Error(
      '[ROOM-03] Phòng đã ngừng sử dụng nên không thể cho thuê.'
    );
  }

  if (
    hasActiveRoomContract(
      room.id,
      contracts
    )
  ) {
    throw new Error(
      '[ROOM-03] Phòng đang có hợp đồng hiệu lực.'
    );
  }

  if (room.status !== ROOM_STATUS.VACANT) {
    throw new Error(
      '[ROOM-03] Chỉ phòng trống mới có thể cho thuê.'
    );
  }

  return true;
}