import '../styles/tenants.css';

import tenantService from '../services/tenant-service.js';
import { createTenantForm } from '../components/tenant-form.js';
import { showToast } from '../components/toast.js';
import { showConfirmDialog } from '../components/confirm-dialog.js';

import {
  CONTRACT_STATUS_LABELS,
  TENANT_STATUS,
  TENANT_STATUS_LABELS
} from '../constants/statuses.js';

import {
  formatDateForDisplay
} from '../utils/date-utils.js';

/*
 * TenantService.getTenants() mặc định không trả hồ sơ đã lưu trữ.
 * Cache này giúp hồ sơ vừa lưu trữ vẫn có thể được xem trong phiên hiện tại
 * mà không truy cập LocalStorage trực tiếp.
 */
const archivedTenantSessionCache = new Map();

const TENANT_STATUS_BADGE_CLASSES = Object.freeze({
  [TENANT_STATUS.ACTIVE]: 'rm-tenant-badge--active',
  [TENANT_STATUS.INACTIVE]: 'rm-tenant-badge--inactive'
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

function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
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
  const normalizedStatus =
    status === TENANT_STATUS.INACTIVE
      ? TENANT_STATUS.INACTIVE
      : TENANT_STATUS.ACTIVE;

  const label =
    TENANT_STATUS_LABELS[normalizedStatus] ??
    'Không xác định';

  const badgeClass =
    TENANT_STATUS_BADGE_CLASSES[normalizedStatus];

  return createElement('span', {
    className: `rm-tenant-badge ${badgeClass}`,
    text: label,
    dataset: {
      testid: 'tenant-status-badge',
      status: normalizedStatus
    }
  });
}

function createTableCell(label, content, className = '') {
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

function getCurrentRoom(tenantId) {
  try {
    return tenantService.getCurrentRoomOfTenant(tenantId);
  } catch (error) {
    console.error(
      `Không thể lấy phòng hiện tại của người thuê "${tenantId}".`,
      error
    );

    return null;
  }
}

function createHistoryDialog() {
  const modalTitle = createElement('h2', {
    className: 'modal-title fs-5',
    text: 'Lịch sử thuê phòng',
    attributes: {
      id: 'tenantHistoryTitle'
    },
    dataset: {
      testid: 'tenant-history-title'
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
      testid: 'tenant-history-close-icon'
    }
  });

  const header = createElement(
    'div',
    {
      className: 'modal-header'
    },
    [modalTitle, closeButton]
  );

  const body = createElement('div', {
    className: 'modal-body',
    dataset: {
      testid: 'tenant-history-content'
    }
  });

  const footerButton = createElement('button', {
    className: 'btn btn-outline-secondary',
    text: 'Đóng',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal'
    },
    dataset: {
      testid: 'tenant-history-close'
    }
  });

  const footer = createElement(
    'div',
    {
      className: 'modal-footer'
    },
    [footerButton]
  );

  const content = createElement(
    'div',
    {
      className: 'modal-content'
    },
    [header, body, footer]
  );

  const dialog = createElement(
    'div',
    {
      className:
        'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'
    },
    [content]
  );

  const element = createElement(
    'div',
    {
      className: 'modal fade rm-tenant-history-modal',
      attributes: {
        id: 'tenantHistoryModal',
        tabindex: '-1',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'tenantHistoryTitle',
        'aria-hidden': 'true'
      },
      dataset: {
        testid: 'tenant-history-modal'
      }
    },
    [dialog]
  );

  function createEmptyHistory() {
    return createElement(
      'div',
      {
        className: 'rm-tenant-history-empty',
        dataset: {
          testid: 'tenant-history-empty'
        }
      },
      [
        createElement('div', {
          className: 'rm-tenant-history-empty-icon',
          text: '▤',
          attributes: {
            'aria-hidden': 'true'
          }
        }),
        createElement('h3', {
          className: 'h6 mb-2',
          text: 'Chưa có lịch sử thuê'
        }),
        createElement('p', {
          className: 'mb-0 text-body-secondary',
          text: 'Người thuê chưa có hợp đồng đang hiệu lực hoặc đã kết thúc.'
        })
      ]
    );
  }

  function createHistoryTable(history) {
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
            'Ngày bắt đầu',
            'Ngày kết thúc',
            'Trạng thái'
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

    const tableBody = createElement('tbody');

    history.forEach(({ contract, room, isCurrent }) => {
      const statusLabel =
        CONTRACT_STATUS_LABELS[contract.status] ??
        contract.status ??
        'Không xác định';

      const statusBadge = createElement('span', {
        className: isCurrent
          ? 'badge text-bg-success'
          : 'badge text-bg-secondary',
        text: statusLabel
      });

      const row = createElement('tr', {
        dataset: {
          testid: `tenant-history-row-${contract.id}`
        }
      });

      row.append(
        createTableCell(
          'Mã hợp đồng',
          contract.code ?? contract.id
        ),
        createTableCell(
          'Phòng',
          room
            ? `${room.code} — ${room.name}`
            : 'Phòng không còn tồn tại'
        ),
        createTableCell(
          'Ngày bắt đầu',
          formatDisplayDate(contract.startDate)
        ),
        createTableCell(
          'Ngày kết thúc',
          formatDisplayDate(contract.endDate)
        ),
        createTableCell(
          'Trạng thái',
          statusBadge
        )
      );

      tableBody.append(row);
    });

    const table = createElement(
      'table',
      {
        className:
          'table align-middle mb-0 rm-tenant-history-table',
        dataset: {
          testid: 'tenant-history-table'
        }
      },
      [tableHead, tableBody]
    );

    return createElement(
      'div',
      {
        className: 'table-responsive'
      },
      [table]
    );
  }

  function open(tenant) {
    modalTitle.textContent =
      `Lịch sử thuê — ${tenant.fullName}`;

    let history;

    try {
      history =
        tenantService.getTenantRentalHistory(
          tenant.id
        );
    } catch (error) {
      body.replaceChildren(
        createElement('div', {
          className: 'alert alert-danger mb-0',
          text:
            error instanceof Error
              ? error.message
              : 'Không thể tải lịch sử thuê.'
        })
      );

      showModal();
      return;
    }

    body.replaceChildren(
      history.length > 0
        ? createHistoryTable(history)
        : createEmptyHistory()
    );

    showModal();
  }

  function showModal() {
    const Modal = window.bootstrap?.Modal;

    if (!Modal) {
      throw new Error(
        'Bootstrap Modal chưa được tải.'
      );
    }

    Modal.getOrCreateInstance(element).show();
  }

  return Object.freeze({
    element,
    open
  });
}

export function createTenantsPage() {
  const state = {
    activeTenants: [],
    keyword: '',
    status: TENANT_STATUS.ACTIVE
  };

  const page = createElement('section', {
    className: 'rm-tenants-page',
    dataset: {
      testid: 'tenants-page'
    }
  });

  const headingContent = createElement('div');

  headingContent.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Danh sách người thuê'
    }),
    createElement('p', {
      className: 'mb-0 text-body-secondary',
      text: 'Quản lý hồ sơ, phòng hiện tại và lịch sử thuê.'
    })
  );

  const addButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm người thuê',
    attributes: {
      type: 'button'
    },
    dataset: {
      testid: 'add-tenant-button'
    }
  });

  const heading = createElement(
    'div',
    {
      className: 'rm-tenants-heading'
    },
    [headingContent, addButton]
  );

  const searchInput = createElement('input', {
    className: 'form-control',
    attributes: {
      id: 'tenant-search-input',
      type: 'search',
      placeholder: 'Tìm theo tên, số điện thoại hoặc CCCD',
      'aria-label': 'Tìm kiếm người thuê'
    },
    dataset: {
      testid: 'tenant-search-input'
    }
  });

  const statusFilter = createElement('select', {
    className: 'form-select',
    attributes: {
      id: 'tenant-status-filter',
      'aria-label': 'Lọc trạng thái người thuê'
    },
    dataset: {
      testid: 'tenant-status-filter'
    }
  });

  statusFilter.append(
    createElement('option', {
      text: 'Đang hoạt động',
      attributes: {
        value: TENANT_STATUS.ACTIVE
      }
    }),
    createElement('option', {
      text: 'Đã lưu trữ',
      attributes: {
        value: TENANT_STATUS.INACTIVE
      }
    }),
    createElement('option', {
      text: 'Tất cả trạng thái',
      attributes: {
        value: 'all'
      }
    })
  );

  const toolbar = createElement(
    'div',
    {
      className: 'rm-tenants-toolbar'
    },
    [
      createElement(
        'div',
        {
          className: 'rm-tenants-search'
        },
        [
          createElement('label', {
            className: 'visually-hidden',
            text: 'Tìm kiếm người thuê',
            attributes: {
              for: 'tenant-search-input'
            }
          }),
          searchInput
        ]
      ),
      createElement(
        'div',
        {
          className: 'rm-tenants-filter'
        },
        [
          createElement('label', {
            className: 'visually-hidden',
            text: 'Trạng thái người thuê',
            attributes: {
              for: 'tenant-status-filter'
            }
          }),
          statusFilter
        ]
      )
    ]
  );

  const resultCount = createElement('span', {
    className: 'small text-body-secondary',
    text: '0 người thuê',
    dataset: {
      testid: 'tenant-result-count'
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
          'Họ tên',
          'Số điện thoại',
          'CCCD',
          'Phòng hiện tại',
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
      testid: 'tenant-table-body'
    }
  });

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-tenants-table',
      dataset: {
        testid: 'tenants-table'
      }
    },
    [tableHead, tableBody]
  );

  const tableWrapper = createElement(
    'div',
    {
      className:
        'table-responsive rm-tenants-table-wrapper'
    },
    [table]
  );

  const emptyTitle = createElement('h3', {
    className: 'h5 mb-2',
    text: 'Chưa có người thuê'
  });

  const emptyDescription = createElement('p', {
    className: 'mb-3 text-body-secondary',
    text: 'Hãy thêm hồ sơ người thuê đầu tiên.'
  });

  const emptyAddButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm người thuê',
    attributes: {
      type: 'button'
    },
    dataset: {
      testid: 'tenant-empty-add-button'
    }
  });

  const emptyState = createElement(
    'div',
    {
      className: 'rm-tenants-empty',
      attributes: {
        hidden: ''
      },
      dataset: {
        testid: 'tenants-empty-state'
      }
    },
    [
      createElement('div', {
        className: 'rm-tenants-empty-icon',
        text: '♙',
        attributes: {
          'aria-hidden': 'true'
        }
      }),
      emptyTitle,
      emptyDescription,
      emptyAddButton
    ]
  );

  const cardHeader = createElement(
    'div',
    {
      className:
        'card-header bg-white border-bottom d-flex align-items-center justify-content-between'
    },
    [
      createElement('strong', {
        text: 'Người thuê'
      }),
      resultCount
    ]
  );

  const contentCard = createElement(
    'div',
    {
      className: 'card border-0 shadow-sm'
    },
    [
      cardHeader,
      tableWrapper,
      emptyState
    ]
  );

  const historyDialog = createHistoryDialog();

  const tenantForm = createTenantForm({
    async onSubmit(data, context) {
      let savedTenant;

      if (context.mode === 'edit') {
        savedTenant =
          tenantService.updateTenant(
            context.tenantId,
            data
          );

        showToast({
          type: 'success',
          title: 'Cập nhật người thuê',
          message:
            `Đã cập nhật hồ sơ ${savedTenant.fullName}.`
        });
      } else {
        savedTenant =
          tenantService.createTenant(data);

        showToast({
          type: 'success',
          title: 'Thêm người thuê',
          message:
            `Đã thêm ${savedTenant.fullName}.`
        });
      }

      if (
        savedTenant.status ===
        TENANT_STATUS.INACTIVE
      ) {
        archivedTenantSessionCache.set(
          savedTenant.id,
          savedTenant
        );
      } else {
        archivedTenantSessionCache.delete(
          savedTenant.id
        );
      }

      refreshTenants();
    }
  });

  page.append(
    heading,
    toolbar,
    contentCard,
    tenantForm.element,
    historyDialog.element
  );

  function getAllSessionTenants() {
    const activeIds = new Set(
      state.activeTenants.map(
        (tenant) => tenant.id
      )
    );

    activeIds.forEach((tenantId) => {
      archivedTenantSessionCache.delete(
        tenantId
      );
    });

    const archivedTenants = [
      ...archivedTenantSessionCache.values()
    ];

    return [
      ...state.activeTenants,
      ...archivedTenants
    ];
  }

  function getVisibleTenants() {
    let tenants = getAllSessionTenants();

    if (state.status !== 'all') {
      tenants = tenants.filter((tenant) => {
        const status =
          tenant.status === TENANT_STATUS.INACTIVE
            ? TENANT_STATUS.INACTIVE
            : TENANT_STATUS.ACTIVE;

        return status === state.status;
      });
    }

    const keyword =
      normalizeSearchText(state.keyword);

    if (keyword) {
      tenants = tenants.filter((tenant) => {
        const searchableText =
          normalizeSearchText([
            tenant.fullName,
            tenant.phone,
            tenant.identityNumber
          ].join(' '));

        return searchableText.includes(keyword);
      });
    }

    return tenants.sort((firstTenant, secondTenant) =>
      String(firstTenant.fullName).localeCompare(
        String(secondTenant.fullName),
        'vi'
      )
    );
  }

  function createActionButton({
    action,
    tenant,
    label,
    className
  }) {
    return createElement('button', {
      className,
      text: label,
      attributes: {
        type: 'button',
        'aria-label':
          `${label} người thuê ${tenant.fullName}`
      },
      dataset: {
        action,
        tenantId: tenant.id,
        testid: `tenant-${action}-${tenant.id}`
      }
    });
  }

  function renderTable() {
    const visibleTenants =
      getVisibleTenants();

    resultCount.textContent =
      `${visibleTenants.length} người thuê`;

    tableBody.replaceChildren();

    const hasAnyTenants =
      getAllSessionTenants().length > 0;

    const hasVisibleTenants =
      visibleTenants.length > 0;

    tableWrapper.hidden = !hasVisibleTenants;
    emptyState.hidden = hasVisibleTenants;

    if (!hasVisibleTenants) {
      emptyAddButton.hidden =
        state.status === TENANT_STATUS.INACTIVE;

      if (!hasAnyTenants) {
        emptyTitle.textContent =
          'Chưa có người thuê';

        emptyDescription.textContent =
          'Hãy thêm hồ sơ người thuê đầu tiên.';
      } else if (
        state.status ===
        TENANT_STATUS.INACTIVE
      ) {
        emptyTitle.textContent =
          'Chưa có hồ sơ lưu trữ';

        emptyDescription.textContent =
          'Các hồ sơ được lưu trữ trong phiên hiện tại sẽ xuất hiện tại đây.';
      } else {
        emptyTitle.textContent =
          'Không tìm thấy người thuê';

        emptyDescription.textContent =
          'Không có hồ sơ nào phù hợp với từ khóa hoặc bộ lọc hiện tại.';
      }

      return;
    }

    visibleTenants.forEach((tenant) => {
      const normalizedStatus =
        tenant.status === TENANT_STATUS.INACTIVE
          ? TENANT_STATUS.INACTIVE
          : TENANT_STATUS.ACTIVE;

      const room = getCurrentRoom(tenant.id);

      const roomDisplay = room
        ? `${room.code} — ${room.name}`
        : 'Chưa thuê phòng';

      const actions = createElement('div', {
        className: 'rm-tenant-actions'
      });

      actions.append(
        createActionButton({
          action: 'history',
          tenant,
          label: 'Lịch sử',
          className:
            'btn btn-sm btn-outline-secondary'
        }),
        createActionButton({
          action: 'edit',
          tenant,
          label: 'Sửa',
          className:
            'btn btn-sm btn-outline-primary'
        })
      );

      if (
        normalizedStatus ===
        TENANT_STATUS.ACTIVE
      ) {
        actions.append(
          createActionButton({
            action: 'archive',
            tenant,
            label: 'Lưu trữ',
            className:
              'btn btn-sm btn-outline-warning'
          })
        );
      }

      actions.append(
        createActionButton({
          action: 'delete',
          tenant,
          label: 'Xóa',
          className:
            'btn btn-sm btn-outline-danger'
        })
      );

      const row = createElement('tr', {
        dataset: {
          tenantId: tenant.id,
          testid: `tenant-row-${tenant.id}`
        }
      });

      row.append(
        createTableCell(
          'Họ tên',
          createElement('strong', {
            text: tenant.fullName
          })
        ),
        createTableCell(
          'Số điện thoại',
          tenant.phone || '—',
          'text-nowrap'
        ),
        createTableCell(
          'CCCD',
          tenant.identityNumber || '—',
          'text-nowrap'
        ),
        createTableCell(
          'Phòng hiện tại',
          roomDisplay
        ),
        createTableCell(
          'Trạng thái',
          createStatusBadge(normalizedStatus)
        ),
        createTableCell(
          'Thao tác',
          actions,
          'rm-tenant-actions-cell'
        )
      );

      tableBody.append(row);
    });
  }

  function refreshTenants() {
    try {
      state.activeTenants =
        tenantService.getTenants();

      renderTable();
    } catch (error) {
      state.activeTenants = [];
      renderTable();

      showToast({
        type: 'danger',
        title: 'Không thể tải người thuê',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách người thuê.'
      });
    }
  }

  function findTenant(tenantId) {
    return getAllSessionTenants().find(
      (tenant) => tenant.id === tenantId
    ) ?? tenantService.getTenantById(tenantId);
  }

  async function archiveTenant(tenant) {
    const confirmed =
      await showConfirmDialog({
        title: `Lưu trữ ${tenant.fullName}?`,
        message:
          'Hồ sơ sẽ không còn xuất hiện trong danh sách người thuê đang hoạt động.',
        confirmText: 'Lưu trữ',
        cancelText: 'Hủy',
        variant: 'warning'
      });

    if (!confirmed) {
      return;
    }

    try {
      const archivedTenant =
        tenantService.archiveTenant(tenant.id);

      archivedTenantSessionCache.set(
        archivedTenant.id,
        archivedTenant
      );

      showToast({
        type: 'success',
        title: 'Đã lưu trữ',
        message:
          `Đã lưu trữ hồ sơ ${archivedTenant.fullName}.`
      });

      refreshTenants();
    } catch (error) {
      showToast({
        type: 'danger',
        title: 'Không thể lưu trữ',
        message:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi lưu trữ hồ sơ.'
      });
    }
  }

  async function deleteTenant(tenant) {
    const confirmed =
      await showConfirmDialog({
        title: `Xóa ${tenant.fullName}?`,
        message:
          'Hồ sơ người thuê sẽ bị xóa khỏi hệ thống. Người thuê có hợp đồng hiệu lực không thể bị xóa.',
        confirmText: 'Xóa người thuê',
        cancelText: 'Hủy',
        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      tenantService.deleteTenant(tenant.id);

      archivedTenantSessionCache.delete(
        tenant.id
      );

      showToast({
        type: 'success',
        title: 'Đã xóa người thuê',
        message:
          `Đã xóa hồ sơ ${tenant.fullName}.`
      });

      refreshTenants();
    } catch (error) {
      showToast({
        type: 'danger',
        title: 'Không thể xóa',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể xóa người thuê.'
      });
    }
  }

  addButton.addEventListener('click', () => {
    tenantForm.open({
      mode: 'create'
    });
  });

  emptyAddButton.addEventListener('click', () => {
    tenantForm.open({
      mode: 'create'
    });
  });

  searchInput.addEventListener('input', () => {
    state.keyword = searchInput.value;
    renderTable();
  });

  statusFilter.addEventListener('change', () => {
    state.status = statusFilter.value;
    renderTable();
  });

  tableBody.addEventListener('click', (event) => {
    const button = event.target.closest(
      'button[data-action][data-tenant-id]'
    );

    if (!button) {
      return;
    }

    const tenant = findTenant(
      button.dataset.tenantId
    );

    if (!tenant) {
      showToast({
        type: 'danger',
        title: 'Không tìm thấy người thuê',
        message:
          'Hồ sơ người thuê không còn tồn tại.'
      });

      refreshTenants();
      return;
    }

    switch (button.dataset.action) {
      case 'edit':
        tenantForm.open({
          mode: 'edit',
          tenant
        });
        break;

      case 'archive':
        archiveTenant(tenant);
        break;

      case 'delete':
        deleteTenant(tenant);
        break;

      case 'history':
        historyDialog.open(tenant);
        break;

      default:
        break;
    }
  });

  refreshTenants();

  return page;
}

export const createPage = createTenantsPage;

export default createTenantsPage;