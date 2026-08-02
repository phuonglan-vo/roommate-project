let fallbackCounter = 0;

/**
 * Chuẩn hóa và kiểm tra tiền tố dùng để tạo ID.
 *
 * @param {string} prefix Tiền tố ID.
 * @returns {string} Tiền tố đã chuẩn hóa.
 * @throws {TypeError} Khi tiền tố không phải chuỗi hoặc không hợp lệ.
 */
function normalizePrefix(prefix) {
  if (typeof prefix !== 'string') {
    throw new TypeError('Tiền tố ID phải là một chuỗi.');
  }

  const normalizedPrefix = prefix.trim();

  if (!normalizedPrefix) {
    throw new TypeError('Tiền tố ID không được để trống.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(normalizedPrefix)) {
    throw new TypeError(
      'Tiền tố ID chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.'
    );
  }

  return normalizedPrefix;
}

/**
 * Tạo một ID chuỗi duy nhất.
 *
 * Hàm ưu tiên sử dụng crypto.randomUUID() khi trình duyệt hỗ trợ.
 * Phương án dự phòng kết hợp thời gian, bộ đếm và số ngẫu nhiên.
 *
 * @param {string} [prefix='id'] Tiền tố giúp nhận biết loại dữ liệu.
 * @returns {string} ID chuỗi duy nhất.
 *
 * @example
 * createUniqueId('room');
 * // "room_550e8400-e29b-41d4-a716-446655440000"
 */
export function createUniqueId(prefix = 'id') {
  const normalizedPrefix = normalizePrefix(prefix);

  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `${normalizedPrefix}_${globalThis.crypto.randomUUID()}`;
  }

  fallbackCounter =
    fallbackCounter >= Number.MAX_SAFE_INTEGER
      ? 1
      : fallbackCounter + 1;

  const timestampPart = Date.now().toString(36);
  const counterPart = fallbackCounter.toString(36);
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 12);

  return [
    normalizedPrefix,
    timestampPart,
    counterPart,
    randomPart
  ].join('_');
}