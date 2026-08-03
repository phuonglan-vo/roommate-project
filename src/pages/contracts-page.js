import '../styles/contracts.css';

import contractService from '../services/contract-service.js';
import roomService from '../services/room-service.js';
import tenantService from '../services/tenant-service.js';

import { createContractForm } from '../components/contract-form.js';
import { createContractDetail } from '../components/contract-detail.js';
import { showToast } from '../components/toast.js';
import { showConfirmDialog } from '../components/confirm-dialog.js';

import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS
} from '../constants/statuses.js';

import {
  compareIsoDates,
  formatDateForDisplay,
  isValidIsoDate
} from '../utils/date-utils.js';

import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

const EXPIRING_WARNING_DAYS = 30;

const STATUS_BADGE_CLASSES = Object.freeze({
  [CONTRACT_STATUS.DRAFT]:
    'rm-contract-badge--draft',
  [CONTRACT_STATUS.ACTIVE]:
    'rm-contract-badge--active',
  [CONTRACT_STATUS.ENDED]:
    'rm-contract-badge--ended',
  [CONTRACT_STATUS.CANCELLED]:
    'rm-contract-badge--cancelled'
});

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

function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
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
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateValue, days) {
  if (!isValidIsoDate(dateValue)) {
    return '';
  }

  const [year, month, day] = dateValue
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) {
    return '—';
  }

  try {
    return formatDateForDisplay(value);
  } catch {
    return value;
  }
}

function createStatusBadge(status) {
  return createElement('span', {
    className:
      `rm-contract-badge ${STATUS_BADGE_CLASSES[status] ??
      STATUS_BADGE_CLASSES[
      CONTRACT_STATUS.DRAFT
      ]
      }`,
    text:
      CONTRACT_STATUS_LABELS[status] ??
      status ??
      'Không xác định',
    dataset: {
      testid: 'contract-status-badge',
      status
    }
  });
}

function createTableCell(
  label,
  content,
  className = ''
) {
  const cell = createElement('td', {
    className,
    attributes: {
      'data-label': label
    }
  });

  if (
    content instanceof HTMLElement ||
    content instanceof DocumentFragment
  ) {
    cell.append(content);
  } else {
    cell.textContent = String(content ?? '');
  }

  return cell;
}

function createActionButton({
  action,
  contract,
  label,
  className
}) {
  const TEST_IDS = {
    view: 'contract-view-button',
    edit: 'contract-edit-button',
    activate: 'contract-activate-button',
    extend: 'contract-extend-button',
    end: 'contract-end-button',
    cancel: 'contract-cancel-button'
  };

  return createElement('button', {
    className,
    text: label,
    attributes: {
      type: 'button',
      'aria-label':
        `${label} hợp đồng ${contract.code ?? contract.id}`
    },
    dataset: {
      action,
      contractId: contract.id,
      testid: TEST_IDS[action]
    }
  });
}

