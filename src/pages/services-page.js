import serviceConfigService from '../services/service-config-service.js';

import {
  createServiceConfigForm
} from '../components/service-config-form.js';

import {
  showToast
} from '../components/toast.js';

import {
  showConfirmDialog
} from '../components/confirm-dialog.js';

import {
  SERVICE_CALCULATION_TYPE_LABELS,
  SERVICE_CONFIG_STATUS,
  SERVICE_CONFIG_STATUS_LABELS
} from '../business/service-config-validator.js';

import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

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

function createStatusBadge(isActive) {
  const status = isActive
    ? SERVICE_CONFIG_STATUS.ACTIVE
    : SERVICE_CONFIG_STATUS.INACTIVE;

  return createElement('span', {
    className: isActive
      ? 'badge text-bg-success'
      : 'badge text-bg-secondary',

    text:
      SERVICE_CONFIG_STATUS_LABELS[
        status
      ],

    dataset: {
      testid:
        `service-status-${status}`
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
    cell.textContent =
      String(content ?? '');
  }

  return cell;
}

function createActionButton({
  action,
  serviceConfig,
  label,
  className
}) {
  return createElement('button', {
    className,
    text: label,

    attributes: {
      type: 'button',

      'aria-label':
        `${label} dịch vụ ${serviceConfig.name}`
    },

    dataset: {
      action,

      serviceId:
        serviceConfig.id,

      testid:
        `service-${action}-${serviceConfig.id}`
    }
  });
}

export function createServicesPage() {
  const state = {
    keyword: '',
    status: 'all'
  };

  const page = createElement('section', {
    className: 'd-grid gap-4',
    dataset: {
      testid: 'services-page'
    }
  });

  const titleGroup = createElement('div');

  titleGroup.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Danh sách dịch vụ'
    }),

    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Quản lý cách tính và đơn giá các dịch vụ của nhà trọ.'
    })
  );

  const addButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm dịch vụ',

    attributes: {
      type: 'button'
    },

    dataset: {
      testid:
        'service-add-button'
    }
  });

  const heading = createElement(
    'div',
    {
      className:
        'd-flex flex-column flex-sm-row align-items-sm-start justify-content-between gap-3'
    },
    [titleGroup, addButton]
  );

  const searchInput = createElement('input', {
    className: 'form-control',

    attributes: {
      type: 'search',

      placeholder:
        'Tìm theo mã hoặc tên dịch vụ',

      'aria-label':
        'Tìm kiếm dịch vụ'
    },

    dataset: {
      testid:
        'service-search-input'
    }
  });

  const statusFilter = createElement(
    'select',
    {
      className: 'form-select',

      attributes: {
        'aria-label':
          'Lọc dịch vụ theo trạng thái'
      },

      dataset: {
        testid:
          'service-status-filter'
      }
    }
  );

  statusFilter.append(
    createElement('option', {
      text: 'Tất cả trạng thái',
      attributes: {
        value: 'all'
      }
    }),

    createElement('option', {
      text:
        SERVICE_CONFIG_STATUS_LABELS[
          SERVICE_CONFIG_STATUS.ACTIVE
        ],

      attributes: {
        value:
          SERVICE_CONFIG_STATUS.ACTIVE
      }
    }),

    createElement('option', {
      text:
        SERVICE_CONFIG_STATUS_LABELS[
          SERVICE_CONFIG_STATUS.INACTIVE
        ],

      attributes: {
        value:
          SERVICE_CONFIG_STATUS.INACTIVE
      }
    })
  );

  const toolbar = createElement(
    'div',
    {
      className:
        'card border-0 shadow-sm'
    },
    [
      createElement(
        'div',
        {
          className: 'card-body'
        },
        [
          createElement(
            'div',
            {
              className:
                'row g-3'
            },
            [
              createElement(
                'div',
                {
                  className:
                    'col-12 col-md-8'
                },
                [searchInput]
              ),

              createElement(
                'div',
                {
                  className:
                    'col-12 col-md-4'
                },
                [statusFilter]
              )
            ]
          )
        ]
      )
    ]
  );

  const resultCount = createElement('span', {
    className:
      'small text-body-secondary',

    text: '0 dịch vụ',

    dataset: {
      testid:
        'service-result-count'
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
          'Mã',
          'Tên dịch vụ',
          'Cách tính',
          'Đơn vị',
          'Đơn giá',
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
      testid:
        'service-table-body'
    }
  });

  const table = createElement(
    'table',
    {
      className:
        'table table-hover align-middle mb-0',

      dataset: {
        testid:
          'service-table'
      }
    },
    [tableHead, tableBody]
  );

  const tableWrapper = createElement(
    'div',
    {
      className:
        'table-responsive'
    },
    [table]
  );

  const emptyTitle = createElement('h3', {
    className: 'h5 mb-2',
    text: 'Chưa có dịch vụ'
  });

  const emptyDescription = createElement('p', {
    className:
      'mb-3 text-body-secondary',

    text:
      'Hãy thêm dịch vụ đầu tiên để bắt đầu cấu hình đơn giá.'
  });

  const emptyAddButton = createElement(
    'button',
    {
      className:
        'btn btn-primary',

      text: 'Thêm dịch vụ',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'service-empty-add-button'
      }
    }
  );

  const emptyState = createElement(
    'div',
    {
      className:
        'text-center py-5 px-3',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'services-empty-state'
      }
    },
    [
      createElement('div', {
        className:
          'display-6 text-primary mb-3',

        text: '◇',

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
      className:
        'card border-0 shadow-sm'
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
            text: 'Dịch vụ'
          }),

          resultCount
        ]
      ),

      tableWrapper,
      emptyState
    ]
  );

  const serviceForm =
    createServiceConfigForm({
      async onSubmit(data, context) {
        if (context.mode === 'edit') {
          const updated =
            serviceConfigService
              .updateServiceConfig(
                context.serviceId,
                data
              );

          showToast({
            type: 'success',
            title:
              'Cập nhật dịch vụ',

            message:
              `Đã cập nhật dịch vụ ${updated.name}.`
          });
        } else {
          const created =
            serviceConfigService
              .createServiceConfig(data);

          showToast({
            type: 'success',
            title:
              'Thêm dịch vụ',

            message:
              `Đã thêm dịch vụ ${created.name}.`
          });
        }

        renderServices();
      }
    });

  page.append(
    heading,
    toolbar,
    contentCard,
    serviceForm.element
  );

  function getVisibleServices() {
    return serviceConfigService
      .filterServiceConfigs({
        keyword: state.keyword,
        status: state.status
      })
      .sort(
        (firstService, secondService) =>
          String(firstService.code)
            .localeCompare(
              String(secondService.code),
              'vi'
            )
      );
  }

  function renderServices() {
    let services;

    try {
      services = getVisibleServices();
    } catch (error) {
      services = [];

      showToast({
        type: 'danger',
        title:
          'Không thể tải dịch vụ',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách dịch vụ.'
      });
    }

    resultCount.textContent =
      `${services.length} dịch vụ`;

    tableBody.replaceChildren();

    tableWrapper.hidden =
      services.length === 0;

    emptyState.hidden =
      services.length > 0;

    if (services.length === 0) {
      const hasFilters =
        Boolean(state.keyword.trim()) ||
        state.status !== 'all';

      if (hasFilters) {
        emptyTitle.textContent =
          'Không tìm thấy dịch vụ';

        emptyDescription.textContent =
          'Không có dịch vụ phù hợp với từ khóa hoặc bộ lọc hiện tại.';

        emptyAddButton.hidden = true;
      } else {
        emptyTitle.textContent =
          'Chưa có dịch vụ';

        emptyDescription.textContent =
          'Hãy thêm dịch vụ đầu tiên để bắt đầu cấu hình đơn giá.';

        emptyAddButton.hidden = false;
      }

      return;
    }

    services.forEach(
      (serviceConfig) => {
        const actions =
          createElement('div', {
            className:
              'd-flex flex-wrap justify-content-end gap-2'
          });

        actions.append(
          createActionButton({
            action: 'edit',

            serviceConfig,

            label: 'Sửa',

            className:
              'btn btn-sm btn-outline-primary'
          })
        );

        if (serviceConfig.isActive) {
          actions.append(
            createActionButton({
              action: 'deactivate',

              serviceConfig,

              label: 'Ngưng áp dụng',

              className:
                'btn btn-sm btn-outline-warning'
            })
          );
        } else {
          actions.append(
            createActionButton({
              action: 'activate',

              serviceConfig,

              label: 'Kích hoạt lại',

              className:
                'btn btn-sm btn-outline-success'
            })
          );
        }

        const row = createElement('tr', {
          dataset: {
            serviceId:
              serviceConfig.id,

            testid:
              `service-row-${serviceConfig.id}`
          }
        });

        row.append(
          createTableCell(
            'Mã',
            createElement('strong', {
              text:
                serviceConfig.code
            })
          ),

          createTableCell(
            'Tên dịch vụ',
            serviceConfig.name
          ),

          createTableCell(
            'Cách tính',

            SERVICE_CALCULATION_TYPE_LABELS[
              serviceConfig.calculationType
            ] ??
              serviceConfig.calculationType
          ),

          createTableCell(
            'Đơn vị',
            serviceConfig.unit
          ),

          createTableCell(
            'Đơn giá',

            formatVietnameseCurrency(
              serviceConfig.unitPrice
            ),

            'text-nowrap text-lg-end'
          ),

          createTableCell(
            'Trạng thái',

            createStatusBadge(
              serviceConfig.isActive
            )
          ),

          createTableCell(
            'Thao tác',
            actions,
            'text-end'
          )
        );

        tableBody.append(row);
      }
    );
  }

  async function deactivateService(
    serviceConfig
  ) {
    const confirmed =
      await showConfirmDialog({
        title:
          `Ngưng áp dụng ${serviceConfig.name}?`,

        message:
          'Dịch vụ sẽ không được dùng cho hóa đơn mới. Các hóa đơn cũ không bị thay đổi.',

        confirmText:
          'Ngưng áp dụng',

        cancelText: 'Hủy',

        variant: 'warning'
      });

    if (!confirmed) {
      return;
    }

    try {
      const updated =
        serviceConfigService
          .deactivateServiceConfig(
            serviceConfig.id
          );

      showToast({
        type: 'success',
        title:
          'Đã ngưng áp dụng',

        message:
          `Dịch vụ ${updated.name} đã được ngưng áp dụng.`
      });

      renderServices();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể ngưng dịch vụ',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể ngưng áp dụng dịch vụ.'
      });
    }
  }

  function activateService(
    serviceConfig
  ) {
    try {
      const updated =
        serviceConfigService
          .activateServiceConfig(
            serviceConfig.id
          );

      showToast({
        type: 'success',
        title:
          'Đã kích hoạt lại',

        message:
          `Dịch vụ ${updated.name} đang được áp dụng.`
      });

      renderServices();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể kích hoạt',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể kích hoạt lại dịch vụ.'
      });
    }
  }

  function openCreateForm() {
    serviceForm.open({
      mode: 'create'
    });
  }

  addButton.addEventListener(
    'click',
    openCreateForm
  );

  emptyAddButton.addEventListener(
    'click',
    openCreateForm
  );

  searchInput.addEventListener(
    'input',
    () => {
      state.keyword =
        searchInput.value;

      renderServices();
    }
  );

  statusFilter.addEventListener(
    'change',
    () => {
      state.status =
        statusFilter.value;

      renderServices();
    }
  );

  tableBody.addEventListener(
    'click',
    (event) => {
      const button =
        event.target.closest(
          'button[data-action][data-service-id]'
        );

      if (!button) {
        return;
      }

      const serviceConfig =
        serviceConfigService
          .getServiceConfigById(
            button.dataset.serviceId
          );

      if (!serviceConfig) {
        showToast({
          type: 'danger',
          title:
            'Không tìm thấy dịch vụ',

          message:
            'Dịch vụ không còn tồn tại.'
        });

        renderServices();
        return;
      }

      switch (button.dataset.action) {
        case 'edit':
          serviceForm.open({
            mode: 'edit',
            serviceConfig
          });
          break;

        case 'deactivate':
          deactivateService(
            serviceConfig
          );
          break;

        case 'activate':
          activateService(
            serviceConfig
          );
          break;

        default:
          break;
      }
    }
  );

  renderServices();

  return page;
}

export const createPage =
  createServicesPage;

export default createServicesPage;