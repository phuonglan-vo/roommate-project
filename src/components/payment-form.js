import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

import {
  isValidIsoDate
} from '../utils/date-utils.js';

const PAYMENT_FORM_MODAL_ID =
  'paymentFormModal';

const PAYMENT_METHODS = Object.freeze([
  {
    value: 'cash',
    label: 'Tiền mặt'
  },
  {
    value: 'bankTransfer',
    label: 'Chuyển khoản'
  },
  {
    value: 'eWallet',
    label: 'Ví điện tử'
  },
  {
    value: 'other',
    label: 'Khác'
  }
]);

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

function createInputField({
  name,
  label,
  type = 'text',
  required = false,
  min,
  max,
  step,
  placeholder = '',
  testId,
  columnClass = 'col-12 col-md-6'
}) {
  const id = `payment-${name}`;

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
        max,
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
        className: columnClass
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
  testId,
  columnClass = 'col-12 col-md-6'
}) {
  const id = `payment-${name}`;

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
        className: columnClass
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
        id: 'payment-note',
        name: 'note',
        rows: '3',
        maxlength: '1000'
      },

      dataset: {
        testid:
          'payment-form-note'
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
            for: 'payment-note'
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
      'hóa đơn'
    ) &&
    (
      normalizedMessage.includes(
        'không tìm thấy'
      ) ||
      normalizedMessage.includes(
        'đã hủy'
      ) ||
      normalizedMessage.includes(
        'đã được thanh toán đủ'
      )
    )
  ) {
    return 'invoiceId';
  }

  if (
    normalizedMessage.includes(
      'số tiền'
    ) ||
    normalizedMessage.includes(
      'công nợ'
    )
  ) {
    return 'amount';
  }

  if (
    normalizedMessage.includes(
      'phương thức'
    )
  ) {
    return 'method';
  }

  if (
    normalizedMessage.includes(
      'ngày thanh toán'
    )
  ) {
    return 'paymentDate';
  }

  return null;
}

