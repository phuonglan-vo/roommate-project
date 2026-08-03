import {
  SERVICE_CALCULATION_TYPE,
  SERVICE_CALCULATION_TYPE_LABELS
} from '../business/service-config-validator.js';

const SERVICE_FORM_MODAL_ID =
  'serviceConfigFormModal';

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
  const element =
    document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== null) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(
    ([name, value]) => {
      if (
        value !== null &&
        value !== undefined
      ) {
        element.setAttribute(
          name,
          String(value)
        );
      }
    }
  );

  Object.entries(dataset).forEach(
    ([name, value]) => {
      element.dataset[name] =
        String(value);
    }
  );

  element.append(...children);

  return element;
}

function createInputField({
  name,
  label,
  type = 'text',
  required = false,
  min,
  step,
  placeholder = '',
  testId
}) {
  const id = `service-${name}`;

  const labelElement =
    createElement('label', {
      className: 'form-label',
      text: label,

      attributes: {
        for: id
      }
    });

  if (required) {
    labelElement.append(
      createElement('span', {
        className:
          'text-danger ms-1',

        text: '*',

        attributes: {
          'aria-hidden': 'true'
        }
      })
    );
  }

  const control =
    createElement('input', {
      className: 'form-control',

      attributes: {
        id,
        name,
        type,
        min,
        step,
        placeholder,
        autocomplete: 'off'
      },

      dataset: {
        testid: testId
      }
    });

  if (required) {
    control.required = true;
  }

  const feedback =
    createElement('div', {
      className:
        'invalid-feedback',

      dataset: {
        errorFor: name
      }
    });

  return {
    wrapper: createElement(
      'div',
      {
        className:
          'col-12 col-md-6'
      },
      [
        labelElement,
        control,
        feedback
      ]
    ),

    control,
    feedback
  };
}

function createSelectField({
  name,
  label,
  required = false,
  testId
}) {
  const id = `service-${name}`;

  const labelElement =
    createElement('label', {
      className: 'form-label',
      text: label,

      attributes: {
        for: id
      }
    });

  if (required) {
    labelElement.append(
      createElement('span', {
        className:
          'text-danger ms-1',

        text: '*',

        attributes: {
          'aria-hidden': 'true'
        }
      })
    );
  }

  const control =
    createElement('select', {
      className: 'form-select',

      attributes: {
        id,
        name
      },

      dataset: {
        testid: testId
      }
    });

  if (required) {
    control.required = true;
  }

  const feedback =
    createElement('div', {
      className:
        'invalid-feedback',

      dataset: {
        errorFor: name
      }
    });

  return {
    wrapper: createElement(
      'div',
      {
        className:
          'col-12 col-md-6'
      },
      [
        labelElement,
        control,
        feedback
      ]
    ),

    control,
    feedback
  };
}

function createTextareaField({
  name,
  label,
  testId
}) {
  const id = `service-${name}`;

  const control =
    createElement('textarea', {
      className: 'form-control',

      attributes: {
        id,
        name,
        rows: '3',
        maxlength: '1000'
      },

      dataset: {
        testid: testId
      }
    });

  const feedback =
    createElement('div', {
      className:
        'invalid-feedback',

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
      [
        createElement('label', {
          className: 'form-label',
          text: label,

          attributes: {
            for: id
          }
        }),

        control,
        feedback
      ]
    ),

    control,
    feedback
  };
}

function mapServiceErrorToField(
  message
) {
  const normalizedMessage =
    String(message ?? '')
      .toLocaleLowerCase('vi-VN');

  if (
    normalizedMessage.includes(
      'mã dịch vụ'
    )
  ) {
    return 'code';
  }

  if (
    normalizedMessage.includes(
      'tên dịch vụ'
    )
  ) {
    return 'name';
  }

  if (
    normalizedMessage.includes(
      'đơn vị tính'
    )
  ) {
    return 'unit';
  }

  if (
    normalizedMessage.includes(
      'đơn giá'
    )
  ) {
    return 'unitPrice';
  }

  if (
    normalizedMessage.includes(
      'cách tính'
    )
  ) {
    return 'calculationType';
  }

  return null;
}

