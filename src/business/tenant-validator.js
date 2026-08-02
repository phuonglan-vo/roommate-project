import {
  CONTRACT_STATUS,
  TENANT_STATUS
} from '../constants/statuses.js';

const TENANT_STATUS_VALUES = Object.freeze(
  Object.values(TENANT_STATUS)
);

const VIETNAMESE_PHONE_PATTERN =
  /^(03|05|07|08|09)\d{8}$/;

const IDENTITY_NUMBER_PATTERN =
  /^(?:\d{9}|\d{12})$/;

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
 * Kiểm tra chuỗi không chứa thẻ HTML.
 *
 * @param {string} value Chuỗi cần kiểm tra.
 * @param {string} fieldName Tên trường.
 * @throws {Error} Khi phát hiện thẻ HTML.
 */
function assertNoHtml(value, fieldName) {
  if (/<[^>]*>/u.test(value)) {
    throw new Error(
      `[TENANT-01] ${fieldName} không được chứa HTML.`
    );
  }
}

/**
 * Chuẩn hóa trường văn bản bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
function normalizeRequiredText(value, fieldName) {
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

  assertNoHtml(normalizedValue, fieldName);

  return normalizedValue;
}

/**
 * Chuẩn hóa trường văn bản không bắt buộc.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @param {string} fieldName Tên trường.
 * @returns {string}
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
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

  assertNoHtml(normalizedValue, fieldName);

  return normalizedValue;
}

/**
 * Chuẩn hóa số điện thoại Việt Nam.
 *
 * Hàm:
 * - Loại bỏ khoảng trắng, dấu chấm, gạch ngang và ngoặc.
 * - Chuyển đầu số +84 hoặc 84 thành đầu số 0.
 *
 * @param {*} phone Số điện thoại cần chuẩn hóa.
 * @returns {string} Số điện thoại dạng 0xxxxxxxxx.
 * @throws {TypeError|Error} Khi số điện thoại không hợp lệ.
 */
export function normalizeTenantPhone(phone) {
  if (typeof phone !== 'string') {
    throw new TypeError(
      '[TENANT-03] Số điện thoại phải là một chuỗi.'
    );
  }

  let normalizedPhone = phone
    .trim()
    .replace(/[\s().-]/g, '');

  if (normalizedPhone.startsWith('+84')) {
    normalizedPhone =
      `0${normalizedPhone.slice(3)}`;
  } else if (
    normalizedPhone.startsWith('84') &&
    normalizedPhone.length === 11
  ) {
    normalizedPhone =
      `0${normalizedPhone.slice(2)}`;
  }

  if (
    !VIETNAMESE_PHONE_PATTERN.test(
      normalizedPhone
    )
  ) {
    throw new Error(
      '[TENANT-03] Số điện thoại không đúng định dạng Việt Nam.'
    );
  }

  return normalizedPhone;
}

/**
 * Chuẩn hóa CCCD hoặc CMND.
 *
 * CCCD là trường không bắt buộc. Hàm chấp nhận:
 * - CMND 9 chữ số.
 * - CCCD 12 chữ số.
 *
 * @param {*} identityNumber Số giấy tờ tùy thân.
 * @returns {string} Chuỗi số đã chuẩn hóa hoặc chuỗi rỗng.
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function normalizeTenantIdentityNumber(
  identityNumber
) {
  if (
    identityNumber === undefined ||
    identityNumber === null ||
    identityNumber === ''
  ) {
    return '';
  }

  if (typeof identityNumber !== 'string') {
    throw new TypeError(
      '[TENANT-02] CCCD phải là một chuỗi.'
    );
  }

  const normalizedIdentityNumber =
    identityNumber
      .trim()
      .replace(/[\s.-]/g, '');

  if (!normalizedIdentityNumber) {
    return '';
  }

  if (
    !IDENTITY_NUMBER_PATTERN.test(
      normalizedIdentityNumber
    )
  ) {
    throw new Error(
      '[TENANT-02] CCCD phải gồm 12 chữ số hoặc CMND gồm 9 chữ số.'
    );
  }

  return normalizedIdentityNumber;
}

/**
 * Chuẩn hóa thông tin liên hệ khẩn cấp.
 *
 * @param {*} emergencyContact Thông tin liên hệ.
 * @returns {{name: string, phone: string, relationship: string}}
 */
function normalizeEmergencyContact(
  emergencyContact
) {
  if (
    emergencyContact === undefined ||
    emergencyContact === null
  ) {
    return {
      name: '',
      phone: '',
      relationship: ''
    };
  }

  if (!isPlainObject(emergencyContact)) {
    throw new TypeError(
      'Thông tin liên hệ khẩn cấp phải là một object.'
    );
  }

  const phone = normalizeOptionalText(
    emergencyContact.phone,
    'Số điện thoại liên hệ khẩn cấp'
  );

  return {
    name: normalizeOptionalText(
      emergencyContact.name,
      'Tên người liên hệ khẩn cấp'
    ),
    phone: phone
      ? normalizeTenantPhone(phone)
      : '',
    relationship: normalizeOptionalText(
      emergencyContact.relationship,
      'Quan hệ với người thuê'
    )
  };
}

/**
 * Kiểm tra và chuẩn hóa dữ liệu người thuê.
 *
 * Hàm không làm thay đổi object đầu vào.
 *
 * @param {object} data Dữ liệu người thuê.
 * @returns {object} Dữ liệu đã chuẩn hóa.
 * @throws {TypeError|Error} Khi dữ liệu không hợp lệ.
 */
