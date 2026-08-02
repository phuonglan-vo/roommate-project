const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_PREFIX_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T/;

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Chuyển chuỗi ngày ISO YYYY-MM-DD thành Date theo múi giờ UTC.
 *
 * @param {string} value Chuỗi ngày ISO.
 * @returns {Date} Đối tượng Date tại 00:00:00 UTC.
 * @throws {TypeError|RangeError} Khi dữ liệu không hợp lệ.
 */
function parseIsoDateToUtc(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Ngày phải là một chuỗi.');
  }

  const normalizedValue = value.trim();
  const match = ISO_DATE_PATTERN.exec(normalizedValue);

  if (!match) {
    throw new RangeError(
      'Ngày phải có định dạng YYYY-MM-DD.'
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1) {
    throw new RangeError('Năm phải lớn hơn hoặc bằng 1.');
  }

  const date = new Date(0);

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  const isValid =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  if (!isValid) {
    throw new RangeError(`Ngày "${normalizedValue}" không tồn tại.`);
  }

  return date;
}

/**
 * Lấy phần ngày YYYY-MM-DD từ ngày ISO hoặc ngày giờ ISO.
 *
 * @param {string} value Chuỗi ISO date hoặc ISO datetime.
 * @returns {string} Phần ngày YYYY-MM-DD.
 * @throws {TypeError|RangeError} Khi dữ liệu không hợp lệ.
 */
function extractIsoDatePart(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Giá trị ngày phải là một chuỗi.');
  }

  const normalizedValue = value.trim();

  if (ISO_DATE_PATTERN.test(normalizedValue)) {
    parseIsoDateToUtc(normalizedValue);
    return normalizedValue;
  }

  if (!ISO_DATETIME_PREFIX_PATTERN.test(normalizedValue)) {
    throw new RangeError(
      'Giá trị phải là ngày ISO hoặc ngày giờ ISO hợp lệ.'
    );
  }

  const datePart = normalizedValue.slice(0, 10);

  parseIsoDateToUtc(datePart);

  if (Number.isNaN(Date.parse(normalizedValue))) {
    throw new RangeError(
      `Ngày giờ ISO "${normalizedValue}" không hợp lệ.`
    );
  }

  return datePart;
}

/**
 * Lấy ngày giờ hiện tại theo định dạng ISO 8601.
 *
 * @returns {string} Ngày giờ hiện tại, ví dụ
 * "2026-08-02T14:18:00.000Z".
 */
export function getCurrentIsoDateTime() {
  return new Date().toISOString();
}

/**
 * Kiểm tra một chuỗi có phải ngày ISO YYYY-MM-DD hợp lệ hay không.
 *
 * @param {*} value Giá trị cần kiểm tra.
 * @returns {boolean} `true` nếu hợp lệ, ngược lại là `false`.
 */
export function isValidIsoDate(value) {
  try {
    parseIsoDateToUtc(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Chuyển ngày ISO hoặc ngày giờ ISO sang định dạng dd/mm/yyyy.
 *
 * Hàm giữ nguyên phần ngày được ghi trong chuỗi ISO,
 * không tự chuyển đổi theo múi giờ máy người dùng.
 *
 * @param {string} isoValue Chuỗi ISO date hoặc ISO datetime.
 * @returns {string} Ngày định dạng dd/mm/yyyy.
 * @throws {TypeError|RangeError} Khi ngày không hợp lệ.
 *
 * @example
 * formatIsoDateToVietnamese('2026-08-02T10:00:00.000Z');
 * // "02/08/2026"
 */
export function formatIsoDateToVietnamese(isoValue) {
  const datePart = extractIsoDatePart(isoValue);
  const [year, month, day] = datePart.split('-');

  return `${day}/${month}/${year}`;
}

/**
 * Chuyển giá trị ngày nhập dạng YYYY-MM-DD sang định dạng hiển thị.
 *
 * @param {string} dateValue Chuỗi ngày YYYY-MM-DD.
 * @returns {string} Ngày định dạng dd/mm/yyyy.
 * @throws {TypeError|RangeError} Khi ngày không hợp lệ.
 *
 * @example
 * formatDateForDisplay('2026-08-02');
 * // "02/08/2026"
 */
export function formatDateForDisplay(dateValue) {
  parseIsoDateToUtc(dateValue);

  return formatIsoDateToVietnamese(dateValue);
}

/**
 * So sánh hai ngày ISO.
 *
 * @param {string} firstDate Ngày thứ nhất dạng YYYY-MM-DD.
 * @param {string} secondDate Ngày thứ hai dạng YYYY-MM-DD.
 * @returns {-1|0|1}
 * - `-1` nếu ngày thứ nhất trước ngày thứ hai.
 * - `0` nếu hai ngày bằng nhau.
 * - `1` nếu ngày thứ nhất sau ngày thứ hai.
 * @throws {TypeError|RangeError} Khi ngày không hợp lệ.
 */
export function compareIsoDates(firstDate, secondDate) {
  const firstTimestamp = parseIsoDateToUtc(firstDate).getTime();
  const secondTimestamp = parseIsoDateToUtc(secondDate).getTime();

  if (firstTimestamp < secondTimestamp) {
    return -1;
  }

  if (firstTimestamp > secondTimestamp) {
    return 1;
  }

  return 0;
}

/**
 * Tính số ngày từ ngày bắt đầu đến ngày kết thúc.
 *
 * Kết quả là số dương nếu ngày kết thúc ở sau ngày bắt đầu,
 * số âm nếu ngày kết thúc ở trước ngày bắt đầu.
 *
 * @param {string} startDate Ngày bắt đầu dạng YYYY-MM-DD.
 * @param {string} endDate Ngày kết thúc dạng YYYY-MM-DD.
 * @returns {number} Khoảng cách ngày có dấu.
 * @throws {TypeError|RangeError} Khi ngày không hợp lệ.
 *
 * @example
 * differenceInDays('2026-08-01', '2026-08-10');
 * // 9
 */
export function differenceInDays(startDate, endDate) {
  const startTimestamp = parseIsoDateToUtc(startDate).getTime();
  const endTimestamp = parseIsoDateToUtc(endDate).getTime();

  return (endTimestamp - startTimestamp) / MILLISECONDS_PER_DAY;
}