function createDateActionDialog() {
  let pendingResolver = null;
  let submitted = false;
  let validator = null;

  const title = createElement('h2', {
    className: 'modal-title fs-5',
    text: 'Chọn ngày',
    attributes: {
      id: 'contractDateActionTitle'
    },
    dataset: {
      testid: 'contract-date-dialog-title'
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
      testid: 'contract-date-dialog-close'
    }
  });

  const label = createElement('label', {
    className: 'form-label',
    text: 'Ngày',
    attributes: {
      for: 'contractDateActionInput'
    }
  });

  const input = createElement('input', {
    className: 'form-control',
    attributes: {
      id: 'contractDateActionInput',
      type: 'date',
      required: ''
    },
    dataset: {
      testid: 'contract-date-dialog-input'
    }
  });

  const feedback = createElement('div', {
    className: 'invalid-feedback',
    dataset: {
      testid: 'contract-date-dialog-error'
    }
  });

  const form = createElement(
    'form',
    {
      className: 'modal-content',
      attributes: {
        novalidate: ''
      }
    },
    [
      createElement(
        'div',
        {
          className: 'modal-header'
        },
        [title, closeButton]
      ),
      createElement(
        'div',
        {
          className: 'modal-body'
        },
        [label, input, feedback]
      ),
      createElement(
        'div',
        {
          className: 'modal-footer'
        },
        [
          createElement('button', {
            className: 'btn btn-outline-secondary',
            text: 'Hủy',
            attributes: {
              type: 'button',
              'data-bs-dismiss': 'modal'
            },
            dataset: {
              testid: 'contract-date-dialog-cancel'
            }
          }),
          createElement('button', {
            className: 'btn btn-primary',
            text: 'Xác nhận',
            attributes: {
              type: 'submit'
            },
            dataset: {
              testid:
                'contract-date-dialog-submit'
            }
          })
        ]
      )
    ]
  );

  const element = createElement(
    'div',
    {
      className: 'modal fade',
      attributes: {
        id: 'contractDateActionModal',
        tabindex: '-1',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby':
          'contractDateActionTitle',
        'aria-hidden': 'true'
      },
      dataset: {
        testid: 'contract-date-dialog'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'modal-dialog modal-dialog-centered'
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

  function clearError() {
    input.classList.remove('is-invalid');
    feedback.textContent = '';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearError();

    const value = input.value;

    if (!isValidIsoDate(value)) {
      input.classList.add('is-invalid');
      feedback.textContent =
        'Vui lòng chọn ngày hợp lệ.';
      input.focus();
      return;
    }

    if (typeof validator === 'function') {
      const validationResult = validator(value);

      if (validationResult !== true) {
        input.classList.add('is-invalid');
        feedback.textContent =
          typeof validationResult === 'string'
            ? validationResult
            : 'Ngày đã chọn không hợp lệ.';

        input.focus();
        return;
      }
    }

    submitted = true;
    pendingResolver?.(value);
    pendingResolver = null;

    getModal().hide();
  });

  input.addEventListener('input', clearError);

  element.addEventListener(
    'hidden.bs.modal',
    () => {
      if (!submitted && pendingResolver) {
        pendingResolver(null);
      }

      pendingResolver = null;
      validator = null;
      submitted = false;
      clearError();
    }
  );

  function open({
    dialogTitle,
    fieldLabel,
    defaultValue = '',
    minimum = '',
    maximum = '',
    validate
  }) {
    title.textContent = dialogTitle;
    label.textContent = fieldLabel;
    input.value = defaultValue;
    input.min = minimum;
    input.max = maximum;
    validator = validate ?? null;
    submitted = false;
    clearError();

    return new Promise((resolve) => {
      pendingResolver = resolve;
      getModal().show();

      window.setTimeout(() => {
        input.focus();
      }, 150);
    });
  }

  return Object.freeze({
    element,
    open
  });
}

export function createContractsPage() {
  const state = {
    contracts: [],
    rooms: [],
    tenants: [],
    expiringIds: new Set(),
    keyword: '',
    status: '',
    roomId: ''
  };

  const page = createElement('section', {
    className: 'rm-contracts-page',
    dataset: {
      testid: 'contracts-page'
    }
  });

  const titleGroup = createElement('div');

  titleGroup.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Danh sách hợp đồng'
    }),
    createElement('p', {
      className: 'mb-0 text-body-secondary',
      text:
        'Theo dõi thời hạn, người thuê và trạng thái hợp đồng.'
    })
  );

  const addButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm hợp đồng',
    attributes: {
      type: 'button'
    },
    dataset: {
      testid: 'add-contract-button'
    }
  });

  const heading = createElement(
    'div',
    {
      className: 'rm-contracts-heading'
    },
    [titleGroup, addButton]
  );

  const expiringAlert = createElement('div', {
    className:
      'alert alert-warning rm-contract-expiring-alert',
    attributes: {
      hidden: '',
      role: 'status'
    },
    dataset: {
      testid: 'contract-expiring-alert'
    }
  });

  const searchInput = createElement('input', {
    className: 'form-control',
    attributes: {
      id: 'contract-search-input',
      type: 'search',
      placeholder: 'Tìm theo mã hợp đồng',
      'aria-label': 'Tìm theo mã hợp đồng'
    },
    dataset: {
      testid: 'contract-search-input'
    }
  });

  const statusFilter = createElement('select', {
    className: 'form-select',
    attributes: {
      id: 'contract-status-filter',
      'aria-label':
        'Lọc hợp đồng theo trạng thái'
    },
    dataset: {
      testid: 'contract-status-filter'
    }
  });

  statusFilter.append(
    createElement('option', {
      text: 'Tất cả trạng thái',
      attributes: {
        value: ''
      }
    })
  );

  Object.values(CONTRACT_STATUS).forEach(
    (status) => {
      statusFilter.append(
        createElement('option', {
          text:
            CONTRACT_STATUS_LABELS[status],
          attributes: {
            value: status
          }
        })
      );
    }
  );

  const roomFilter = createElement('select', {
    className: 'form-select',
    attributes: {
      id: 'contract-room-filter',
      'aria-label': 'Lọc hợp đồng theo phòng'
    },
    dataset: {
      testid: 'contract-room-filter'
    }
  });

  const toolbar = createElement(
    'div',
    {
      className: 'rm-contracts-toolbar'
    },
    [
      createElement(
        'div',
        {
          className: 'rm-contracts-search'
        },
        [
          createElement('label', {
            className: 'visually-hidden',
            text: 'Tìm kiếm hợp đồng',
            attributes: {
              for: 'contract-search-input'
            }
          }),
          searchInput
        ]
      ),
      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'visually-hidden',
            text: 'Trạng thái hợp đồng',
            attributes: {
              for: 'contract-status-filter'
            }
          }),
          statusFilter
        ]
      ),
      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'visually-hidden',
            text: 'Phòng',
            attributes: {
              for: 'contract-room-filter'
            }
          }),
          roomFilter
        ]
      )
    ]
  );

  const resultCount = createElement('span', {
    className: 'small text-body-secondary',
    text: '0 hợp đồng',
    dataset: {
      testid: 'contract-result-count'
    }
  });

  const tableHead = createElement(
    'thead',
    {},
    [
      createElement(
        'tr',
        {},
        [
          'Mã hợp đồng',
          'Phòng',
          'Người đại diện',
          'Thời hạn',
          'Giá thuê',
          'Trạng thái',
          'Thao tác'
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
  );

  const tableBody = createElement('tbody', {
    dataset: {
      testid: 'contract-table-body'
    }
  });

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-contracts-table',
      dataset: {
        testid: 'contracts-table'
      }
    },
    [tableHead, tableBody]
  );

  const tableWrapper = createElement(
    'div',
    {
      className:
        'table-responsive rm-contracts-table-wrapper'
    },
    [table]
  );

  const emptyTitle = createElement('h3', {
    className: 'h5 mb-2',
    text: 'Chưa có hợp đồng'
  });

  const emptyDescription = createElement('p', {
    className: 'mb-3 text-body-secondary',
    text:
      'Hãy tạo hợp đồng đầu tiên cho phòng phù hợp.'
  });

  const emptyAddButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm hợp đồng',
    attributes: {
      type: 'button'
    },
    dataset: {
      testid: 'contract-empty-add-button'
    }
  });

  const emptyState = createElement(
    'div',
    {
      className: 'rm-contracts-empty',
      attributes: {
        hidden: ''
      },
      dataset: {
        testid: 'contracts-empty-state'
      }
    },
    [
      createElement('div', {
        className: 'rm-contracts-empty-icon',
        text: '▤',
        attributes: {
          'aria-hidden': 'true'
        }
      }),
      emptyTitle,
      emptyDescription,
      emptyAddButton
    ]
  );

  const contentCard = createElement(
    'div',
    {
      className: 'card border-0 shadow-sm'
    },
    [
      createElement(
        'div',
        {
          className:
            'card-header bg-white border-bottom d-flex align-items-center justify-content-between'
        },
        [
          createElement('strong', {
            text: 'Hợp đồng'
          }),
          resultCount
        ]
      ),
      tableWrapper,
      emptyState
    ]
  );

  const contractDetail =
    createContractDetail();

  const dateActionDialog =
    createDateActionDialog();

  const contractForm = createContractForm({
    async onSubmit(data, context) {
      let savedContract;

      if (context.mode === 'edit') {
        savedContract =
          contractService.updateContract(
            context.contractId,
            data
          );

        showToast({
          type: 'success',
          title: 'Cập nhật hợp đồng',
          message:
            `Đã cập nhật hợp đồng ${savedContract.code ??
            savedContract.id
            }.`
        });
      } else {
        savedContract =
          contractService.createContract(data);

        showToast({
          type: 'success',
          title: 'Thêm hợp đồng',
          message:
            `Đã tạo hợp đồng ${savedContract.code ??
            savedContract.id
            }.`
        });
      }

      refreshData();
    }
  });

  page.append(
    heading,
    expiringAlert,
    toolbar,
    contentCard,
    contractForm.element,
    contractDetail.element,
    dateActionDialog.element
  );

  function getRoomById(roomId) {
    return state.rooms.find(
      (room) => room.id === roomId
    ) ?? null;
  }

  function getTenantById(tenantId) {
    return state.tenants.find(
      (tenant) => tenant.id === tenantId
    ) ?? tenantService.getTenantById(tenantId);
  }

  function populateRoomFilter() {
    const selectedValue = roomFilter.value;

    roomFilter.replaceChildren(
      createElement('option', {
        text: 'Tất cả phòng',
        attributes: {
          value: ''
        }
      })
    );

    [...state.rooms]
      .sort((firstRoom, secondRoom) =>
        String(firstRoom.code).localeCompare(
          String(secondRoom.code),
          'vi'
        )
      )
      .forEach((room) => {
        roomFilter.append(
          createElement('option', {
            text: `${room.code} — ${room.name}`,
            attributes: {
              value: room.id
            }
          })
        );
      });

    roomFilter.value = selectedValue;
  }

  function getVisibleContracts() {
    let contracts = [...state.contracts];

    const keyword =
      normalizeSearchText(state.keyword);

    if (keyword) {
      contracts = contracts.filter(
        (contract) =>
          normalizeSearchText(
            contract.code
          ).includes(keyword)
      );
    }

    if (state.status) {
      contracts = contracts.filter(
        (contract) =>
          contract.status === state.status
      );
    }

    if (state.roomId) {
      contracts = contracts.filter(
        (contract) =>
          contract.roomId === state.roomId
      );
    }

    return contracts.sort(
      (firstContract, secondContract) =>
        String(secondContract.startDate)
          .localeCompare(
            String(firstContract.startDate)
          )
    );
  }

  function createContractActions(contract) {
    const actions = createElement('div', {
      className: 'rm-contract-actions'
    });

    actions.append(
      createActionButton({
        action: 'view',
        contract,
        label: 'Xem',
        className:
          'btn btn-sm btn-outline-secondary'
      })
    );

    if (
      contract.status === CONTRACT_STATUS.DRAFT
    ) {
      actions.append(
        createActionButton({
          action: 'edit',
          contract,
          label: 'Sửa',
          className:
            'btn btn-sm btn-outline-primary'
        }),
        createActionButton({
          action: 'activate',
          contract,
          label: 'Kích hoạt',
          className:
            'btn btn-sm btn-outline-success'
        }),
        createActionButton({
          action: 'cancel',
          contract,
          label: 'Hủy',
          className:
            'btn btn-sm btn-outline-danger'
        })
      );
    }

    if (
      contract.status === CONTRACT_STATUS.ACTIVE
    ) {
      actions.append(
        createActionButton({
          action: 'extend',
          contract,
          label: 'Gia hạn',
          className:
            'btn btn-sm btn-outline-primary'
        }),
        createActionButton({
          action: 'end',
          contract,
          label: 'Kết thúc',
          className:
            'btn btn-sm btn-outline-warning'
        }),
        createActionButton({
          action: 'cancel',
          contract,
          label: 'Hủy',
          className:
            'btn btn-sm btn-outline-danger'
        })
      );
    }

    return actions;
  }

  function renderTable() {
    const visibleContracts =
      getVisibleContracts();

    resultCount.textContent =
      `${visibleContracts.length} hợp đồng`;

    tableBody.replaceChildren();

    tableWrapper.hidden =
      visibleContracts.length === 0;

    emptyState.hidden =
      visibleContracts.length > 0;

    if (visibleContracts.length === 0) {
      if (state.contracts.length === 0) {
        emptyTitle.textContent =
          'Chưa có hợp đồng';

        emptyDescription.textContent =
          'Hãy tạo hợp đồng đầu tiên cho phòng phù hợp.';

        emptyAddButton.hidden = false;
      } else {
        emptyTitle.textContent =
          'Không tìm thấy hợp đồng';

        emptyDescription.textContent =
          'Không có hợp đồng phù hợp với từ khóa hoặc bộ lọc hiện tại.';

        emptyAddButton.hidden = true;
      }

      return;
    }

    visibleContracts.forEach((contract) => {
      const room =
        getRoomById(contract.roomId);

      const representative =
        getTenantById(
          contract.representativeTenantId
        );

      const statusContainer =
        createElement('div', {
          className:
            'd-flex flex-column align-items-start gap-1'
        });

      statusContainer.append(
        createStatusBadge(contract.status)
      );

      if (
        state.expiringIds.has(contract.id)
      ) {
        statusContainer.append(
          createElement('span', {
            className:
              'rm-contract-expiring-badge',
            text: 'Sắp hết hạn',
            dataset: {
              testid:
                `contract-expiring-${contract.id}`
            }
          })
        );
      }

      const row = createElement('tr', {
        dataset: {
          contractId: contract.id,
          testid:
            `contract-row-${contract.id}`
        }
      });

      row.append(
        createTableCell(
          'Mã hợp đồng',
          createElement('strong', {
            text:
              contract.code ??
              contract.id
          })
        ),
        createTableCell(
          'Phòng',
          room
            ? `${room.code} — ${room.name}`
            : 'Phòng không tồn tại'
        ),
        createTableCell(
          'Người đại diện',
          representative?.fullName ??
          'Không xác định'
        ),
        createTableCell(
          'Thời hạn',
          `${formatDisplayDate(
            contract.startDate
          )} – ${formatDisplayDate(
            contract.endDate
          )}`,
          'text-nowrap'
        ),
        createTableCell(
          'Giá thuê',
          formatVietnameseCurrency(
            contract.rentAmount
          ),
          'text-nowrap text-lg-end'
        ),
        createTableCell(
          'Trạng thái',
          statusContainer
        ),
        createTableCell(
          'Thao tác',
          createContractActions(contract),
          'rm-contract-actions-cell'
        )
      );

      tableBody.append(row);
    });
  }

  function renderExpiringAlert() {
    const count = state.expiringIds.size;

    expiringAlert.hidden = count === 0;

    if (count > 0) {
      expiringAlert.textContent =
        `${count} hợp đồng sẽ hết hạn trong vòng ${EXPIRING_WARNING_DAYS} ngày.`;
    }
  }

  function refreshData() {
    try {
      state.contracts =
        contractService.getContracts();

      state.rooms =
        roomService.getRooms();

      state.tenants =
        tenantService.getTenants();

      state.contracts.forEach((contract) => {
        for (
          const tenantId of contract.tenantIds ?? []
        ) {
          const exists = state.tenants.some(
            (tenant) =>
              tenant.id === tenantId
          );

          if (!exists) {
            const tenant =
              tenantService.getTenantById(
                tenantId
              );

            if (tenant) {
              state.tenants.push(tenant);
            }
          }
        }
      });

      let expiringContracts = [];

      try {
        expiringContracts =
          contractService.getExpiringContracts(
            EXPIRING_WARNING_DAYS
          );
      } catch (error) {
        console.error(
          'Không thể tải hợp đồng sắp hết hạn.',
          error
        );
      }

      state.expiringIds = new Set(
        expiringContracts.map(
          (contract) => contract.id
        )
      );

      populateRoomFilter();
      renderExpiringAlert();
      renderTable();
    } catch (error) {
      state.contracts = [];
      state.rooms = [];
      state.tenants = [];
      state.expiringIds = new Set();

      populateRoomFilter();
      renderExpiringAlert();
      renderTable();

      showToast({
        type: 'danger',
        title: 'Không thể tải hợp đồng',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách hợp đồng.'
      });
    }
  }

  function getSuitableRooms(contract = null) {
    const availableRooms =
      roomService.getAvailableRooms();

    if (contract) {
      const currentRoom =
        roomService.getRoomById(
          contract.roomId
        );

      if (
        currentRoom &&
        !availableRooms.some(
          (room) =>
            room.id === currentRoom.id
        )
      ) {
        availableRooms.push(currentRoom);
      }
    }

    return availableRooms.sort(
      (firstRoom, secondRoom) =>
        String(firstRoom.code).localeCompare(
          String(secondRoom.code),
          'vi'
        )
    );
  }

  function getFormTenants(contract = null) {
    const tenants = tenantService.getTenants();

    for (
      const tenantId of contract?.tenantIds ?? []
    ) {
      const exists = tenants.some(
        (tenant) => tenant.id === tenantId
      );

      if (!exists) {
        const tenant =
          tenantService.getTenantById(
            tenantId
          );

        if (tenant) {
          tenants.push(tenant);
        }
      }
    }

    return tenants.sort(
      (firstTenant, secondTenant) =>
        String(firstTenant.fullName)
          .localeCompare(
            String(secondTenant.fullName),
            'vi'
          )
    );
  }

  function openCreateForm() {
    const rooms = getSuitableRooms();
    const tenants = getFormTenants();

    if (rooms.length === 0) {
      showToast({
        type: 'warning',
        title: 'Không có phòng phù hợp',
        message:
          'Hiện không có phòng trống phù hợp để lập hợp đồng.'
      });

      return;
    }

    if (tenants.length === 0) {
      showToast({
        type: 'warning',
        title: 'Chưa có người thuê',
        message:
          'Cần tạo người thuê trước khi lập hợp đồng.'
      });

      return;
    }

    contractForm.open({
      mode: 'create',
      rooms,
      tenants
    });
  }

  async function activateContract(contract) {
    const confirmed =
      await showConfirmDialog({
        title:
          `Kích hoạt ${contract.code ?? contract.id
          }?`,
        message:
          'Phòng sẽ được chuyển sang trạng thái đang thuê.',
        confirmText: 'Kích hoạt',
        cancelText: 'Hủy',
        variant: 'primary'
      });

    if (!confirmed) {
      return;
    }

    try {
      const activated =
        contractService.activateContract(
          contract.id
        );

      showToast({
        type: 'success',
        title: 'Đã kích hoạt',
        message:
          `Hợp đồng ${activated.code ?? activated.id
          } đang có hiệu lực.`
      });

      refreshData();
    } catch (error) {
      showToast({
        type: 'danger',
        title: 'Không thể kích hoạt',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể kích hoạt hợp đồng.'
      });
    }
  }

  async function extendContract(contract) {
    const newEndDate =
      await dateActionDialog.open({
        dialogTitle:
          `Gia hạn ${contract.code ?? contract.id
          }`,
        fieldLabel: 'Ngày kết thúc mới',
        defaultValue:
          addDays(contract.endDate, 1),
        minimum:
          addDays(contract.endDate, 1),
        validate(value) {
          return compareIsoDates(
            value,
            contract.endDate
          ) > 0
            ? true
            : 'Ngày kết thúc mới phải sau ngày kết thúc hiện tại.';
        }
      });

    if (!newEndDate) {
      return;
    }

    try {
      const extended =
        contractService.extendContract(
          contract.id,
          newEndDate
        );

      showToast({
        type: 'success',
        title: 'Đã gia hạn',
        message:
          `Hợp đồng được gia hạn đến ${formatDisplayDate(
            extended.endDate
          )}.`
      });

      refreshData();
    } catch (error) {
      showToast({
        type: 'danger',
        title: 'Không thể gia hạn',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể gia hạn hợp đồng.'
      });
    }
  }

  async function endContract(contract) {
    const today = getCurrentDateInVietnam();

    const defaultDate =
      compareIsoDates(
        today,
        contract.startDate
      ) > 0
        ? today
        : addDays(contract.startDate, 1);

    const actualEndDate =
      await dateActionDialog.open({
        dialogTitle:
          `Kết thúc ${contract.code ?? contract.id
          }`,
        fieldLabel: 'Ngày kết thúc thực tế',
        defaultValue: defaultDate,
        minimum:
          addDays(contract.startDate, 1),
        validate(value) {
          return compareIsoDates(
            value,
            contract.startDate
          ) > 0
            ? true
            : 'Ngày kết thúc thực tế phải sau ngày bắt đầu.';
        }
      });

    if (!actualEndDate) {
      return;
    }

    try {
      const ended =
        contractService.endContract(
          contract.id,
          actualEndDate
        );

      showToast({
        type: 'success',
        title: 'Đã kết thúc',
        message:
          `Hợp đồng ${ended.code ?? ended.id
          } đã kết thúc.`
      });

      refreshData();
    } catch (error) {
      showToast({
        type: 'danger',
        title: 'Không thể kết thúc',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể kết thúc hợp đồng.'
      });
    }
  }

  async function cancelContract(contract) {
    const confirmed =
      await showConfirmDialog({
        title:
          `Hủy ${contract.code ?? contract.id
          }?`,
        message:
          contract.status ===
            CONTRACT_STATUS.ACTIVE
            ? 'Hợp đồng đang hiệu lực sẽ bị hủy và phòng có thể được chuyển thành trống.'
            : 'Hợp đồng nháp sẽ được chuyển sang trạng thái đã hủy.',
        confirmText: 'Hủy hợp đồng',
        cancelText: 'Quay lại',
        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      const cancelled =
        contractService.cancelContract(
          contract.id
        );

      showToast({
        type: 'success',
        title: 'Đã hủy hợp đồng',
        message:
          `Đã hủy ${cancelled.code ?? cancelled.id
          }.`
      });

      refreshData();
    } catch (error) {
      showToast({
        type: 'danger',
        title: 'Không thể hủy',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể hủy hợp đồng.'
      });
    }
  }

  addButton.addEventListener(
    'click',
    openCreateForm
  );

  emptyAddButton.addEventListener(
    'click',
    openCreateForm
  );

  searchInput.addEventListener('input', () => {
    state.keyword = searchInput.value;
    renderTable();
  });

  statusFilter.addEventListener(
    'change',
    () => {
      state.status = statusFilter.value;
      renderTable();
    }
  );

  roomFilter.addEventListener(
    'change',
    () => {
      state.roomId = roomFilter.value;
      renderTable();
    }
  );

  tableBody.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest(
        'button[data-action][data-contract-id]'
      );

      if (!button) {
        return;
      }

      const contract =
        contractService.getContractById(
          button.dataset.contractId
        );

      if (!contract) {
        showToast({
          type: 'danger',
          title: 'Không tìm thấy hợp đồng',
          message:
            'Hợp đồng không còn tồn tại.'
        });

        refreshData();
        return;
      }

      const room =
        roomService.getRoomById(
          contract.roomId
        );

      const tenants = (
        contract.tenantIds ?? []
      )
        .map((tenantId) =>
          tenantService.getTenantById(
            tenantId
          )
        )
        .filter(Boolean);

      switch (button.dataset.action) {
        case 'view':
          contractDetail.open({
            contract,
            room,
            tenants,
            isExpiringSoon:
              state.expiringIds.has(
                contract.id
              )
          });
          break;

        case 'edit':
          contractForm.open({
            mode: 'edit',
            contract,
            rooms:
              getSuitableRooms(contract),
            tenants:
              getFormTenants(contract)
          });
          break;

        case 'activate':
          activateContract(contract);
          break;

        case 'extend':
          extendContract(contract);
          break;

        case 'end':
          endContract(contract);
          break;

        case 'cancel':
          cancelContract(contract);
          break;

        default:
          break;
      }
    }
  );

  refreshData();

  return page;
}

export const createPage =
  createContractsPage;

export default createContractsPage;