export function validateTenantData(data) {
  if (!isPlainObject(data)) {
    throw new TypeError(
      'Dữ liệu người thuê phải là một object.'
    );
  }

  const status =
    data.status ?? TENANT_STATUS.ACTIVE;

  if (
    typeof status !== 'string' ||
    !TENANT_STATUS_VALUES.includes(status)
  ) {
    throw new Error(
      'Trạng thái người thuê không hợp lệ.'
    );
  }

  const fullName = normalizeRequiredText(
    data.fullName,
    'Họ tên người thuê'
  );

  if (fullName.length < 2) {
    throw new Error(
      '[TENANT-01] Họ tên người thuê phải có ít nhất 2 ký tự.'
    );
  }

  const normalizedTenant = {
    fullName,
    dateOfBirth: normalizeOptionalText(
      data.dateOfBirth,
      'Ngày sinh'
    ),
    gender:
      normalizeOptionalText(
        data.gender,
        'Giới tính'
      ) || 'unspecified',
    identityNumber:
      normalizeTenantIdentityNumber(
        data.identityNumber
      ),
    phone: normalizeTenantPhone(data.phone),
    email: normalizeOptionalText(
      data.email,
      'Email'
    ).toLocaleLowerCase('vi-VN'),
    permanentAddress: normalizeOptionalText(
      data.permanentAddress,
      'Địa chỉ thường trú'
    ),
    occupation: normalizeOptionalText(
      data.occupation,
      'Nghề nghiệp'
    ),
    vehiclePlate: normalizeOptionalText(
      data.vehiclePlate,
      'Biển số xe'
    ).toUpperCase(),
    emergencyContact:
      normalizeEmergencyContact(
        data.emergencyContact
      ),
    status,
    note: normalizeOptionalText(
      data.note,
      'Ghi chú'
    )
  };

  if (data.id !== undefined) {
    if (
      typeof data.id !== 'string' ||
      !data.id.trim()
    ) {
      throw new TypeError(
        'ID người thuê phải là chuỗi không rỗng.'
      );
    }

    normalizedTenant.id = data.id.trim();
  }

  return normalizedTenant;
}

/**
 * Kiểm tra CCCD không bị trùng.
 *
 * CCCD rỗng không được tính là trùng.
 *
 * @param {string} identityNumber CCCD đã chuẩn hóa.
 * @param {object[]} tenants Danh sách người thuê.
 * @param {string|null} [excludedTenantId=null] ID được bỏ qua khi cập nhật.
 * @returns {true}
 * @throws {Error} Khi CCCD đã tồn tại.
 */
export function assertTenantIdentityUnique(
  identityNumber,
  tenants,
  excludedTenantId = null
) {
  if (!Array.isArray(tenants)) {
    throw new TypeError(
      'Danh sách người thuê phải là một mảng.'
    );
  }

  const normalizedIdentityNumber =
    normalizeTenantIdentityNumber(
      identityNumber
    );

  if (!normalizedIdentityNumber) {
    return true;
  }

  const duplicatedTenant = tenants.find(
    (tenant) => {
      if (
        !tenant ||
        tenant.id === excludedTenantId
      ) {
        return false;
      }

      try {
        return (
          normalizeTenantIdentityNumber(
            tenant.identityNumber
          ) === normalizedIdentityNumber
        );
      } catch {
        return false;
      }
    }
  );

  if (duplicatedTenant) {
    throw new Error(
      `[TENANT-02] CCCD "${normalizedIdentityNumber}" đã được sử dụng cho người thuê khác.`
    );
  }

  return true;
}

/**
 * Lấy các hợp đồng đang hiệu lực của người thuê.
 *
 * @param {string} tenantId ID người thuê.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {object[]}
 */
export function getActiveTenantContracts(
  tenantId,
  contracts
) {
  if (
    typeof tenantId !== 'string' ||
    !tenantId.trim()
  ) {
    throw new TypeError(
      'ID người thuê phải là chuỗi không rỗng.'
    );
  }

  if (!Array.isArray(contracts)) {
    throw new TypeError(
      'Danh sách hợp đồng phải là một mảng.'
    );
  }

  const normalizedTenantId =
    tenantId.trim();

  return contracts.filter(
    (contract) =>
      contract?.status ===
        CONTRACT_STATUS.ACTIVE &&
      Array.isArray(contract.tenantIds) &&
      contract.tenantIds.includes(
        normalizedTenantId
      )
  );
}

/**
 * Kiểm tra người thuê có hợp đồng đang hiệu lực hay không.
 *
 * @param {string} tenantId ID người thuê.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {boolean}
 */
export function hasActiveTenantContract(
  tenantId,
  contracts
) {
  return (
    getActiveTenantContracts(
      tenantId,
      contracts
    ).length > 0
  );
}

/**
 * Kiểm tra người thuê có thể bị xóa hay không.
 *
 * @param {string} tenantId ID người thuê.
 * @param {object[]} contracts Danh sách hợp đồng.
 * @returns {true}
 * @throws {Error} Khi người thuê có hợp đồng hiệu lực.
 */
export function assertTenantCanBeDeleted(
  tenantId,
  contracts
) {
  if (
    hasActiveTenantContract(
      tenantId,
      contracts
    )
  ) {
    throw new Error(
      '[TENANT-05] Không thể xóa người thuê đang có hợp đồng hiệu lực. Hãy lưu trữ hồ sơ thay vì xóa.'
    );
  }

  return true;
}