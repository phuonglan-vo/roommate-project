import meterReadingService from '../services/meter-reading-service.js';

import {
  calculateElectricUsage,
  calculateWaterUsage,
  detectAbnormalUsage
} from '../business/meter-calculator.js';

const METER_FORM_MODAL_ID =
  'meterReadingFormModal';

const ABNORMAL_USAGE_THRESHOLD_PERCENT = 50;

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
  type = 'number',
  required = false,
  min,
  step,
  readOnly = false,
  testId
}) {
  const id = `meter-${name}`;

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
        step
      },

      dataset: {
        testid: testId
      }
    });

  control.readOnly = readOnly;

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
  testId
}) {
  const id = `meter-${name}`;

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

function createTextareaField() {
  const control =
    createElement('textarea', {
      className: 'form-control',

      attributes: {
        id: 'meter-note',
        name: 'note',
        rows: '3',
        maxlength: '1000'
      },

      dataset: {
        testid:
          'meter-form-note'
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
            for: 'meter-note'
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

function getLastDayOfMonth(month) {
  const match =
    /^(\d{4})-(\d{2})$/.exec(month);

  if (!match) {
    return '';
  }

  const year = Number(match[1]);
  const monthNumber =
    Number(match[2]);

  const date = new Date(
    Date.UTC(
      year,
      monthNumber,
      0
    )
  );

  return date.toISOString().slice(0, 10);
}

function normalizeNumericValue(value) {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return NaN;
  }

  return Number(value);
}

function mapServiceErrorToField(message) {
  const normalizedMessage =
    String(message ?? '')
      .toLocaleLowerCase('vi-VN');

  if (
    normalizedMessage.includes(
      'phòng'
    ) ||
    normalizedMessage.includes(
      'hợp đồng hiệu lực'
    ) ||
    normalizedMessage.includes(
      'đã có bản ghi'
    )
  ) {
    return 'roomId';
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
      'điện mới'
    )
  ) {
    return 'electricityCurrent';
  }

  if (
    normalizedMessage.includes(
      'điện cũ'
    )
  ) {
    return 'electricityPrevious';
  }

  if (
    normalizedMessage.includes(
      'nước mới'
    )
  ) {
    return 'waterCurrent';
  }

  if (
    normalizedMessage.includes(
      'nước cũ'
    )
  ) {
    return 'waterPrevious';
  }

  return null;
}

export function createMeterReadingForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'MeterReadingForm cần hàm onSubmit.'
    );
  }

  let mode = 'create';
  let currentReadingId = null;
  let currentMonth = '';
  let availableRooms = [];
  let previousReading = null;
  let hasPreviousReading = false;
  let isSubmitting = false;

  const fields = {
    roomId: createSelectField({
      name: 'roomId',
      label: 'Phòng',

      testId:
        'meter-form-room'
    }),

    period: createInputField({
      name: 'period',
      label: 'Tháng',
      type: 'month',
      required: true,

      testId:
        'meter-form-period'
    }),

    readingDate: createInputField({
      name: 'readingDate',
      label: 'Ngày ghi chỉ số',
      type: 'date',
      required: true,

      testId:
        'meter-form-reading-date'
    }),

    electricityPrevious:
      createInputField({
        name:
          'electricityPrevious',

        label:
          'Chỉ số điện cũ',

        required: true,
        min: '0',
        step: '0.01',

        testId:
          'meter-form-electricity-previous'
      }),

    electricityCurrent:
      createInputField({
        name:
          'electricityCurrent',

        label:
          'Chỉ số điện mới',

        required: true,
        min: '0',
        step: '0.01',

        testId:
          'meter-form-electricity-current'
      }),

    waterPrevious:
      createInputField({
        name:
          'waterPrevious',

        label:
          'Chỉ số nước cũ',

        required: true,
        min: '0',
        step: '0.01',

        testId:
          'meter-form-water-previous'
      }),

    waterCurrent:
      createInputField({
        name:
          'waterCurrent',

        label:
          'Chỉ số nước mới',

        required: true,
        min: '0',
        step: '0.01',

        testId:
          'meter-form-water-current'
      }),

    note: createTextareaField()
  };

  fields.period.control.readOnly = true;

  const modalTitle = createElement('h2', {
    className:
      'modal-title fs-5',

    text: 'Ghi chỉ số',

    attributes: {
      id:
        'meterReadingFormTitle'
    },

    dataset: {
      testid:
        'meter-form-title'
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

  const generalError = createElement('div', {
    className:
      'alert alert-danger d-none',

    attributes: {
      role: 'alert'
    },

    dataset: {
      testid:
        'meter-form-general-error'
    }
  });

  const previousInfo = createElement('div', {
    className:
      'alert alert-info rm-meter-form-previous-info',

    attributes: {
      hidden: '',
      role: 'status'
    },

    dataset: {
      testid:
        'meter-form-previous-info'
    }
  });

  const abnormalWarning =
    createElement('div', {
      className:
        'alert alert-warning d-none',

      attributes: {
        role: 'status'
      },

      dataset: {
        testid:
          'meter-form-abnormal-warning'
      }
    });

  const electricityUsageValue =
    createElement('strong', {
      text: '0',

      dataset: {
        testid:
          'meter-form-electricity-usage'
      }
    });

  const waterUsageValue =
    createElement('strong', {
      text: '0',

      dataset: {
        testid:
          'meter-form-water-usage'
      }
    });

  const usageSummary = createElement(
    'div',
    {
      className:
        'rm-meter-form-summary'
    },
    [
      createElement(
        'div',
        {
          className:
            'rm-meter-form-summary-card'
        },
        [
          createElement('span', {
            text:
              'Điện tiêu thụ'
          }),

          createElement(
            'div',
            {},
            [
              electricityUsageValue,

              createElement('small', {
                text: ' kWh'
              })
            ]
          )
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-meter-form-summary-card'
        },
        [
          createElement('span', {
            text:
              'Nước tiêu thụ'
          }),

          createElement(
            'div',
            {},
            [
              waterUsageValue,

              createElement('small', {
                text: ' m³'
              })
            ]
          )
        ]
      )
    ]
  );

  const submitButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Lưu chỉ số',

    attributes: {
      type: 'submit'
    },

    dataset: {
      testid:
        'meter-form-submit'
    }
  });

  const cancelButton = createElement('button', {
    className:
      'btn btn-outline-secondary',

    text: 'Hủy',

    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal'
    },

    dataset: {
      testid:
        'meter-form-cancel'
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
          'meter-reading-form'
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
          previousInfo,
          abnormalWarning,

          createElement(
            'div',
            {
              className:
                'row g-3'
            },
            [
              fields.roomId.wrapper,
              fields.period.wrapper,
              fields.readingDate.wrapper,
              fields.electricityPrevious.wrapper,
              fields.electricityCurrent.wrapper,
              fields.waterPrevious.wrapper,
              fields.waterCurrent.wrapper,
              fields.note.wrapper
            ]
          ),

          usageSummary
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
        'modal fade rm-meter-form-modal',

      attributes: {
        id:
          METER_FORM_MODAL_ID,

        tabindex: '-1',

        'aria-labelledby':
          'meterReadingFormTitle',

        'aria-hidden': 'true'
      },

      dataset: {
        testid:
          'meter-form-modal'
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

  function populateRoomOptions(
    selectedRoomId
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
      selectedRoomId ?? '';
  }

  function loadPreviousReading(
    roomId,
    reading = null
  ) {
    if (!roomId || !currentMonth) {
      previousReading = null;
      hasPreviousReading = false;
      previousInfo.hidden = true;
      return;
    }

    previousReading =
      meterReadingService
        .getPreviousReading(
          roomId,
          currentMonth
        );

    hasPreviousReading =
      Boolean(previousReading);

    fields.electricityPrevious
      .control
      .readOnly =
        hasPreviousReading;

    fields.waterPrevious
      .control
      .readOnly =
        hasPreviousReading;

    if (previousReading) {
      fields.electricityPrevious
        .control
        .value =
          previousReading
            .electricityCurrent;

      fields.waterPrevious
        .control
        .value =
          previousReading
            .waterCurrent;

      previousInfo.hidden = false;

      previousInfo.textContent =
        `Đã tự lấy chỉ số tháng ${previousReading.period}: ` +
        `điện ${previousReading.electricityCurrent}, ` +
        `nước ${previousReading.waterCurrent}.`;
    } else {
      fields.electricityPrevious
        .control
        .value =
          reading
            ?.electricityPrevious ??
          0;

      fields.waterPrevious
        .control
        .value =
          reading
            ?.waterPrevious ??
          0;

      previousInfo.hidden = false;

      previousInfo.textContent =
        'Không có chỉ số tháng trước. Hãy nhập chỉ số đầu kỳ.';
    }

    if (!reading) {
      fields.electricityCurrent
        .control
        .value =
          fields.electricityPrevious
            .control
            .value;

      fields.waterCurrent
        .control
        .value =
          fields.waterPrevious
            .control
            .value;
    }

    updateUsagePreview();
  }

  function updateUsagePreview() {
    clearFieldError(
      'electricityCurrent'
    );

    clearFieldError(
      'waterCurrent'
    );

    let electricityUsage = null;
    let waterUsage = null;

    try {
      electricityUsage =
        calculateElectricUsage(
          fields.electricityPrevious
            .control
            .value,

          fields.electricityCurrent
            .control
            .value
        );

      electricityUsageValue.textContent =
        new Intl.NumberFormat(
          'vi-VN',
          {
            maximumFractionDigits: 2
          }
        ).format(electricityUsage);
    } catch (error) {
      electricityUsageValue.textContent =
        '—';

      if (
        fields.electricityCurrent
          .control
          .value !== ''
      ) {
        setFieldError(
          'electricityCurrent',

          error instanceof Error
            ? error.message
            : 'Chỉ số điện không hợp lệ.'
        );
      }
    }

    try {
      waterUsage =
        calculateWaterUsage(
          fields.waterPrevious
            .control
            .value,

          fields.waterCurrent
            .control
            .value
        );

      waterUsageValue.textContent =
        new Intl.NumberFormat(
          'vi-VN',
          {
            maximumFractionDigits: 2
          }
        ).format(waterUsage);
    } catch (error) {
      waterUsageValue.textContent =
        '—';

      if (
        fields.waterCurrent
          .control
          .value !== ''
      ) {
        setFieldError(
          'waterCurrent',

          error instanceof Error
            ? error.message
            : 'Chỉ số nước không hợp lệ.'
        );
      }
    }

    const warnings = [];

    if (
      previousReading &&
      electricityUsage !== null
    ) {
      try {
        if (
          detectAbnormalUsage(
            electricityUsage,
            previousReading
              .electricityUsage,
            ABNORMAL_USAGE_THRESHOLD_PERCENT
          )
        ) {
          warnings.push(
            `Điện tăng từ ${ABNORMAL_USAGE_THRESHOLD_PERCENT}% so với tháng trước.`
          );
        }
      } catch {
        // Không hiển thị cảnh báo nếu dữ liệu tháng trước lỗi.
      }
    }

    if (
      previousReading &&
      waterUsage !== null
    ) {
      try {
        if (
          detectAbnormalUsage(
            waterUsage,
            previousReading.waterUsage,
            ABNORMAL_USAGE_THRESHOLD_PERCENT
          )
        ) {
          warnings.push(
            `Nước tăng từ ${ABNORMAL_USAGE_THRESHOLD_PERCENT}% so với tháng trước.`
          );
        }
      } catch {
        // Không hiển thị cảnh báo nếu dữ liệu tháng trước lỗi.
      }
    }

    abnormalWarning.classList.toggle(
      'd-none',
      warnings.length === 0
    );

    abnormalWarning.textContent =
      warnings.join(' ');
  }

  function getFormData() {
    return {
      roomId:
        fields.roomId.control.value,

      period:
        fields.period.control.value,

      readingDate:
        fields.readingDate
          .control
          .value,

      electricityPrevious:
        normalizeNumericValue(
          fields.electricityPrevious
            .control
            .value
        ),

      electricityCurrent:
        normalizeNumericValue(
          fields.electricityCurrent
            .control
            .value
        ),

      waterPrevious:
        normalizeNumericValue(
          fields.waterPrevious
            .control
            .value
        ),

      waterCurrent:
        normalizeNumericValue(
          fields.waterCurrent
            .control
            .value
        ),

      note:
        fields.note.control.value
          .trim()
    };
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
        'Tháng không hợp lệ.';
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        data.readingDate
      )
    ) {
      errors.readingDate =
        'Ngày ghi chỉ số không hợp lệ.';
    }

    const numberFields = [
      [
        'electricityPrevious',
        data.electricityPrevious,
        'Chỉ số điện cũ'
      ],

      [
        'electricityCurrent',
        data.electricityCurrent,
        'Chỉ số điện mới'
      ],

      [
        'waterPrevious',
        data.waterPrevious,
        'Chỉ số nước cũ'
      ],

      [
        'waterCurrent',
        data.waterCurrent,
        'Chỉ số nước mới'
      ]
    ];

    numberFields.forEach(
      ([
        fieldName,
        value,
        label
      ]) => {
        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          errors[fieldName] =
            `${label} phải là số không âm.`;
        }
      }
    );

    if (
      !errors.electricityPrevious &&
      !errors.electricityCurrent &&
      data.electricityCurrent <
        data.electricityPrevious
    ) {
      errors.electricityCurrent =
        'Chỉ số điện mới không được nhỏ hơn chỉ số điện cũ.';
    }

    if (
      !errors.waterPrevious &&
      !errors.waterCurrent &&
      data.waterCurrent <
        data.waterPrevious
    ) {
      errors.waterCurrent =
        'Chỉ số nước mới không được nhỏ hơn chỉ số nước cũ.';
    }

    return {
      data,
      errors,

      isValid:
        Object.keys(errors).length ===
        0
    };
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
        : 'Lưu chỉ số';
  }

  function open({
    mode: nextMode = 'create',
    month,
    rooms = [],
    selectedRoomId = '',
    reading = null
  } = {}) {
    if (
      nextMode !== 'create' &&
      nextMode !== 'edit'
    ) {
      throw new Error(
        'Chế độ form chỉ số không hợp lệ.'
      );
    }

    if (!Array.isArray(rooms)) {
      throw new TypeError(
        'Danh sách phòng phải là một mảng.'
      );
    }

    if (
      nextMode === 'edit' &&
      !reading?.id
    ) {
      throw new Error(
        'Không có bản ghi cần sửa.'
      );
    }

    mode = nextMode;

    currentReadingId =
      reading?.id ?? null;

    currentMonth =
      reading?.period ??
      month ??
      '';

    availableRooms = [...rooms];

    const roomId =
      reading?.roomId ??
      selectedRoomId ??
      '';

    modalTitle.textContent =
      nextMode === 'edit'
        ? 'Sửa chỉ số điện nước'
        : 'Ghi chỉ số điện nước';

    populateRoomOptions(roomId);

    fields.roomId.control.disabled =
      nextMode === 'edit';

    fields.period.control.value =
      currentMonth;

    const today =
      getCurrentDateInVietnam();

    fields.readingDate.control.value =
      reading?.readingDate ??
      (
        today.startsWith(
          currentMonth
        )
          ? today
          : getLastDayOfMonth(
              currentMonth
            )
      );

    fields.electricityCurrent
      .control
      .value =
        reading?.electricityCurrent ??
        '';

    fields.waterCurrent
      .control
      .value =
        reading?.waterCurrent ??
        '';

    fields.note.control.value =
      reading?.note ?? '';

    clearErrors();

    loadPreviousReading(
      roomId,
      reading
    );

    if (reading) {
      fields.electricityCurrent
        .control
        .value =
          reading.electricityCurrent;

      fields.waterCurrent
        .control
        .value =
          reading.waterCurrent;

      updateUsagePreview();
    }

    setSubmitting(false);

    getModal().show();

    window.setTimeout(() => {
      if (
        nextMode === 'create' &&
        !roomId
      ) {
        fields.roomId.control.focus();
      } else {
        fields.electricityCurrent
          .control
          .focus();
      }
    }, 150);
  }

  function close() {
    getModal().hide();
  }

  fields.roomId.control.addEventListener(
    'change',
    () => {
      clearFieldError('roomId');

      loadPreviousReading(
        fields.roomId.control.value
      );
    }
  );

  [
    'electricityPrevious',
    'electricityCurrent',
    'waterPrevious',
    'waterCurrent'
  ].forEach((fieldName) => {
    fields[
      fieldName
    ].control.addEventListener(
      'input',
      updateUsagePreview
    );
  });

  fields.readingDate
    .control
    .addEventListener(
      'input',
      () => {
        clearFieldError(
          'readingDate'
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

            readingId:
              currentReadingId
          }
        );

        close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể lưu chỉ số.';

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
      currentReadingId = null;
      currentMonth = '';
      availableRooms = [];
      previousReading = null;
      hasPreviousReading = false;

      fields.roomId.control.disabled =
        false;

      fields.electricityPrevious
        .control
        .readOnly = false;

      fields.waterPrevious
        .control
        .readOnly = false;

      abnormalWarning.classList.add(
        'd-none'
      );

      previousInfo.hidden = true;

      clearErrors();
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createMeterReadingForm;