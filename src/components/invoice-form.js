import {
  INVOICE_DOCUMENT_STATUS
} from '../constants/statuses.js';

import {
  SERVICE_CALCULATION_TYPE
} from '../business/service-config-validator.js';

import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

const INVOICE_FORM_MODAL_ID =
  'invoiceFormModal';

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
  const id = `invoice-${name}`;

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
  const id = `invoice-${name}`;

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

function createTextareaField() {
  const control =
    createElement('textarea', {
      className: 'form-control',

      attributes: {
        id: 'invoice-note',
        name: 'note',
        rows: '3',
        maxlength: '1000'
      },

      dataset: {
        testid:
          'invoice-form-note'
      }
    });

  const feedback =
    createElement('div', {
      className:
        'invalid-feedback'
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
          text: 'Ghi chú',

          attributes: {
            for: 'invoice-note'
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

function mapServiceErrorToField(message) {
  const normalizedMessage =
    String(message ?? '')
      .toLocaleLowerCase('vi-VN');

  if (
    normalizedMessage.includes(
      'mã hóa đơn'
    )
  ) {
    return 'code';
  }

  if (
    normalizedMessage.includes(
      'giảm giá'
    )
  ) {
    return 'discount';
  }

  if (
    normalizedMessage.includes(
      'ngày đến hạn'
    )
  ) {
    return 'dueDate';
  }

  if (
    normalizedMessage.includes(
      'ngày lập'
    )
  ) {
    return 'issueDate';
  }

  if (
    normalizedMessage.includes(
      'tháng'
    )
  ) {
    return 'period';
  }

  if (
    normalizedMessage.includes(
      'phòng'
    ) ||
    normalizedMessage.includes(
      'hợp đồng hiệu lực'
    ) ||
    normalizedMessage.includes(
      'bản ghi điện nước'
    )
  ) {
    return 'roomId';
  }

  return null;
}

export function createInvoiceForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'InvoiceForm cần hàm onSubmit.'
    );
  }

  let mode = 'create';
  let currentInvoiceId = null;
  let availableRooms = [];
  let currentItems = [];
  let itemControls = [];
  let isSubmitting = false;

  const fields = {
    code: createInputField({
      name: 'code',
      label: 'Mã hóa đơn',

      placeholder:
        'Để trống để tạo tự động',

      testId:
        'invoice-form-code'
    }),

    roomId: createSelectField({
      name: 'roomId',
      label: 'Phòng',
      required: true,

      testId:
        'invoice-form-room'
    }),

    period: createInputField({
      name: 'period',
      label: 'Tháng hóa đơn',
      type: 'month',
      required: true,

      testId:
        'invoice-form-period'
    }),

    issueDate: createInputField({
      name: 'issueDate',
      label: 'Ngày lập',
      type: 'date',

      testId:
        'invoice-form-issue-date'
    }),

    dueDate: createInputField({
      name: 'dueDate',
      label: 'Ngày đến hạn',
      type: 'date',

      testId:
        'invoice-form-due-date'
    }),

    discount: createInputField({
      name: 'discount',
      label: 'Giảm giá',
      type: 'number',
      min: '0',
      step: '1000',

      testId:
        'invoice-form-discount'
    }),

    note: createTextareaField()
  };

  const modalTitle = createElement('h2', {
    className:
      'modal-title fs-5',

    text: 'Tạo hóa đơn',

    attributes: {
      id: 'invoiceFormTitle'
    },

    dataset: {
      testid:
        'invoice-form-title'
    }
  });

  const closeButton = createElement('button', {
    className: 'btn-close',

    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal',
      'aria-label': 'Đóng'
    },

    dataset: {
      testid: 'invoice-form-close'
    }});

  const generalError = createElement('div', {
    className:
      'alert alert-danger d-none',

    attributes: {
      role: 'alert'
    },

    dataset: {
      testid:
        'invoice-form-general-error'
    }
  });

  const createModeInformation =
    createElement('div', {
      className:
        'alert alert-info',

      text:
        'Các khoản tiền phòng, điện nước và dịch vụ sẽ được InvoiceService tự động tạo từ dữ liệu của tháng đã chọn.',

      dataset: {
        testid:
          'invoice-form-create-info'
      }
    });

  const itemsSectionTitle =
    createElement('h3', {
      className:
        'rm-invoice-form-section-title',

      text:
        'Các khoản trong hóa đơn'
    });

  const itemsTableBody =
    createElement('tbody', {
      dataset: {
        testid:
          'invoice-form-items-body'
      }
    });

  const itemsTable = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-invoice-form-items-table',

      dataset: {
        testid:
          'invoice-form-items-table'
      }
    },
    [
      createElement(
        'thead',
        {},
        [
          createElement(
            'tr',
            {},
            [
              'Khoản thu',
              'Số lượng',
              'Đơn giá',
              'Thành tiền'
            ].map((label) =>
              createElement('th', {
                text: label,

                attributes: {
                  scope: 'col'
                }
              })
            )
          )
        ]
      ),

      itemsTableBody
    ]
  );

  const itemsSection = createElement(
    'section',
    {
      className:
        'rm-invoice-form-items-section',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'invoice-form-items-section'
      }
    },
    [
      itemsSectionTitle,

      createElement(
        'div',
        {
          className:
            'table-responsive'
        },
        [itemsTable]
      ),

      createElement('div', {
        className:
          'form-text mt-2',

        text:
          'InvoiceService sẽ tính lại thành tiền khi lưu hóa đơn.'
      })
    ]
  );

  const submitButton =
    createElement('button', {
      className: 'btn btn-primary',
      text: 'Tạo hóa đơn',

      attributes: {
        type: 'submit'
      },

      dataset: {
        testid:
          'invoice-form-submit'
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
          'invoice-form-cancel'
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
          'invoice-form'
      }
    },
    [
      createElement(
        'div',
        {
          className: 'modal-header'
        },
        [
          modalTitle,
          closeButton
        ]
      ),

      createElement(
        'div',
        {
          className: 'modal-body'
        },
        [
          generalError,

          createElement(
            'div',
            {
              className: 'row g-3'
            },
            [
              fields.code.wrapper,
              fields.roomId.wrapper,
              fields.period.wrapper,
              fields.issueDate.wrapper,
              fields.dueDate.wrapper,
              fields.discount.wrapper,
              fields.note.wrapper
            ]
          ),

          createModeInformation,
          itemsSection
        ]
      ),

      createElement(
        'div',
        {
          className: 'modal-footer'
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
        'modal fade rm-invoice-form-modal',

      attributes: {
        id: INVOICE_FORM_MODAL_ID,
        tabindex: '-1',
        role: 'dialog',
        'aria-modal': 'true',

        'aria-labelledby':
          'invoiceFormTitle',

        'aria-hidden': 'true'
      },

      dataset: {
        testid:
          'invoice-form-modal'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable'
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

  function clearFieldError(fieldName) {
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

    itemControls.forEach(
      ({
        quantityInput,
        unitPriceInput
      }) => {
        quantityInput.classList.remove(
          'is-invalid'
        );

        unitPriceInput.classList.remove(
          'is-invalid'
        );
      }
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

  function populateRoomOptions(
    selectedRoomId = ''
  ) {
    fields.roomId.control
      .replaceChildren(
        createElement('option', {
          text: 'Chọn phòng',

          attributes: {
            value: ''
          }
        })
      );

    availableRooms.forEach((room) => {
      fields.roomId.control.append(
        createElement('option', {
          text:
            `${room.code} — ${room.name}`,

          attributes: {
            value: room.id
          }
        })
      );
    });

    fields.roomId.control.value =
      selectedRoomId;
  }

  function renderItems(items) {
    currentItems = items.map(
      (item) => ({
        ...item
      })
    );

    itemControls = [];
    itemsTableBody.replaceChildren();

    currentItems.forEach(
      (item, index) => {
        const itemId =
          item.id ??
          `item-${index}`;

        const quantityInput =
          createElement('input', {
            className:
              'form-control form-control-sm',

            attributes: {
              type: 'number',
              min: '0',
              step: '0.01',
              value:
                item.quantity ?? 0
            },

            dataset: {
              testid:
                `invoice-form-item-quantity-${itemId}`
            }
          });

        const isFixedItem =
          item.type === 'rent' ||
          item.calculationType ===
            SERVICE_CALCULATION_TYPE.FIXED;

        quantityInput.disabled =
          isFixedItem;

        const unitPriceInput =
          createElement('input', {
            className:
              'form-control form-control-sm',

            attributes: {
              type: 'number',
              min: '0',
              step: '1000',
              value:
                item.unitPrice ?? 0
            },

            dataset: {
              testid:
                `invoice-form-item-unit-price-${itemId}`
            }
          });

        const row = createElement('tr', {
          dataset: {
            testid:
              `invoice-form-item-row-${itemId}`
          }
        });

        row.append(
          createElement('td', {}, [
            createElement('strong', {
              text:
                item.name ??
                `Khoản ${index + 1}`
            }),

            createElement('div', {
              className:
                'small text-body-secondary',

              text:
                item.unit ??
                '—'
            })
          ]),

          createElement(
            'td',
            {},
            [quantityInput]
          ),

          createElement(
            'td',
            {},
            [unitPriceInput]
          ),

          createElement('td', {
            className:
              'text-nowrap text-end',

            text:
              formatVietnameseCurrency(
                item.amount ?? 0
              )
          })
        );

        itemsTableBody.append(row);

        itemControls.push({
          item,
          quantityInput,
          unitPriceInput
        });
      }
    );
  }

  function getEditedItems() {
    return itemControls.map(
      ({
        item,
        quantityInput,
        unitPriceInput
      }) => ({
        ...item,

        quantity:
          Number(
            quantityInput.value
          ),

        unitPrice:
          Number(
            unitPriceInput.value
          )
      })
    );
  }

  function getFormData() {
    const data = {
      roomId:
        fields.roomId.control.value,

      period:
        fields.period.control.value,

      discount:
        Number(
          fields.discount.control.value ||
          0
        ),

      note:
        fields.note.control.value
          .trim()
    };

    const code =
      fields.code.control.value
        .trim()
        .toUpperCase();

    const issueDate =
      fields.issueDate.control.value;

    const dueDate =
      fields.dueDate.control.value;

    if (code) {
      data.code = code;
    }

    if (issueDate) {
      data.issueDate = issueDate;
    }

    if (dueDate) {
      data.dueDate = dueDate;
    }

    if (mode === 'edit') {
      data.items = getEditedItems();
    }

    return data;
  }

  function validate() {
    const data = getFormData();
    const errors = {};

    if (!data.roomId) {
      errors.roomId =
        'Vui lòng chọn phòng.';
    }

    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(
        data.period
      )
    ) {
      errors.period =
        'Tháng hóa đơn không hợp lệ.';
    }

    if (
      !Number.isFinite(
        data.discount
      ) ||
      data.discount < 0
    ) {
      errors.discount =
        'Giảm giá phải là số không âm.';
    }

    if (
      data.issueDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        data.issueDate
      )
    ) {
      errors.issueDate =
        'Ngày lập hóa đơn không hợp lệ.';
    }

    if (
      data.dueDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(
        data.dueDate
      )
    ) {
      errors.dueDate =
        'Ngày đến hạn không hợp lệ.';
    }

    if (
      data.issueDate &&
      data.dueDate &&
      data.dueDate < data.issueDate
    ) {
      errors.dueDate =
        'Ngày đến hạn không được trước ngày lập.';
    }

    let invalidItemControl = null;

    itemControls.forEach(
      ({
        quantityInput,
        unitPriceInput
      }) => {
        const quantity =
          Number(quantityInput.value);

        const unitPrice =
          Number(unitPriceInput.value);

        if (
          !Number.isFinite(quantity) ||
          quantity < 0
        ) {
          quantityInput.classList.add(
            'is-invalid'
          );

          invalidItemControl ??=
            quantityInput;
        }

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          unitPriceInput.classList.add(
            'is-invalid'
          );

          invalidItemControl ??=
            unitPriceInput;
        }
      }
    );

    return {
      data,
      errors,
      invalidItemControl,

      isValid:
        Object.keys(errors).length === 0 &&
        invalidItemControl === null
    };
  }

  function populateForm(
    invoice,
    month
  ) {
    const values =
      invoice ?? {
        code: '',
        roomId: '',
        period: month ?? '',
        issueDate: '',
        dueDate: '',
        discount: 0,
        note: '',
        items: []
      };

    populateRoomOptions(
      values.roomId
    );

    fields.code.control.value =
      values.code ?? '';

    fields.period.control.value =
      values.period ??
      month ??
      '';

    fields.issueDate.control.value =
      values.issueDate ?? '';

    fields.dueDate.control.value =
      values.dueDate ?? '';

    fields.discount.control.value =
      values.discount ?? 0;

    fields.note.control.value =
      values.note ?? '';

    renderItems(
      values.items ?? []
    );
  }

  function setSubmitting(submitting) {
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
        : 'Tạo hóa đơn';
  }

  function open({
    mode: nextMode = 'create',
    invoice = null,
    rooms = [],
    month = ''
  } = {}) {
    if (
      nextMode !== 'create' &&
      nextMode !== 'edit'
    ) {
      throw new Error(
        'Chế độ form hóa đơn không hợp lệ.'
      );
    }

    if (!Array.isArray(rooms)) {
      throw new TypeError(
        'Danh sách phòng phải là một mảng.'
      );
    }

    if (
      nextMode === 'edit' &&
      (
        !invoice?.id ||
        invoice.documentStatus !==
          INVOICE_DOCUMENT_STATUS.DRAFT
      )
    ) {
      throw new Error(
        'Chỉ hóa đơn nháp mới được sửa.'
      );
    }

    mode = nextMode;

    currentInvoiceId =
      invoice?.id ?? null;

    availableRooms = [...rooms];

    modalTitle.textContent =
      nextMode === 'edit'
        ? `Sửa hóa đơn ${invoice.code}`
        : 'Tạo hóa đơn';

    fields.roomId.control.disabled =
      nextMode === 'edit';

    fields.period.control.disabled =
      nextMode === 'edit';

    createModeInformation.hidden =
      nextMode === 'edit';

    itemsSection.hidden =
      nextMode !== 'edit';

    populateForm(
      invoice,
      month
    );

    clearErrors();
    setSubmitting(false);

    getModal().show();

    window.setTimeout(() => {
      if (nextMode === 'create') {
        fields.roomId.control.focus();
      } else {
        fields.code.control.focus();
      }
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

        const firstFieldName =
          Object.keys(
            validationResult.errors
          )[0];

        if (firstFieldName) {
          fields[
            firstFieldName
          ]?.control.focus();
        } else {
          validationResult
            .invalidItemControl
            ?.focus();
        }

        return;
      }

      setSubmitting(true);

      try {
        await onSubmit(
          validationResult.data,
          {
            mode,

            invoiceId:
              currentInvoiceId
          }
        );

        close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể lưu hóa đơn.';

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
      mode = 'create';
      currentInvoiceId = null;
      availableRooms = [];
      currentItems = [];
      itemControls = [];

      fields.roomId.control.disabled =
        false;

      fields.period.control.disabled =
        false;

      createModeInformation.hidden =
        false;

      itemsSection.hidden = true;

      clearErrors();
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createInvoiceForm;