export function createServiceConfigForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'ServiceConfigForm cần hàm onSubmit.'
    );
  }

  let mode = 'create';
  let currentServiceId = null;
  let currentIsActive = true;
  let isSubmitting = false;

  const fields = {
    code: createInputField({
      name: 'code',
      label: 'Mã dịch vụ',
      required: true,

      placeholder:
        'Ví dụ: INTERNET',

      testId:
        'service-form-code'
    }),

    name: createInputField({
      name: 'name',
      label: 'Tên dịch vụ',
      required: true,

      placeholder:
        'Ví dụ: Internet',

      testId:
        'service-form-name'
    }),

    unit: createInputField({
      name: 'unit',
      label: 'Đơn vị tính',
      required: true,

      placeholder:
        'Ví dụ: phòng, người, kWh',

      testId:
        'service-form-unit'
    }),

    calculationType:
      createSelectField({
        name: 'calculationType',
        label: 'Cách tính',
        required: true,

        testId:
          'service-form-calculation-type'
      }),

    unitPrice: createInputField({
      name: 'unitPrice',
      label: 'Đơn giá',
      type: 'number',
      required: true,
      min: '0',
      step: '1000',

      testId:
        'service-form-unit-price'
    }),

    description:
      createTextareaField({
        name: 'description',
        label: 'Mô tả',

        testId:
          'service-form-description'
      })
  };

  fields.calculationType
    .control
    .append(
      createElement('option', {
        text: 'Chọn cách tính',

        attributes: {
          value: ''
        }
      })
    );

  Object.values(
    SERVICE_CALCULATION_TYPE
  ).forEach((calculationType) => {
    fields.calculationType
      .control
      .append(
        createElement('option', {
          text:
            SERVICE_CALCULATION_TYPE_LABELS[
              calculationType
            ],

          attributes: {
            value: calculationType
          }
        })
      );
  });

  const modalTitle =
    createElement('h2', {
      className:
        'modal-title fs-5',

      text: 'Thêm dịch vụ',

      attributes: {
        id:
          'serviceConfigFormTitle'
      },

      dataset: {
        testid:
          'service-form-title'
      }
    });

  const closeButton =
    createElement('button', {
      className: 'btn-close',

      attributes: {
        type: 'button',
        'data-bs-dismiss': 'modal',
        'aria-label': 'Đóng'
      }
    });

  const generalError =
    createElement('div', {
      className:
        'alert alert-danger d-none',

      attributes: {
        role: 'alert'
      },

      dataset: {
        testid:
          'service-form-general-error'
      }
    });

  const priceHelp =
    createElement('div', {
      className:
        'form-text',

      text:
        'Khi thay đổi đơn giá, RoomMate tạo một mốc giá mới. Hóa đơn cũ không bị thay đổi.'
    });

  fields.unitPrice.wrapper.append(
    priceHelp
  );

  const submitButton =
    createElement('button', {
      className:
        'btn btn-primary',

      text: 'Thêm dịch vụ',

      attributes: {
        type: 'submit'
      },

      dataset: {
        testid:
          'service-form-submit'
      }
    });

  const cancelButton =
    createElement('button', {
      className:
        'btn btn-outline-secondary',

      text: 'Hủy',

      attributes: {
        type: 'button',
        'data-bs-dismiss': 'modal'
      },

      dataset: {
        testid:
          'service-form-cancel'
      }
    });

  const form = createElement(
    'form',
    {
      className:
        'modal-content',

      attributes: {
        novalidate: ''
      },

      dataset: {
        testid:
          'service-form'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'modal-header'
        },
        [
          modalTitle,
          closeButton
        ]
      ),

      createElement(
        'div',
        {
          className:
            'modal-body'
        },
        [
          generalError,

          createElement(
            'div',
            {
              className:
                'row g-3'
            },
            [
              fields.code.wrapper,
              fields.name.wrapper,
              fields.unit.wrapper,
              fields.calculationType.wrapper,
              fields.unitPrice.wrapper,
              fields.description.wrapper
            ]
          )
        ]
      ),

      createElement(
        'div',
        {
          className:
            'modal-footer'
        },
        [
          cancelButton,
          submitButton
        ]
      )
    ]
  );

  const element = createElement(
    'div',
    {
      className:
        'modal fade',

      attributes: {
        id:
          SERVICE_FORM_MODAL_ID,

        tabindex: '-1',

        'aria-labelledby':
          'serviceConfigFormTitle',

        'aria-hidden': 'true'
      },

      dataset: {
        testid:
          'service-form-modal'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'
        },
        [form]
      )
    ]
  );

  function getModal() {
    const Modal =
      window.bootstrap?.Modal;

    if (!Modal) {
      throw new Error(
        'Bootstrap Modal chưa được tải.'
      );
    }

    return Modal.getOrCreateInstance(
      element,
      {
        backdrop: 'static',
        keyboard: true,
        focus: true
      }
    );
  }

  function clearFieldError(
    fieldName
  ) {
    const field = fields[fieldName];

    if (!field) {
      return;
    }

    field.control.classList.remove(
      'is-invalid'
    );

    field.control.removeAttribute(
      'aria-invalid'
    );

    field.feedback.textContent = '';
  }

  function setFieldError(
    fieldName,
    message
  ) {
    const field = fields[fieldName];

    if (!field) {
      return;
    }

    field.control.classList.add(
      'is-invalid'
    );

    field.control.setAttribute(
      'aria-invalid',
      'true'
    );

    field.feedback.textContent =
      message;
  }

  function clearErrors() {
    Object.keys(fields).forEach(
      clearFieldError
    );

    generalError.textContent = '';
    generalError.classList.add(
      'd-none'
    );
  }

  function showGeneralError(message) {
    generalError.textContent =
      message;

    generalError.classList.remove(
      'd-none'
    );
  }

  function getFormData() {
    return {
      code:
        fields.code.control.value
          .trim()
          .toUpperCase(),

      name:
        fields.name.control.value
          .trim(),

      unit:
        fields.unit.control.value
          .trim(),

      calculationType:
        fields.calculationType
          .control
          .value,

      unitPrice:
        Number(
          fields.unitPrice
            .control
            .value
        ),

      isActive:
        currentIsActive,

      description:
        fields.description
          .control
          .value
          .trim()
    };
  }

  function validate() {
    const data = getFormData();
    const errors = {};

    if (!data.code) {
      errors.code =
        'Mã dịch vụ không được để trống.';
    }

    if (
      data.code &&
      !/^[A-Z0-9_-]+$/.test(
        data.code
      )
    ) {
      errors.code =
        'Mã chỉ được chứa chữ, số, dấu gạch ngang hoặc gạch dưới.';
    }

    if (!data.name) {
      errors.name =
        'Tên dịch vụ không được để trống.';
    }

    if (!data.unit) {
      errors.unit =
        'Đơn vị tính không được để trống.';
    }

    if (
      !Object.values(
        SERVICE_CALCULATION_TYPE
      ).includes(
        data.calculationType
      )
    ) {
      errors.calculationType =
        'Vui lòng chọn cách tính hợp lệ.';
    }

    if (
      !Number.isFinite(
        data.unitPrice
      ) ||
      data.unitPrice < 0
    ) {
      errors.unitPrice =
        'Đơn giá phải là số không âm.';
    }

    return {
      data,
      errors,

      isValid:
        Object.keys(errors).length ===
        0
    };
  }

  function populateForm(
    serviceConfig = null
  ) {
    const values =
      serviceConfig ?? {
        code: '',
        name: '',
        unit: '',
        calculationType: '',
        unitPrice: 0,
        description: '',
        isActive: true
      };

    fields.code.control.value =
      values.code ?? '';

    fields.name.control.value =
      values.name ?? '';

    fields.unit.control.value =
      values.unit ?? '';

    fields.calculationType
      .control
      .value =
        values.calculationType ?? '';

    fields.unitPrice
      .control
      .value =
        values.unitPrice ?? 0;

    fields.description
      .control
      .value =
        values.description ?? '';

    currentIsActive =
      values.isActive !== false;
  }

  function setSubmitting(
    submitting
  ) {
    isSubmitting = submitting;

    submitButton.disabled =
      submitting;

    cancelButton.disabled =
      submitting;

    closeButton.disabled =
      submitting;

    if (submitting) {
      submitButton.textContent =
        'Đang lưu...';

      return;
    }

    submitButton.textContent =
      mode === 'edit'
        ? 'Lưu thay đổi'
        : 'Thêm dịch vụ';
  }

  function open({
    mode: nextMode = 'create',
    serviceConfig = null
  } = {}) {
    if (
      nextMode !== 'create' &&
      nextMode !== 'edit'
    ) {
      throw new Error(
        'Chế độ form dịch vụ không hợp lệ.'
      );
    }

    if (
      nextMode === 'edit' &&
      !serviceConfig?.id
    ) {
      throw new Error(
        'Không có thông tin dịch vụ cần sửa.'
      );
    }

    mode = nextMode;

    currentServiceId =
      serviceConfig?.id ?? null;

    modalTitle.textContent =
      nextMode === 'edit'
        ? `Sửa dịch vụ ${serviceConfig.name}`
        : 'Thêm dịch vụ';

    populateForm(serviceConfig);
    clearErrors();
    setSubmitting(false);

    getModal().show();

    window.setTimeout(() => {
      fields.code.control.focus();
    }, 150);
  }

  function close() {
    getModal().hide();
  }

  Object.entries(fields).forEach(
    ([fieldName, field]) => {
      const eventName =
        field.control.tagName ===
        'SELECT'
          ? 'change'
          : 'input';

      field.control.addEventListener(
        eventName,
        () => {
          clearFieldError(
            fieldName
          );

          generalError.classList.add(
            'd-none'
          );
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

      const validationResult =
        validate();

      if (
        !validationResult.isValid
      ) {
        Object.entries(
          validationResult.errors
        ).forEach(
          ([fieldName, message]) => {
            setFieldError(
              fieldName,
              message
            );
          }
        );

        const firstField =
          Object.keys(
            validationResult.errors
          )[0];

        fields[
          firstField
        ]?.control.focus();

        return;
      }

      setSubmitting(true);

      try {
        await onSubmit(
          validationResult.data,
          {
            mode,

            serviceId:
              currentServiceId
          }
        );

        close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể lưu dịch vụ.';

        const fieldName =
          mapServiceErrorToField(
            message
          );

        if (fieldName) {
          setFieldError(
            fieldName,
            message
          );

          fields[
            fieldName
          ].control.focus();
        } else {
          showGeneralError(
            message
          );
        }
      } finally {
        setSubmitting(false);
      }
    }
  );

  element.addEventListener(
    'hidden.bs.modal',
    () => {
      mode = 'create';
      currentServiceId = null;
      currentIsActive = true;
      clearErrors();
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createServiceConfigForm;