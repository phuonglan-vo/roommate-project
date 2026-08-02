import {
  TENANT_STATUS,
  TENANT_STATUS_LABELS
} from '../constants/statuses.js';

const TENANT_FORM_MODAL_ID = 'tenantFormModal';

function createElement(
  tagName,
  {
    className = '',
    text = null,
    attributes = {},
    dataset = {}
  } = {},
  children = []
) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== null) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== null && value !== undefined) {
      element.setAttribute(name, String(value));
    }
  });

  Object.entries(dataset).forEach(([name, value]) => {
    element.dataset[name] = String(value);
  });

  element.append(...children);

  return element;
}

function createInputField({
  name,
  label,
  type = 'text',
  required = false,
  placeholder = '',
  testId,
  columnClass = 'col-12 col-md-6'
}) {
  const inputId = `tenant-${name}`;

  const labelElement = createElement('label', {
    className: 'form-label',
    text: label,
    attributes: {
      for: inputId
    }
  });

  if (required) {
    labelElement.append(
      createElement('span', {
        className: 'text-danger ms-1',
        text: '*',
        attributes: {
          'aria-hidden': 'true'
        }
      })
    );
  }

  const input = createElement('input', {
    className: 'form-control',
    attributes: {
      id: inputId,
      name,
      type,
      placeholder,
      autocomplete: 'off'
    },
    dataset: {
      testid: testId
    }
  });

  if (required) {
    input.required = true;
  }

  const feedback = createElement('div', {
    className: 'invalid-feedback',
    dataset: {
      errorFor: name
    }
  });

  return {
    wrapper: createElement(
      'div',
      {
        className: columnClass
      },
      [labelElement, input, feedback]
    ),
    control: input,
    feedback
  };
}

function createSelectField({
  name,
  label,
  options,
  testId,
  columnClass = 'col-12 col-md-6'
}) {
  const selectId = `tenant-${name}`;

  const labelElement = createElement('label', {
    className: 'form-label',
    text: label,
    attributes: {
      for: selectId
    }
  });

  const select = createElement('select', {
    className: 'form-select',
    attributes: {
      id: selectId,
      name
    },
    dataset: {
      testid: testId
    }
  });

  options.forEach(({ value, label: optionLabel }) => {
    select.append(
      createElement('option', {
        text: optionLabel,
        attributes: {
          value
        }
      })
    );
  });

  const feedback = createElement('div', {
    className: 'invalid-feedback',
    dataset: {
      errorFor: name
    }
  });

  return {
    wrapper: createElement(
      'div',
      {
        className: columnClass
      },
      [labelElement, select, feedback]
    ),
    control: select,
    feedback
  };
}

function createTextareaField({
  name,
  label,
  testId
}) {
  const textareaId = `tenant-${name}`;

  const labelElement = createElement('label', {
    className: 'form-label',
    text: label,
    attributes: {
      for: textareaId
    }
  });

  const textarea = createElement('textarea', {
    className: 'form-control',
    attributes: {
      id: textareaId,
      name,
      rows: '3',
      maxlength: '1000'
    },
    dataset: {
      testid: testId
    }
  });

  const feedback = createElement('div', {
    className: 'invalid-feedback',
    dataset: {
      errorFor: name
    }
  });

  return {
    wrapper: createElement(
      'div',
      {
        className: 'col-12'
      },
      [labelElement, textarea, feedback]
    ),
    control: textarea,
    feedback
  };
}

function normalizePhoneForValidation(value) {
  let normalizedValue = String(value ?? '')
    .trim()
    .replace(/[\s().-]/g, '');

  if (normalizedValue.startsWith('+84')) {
    normalizedValue =
      `0${normalizedValue.slice(3)}`;
  } else if (
    normalizedValue.startsWith('84') &&
    normalizedValue.length === 11
  ) {
    normalizedValue =
      `0${normalizedValue.slice(2)}`;
  }

  return normalizedValue;
}

