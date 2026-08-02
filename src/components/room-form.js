import {
  ROOM_STATUS,
  ROOM_STATUS_LABELS
} from '../constants/statuses.js';

const ROOM_FORM_MODAL_ID = 'roomFormModal';

const ROOM_TYPE_OPTIONS = Object.freeze([
  {
    value: 'standard',
    label: 'Tiêu chuẩn'
  },
  {
    value: 'large',
    label: 'Phòng lớn'
  },
  {
    value: 'premium',
    label: 'Cao cấp'
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
  step,
  min,
  testId
}) {
  const inputId = `room-${name}`;

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
      step,
      min,
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

  const wrapper = createElement(
    'div',
    {
      className: 'col-12 col-md-6'
    },
    [labelElement, input, feedback]
  );

  return {
    wrapper,
    control: input,
    feedback
  };
}

function createSelectField({
  name,
  label,
  options,
  testId
}) {
  const selectId = `room-${name}`;

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

  const wrapper = createElement(
    'div',
    {
      className: 'col-12 col-md-6'
    },
    [labelElement, select, feedback]
  );

  return {
    wrapper,
    control: select,
    feedback
  };
}

function createTextareaField({
  name,
  label,
  testId
}) {
  const textareaId = `room-${name}`;

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

  const wrapper = createElement(
    'div',
    {
      className: 'col-12'
    },
    [labelElement, textarea, feedback]
  );

  return {
    wrapper,
    control: textarea,
    feedback
  };
}

function parseOptionalNumber(value) {
  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    return null;
  }

  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

function mapServiceErrorToField(message) {
  const normalizedMessage =
    String(message ?? '').toLocaleLowerCase('vi-VN');

  if (normalizedMessage.includes('mã phòng')) {
    return 'code';
  }

  if (normalizedMessage.includes('tên phòng')) {
    return 'name';
  }

  if (normalizedMessage.includes('giá thuê')) {
    return 'monthlyRent';
  }

  if (
    normalizedMessage.includes('số người tối đa') ||
    normalizedMessage.includes('sức chứa')
  ) {
    return 'maxOccupants';
  }

  if (normalizedMessage.includes('diện tích')) {
    return 'areaM2';
  }

  if (normalizedMessage.includes('tầng')) {
    return 'floor';
  }

  if (normalizedMessage.includes('trạng thái')) {
    return 'status';
  }

  return null;
}

export function createRoomForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'RoomForm cần hàm onSubmit.'
    );
  }

  let mode = 'create';
  let currentRoomId = null;
  let isSubmitting = false;

  const fields = {
    code: createInputField({
      name: 'code',
      label: 'Mã phòng',
      required: true,
      placeholder: 'Ví dụ: P101',
      testId: 'room-form-code'
    }),

    name: createInputField({
      name: 'name',
      label: 'Tên phòng',
      required: true,
      placeholder: 'Ví dụ: Phòng 101',
      testId: 'room-form-name'
    }),

    area: createInputField({
      name: 'area',
      label: 'Khu vực',
      placeholder: 'Ví dụ: Dãy A',
      testId: 'room-form-area'
    }),

    floor: createInputField({
      name: 'floor',
      label: 'Tầng',
      type: 'number',
      min: '0',
      step: '1',
      testId: 'room-form-floor'
    }),

    roomType: createSelectField({
      name: 'roomType',
      label: 'Loại phòng',
      options: ROOM_TYPE_OPTIONS,
      testId: 'room-form-type'
    }),

    areaM2: createInputField({
      name: 'areaM2',
      label: 'Diện tích (m²)',
      type: 'number',
      min: '0',
      step: '0.1',
      testId: 'room-form-area-m2'
    }),

    monthlyRent: createInputField({
      name: 'monthlyRent',
      label: 'Giá thuê',
      type: 'number',
      required: true,
      min: '0',
      step: '1000',
      testId: 'room-form-rent'
    }),

    maxOccupants: createInputField({
      name: 'maxOccupants',
      label: 'Số người tối đa',
      type: 'number',
      required: true,
      min: '1',
      step: '1',
      testId: 'room-form-max-occupants'
    }),

    status: createSelectField({
      name: 'status',
      label: 'Trạng thái',
      options: Object.values(ROOM_STATUS).map(
        (status) => ({
          value: status,
          label: ROOM_STATUS_LABELS[status]
        })
      ),
      testId: 'room-form-status'
    }),

    description: createTextareaField({
      name: 'description',
      label: 'Mô tả',
      testId: 'room-form-description'
    })
  };

  const modalTitle = createElement('h2', {
    className: 'modal-title fs-5',
    text: 'Thêm phòng',
    attributes: {
      id: 'roomFormTitle'
    },
    dataset: {
      testid: 'room-form-title'
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
      testid: 'room-form-general-error'
    }
  });

  const formGrid = createElement(
    'div',
    {
      className: 'row g-3'
    },
    [
      fields.code.wrapper,
      fields.name.wrapper,
      fields.area.wrapper,
      fields.floor.wrapper,
      fields.roomType.wrapper,
      fields.areaM2.wrapper,
      fields.monthlyRent.wrapper,
      fields.maxOccupants.wrapper,
      fields.status.wrapper,
      fields.description.wrapper
    ]
  );

  const modalBody = createElement(
    'div',
    {
      className: 'modal-body'
    },
    [generalError, formGrid]
  );

  const cancelButton = createElement('button', {
    className: 'btn btn-outline-secondary',
    text: 'Hủy',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal'
    },
    dataset: {
      testid: 'room-form-cancel'
    }
  });

  const submitButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm phòng',
    attributes: {
      type: 'submit'
    },
    dataset: {
      testid: 'room-form-submit'
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
        testid: 'room-form'
      }
    },
    [modalHeader, modalBody, modalFooter]
  );

  const modalDialog = createElement(
    'div',
    {
      className:
        'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'
    },
    [form]
  );

  const element = createElement(
    'div',
    {
      className: 'modal fade rm-room-form-modal',
      attributes: {
        id: ROOM_FORM_MODAL_ID,
        tabindex: '-1',
        'aria-labelledby': 'roomFormTitle',
        'aria-hidden': 'true'
      },
      dataset: {
        testid: 'room-form-modal'
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
      code: fields.code.control.value.trim(),
      name: fields.name.control.value.trim(),
      area: fields.area.control.value.trim(),
      floor: parseOptionalNumber(
        fields.floor.control.value
      ),
      roomType: fields.roomType.control.value,
      areaM2: parseOptionalNumber(
        fields.areaM2.control.value
      ),
      monthlyRent: Number(
        fields.monthlyRent.control.value
      ),
      maxOccupants: Number(
        fields.maxOccupants.control.value
      ),
      status: fields.status.control.value,
      description:
        fields.description.control.value.trim()
    };
  }

  function validate() {
    const errors = {};
    const data = getFormData();

    if (!data.code) {
      errors.code = 'Mã phòng không được để trống.';
    }

    if (!data.name) {
      errors.name = 'Tên phòng không được để trống.';
    }

    if (
      !Number.isFinite(data.monthlyRent) ||
      data.monthlyRent < 0
    ) {
      errors.monthlyRent =
        'Giá thuê phải là số không âm.';
    }

    if (
      !Number.isInteger(data.maxOccupants) ||
      data.maxOccupants <= 0
    ) {
      errors.maxOccupants =
        'Số người tối đa phải là số nguyên lớn hơn 0.';
    }

    if (
      data.floor !== null &&
      (
        !Number.isInteger(data.floor) ||
        data.floor < 0
      )
    ) {
      errors.floor =
        'Tầng phải là số nguyên không âm.';
    }

    if (
      data.areaM2 !== null &&
      data.areaM2 <= 0
    ) {
      errors.areaM2 =
        'Diện tích phải lớn hơn 0.';
    }

    if (
      !Object.values(ROOM_STATUS).includes(
        data.status
      )
    ) {
      errors.status =
        'Trạng thái phòng không hợp lệ.';
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
        : 'Thêm phòng';
  }

  function populateForm(room = null) {
    const values = room ?? {
      code: '',
      name: '',
      area: '',
      floor: null,
      roomType: 'standard',
      areaM2: null,
      monthlyRent: 0,
      maxOccupants: 1,
      status: ROOM_STATUS.VACANT,
      description: ''
    };

    fields.code.control.value =
      values.code ?? '';

    fields.name.control.value =
      values.name ?? '';

    fields.area.control.value =
      values.area ?? '';

    fields.floor.control.value =
      values.floor ?? '';

    fields.roomType.control.value =
      values.roomType ?? 'standard';

    fields.areaM2.control.value =
      values.areaM2 ?? '';

    fields.monthlyRent.control.value =
      values.monthlyRent ?? 0;

    fields.maxOccupants.control.value =
      values.maxOccupants ?? 1;

    fields.status.control.value =
      values.status ?? ROOM_STATUS.VACANT;

    fields.description.control.value =
      values.description ?? '';
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
    room = null
  } = {}) {
    if (
      nextMode !== 'create' &&
      nextMode !== 'edit'
    ) {
      throw new Error(
        'Chế độ form phòng không hợp lệ.'
      );
    }

    mode = nextMode;
    currentRoomId =
      nextMode === 'edit'
        ? room?.id ?? null
        : null;

    if (
      nextMode === 'edit' &&
      !currentRoomId
    ) {
      throw new Error(
        'Không có thông tin phòng cần sửa.'
      );
    }

    modalTitle.textContent =
      nextMode === 'edit'
        ? `Sửa phòng ${room.code}`
        : 'Thêm phòng';

    populateForm(room);
    clearErrors();
    setSubmitting(false);

    getModalInstance().show();

    window.setTimeout(() => {
      fields.code.control.focus();
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

  form.addEventListener('submit', async (event) => {
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
          roomId: currentRoomId
        }
      );

      close();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể lưu thông tin phòng.';

      const fieldName =
        mapServiceErrorToField(message);

      if (fieldName) {
        setFieldError(fieldName, message);
        fields[fieldName].control.focus();
      } else {
        showGeneralError(message);
      }
    } finally {
      setSubmitting(false);
    }
  });

  element.addEventListener(
    'hidden.bs.modal',
    () => {
      clearErrors();
      currentRoomId = null;
      mode = 'create';
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createRoomForm;