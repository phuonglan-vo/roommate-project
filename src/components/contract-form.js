import {
  CONTRACT_STATUS
} from '../constants/statuses.js';

import {
  compareIsoDates,
  isValidIsoDate
} from '../utils/date-utils.js';

const CONTRACT_FORM_MODAL_ID =
  'contractFormModal';

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

  Object.entries(attributes).forEach(
    ([name, value]) => {
      if (value !== null && value !== undefined) {
        element.setAttribute(name, String(value));
      }
    }
  );

  Object.entries(dataset).forEach(
    ([name, value]) => {
      element.dataset[name] = String(value);
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
  max,
  step,
  placeholder = '',
  testId,
  columnClass = 'col-12 col-md-6'
}) {
  const id = `contract-${name}`;

  const labelElement = createElement('label', {
    className: 'form-label',
    text: label,
    attributes: {
      for: id
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

  const control = createElement('input', {
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
      [labelElement, control, feedback]
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
  const id = `contract-${name}`;

  const labelElement = createElement('label', {
    className: 'form-label',
    text: label,
    attributes: {
      for: id
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

  const control = createElement('select', {
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
      [labelElement, control, feedback]
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
  const id = `contract-${name}`;

  const control = createElement('textarea', {
    className: 'form-control',
    attributes: {
      id,
      name,
      rows: '3',
      maxlength: '2000'
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

function mapServiceError(message) {
  const normalizedMessage =
    String(message ?? '')
      .toLocaleLowerCase('vi-VN');

  if (
    normalizedMessage.includes(
      'mã hợp đồng'
    )
  ) {
    return 'code';
  }

  if (
    normalizedMessage.includes(
      'trùng thời gian'
    ) ||
    normalizedMessage.includes(
      'ngày kết thúc'
    )
  ) {
    return 'endDate';
  }

  if (
    normalizedMessage.includes(
      'vượt quá sức chứa'
    ) ||
    normalizedMessage.includes(
      'số người thuê'
    )
  ) {
    return 'tenantIds';
  }

  if (
    normalizedMessage.includes('phòng') &&
    (
      normalizedMessage.includes(
        'sửa chữa'
      ) ||
      normalizedMessage.includes(
        'tạm ngưng'
      ) ||
      normalizedMessage.includes(
        'không thể'
      )
    )
  ) {
    return 'roomId';
  }

  if (
    normalizedMessage.includes(
      'người đại diện'
    )
  ) {
    return 'representativeTenantId';
  }

  if (
    normalizedMessage.includes('giá thuê')
  ) {
    return 'rentAmount';
  }

  if (
    normalizedMessage.includes('tiền cọc')
  ) {
    return 'depositAmount';
  }

  return null;
}

export function createContractForm({
  onSubmit
} = {}) {
  if (typeof onSubmit !== 'function') {
    throw new TypeError(
      'ContractForm cần hàm onSubmit.'
    );
  }

  let mode = 'create';
  let currentContractId = null;
  let currentContractStatus =
    CONTRACT_STATUS.DRAFT;

  let availableRooms = [];
  let availableTenants = [];
  let selectedTenantIds = new Set();
  let isSubmitting = false;

  const fields = {
    code: createInputField({
      name: 'code',
      label: 'Mã hợp đồng',
      required: true,
      placeholder: 'Ví dụ: HD-P101-2026-01',
      testId: 'contract-form-code'
    }),

    roomId: createSelectField({
      name: 'roomId',
      label: 'Phòng',
      required: true,
      testId: 'contract-form-room'
    }),

    representativeTenantId:
      createSelectField({
        name: 'representativeTenantId',
        label: 'Người đại diện',
        required: true,
        testId:
          'contract-form-representative'
      }),

    signedDate: createInputField({
      name: 'signedDate',
      label: 'Ngày ký',
      type: 'date',
      testId: 'contract-form-signed-date'
    }),

    startDate: createInputField({
      name: 'startDate',
      label: 'Ngày bắt đầu',
      type: 'date',
      required: true,
      testId: 'contract-form-start-date'
    }),

    endDate: createInputField({
      name: 'endDate',
      label: 'Ngày kết thúc',
      type: 'date',
      required: true,
      testId: 'contract-form-end-date'
    }),

    rentAmount: createInputField({
      name: 'rentAmount',
      label: 'Giá thuê',
      type: 'number',
      required: true,
      min: '0',
      step: '1000',
      testId: 'contract-form-rent'
    }),

    depositAmount: createInputField({
      name: 'depositAmount',
      label: 'Tiền cọc',
      type: 'number',
      required: true,
      min: '0',
      step: '1000',
      testId: 'contract-form-deposit'
    }),

    dueDay: createInputField({
      name: 'dueDay',
      label: 'Ngày thanh toán hằng tháng',
      type: 'number',
      min: '1',
      max: '31',
      step: '1',
      testId: 'contract-form-due-day'
    }),

    terms: createTextareaField({
      name: 'terms',
      label: 'Điều khoản',
      testId: 'contract-form-terms'
    }),

    note: createTextareaField({
      name: 'note',
      label: 'Ghi chú',
      testId: 'contract-form-note'
    })
  };

  const modalTitle = createElement('h2', {
    className: 'modal-title fs-5',
    text: 'Thêm hợp đồng',
    attributes: {
      id: 'contractFormTitle'
    },
    dataset: {
      testid: 'contract-form-title'
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
    className: 'alert alert-danger d-none',
    attributes: {
      role: 'alert'
    },
    dataset: {
      testid: 'contract-form-general-error'
    }
  });

  const roommateContainer = createElement('div', {
    className:
      'rm-contract-roommate-options',
    dataset: {
      testid:
        'contract-form-roommate-options'
    }
  });

  const roommateFeedback = createElement('div', {
    className:
      'invalid-feedback d-block',
    dataset: {
      testid:
        'contract-form-roommate-error'
    }
  });

  const occupancyInfo = createElement('div', {
    className:
      'form-text rm-contract-occupancy-info',
    dataset: {
      testid:
        'contract-form-occupancy-info'
    }
  });

  const roommateSection = createElement(
    'div',
    {
      className: 'col-12'
    },
    [
      createElement('div', {
        className: 'form-label',
        text: 'Người ở cùng'
      }),
      roommateContainer,
      roommateFeedback,
      occupancyInfo
    ]
  );

  const formGrid = createElement(
    'div',
    {
      className: 'row g-3'
    },
    [
      fields.code.wrapper,
      fields.roomId.wrapper,
      fields.representativeTenantId.wrapper,
      fields.signedDate.wrapper,
      fields.startDate.wrapper,
      fields.endDate.wrapper,
      fields.rentAmount.wrapper,
      fields.depositAmount.wrapper,
      fields.dueDay.wrapper,
      roommateSection,
      fields.terms.wrapper,
      fields.note.wrapper
    ]
  );

  const submitButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Tạo hợp đồng',
    attributes: {
      type: 'submit'
    },
    dataset: {
      testid: 'contract-form-submit'
    }
  });

  const cancelButton = createElement('button', {
    className: 'btn btn-outline-secondary',
    text: 'Hủy',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal'
    },
    dataset: {
      testid: 'contract-form-cancel'
    }
  });

  const form = createElement(
    'form',
    {
      className: 'modal-content',
      attributes: {
        novalidate: ''
      },
      dataset: {
        testid: 'contract-form'
      }
    },
    [
      createElement(
        'div',
        {
          className: 'modal-header'
        },
        [modalTitle, closeButton]
      ),
      createElement(
        'div',
        {
          className: 'modal-body'
        },
        [generalError, formGrid]
      ),
      createElement(
        'div',
        {
          className: 'modal-footer'
        },
        [cancelButton, submitButton]
      )
    ]
  );

  const element = createElement(
    'div',
    {
      className:
        'modal fade rm-contract-form-modal',
      attributes: {
        id: CONTRACT_FORM_MODAL_ID,
        tabindex: '-1',
        'aria-labelledby':
          'contractFormTitle',
        'aria-hidden': 'true'
      },
      dataset: {
        testid: 'contract-form-modal'
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

  function getSelectedRoom() {
    return availableRooms.find(
      (room) =>
        room.id === fields.roomId.control.value
    ) ?? null;
  }

  function clearFieldError(fieldName) {
    if (fieldName === 'tenantIds') {
      roommateContainer.classList.remove(
        'is-invalid'
      );

      roommateFeedback.textContent = '';
      return;
    }

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
    if (fieldName === 'tenantIds') {
      roommateContainer.classList.add(
        'is-invalid'
      );

      roommateFeedback.textContent = message;
      return;
    }

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

    field.feedback.textContent = message;
  }

  function clearErrors() {
    Object.keys(fields).forEach(
      clearFieldError
    );

    clearFieldError('tenantIds');

    generalError.textContent = '';
    generalError.classList.add('d-none');
  }

  function showGeneralError(message) {
    generalError.textContent = message;
    generalError.classList.remove('d-none');
  }

  function populateRoomOptions(
    selectedRoomId = ''
  ) {
    fields.roomId.control.replaceChildren(
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
            `${room.code} — ${room.name} ` +
            `(tối đa ${room.maxOccupants} người)`,
          attributes: {
            value: room.id
          }
        })
      );
    });

    fields.roomId.control.value =
      selectedRoomId;
  }

  function populateRepresentativeOptions(
    selectedRepresentativeId = ''
  ) {
    fields.representativeTenantId
      .control
      .replaceChildren(
        createElement('option', {
          text: 'Chọn người đại diện',
          attributes: {
            value: ''
          }
        })
      );

    availableTenants.forEach((tenant) => {
      fields.representativeTenantId
        .control
        .append(
          createElement('option', {
            text:
              `${tenant.fullName} — ${tenant.phone}`,
            attributes: {
              value: tenant.id
            }
          })
        );
    });

    fields.representativeTenantId
      .control
      .value = selectedRepresentativeId;
  }

  function updateOccupancyInfo() {
    const room = getSelectedRoom();

    const representativeId =
      fields.representativeTenantId
        .control
        .value;

    const occupantIds = new Set(
      selectedTenantIds
    );

    if (representativeId) {
      occupantIds.add(representativeId);
    }

    if (!room) {
      occupancyInfo.textContent =
        'Chọn phòng để xem sức chứa.';
      return;
    }

    occupancyInfo.textContent =
      `Đã chọn ${occupantIds.size}/${room.maxOccupants} người.`;
  }

  function renderRoommates() {
    const representativeId =
      fields.representativeTenantId
        .control
        .value;

    roommateContainer.replaceChildren();

    const roommateTenants =
      availableTenants.filter(
        (tenant) =>
          tenant.id !== representativeId
      );

    if (roommateTenants.length === 0) {
      roommateContainer.append(
        createElement('p', {
          className:
            'mb-0 text-body-secondary small',
          text:
            'Không có người thuê khác để chọn.'
        })
      );

      updateOccupancyInfo();
      return;
    }

    roommateTenants.forEach((tenant) => {
      const inputId =
        `contract-roommate-${tenant.id}`;

      const checkbox = createElement('input', {
        className: 'form-check-input',
        attributes: {
          id: inputId,
          type: 'checkbox',
          value: tenant.id
        },
        dataset: {
          tenantId: tenant.id,
          testid:
            `contract-form-roommate-${tenant.id}`
        }
      });

      checkbox.checked =
        selectedTenantIds.has(tenant.id);

      checkbox.addEventListener(
        'change',
        () => {
          clearFieldError('tenantIds');

          if (checkbox.checked) {
            selectedTenantIds.add(
              tenant.id
            );
          } else {
            selectedTenantIds.delete(
              tenant.id
            );
          }

          updateOccupancyInfo();
        }
      );

      roommateContainer.append(
        createElement(
          'div',
          {
            className:
              'form-check rm-contract-roommate-option'
          },
          [
            checkbox,
            createElement('label', {
              className: 'form-check-label',
              text:
                `${tenant.fullName} — ${tenant.phone}`,
              attributes: {
                for: inputId
              }
            })
          ]
        )
      );
    });

    updateOccupancyInfo();
  }

  function getFormData() {
    const representativeTenantId =
      fields.representativeTenantId
        .control
        .value;

    const tenantIds = [
      ...new Set([
        representativeTenantId,
        ...selectedTenantIds
      ])
    ].filter(Boolean);

    return {
      code:
        fields.code.control.value
          .trim()
          .toUpperCase(),

      roomId:
        fields.roomId.control.value,

      tenantIds,

      representativeTenantId,

      signedDate:
        fields.signedDate.control.value,

      startDate:
        fields.startDate.control.value,

      endDate:
        fields.endDate.control.value,

      rentAmount:
        Number(
          fields.rentAmount.control.value
        ),

      depositAmount:
        Number(
          fields.depositAmount.control.value
        ),

      billingCycle: 'monthly',

      dueDay:
        fields.dueDay.control.value
          ? Number(
              fields.dueDay.control.value
            )
          : 10,

      status: currentContractStatus,

      terms:
        fields.terms.control.value.trim(),

      note:
        fields.note.control.value.trim()
    };
  }

  function validate() {
    const data = getFormData();
    const errors = {};

    if (!data.code) {
      errors.code =
        'Mã hợp đồng không được để trống.';
    }

    if (!data.roomId) {
      errors.roomId =
        'Vui lòng chọn phòng.';
    }

    if (!data.representativeTenantId) {
      errors.representativeTenantId =
        'Vui lòng chọn người đại diện.';
    }

    if (!isValidIsoDate(data.startDate)) {
      errors.startDate =
        'Vui lòng chọn ngày bắt đầu hợp lệ.';
    }

    if (!isValidIsoDate(data.endDate)) {
      errors.endDate =
        'Vui lòng chọn ngày kết thúc hợp lệ.';
    }

    if (
      !errors.startDate &&
      !errors.endDate &&
      compareIsoDates(
        data.endDate,
        data.startDate
      ) <= 0
    ) {
      errors.endDate =
        'Ngày kết thúc phải sau ngày bắt đầu.';
    }

    if (
      !Number.isFinite(data.rentAmount) ||
      data.rentAmount < 0
    ) {
      errors.rentAmount =
        'Giá thuê phải là số không âm.';
    }

    if (
      !Number.isFinite(
        data.depositAmount
      ) ||
      data.depositAmount < 0
    ) {
      errors.depositAmount =
        'Tiền cọc phải là số không âm.';
    }

    if (
      !Number.isInteger(data.dueDay) ||
      data.dueDay < 1 ||
      data.dueDay > 31
    ) {
      errors.dueDay =
        'Ngày thanh toán phải từ 1 đến 31.';
    }

    const room = getSelectedRoom();

    if (
      room &&
      data.tenantIds.length >
        room.maxOccupants
    ) {
      errors.tenantIds =
        `Số người thuê (${data.tenantIds.length}) vượt quá sức chứa phòng (${room.maxOccupants}).`;
    }

    return {
      data,
      errors,
      isValid:
        Object.keys(errors).length === 0
    };
  }

  function populateForm(contract = null) {
    const values = contract ?? {
      code: '',
      roomId: '',
      tenantIds: [],
      representativeTenantId: '',
      signedDate: '',
      startDate: '',
      endDate: '',
      rentAmount: '',
      depositAmount: 0,
      dueDay: 10,
      terms: '',
      note: ''
    };

    selectedTenantIds = new Set(
      (values.tenantIds ?? []).filter(
        (tenantId) =>
          tenantId !==
          values.representativeTenantId
      )
    );

    populateRoomOptions(values.roomId);

    populateRepresentativeOptions(
      values.representativeTenantId
    );

    fields.code.control.value =
      values.code ?? '';

    fields.signedDate.control.value =
      values.signedDate ?? '';

    fields.startDate.control.value =
      values.startDate ?? '';

    fields.endDate.control.value =
      values.endDate ?? '';

    fields.rentAmount.control.value =
      values.rentAmount ?? '';

    fields.depositAmount.control.value =
      values.depositAmount ?? 0;

    fields.dueDay.control.value =
      values.dueDay ?? 10;

    fields.terms.control.value =
      values.terms ?? '';

    fields.note.control.value =
      values.note ?? '';

    renderRoommates();
  }

  function setSubmitting(submitting) {
    isSubmitting = submitting;

    submitButton.disabled = submitting;
    cancelButton.disabled = submitting;
    closeButton.disabled = submitting;

    if (submitting) {
      submitButton.textContent =
        'Đang lưu...';
      return;
    }

    submitButton.textContent =
      mode === 'edit'
        ? 'Lưu thay đổi'
        : 'Tạo hợp đồng';
  }

  function open({
    mode: nextMode = 'create',
    contract = null,
    rooms = [],
    tenants = []
  } = {}) {
    if (
      nextMode !== 'create' &&
      nextMode !== 'edit'
    ) {
      throw new Error(
        'Chế độ form hợp đồng không hợp lệ.'
      );
    }

    if (!Array.isArray(rooms)) {
      throw new TypeError(
        'Danh sách phòng phải là một mảng.'
      );
    }

    if (!Array.isArray(tenants)) {
      throw new TypeError(
        'Danh sách người thuê phải là một mảng.'
      );
    }

    if (
      nextMode === 'edit' &&
      (
        !contract ||
        contract.status !==
          CONTRACT_STATUS.DRAFT
      )
    ) {
      throw new Error(
        'Chỉ hợp đồng nháp mới được sửa.'
      );
    }

    mode = nextMode;
    currentContractId =
      contract?.id ?? null;

    currentContractStatus =
      contract?.status ??
      CONTRACT_STATUS.DRAFT;

    availableRooms = [...rooms];
    availableTenants = [...tenants];

    modalTitle.textContent =
      nextMode === 'edit'
        ? `Sửa ${
            contract.code ?? contract.id
          }`
        : 'Thêm hợp đồng';

    populateForm(contract);
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

  fields.roomId.control.addEventListener(
    'change',
    () => {
      clearFieldError('roomId');
      clearFieldError('tenantIds');

      const room = getSelectedRoom();

      if (
        mode === 'create' &&
        room
      ) {
        fields.rentAmount.control.value =
          room.monthlyRent;
      }

      updateOccupancyInfo();
    }
  );

  fields.representativeTenantId
    .control
    .addEventListener(
      'change',
      () => {
        clearFieldError(
          'representativeTenantId'
        );

        const representativeId =
          fields.representativeTenantId
            .control
            .value;

        selectedTenantIds.delete(
          representativeId
        );

        renderRoommates();
      }
    );

  Object.entries(fields).forEach(
    ([fieldName, field]) => {
      if (
        fieldName === 'roomId' ||
        fieldName ===
          'representativeTenantId'
      ) {
        return;
      }

      const eventName =
        field.control.tagName === 'SELECT'
          ? 'change'
          : 'input';

      field.control.addEventListener(
        eventName,
        () => {
          clearFieldError(fieldName);
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

      const validationResult = validate();

      if (!validationResult.isValid) {
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

        if (firstField === 'tenantIds') {
          roommateContainer
            .querySelector('input')
            ?.focus();
        } else {
          fields[
            firstField
          ]?.control.focus();
        }

        return;
      }

      setSubmitting(true);

      try {
        await onSubmit(
          validationResult.data,
          {
            mode,
            contractId:
              currentContractId
          }
        );

        close();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể lưu hợp đồng.';

        const fieldName =
          mapServiceError(message);

        if (fieldName) {
          setFieldError(
            fieldName,
            message
          );

          if (
            fieldName === 'tenantIds'
          ) {
            roommateContainer
              .querySelector('input')
              ?.focus();
          } else {
            fields[
              fieldName
            ]?.control.focus();
          }
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
      currentContractId = null;
      currentContractStatus =
        CONTRACT_STATUS.DRAFT;
      availableRooms = [];
      availableTenants = [];
      selectedTenantIds = new Set();
      clearErrors();
    }
  );

  return Object.freeze({
    element,
    open,
    close
  });
}

export default createContractForm;