function normalizeIdentityForValidation(value) {
  return String(value ?? '')
    .trim()
    .replace(/[\s.-]/g, '');
}

function mapServiceErrorToField(message) {
  const normalizedMessage =
    String(message ?? '')
      .toLocaleLowerCase('vi-VN');

  if (
    normalizedMessage.includes('họ tên') ||
    normalizedMessage.includes('họ tên người thuê')
  ) {
    return 'fullName';
  }

  if (
    normalizedMessage.includes('số điện thoại') &&
    !normalizedMessage.includes('khẩn cấp')
  ) {
    return 'phone';
  }

  if (
    normalizedMessage.includes('cccd') ||
    normalizedMessage.includes('cmnd')
  ) {
    return 'identityNumber';
  }

  if (normalizedMessage.includes('email')) {
    return 'email';
  }

  if (
    normalizedMessage.includes('số điện thoại liên hệ khẩn cấp')
  ) {
    return 'emergencyPhone';
  }

  if (normalizedMessage.includes('trạng thái')) {
    return 'status';
  }

  return null;
}

export function createTenantForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'TenantForm cần hàm onSubmit.'
    );
  }

  let mode = 'create';
  let currentTenantId = null;
  let isSubmitting = false;

  const fields = {
    fullName: createInputField({
      name: 'fullName',
      label: 'Họ và tên',
      required: true,
      placeholder: 'Ví dụ: Nguyễn Văn An',
      testId: 'tenant-form-full-name'
    }),

    phone: createInputField({
      name: 'phone',
      label: 'Số điện thoại',
      required: true,
      placeholder: 'Ví dụ: 0901234567',
      testId: 'tenant-form-phone'
    }),

    identityNumber: createInputField({
      name: 'identityNumber',
      label: 'CCCD / CMND',
      placeholder: '9 hoặc 12 chữ số',
      testId: 'tenant-form-identity'
    }),

    dateOfBirth: createInputField({
      name: 'dateOfBirth',
      label: 'Ngày sinh',
      type: 'date',
      testId: 'tenant-form-date-of-birth'
    }),

    gender: createSelectField({
      name: 'gender',
      label: 'Giới tính',
      testId: 'tenant-form-gender',
      options: [
        {
          value: 'unspecified',
          label: 'Không xác định'
        },
        {
          value: 'male',
          label: 'Nam'
        },
        {
          value: 'female',
          label: 'Nữ'
        },
        {
          value: 'other',
          label: 'Khác'
        }
      ]
    }),

    email: createInputField({
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'example@email.com',
      testId: 'tenant-form-email'
    }),

    permanentAddress: createInputField({
      name: 'permanentAddress',
      label: 'Địa chỉ thường trú',
      placeholder: 'Nhập địa chỉ',
      testId: 'tenant-form-address',
      columnClass: 'col-12'
    }),

    occupation: createInputField({
      name: 'occupation',
      label: 'Nghề nghiệp',
      placeholder: 'Nhập nghề nghiệp',
      testId: 'tenant-form-occupation'
    }),

    vehiclePlate: createInputField({
      name: 'vehiclePlate',
      label: 'Biển số xe',
      placeholder: 'Ví dụ: 65B1-123.45',
      testId: 'tenant-form-vehicle-plate'
    }),

    status: createSelectField({
      name: 'status',
      label: 'Trạng thái',
      testId: 'tenant-form-status',
      options: Object.values(TENANT_STATUS).map(
        (status) => ({
          value: status,
          label:
            TENANT_STATUS_LABELS[status]
        })
      )
    }),

    emergencyName: createInputField({
      name: 'emergencyName',
      label: 'Người liên hệ khẩn cấp',
      placeholder: 'Họ tên người liên hệ',
      testId: 'tenant-form-emergency-name'
    }),

    emergencyPhone: createInputField({
      name: 'emergencyPhone',
      label: 'Số điện thoại khẩn cấp',
      placeholder: 'Ví dụ: 0901234567',
      testId: 'tenant-form-emergency-phone'
    }),

    emergencyRelationship: createInputField({
      name: 'emergencyRelationship',
      label: 'Mối quan hệ',
      placeholder: 'Ví dụ: Cha, mẹ, anh, chị',
      testId: 'tenant-form-emergency-relationship'
    }),

    note: createTextareaField({
      name: 'note',
      label: 'Ghi chú',
      testId: 'tenant-form-note'
    })
  };

  const modalTitle = createElement('h2', {
    className: 'modal-title fs-5',
    text: 'Thêm người thuê',
    attributes: {
      id: 'tenantFormTitle'
    },
    dataset: {
      testid: 'tenant-form-title'
    }
  });

  const closeButton = createElement('button', {
    className: 'btn-close',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal',
      'aria-label': 'Đóng'
    }
  });

  const modalHeader = createElement(
    'div',
    {
      className: 'modal-header'
    },
    [modalTitle, closeButton]
  );

  const generalError = createElement('div', {
    className: 'alert alert-danger d-none',
    attributes: {
      role: 'alert'
    },
    dataset: {
      testid: 'tenant-form-general-error'
    }
  });

  const personalSectionTitle = createElement('h3', {
    className: 'rm-tenant-form-section-title',
    text: 'Thông tin cá nhân'
  });

  const personalGrid = createElement(
    'div',
    {
      className: 'row g-3'
    },
    [
      fields.fullName.wrapper,
      fields.phone.wrapper,
      fields.identityNumber.wrapper,
      fields.dateOfBirth.wrapper,
      fields.gender.wrapper,
      fields.email.wrapper,
      fields.permanentAddress.wrapper,
      fields.occupation.wrapper,
      fields.vehiclePlate.wrapper,
      fields.status.wrapper
    ]
  );

  const emergencySectionTitle = createElement('h3', {
    className:
      'rm-tenant-form-section-title mt-4',
    text: 'Liên hệ khẩn cấp'
  });

  const emergencyGrid = createElement(
    'div',
    {
      className: 'row g-3'
    },
    [
      fields.emergencyName.wrapper,
      fields.emergencyPhone.wrapper,
      fields.emergencyRelationship.wrapper,
      fields.note.wrapper
    ]
  );

  const modalBody = createElement(
    'div',
    {
      className: 'modal-body'
    },
    [
      generalError,
      personalSectionTitle,
      personalGrid,
      emergencySectionTitle,
      emergencyGrid
    ]
  );

  const cancelButton = createElement('button', {
    className: 'btn btn-outline-secondary',
    text: 'Hủy',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal'
    },
    dataset: {
      testid: 'tenant-form-cancel'
    }
  });

  const submitButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm người thuê',
    attributes: {
      type: 'submit'
    },
    dataset: {
      testid: 'tenant-form-submit'
    }
  });

  const modalFooter = createElement(
    'div',
    {
      className: 'modal-footer'
    },
    [cancelButton, submitButton]
  );

  const form = createElement(
    'form',
    {
      className: 'modal-content',
      attributes: {
        novalidate: ''
      },
      dataset: {
        testid: 'tenant-form'
      }
    },
    [
      modalHeader,
      modalBody,
      modalFooter
    ]
  );

  const modalDialog = createElement(
    'div',
    {
      className:
        'modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable'
    },
    [form]
  );

  const element = createElement(
    'div',
    {
      className: 'modal fade rm-tenant-form-modal',
      attributes: {
        id: TENANT_FORM_MODAL_ID,
        tabindex: '-1',
        'aria-labelledby': 'tenantFormTitle',
        'aria-hidden': 'true'
      },
      dataset: {
        testid: 'tenant-form-modal'
      }
    },
    [modalDialog]
  );

  function clearFieldError(fieldName) {
    const field = fields[fieldName];

    if (!field) {
      return;
    }

    field.control.classList.remove('is-invalid');
    field.control.removeAttribute('aria-invalid');
    field.feedback.textContent = '';
  }

  function clearErrors() {
    Object.keys(fields).forEach(clearFieldError);

    generalError.textContent = '';
    generalError.classList.add('d-none');
  }

  function setFieldError(fieldName, message) {
    const field = fields[fieldName];

    if (!field) {
      return;
    }

    field.control.classList.add('is-invalid');
    field.control.setAttribute(
      'aria-invalid',
      'true'
    );

    field.feedback.textContent = message;
  }

  function showGeneralError(message) {
    generalError.textContent = message;
    generalError.classList.remove('d-none');
  }

  function getFormData() {
    return {
      fullName:
        fields.fullName.control.value.trim(),

      phone:
        fields.phone.control.value.trim(),

      identityNumber:
        fields.identityNumber.control.value.trim(),

      dateOfBirth:
        fields.dateOfBirth.control.value,

      gender:
        fields.gender.control.value,

      email:
        fields.email.control.value.trim(),

      permanentAddress:
        fields.permanentAddress.control.value.trim(),

      occupation:
        fields.occupation.control.value.trim(),

      vehiclePlate:
        fields.vehiclePlate.control.value.trim(),

      emergencyContact: {
        name:
          fields.emergencyName.control.value.trim(),

        phone:
          fields.emergencyPhone.control.value.trim(),

        relationship:
          fields.emergencyRelationship.control.value.trim()
      },

      status:
        fields.status.control.value,

      note:
        fields.note.control.value.trim()
    };
  }

  function validate() {
    const data = getFormData();
    const errors = {};

    if (!data.fullName) {
      errors.fullName =
        'Họ tên không được để trống.';
    } else if (data.fullName.length < 2) {
      errors.fullName =
        'Họ tên phải có ít nhất 2 ký tự.';
    }

    const normalizedPhone =
      normalizePhoneForValidation(data.phone);

    if (!data.phone) {
      errors.phone =
        'Số điện thoại không được để trống.';
    } else if (
      !/^(03|05|07|08|09)\d{8}$/.test(
        normalizedPhone
      )
    ) {
      errors.phone =
        'Số điện thoại không đúng định dạng Việt Nam.';
    }

    const normalizedIdentity =
      normalizeIdentityForValidation(
        data.identityNumber
      );

    if (
      normalizedIdentity &&
      !/^(?:\d{9}|\d{12})$/.test(
        normalizedIdentity
      )
    ) {
      errors.identityNumber =
        'CCCD phải có 12 chữ số hoặc CMND có 9 chữ số.';
    }

    if (
      data.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        data.email
      )
    ) {
      errors.email =
        'Email không đúng định dạng.';
    }

    const emergencyPhone =
      normalizePhoneForValidation(
        data.emergencyContact.phone
      );

    if (
      data.emergencyContact.phone &&
      !/^(03|05|07|08|09)\d{8}$/.test(
        emergencyPhone
      )
    ) {
      errors.emergencyPhone =
        'Số điện thoại khẩn cấp không đúng định dạng.';
    }

    if (
      !Object.values(TENANT_STATUS).includes(
        data.status
      )
    ) {
      errors.status =
        'Trạng thái người thuê không hợp lệ.';
    }

    return {
      data,
      errors,
      isValid:
        Object.keys(errors).length === 0
    };
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;

    submitButton.disabled = submitting;
    cancelButton.disabled = submitting;
    closeButton.disabled = submitting;

    if (submitting) {
      submitButton.textContent = 'Đang lưu...';
      return;
    }

    submitButton.textContent =
      mode === 'edit'
        ? 'Lưu thay đổi'
        : 'Thêm người thuê';
  }

  function populateForm(tenant = null) {
    const values = tenant ?? {
      fullName: '',
      phone: '',
      identityNumber: '',
      dateOfBirth: '',
      gender: 'unspecified',
      email: '',
      permanentAddress: '',
      occupation: '',
      vehiclePlate: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      },
      status: TENANT_STATUS.ACTIVE,
      note: ''
    };

    fields.fullName.control.value =
      values.fullName ?? '';

    fields.phone.control.value =
      values.phone ?? '';

    fields.identityNumber.control.value =
      values.identityNumber ?? '';

    fields.dateOfBirth.control.value =
      values.dateOfBirth ?? '';

    fields.gender.control.value =
      values.gender ?? 'unspecified';

    fields.email.control.value =
      values.email ?? '';

    fields.permanentAddress.control.value =
      values.permanentAddress ?? '';

    fields.occupation.control.value =
      values.occupation ?? '';

    fields.vehiclePlate.control.value =
      values.vehiclePlate ?? '';

    fields.emergencyName.control.value =
      values.emergencyContact?.name ?? '';

    fields.emergencyPhone.control.value =
      values.emergencyContact?.phone ?? '';

    fields.emergencyRelationship.control.value =
      values.emergencyContact?.relationship ?? '';

    fields.status.control.value =
      values.status ?? TENANT_STATUS.ACTIVE;

    fields.note.control.value =
      values.note ?? '';
  }

  function getModalInstance() {
    const Modal = window.bootstrap?.Modal;

    if (!Modal) {
      throw new Error(
        'Bootstrap Modal chưa được tải.'
      );
    }

    return Modal.getOrCreateInstance(element, {
      backdrop: 'static',
      keyboard: true,
      focus: true
    });
  }

  function open({
    mode: nextMode = 'create',
    tenant = null
  } = {}) {
    if (
      nextMode !== 'create' &&
      nextMode !== 'edit'
    ) {
      throw new Error(
        'Chế độ form người thuê không hợp lệ.'
      );
    }

    mode = nextMode;

    currentTenantId =
      nextMode === 'edit'
        ? tenant?.id ?? null
        : null;

    if (
      nextMode === 'edit' &&
      !currentTenantId
    ) {
      throw new Error(
        'Không có thông tin người thuê cần sửa.'
      );
    }

    modalTitle.textContent =
      nextMode === 'edit'
        ? `Sửa hồ sơ ${tenant.fullName}`
        : 'Thêm người thuê';

    /*
     * Hồ sơ mới luôn ở trạng thái hoạt động.
     * Khi sửa, người dùng có thể thay đổi trạng thái.
     */
    fields.status.control.disabled =
      nextMode === 'create';

    populateForm(tenant);
    clearErrors();
    setSubmitting(false);

    getModalInstance().show();

    window.setTimeout(() => {
      fields.fullName.control.focus();
    }, 150);
  }

  function close() {
    getModalInstance().hide();
  }

  Object.entries(fields).forEach(
    ([fieldName, field]) => {
      const eventName =
        field.control.tagName === 'SELECT'
          ? 'change'
          : 'input';

      field.control.addEventListener(
        eventName,
        () => {
          clearFieldError(fieldName);

          generalError.textContent = '';
          generalError.classList.add('d-none');
        }
      );
    }
  );

  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      clearErrors();

      const validationResult = validate();

      if (!validationResult.isValid) {
        Object.entries(
          validationResult.errors
        ).forEach(([fieldName, message]) => {
          setFieldError(fieldName, message);
        });

        const firstInvalidField =
          Object.keys(
            validationResult.errors
          )[0];

        fields[
          firstInvalidField
        ]?.control.focus();

        return;
      }

      setSubmitting(true);

      try {
        await onSubmit(
          validationResult.data,
          {
            mode,
            tenantId: currentTenantId
          }
        );

        close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể lưu hồ sơ người thuê.';

        const fieldName =
          mapServiceErrorToField(message);

        if (fieldName) {
          setFieldError(
            fieldName,
            message
          );

          fields[
            fieldName
          ].control.focus();
        } else {
          showGeneralError(message);
        }
      } finally {
        setSubmitting(false);
      }
    }
  );

  element.addEventListener(
    'hidden.bs.modal',
    () => {
      clearErrors();
      currentTenantId = null;
      mode = 'create';
      fields.status.control.disabled = false;
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createTenantForm;