export function createPaymentForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'PaymentForm cần hàm onSubmit.'
    );
  }

  let invoices = [];
  let selectedInvoice = null;
  let isSubmitting = false;

  const fields = {
    invoiceId: createSelectField({
      name: 'invoiceId',
      label: 'Hóa đơn còn nợ',
      required: true,

      testId:
        'payment-form-invoice',

      columnClass: 'col-12'
    }),

    amount: createInputField({
      name: 'amount',
      label: 'Số tiền thanh toán',
      type: 'number',
      required: true,
      min: '1',
      step: '1',

      testId:
        'payment-form-amount'
    }),

    method: createSelectField({
      name: 'method',
      label: 'Phương thức',
      required: true,

      testId:
        'payment-form-method'
    }),

    paymentDate: createInputField({
      name: 'paymentDate',
      label: 'Ngày thanh toán',
      type: 'date',
      required: true,

      testId:
        'payment-form-date'
    }),

    reference: createInputField({
      name: 'reference',
      label: 'Mã tham chiếu',

      placeholder:
        'Ví dụ: mã giao dịch ngân hàng',

      testId:
        'payment-form-reference'
    }),

    note: createTextareaField()
  };

  fields.method.control.append(
    createElement('option', {
      text:
        'Chọn phương thức',

      attributes: {
        value: ''
      }
    })
  );

  PAYMENT_METHODS.forEach(
    ({ value, label }) => {
      fields.method.control.append(
        createElement('option', {
          text: label,

          attributes: {
            value
          }
        })
      );
    }
  );

  const modalTitle = createElement('h2', {
    className:
      'modal-title fs-5',

    text: 'Thêm thanh toán',

    attributes: {
      id:
        'paymentFormTitle'
    },

    dataset: {
      testid:
        'payment-form-title'
    }
  });

  const closeButton =
    createElement('button', {
      className: 'btn-close',

      attributes: {
        type: 'button',
        'data-bs-dismiss': 'modal',
        'aria-label': 'Đóng'
      },

    dataset: {
      testid: 'payment-form-close'
    }});

  const generalError =
    createElement('div', {
      className:
        'alert alert-danger d-none',

      attributes: {
        role: 'alert'
      },

      dataset: {
        testid:
          'payment-form-general-error'
      }
    });

  const invoiceCodeValue =
    createElement('strong', {
      text: '—',

      dataset: {
        testid:
          'payment-form-invoice-code'
      }
    });

  const roomValue =
    createElement('strong', {
      text: '—',

      dataset: {
        testid:
          'payment-form-room'
      }
    });

  const invoiceTotalValue =
    createElement('strong', {
      text:
        formatVietnameseCurrency(0),

      dataset: {
        testid:
          'payment-form-invoice-total'
      }
    });

  const paidAmountValue =
    createElement('strong', {
      text:
        formatVietnameseCurrency(0),

      dataset: {
        testid:
          'payment-form-paid-amount'
      }
    });

  const remainingDebtValue =
    createElement('strong', {
      text:
        formatVietnameseCurrency(0),

      dataset: {
        testid:
          'payment-form-remaining-debt'
      }
    });

  function createSummaryItem(
    label,
    valueElement,
    className = ''
  ) {
    return createElement(
      'div',
      {
        className:
          `rm-payment-form-summary-item ${className}`
      },
      [
        createElement('span', {
          text: label
        }),

        valueElement
      ]
    );
  }

  const invoiceSummary =
    createElement(
      'section',
      {
        className:
          'rm-payment-form-summary',

        attributes: {
          hidden: ''
        },

        dataset: {
          testid:
            'payment-form-invoice-summary'
        }
      },
      [
        createSummaryItem(
          'Mã hóa đơn',
          invoiceCodeValue
        ),

        createSummaryItem(
          'Phòng',
          roomValue
        ),

        createSummaryItem(
          'Tổng hóa đơn',
          invoiceTotalValue
        ),

        createSummaryItem(
          'Đã trả',
          paidAmountValue
        ),

        createSummaryItem(
          'Còn nợ',
          remainingDebtValue,
          'rm-payment-form-summary-item--debt'
        )
      ]
    );

  const payAllButton =
    createElement('button', {
      className:
        'btn btn-sm btn-outline-primary',

      text: 'Thanh toán toàn bộ công nợ',

      attributes: {
        type: 'button',
        disabled: ''
      },

      dataset: {
        testid:
          'payment-form-pay-all'
      }
    });

  fields.amount.wrapper.append(
    createElement(
      'div',
      {
        className:
          'd-flex justify-content-between align-items-start gap-2 mt-2'
      },
      [
        createElement('div', {
          className:
            'form-text mt-0',

          text:
            'Số tiền không được vượt quá công nợ.'
        }),

        payAllButton
      ]
    )
  );

  const submitButton =
    createElement('button', {
      className: 'btn btn-primary',
      text: 'Lưu thanh toán',

      attributes: {
        type: 'submit'
      },

      dataset: {
        testid:
          'payment-form-submit'
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
          'payment-form-cancel'
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
          'payment-form'
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
          invoiceSummary,

          createElement(
            'div',
            {
              className: 'row g-3'
            },
            [
              fields.invoiceId.wrapper,
              fields.amount.wrapper,
              fields.method.wrapper,
              fields.paymentDate.wrapper,
              fields.reference.wrapper,
              fields.note.wrapper
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
        'modal fade rm-payment-form-modal',

      attributes: {
        id:
          PAYMENT_FORM_MODAL_ID,

        tabindex: '-1',
        role: 'dialog',
        'aria-modal': 'true',

        'aria-labelledby':
          'paymentFormTitle',

        'aria-hidden': 'true'
      },

      dataset: {
        testid:
          'payment-form-modal'
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

  function getInvoiceRoomLabel(invoice) {
    if (invoice.roomSnapshot) {
      return (
        `${invoice.roomSnapshot.code} — ` +
        `${invoice.roomSnapshot.name}`
      );
    }

    return invoice.roomId;
  }

  function populateInvoiceOptions() {
    fields.invoiceId.control
      .replaceChildren(
        createElement('option', {
          text:
            'Chọn hóa đơn còn nợ',

          attributes: {
            value: ''
          }
        })
      );

    invoices.forEach((invoice) => {
      fields.invoiceId.control.append(
        createElement('option', {
          text:
            `${invoice.code} — ` +
            `${getInvoiceRoomLabel(invoice)} — ` +
            `Còn nợ ${formatVietnameseCurrency(
              invoice.remainingDebt
            )}`,

          attributes: {
            value: invoice.id
          }
        })
      );
    });
  }

  function renderInvoiceSummary() {
    if (!selectedInvoice) {
      invoiceSummary.hidden = true;

      invoiceCodeValue.textContent = '—';
      roomValue.textContent = '—';

      invoiceTotalValue.textContent =
        formatVietnameseCurrency(0);

      paidAmountValue.textContent =
        formatVietnameseCurrency(0);

      remainingDebtValue.textContent =
        formatVietnameseCurrency(0);

      fields.amount.control.max = '';

      payAllButton.disabled = true;

      return;
    }

    const remainingDebt =
      Number(
        selectedInvoice.remainingDebt ??
        0
      );

    invoiceSummary.hidden = false;

    invoiceCodeValue.textContent =
      selectedInvoice.code;

    roomValue.textContent =
      getInvoiceRoomLabel(
        selectedInvoice
      );

    invoiceTotalValue.textContent =
      formatVietnameseCurrency(
        selectedInvoice.total ?? 0
      );

    paidAmountValue.textContent =
      formatVietnameseCurrency(
        selectedInvoice.paidAmount ?? 0
      );

    remainingDebtValue.textContent =
      formatVietnameseCurrency(
        remainingDebt
      );

    fields.amount.control.max =
      String(remainingDebt);

    payAllButton.disabled =
      !Number.isFinite(remainingDebt) ||
      remainingDebt <= 0;
  }

  function selectInvoice(invoiceId) {
    selectedInvoice =
      invoices.find(
        (invoice) =>
          invoice.id === invoiceId
      ) ?? null;

    renderInvoiceSummary();
  }

  function getFormData() {
    return {
      invoiceId:
        fields.invoiceId.control.value,

      amount:
        Number(
          fields.amount.control.value
        ),

      method:
        fields.method.control.value,

      paymentDate:
        fields.paymentDate.control.value,

      reference:
        fields.reference.control.value
          .trim(),

      note:
        fields.note.control.value
          .trim()
    };
  }

  function validate() {
    const data = getFormData();
    const errors = {};

    if (!data.invoiceId) {
      errors.invoiceId =
        'Vui lòng chọn hóa đơn.';
    }

    if (
      !Number.isFinite(data.amount) ||
      data.amount <= 0
    ) {
      errors.amount =
        'Số tiền thanh toán phải lớn hơn 0.';
    }

    const remainingDebt =
      Number(
        selectedInvoice
          ?.remainingDebt ?? 0
      );

    if (
      !errors.amount &&
      (
        !selectedInvoice ||
        data.amount >
          remainingDebt
      )
    ) {
      errors.amount =
        `Số tiền không được vượt quá công nợ ${formatVietnameseCurrency(
          remainingDebt
        )}.`;
    }

    if (!data.method) {
      errors.method =
        'Vui lòng chọn phương thức thanh toán.';
    }

    if (
      !isValidIsoDate(
        data.paymentDate
      )
    ) {
      errors.paymentDate =
        'Ngày thanh toán không hợp lệ.';
    }

    return {
      data,
      errors,

      isValid:
        Object.keys(errors).length ===
        0
    };
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;

    submitButton.disabled =
      submitting;

    cancelButton.disabled =
      submitting;

    closeButton.disabled =
      submitting;

    fields.invoiceId.control.disabled =
      submitting;

    payAllButton.disabled =
      submitting ||
      !selectedInvoice;

    submitButton.textContent =
      submitting
        ? 'Đang lưu...'
        : 'Lưu thanh toán';
  }

  function resetForm() {
    selectedInvoice = null;

    fields.invoiceId.control.value = '';
    fields.amount.control.value = '';
    fields.amount.control.max = '';

    fields.method.control.value =
      'cash';

    fields.paymentDate.control.value =
      getCurrentDateInVietnam();

    fields.reference.control.value = '';
    fields.note.control.value = '';

    renderInvoiceSummary();
    clearErrors();
  }

  function open({
    invoices:
      nextInvoices = [],
    selectedInvoiceId = ''
  } = {}) {
    if (!Array.isArray(nextInvoices)) {
      throw new TypeError(
        'Danh sách hóa đơn phải là một mảng.'
      );
    }

    invoices = [...nextInvoices];

    populateInvoiceOptions();
    resetForm();

    if (selectedInvoiceId) {
      fields.invoiceId.control.value =
        selectedInvoiceId;

      selectInvoice(
        selectedInvoiceId
      );
    }

    setSubmitting(false);

    getModal().show();

    window.setTimeout(() => {
      fields.invoiceId.control.focus();
    }, 150);
  }

  function close() {
    getModal().hide();
  }

  fields.invoiceId.control
    .addEventListener(
      'change',
      () => {
        clearFieldError(
          'invoiceId'
        );

        clearFieldError(
          'amount'
        );

        fields.amount.control.value = '';

        selectInvoice(
          fields.invoiceId
            .control
            .value
        );
      }
    );

  fields.amount.control.addEventListener(
    'input',
    () => {
      clearFieldError('amount');

      if (!selectedInvoice) {
        return;
      }

      const remainingDebt =
        Number(
          selectedInvoice
            .remainingDebt ?? 0
        );

      const amount =
        Number(
          fields.amount.control.value
        );

      if (
        Number.isFinite(amount) &&
        amount > remainingDebt
      ) {
        setFieldError(
          'amount',

          `Số tiền không được vượt quá công nợ ${formatVietnameseCurrency(
            remainingDebt
          )}.`
        );
      }
    }
  );

  fields.method.control.addEventListener(
    'change',
    () => {
      clearFieldError('method');
    }
  );

  fields.paymentDate.control
    .addEventListener(
      'change',
      () => {
        clearFieldError(
          'paymentDate'
        );
      }
    );

  fields.reference.control
    .addEventListener(
      'input',
      () => {
        clearFieldError(
          'reference'
        );
      }
    );

  payAllButton.addEventListener(
    'click',
    () => {
      if (!selectedInvoice) {
        return;
      }

      fields.amount.control.value =
        String(
          selectedInvoice
            .remainingDebt ?? 0
        );

      clearFieldError('amount');

      fields.amount.control.focus();
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
          validationResult.data
        );

        close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể lưu thanh toán.';

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
      invoices = [];
      selectedInvoice = null;

      fields.invoiceId.control.disabled =
        false;

      resetForm();
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createPaymentForm;