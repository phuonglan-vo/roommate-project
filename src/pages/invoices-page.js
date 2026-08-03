import '../styles/invoices.css';

import invoiceService from '../services/invoice-service.js';
import roomService from '../services/room-service.js';

import {
  createInvoiceForm
} from '../components/invoice-form.js';

import {
  createInvoiceDetail
} from '../components/invoice-detail.js';

import {
  showToast
} from '../components/toast.js';

import {
  showConfirmDialog
} from '../components/confirm-dialog.js';

import {
  INVOICE_DOCUMENT_STATUS,
  INVOICE_PAYMENT_STATUS
} from '../constants/statuses.js';

import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

const DOCUMENT_STATUS_LABELS = Object.freeze({
  [INVOICE_DOCUMENT_STATUS.DRAFT]:
    'Bản nháp',

  [INVOICE_DOCUMENT_STATUS.FINALIZED]:
    'Đã chốt',

  [INVOICE_DOCUMENT_STATUS.CANCELLED]:
    'Đã hủy'
});

const PAYMENT_STATUS_LABELS = Object.freeze({
  [INVOICE_PAYMENT_STATUS.UNPAID]:
    'Chưa thanh toán',

  [INVOICE_PAYMENT_STATUS.PARTIALLY_PAID]:
    'Thanh toán một phần',

  [INVOICE_PAYMENT_STATUS.PAID]:
    'Đã thanh toán',

  [INVOICE_PAYMENT_STATUS.OVERDUE]:
    'Quá hạn'
});

const DOCUMENT_BADGE_CLASSES = Object.freeze({
  [INVOICE_DOCUMENT_STATUS.DRAFT]:
    'rm-invoice-badge--draft',

  [INVOICE_DOCUMENT_STATUS.FINALIZED]:
    'rm-invoice-badge--finalized',

  [INVOICE_DOCUMENT_STATUS.CANCELLED]:
    'rm-invoice-badge--cancelled'
});

const PAYMENT_BADGE_CLASSES = Object.freeze({
  [INVOICE_PAYMENT_STATUS.UNPAID]:
    'rm-invoice-badge--unpaid',

  [INVOICE_PAYMENT_STATUS.PARTIALLY_PAID]:
    'rm-invoice-badge--partial',

  [INVOICE_PAYMENT_STATUS.PAID]:
    'rm-invoice-badge--paid',

  [INVOICE_PAYMENT_STATUS.OVERDUE]:
    'rm-invoice-badge--overdue'
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

function getCurrentMonthInVietnam() {
  const parts = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit'
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

  return `${values.year}-${values.month}`;
}

function formatDisplayDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  ).format(date);
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
    content &&
    typeof content === 'object' &&
    'nodeType' in content
  ) {
    cell.append(content);
  } else {
    cell.textContent =
      String(content ?? '');
  }

  return cell;
}

function createDocumentBadge(status) {
  return createElement('span', {
    className:
      `rm-invoice-badge ${
        DOCUMENT_BADGE_CLASSES[status] ??
        DOCUMENT_BADGE_CLASSES[
          INVOICE_DOCUMENT_STATUS.DRAFT
        ]
      }`,

    text:
      DOCUMENT_STATUS_LABELS[status] ??
      status ??
      'Không xác định',

    dataset: {
      testid: 'invoice-document-status-badge',
      status
    }
  });
}

function createPaymentBadge(status) {
  return createElement('span', {
    className:
      `rm-invoice-badge ${
        PAYMENT_BADGE_CLASSES[status] ??
        PAYMENT_BADGE_CLASSES[
          INVOICE_PAYMENT_STATUS.UNPAID
        ]
      }`,

    text:
      PAYMENT_STATUS_LABELS[status] ??
      status ??
      'Không xác định',

    dataset: {
      testid: 'invoice-payment-status-badge',
      status
    }
  });
}

function createActionButton({
  action,
  invoice,
  label,
  className
}) {
  return createElement('button', {
    className,
    text: label,

    attributes: {
      type: 'button',

      'aria-label':
        `${label} hóa đơn ${
          invoice.code ?? invoice.id
        }`
    },

    dataset: {
      action,

      invoiceId:
        invoice.id,

      testid:
        `invoice-${action}-${invoice.id}`
    }
  });
}

export function createInvoicesPage() {
  const state = {
    invoices: [],
    rooms: [],
    month: getCurrentMonthInVietnam(),
    roomId: '',
    status: '',
    keyword: ''
  };

  const page = createElement('section', {
    className: 'rm-invoices-page',

    dataset: {
      testid: 'invoices-page'
    }
  });

  const titleGroup = createElement('div');

  titleGroup.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Quản lý hóa đơn'
    }),

    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Lập, chốt và theo dõi thanh toán hóa đơn hằng tháng.'
    })
  );

  const batchButton = createElement('button', {
    className:
      'btn btn-outline-primary',

    text: 'Tạo hàng loạt',

    attributes: {
      type: 'button'
    },

    dataset: {
      testid:
        'invoice-batch-create-button'
    }
  });

  const addButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Tạo hóa đơn',

    attributes: {
      type: 'button'
    },

    dataset: {
      testid:
        'invoice-add-button'
    }
  });

  const headingActions = createElement(
    'div',
    {
      className:
        'd-flex flex-wrap gap-2'
    },
    [
      batchButton,
      addButton
    ]
  );

  const heading = createElement(
    'div',
    {
      className:
        'rm-invoices-heading'
    },
    [
      titleGroup,
      headingActions
    ]
  );

  const searchInput = createElement('input', {
    className: 'form-control',

    attributes: {
      type: 'search',
      placeholder:
        'Tìm theo mã hóa đơn',

      'aria-label':
        'Tìm kiếm hóa đơn theo mã'
    },

    dataset: {
      testid:
        'invoice-search-input'
    }
  });

  const monthInput = createElement('input', {
    className: 'form-control',

    attributes: {
      id: 'invoice-month-filter',
      type: 'month',
      value: state.month,
      'aria-label':
        'Lọc hóa đơn theo tháng'
    },

    dataset: {
      testid:
        'invoice-month-filter'
    }
  });

  const clearMonthButton = createElement(
    'button',
    {
      className:
        'btn btn-outline-secondary',

      text: 'Tất cả tháng',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'invoice-clear-month-filter'
      }
    }
  );

  const roomFilter = createElement('select', {
    className: 'form-select',

    attributes: {
      id: 'invoice-room-filter',
      'aria-label':
        'Lọc hóa đơn theo phòng'
    },

    dataset: {
      testid:
        'invoice-room-filter'
    }
  });

  const statusFilter = createElement('select', {
    className: 'form-select',

    attributes: {
      id: 'invoice-status-filter',
      'aria-label':
        'Lọc hóa đơn theo trạng thái'
    },

    dataset: {
      testid:
        'invoice-status-filter'
    }
  });

  statusFilter.append(
    createElement('option', {
      text: 'Tất cả trạng thái',

      attributes: {
        value: ''
      }
    }),

    createElement('optgroup', {
      attributes: {
        label: 'Trạng thái hóa đơn'
      }
    }),

    createElement('optgroup', {
      attributes: {
        label: 'Trạng thái thanh toán'
      }
    })
  );

  const documentGroup =
    statusFilter.children[1];

  Object.values(
    INVOICE_DOCUMENT_STATUS
  ).forEach((status) => {
    documentGroup.append(
      createElement('option', {
        text:
          DOCUMENT_STATUS_LABELS[status],

        attributes: {
          value:
            `document:${status}`
        }
      })
    );
  });

  const paymentGroup =
    statusFilter.children[2];

  Object.values(
    INVOICE_PAYMENT_STATUS
  ).forEach((status) => {
    paymentGroup.append(
      createElement('option', {
        text:
          PAYMENT_STATUS_LABELS[status],

        attributes: {
          value:
            `payment:${status}`
        }
      })
    );
  });

  const toolbar = createElement(
    'div',
    {
      className:
        'rm-invoices-toolbar'
    },
    [
      createElement(
        'div',
        {
          className:
            'rm-invoice-search-field'
        },
        [
          createElement('label', {
            className: 'form-label',
            text: 'Tìm kiếm',

            attributes: {
              for:
                'invoice-search-input'
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
            className: 'form-label',
            text: 'Tháng',

            attributes: {
              for:
                'invoice-month-filter'
            }
          }),

          createElement(
            'div',
            {
              className:
                'input-group'
            },
            [
              monthInput,
              clearMonthButton
            ]
          )
        ]
      ),

      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Phòng',

            attributes: {
              for:
                'invoice-room-filter'
            }
          }),

          roomFilter
        ]
      ),

      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Trạng thái',

            attributes: {
              for:
                'invoice-status-filter'
            }
          }),

          statusFilter
        ]
      )
    ]
  );

  searchInput.id =
    'invoice-search-input';

  const resultCount = createElement('span', {
    className:
      'small text-body-secondary',

    text: '0 hóa đơn',

    dataset: {
      testid:
        'invoice-result-count'
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
          'Mã hóa đơn',
          'Phòng',
          'Tháng',
          'Hạn thanh toán',
          'Tổng tiền',
          'Đã trả',
          'Còn nợ',
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
        'invoice-table-body'
    }
  });

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-invoices-table',

      dataset: {
        testid:
          'invoice-table'
      }
    },
    [
      tableHead,
      tableBody
    ]
  );

  const tableWrapper = createElement(
    'div',
    {
      className:
        'table-responsive rm-invoices-table-wrapper'
    },
    [table]
  );

  const emptyTitle = createElement('h3', {
    className: 'h5 mb-2',
    text: 'Chưa có hóa đơn'
  });

  const emptyDescription = createElement('p', {
    className:
      'mb-3 text-body-secondary',

    text:
      'Hãy tạo hóa đơn đầu tiên cho phòng.'
  });

  const emptyAddButton = createElement(
    'button',
    {
      className: 'btn btn-primary',
      text: 'Tạo hóa đơn',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'invoice-empty-add-button'
      }
    }
  );

  const emptyState = createElement(
    'div',
    {
      className:
        'rm-invoices-empty',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'invoices-empty-state'
      }
    },
    [
      createElement('div', {
        className:
          'rm-invoices-empty-icon',

        text: '₫',

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
            'card-header bg-white border-bottom d-flex align-items-center justify-content-between gap-3'
        },
        [
          createElement('strong', {
            text: 'Hóa đơn'
          }),

          resultCount
        ]
      ),

      tableWrapper,
      emptyState
    ]
  );

  const invoiceDetail =
    createInvoiceDetail();

  const invoiceForm =
    createInvoiceForm({
      async onSubmit(data, context) {
        let savedInvoice;

        if (context.mode === 'edit') {
          savedInvoice =
            invoiceService
              .updateDraftInvoice(
                context.invoiceId,
                data
              );

          showToast({
            type: 'success',
            title:
              'Cập nhật hóa đơn',

            message:
              `Đã cập nhật hóa đơn ${
                savedInvoice.code
              }.`
          });
        } else {
          savedInvoice =
            invoiceService
              .createInvoice(data);

          showToast({
            type: 'success',
            title:
              'Tạo hóa đơn',

            message:
              `Đã tạo hóa đơn ${
                savedInvoice.code
              }.`
          });
        }

        refreshInvoices();
      }
    });

  page.append(
    heading,
    toolbar,
    contentCard,
    invoiceForm.element,
    invoiceDetail.element
  );

  function populateRoomFilter() {
    const selectedRoomId =
      state.roomId;

    roomFilter.replaceChildren(
      createElement('option', {
        text: 'Tất cả phòng',

        attributes: {
          value: ''
        }
      })
    );

    state.rooms.forEach((room) => {
      roomFilter.append(
        createElement('option', {
          text:
            `${room.code} — ${room.name}`,

          attributes: {
            value: room.id
          }
        })
      );
    });

    if (
      state.rooms.some(
        (room) =>
          room.id === selectedRoomId
      )
    ) {
      roomFilter.value =
        selectedRoomId;
    } else {
      state.roomId = '';
      roomFilter.value = '';
    }
  }

  function getInvoiceFilters() {
    const filters = {
      keyword: state.keyword,
      roomId: state.roomId
    };

    if (state.month) {
      filters.month = state.month;
    }

    if (state.status) {
      const [
        statusType,
        statusValue
      ] = state.status.split(':');

      if (statusType === 'document') {
        filters.documentStatus =
          statusValue;
      }

      if (statusType === 'payment') {
        filters.paymentStatus =
          statusValue;
      }
    }

    return filters;
  }

  function createActions(invoice) {
    const actions = createElement('div', {
      className:
        'rm-invoice-actions'
    });

    actions.append(
      createActionButton({
        action: 'view',
        invoice,
        label: 'Xem',

        className:
          'btn btn-sm btn-outline-secondary'
      })
    );

    if (
      invoice.documentStatus ===
      INVOICE_DOCUMENT_STATUS.DRAFT
    ) {
      actions.append(
        createActionButton({
          action: 'edit',
          invoice,
          label: 'Sửa',

          className:
            'btn btn-sm btn-outline-primary'
        }),

        createActionButton({
          action: 'finalize',
          invoice,
          label: 'Chốt',

          className:
            'btn btn-sm btn-outline-success'
        }),

        createActionButton({
          action: 'cancel',
          invoice,
          label: 'Hủy',

          className:
            'btn btn-sm btn-outline-warning'
        }),

        createActionButton({
          action: 'delete',
          invoice,
          label: 'Xóa',

          className:
            'btn btn-sm btn-outline-danger'
        })
      );
    } else if (
      invoice.documentStatus ===
      INVOICE_DOCUMENT_STATUS.FINALIZED
    ) {
      actions.append(
        createActionButton({
          action: 'cancel',
          invoice,
          label: 'Hủy',

          className:
            'btn btn-sm btn-outline-danger'
        })
      );
    }

    return actions;
  }

  function renderInvoices() {
    resultCount.textContent =
      `${state.invoices.length} hóa đơn`;

    tableBody.replaceChildren();

    tableWrapper.hidden =
      state.invoices.length === 0;

    emptyState.hidden =
      state.invoices.length > 0;

    if (state.invoices.length === 0) {
      const hasFilters =
        Boolean(state.keyword.trim()) ||
        Boolean(state.roomId) ||
        Boolean(state.status) ||
        Boolean(state.month);

      if (hasFilters) {
        emptyTitle.textContent =
          'Không tìm thấy hóa đơn';

        emptyDescription.textContent =
          'Không có hóa đơn phù hợp với các điều kiện lọc hiện tại.';

        emptyAddButton.hidden = true;
      } else {
        emptyTitle.textContent =
          'Chưa có hóa đơn';

        emptyDescription.textContent =
          'Hãy tạo hóa đơn đầu tiên cho phòng.';

        emptyAddButton.hidden = false;
      }

      return;
    }

    state.invoices.forEach((invoice) => {
      const roomLabel =
        invoice.roomSnapshot
          ? `${invoice.roomSnapshot.code} — ${invoice.roomSnapshot.name}`
          : (
              state.rooms.find(
                (room) =>
                  room.id ===
                  invoice.roomId
              )
              ? `${
                  state.rooms.find(
                    (room) =>
                      room.id ===
                      invoice.roomId
                  ).code
                } — ${
                  state.rooms.find(
                    (room) =>
                      room.id ===
                      invoice.roomId
                  ).name
                }`
              : invoice.roomId
            );

      const statuses = createElement('div', {
        className:
          'd-flex flex-column align-items-start gap-1'
      });

      statuses.append(
        createDocumentBadge(
          invoice.documentStatus
        )
      );

      if (
        invoice.documentStatus !==
        INVOICE_DOCUMENT_STATUS.CANCELLED
      ) {
        statuses.append(
          createPaymentBadge(
            invoice.paymentStatus
          )
        );
      }

      const row = createElement('tr', {
        dataset: {
          invoiceId: invoice.id,

          testid:
            `invoice-row-${invoice.id}`
        }
      });

      row.append(
        createTableCell(
          'Mã hóa đơn',

          createElement('strong', {
            text:
              invoice.code ??
              invoice.id
          })
        ),

        createTableCell(
          'Phòng',
          roomLabel
        ),

        createTableCell(
          'Tháng',
          invoice.period,
          'text-nowrap'
        ),

        createTableCell(
          'Hạn thanh toán',

          formatDisplayDate(
            invoice.dueDate
          ),

          'text-nowrap'
        ),

        createTableCell(
          'Tổng tiền',

          formatVietnameseCurrency(
            invoice.total ?? 0
          ),

          'text-nowrap text-lg-end fw-semibold'
        ),

        createTableCell(
          'Đã trả',

          formatVietnameseCurrency(
            invoice.paidAmount ?? 0
          ),

          'text-nowrap text-lg-end'
        ),

        createTableCell(
          'Còn nợ',

          formatVietnameseCurrency(
            invoice.remainingDebt ?? 0
          ),

          'text-nowrap text-lg-end rm-invoice-debt'
        ),

        createTableCell(
          'Trạng thái',
          statuses
        ),

        createTableCell(
          'Thao tác',

          createActions(invoice),

          'rm-invoice-actions-cell'
        )
      );

      tableBody.append(row);
    });
  }

  function refreshInvoices() {
    try {
      state.rooms =
        roomService.getRooms()
          .sort(
            (firstRoom, secondRoom) =>
              String(firstRoom.code)
                .localeCompare(
                  String(secondRoom.code),
                  'vi'
                )
          );

      state.invoices =
        invoiceService.filterInvoices(
          getInvoiceFilters()
        );

      populateRoomFilter();
      renderInvoices();
    } catch (error) {
      state.invoices = [];

      populateRoomFilter();
      renderInvoices();

      showToast({
        type: 'danger',
        title:
          'Không thể tải hóa đơn',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách hóa đơn.'
      });
    }
  }

  function openCreateForm() {
    if (state.rooms.length === 0) {
      showToast({
        type: 'warning',
        title: 'Chưa có phòng',
        message:
          'Cần có phòng trước khi tạo hóa đơn.'
      });

      return;
    }

    invoiceForm.open({
      mode: 'create',
      rooms: state.rooms,
      month:
        state.month ||
        getCurrentMonthInVietnam()
    });
  }

  async function finalizeInvoice(invoice) {
    const confirmed =
      await showConfirmDialog({
        title:
          `Chốt hóa đơn ${invoice.code}?`,

        message:
          'Sau khi chốt, hóa đơn không thể chỉnh sửa tùy ý.',

        confirmText:
          'Chốt hóa đơn',

        cancelText: 'Hủy',

        variant: 'success'
      });

    if (!confirmed) {
      return;
    }

    try {
      invoiceService.finalizeInvoice(
        invoice.id
      );

      showToast({
        type: 'success',
        title:
          'Đã chốt hóa đơn',

        message:
          `Hóa đơn ${invoice.code} đã được chốt.`
      });

      refreshInvoices();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể chốt',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể chốt hóa đơn.'
      });
    }
  }

  async function cancelInvoice(invoice) {
    const confirmed =
      await showConfirmDialog({
        title:
          `Hủy hóa đơn ${invoice.code}?`,

        message:
          'Hóa đơn đã hủy không thể tiếp tục thanh toán.',

        confirmText:
          'Hủy hóa đơn',

        cancelText: 'Quay lại',

        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      invoiceService.cancelInvoice(
        invoice.id
      );

      showToast({
        type: 'success',
        title:
          'Đã hủy hóa đơn',

        message:
          `Hóa đơn ${invoice.code} đã được hủy.`
      });

      refreshInvoices();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể hủy',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể hủy hóa đơn.'
      });
    }
  }

  async function deleteInvoice(invoice) {
    const confirmed =
      await showConfirmDialog({
        title:
          `Xóa hóa đơn ${invoice.code}?`,

        message:
          'Chỉ hóa đơn nháp chưa thanh toán mới có thể bị xóa.',

        confirmText:
          'Xóa hóa đơn',

        cancelText: 'Hủy',

        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      invoiceService.deleteDraftInvoice(
        invoice.id
      );

      showToast({
        type: 'success',
        title:
          'Đã xóa hóa đơn',

        message:
          `Đã xóa hóa đơn ${invoice.code}.`
      });

      refreshInvoices();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể xóa',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể xóa hóa đơn.'
      });
    }
  }

  async function generateBatchInvoices() {
    const month =
      state.month ||
      getCurrentMonthInVietnam();

    const confirmed =
      await showConfirmDialog({
        title:
          `Tạo hóa đơn tháng ${month}?`,

        message:
          'RoomMate sẽ tạo hóa đơn cho các phòng đủ điều kiện và bỏ qua phòng đã có hóa đơn.',

        confirmText:
          'Tạo hàng loạt',

        cancelText: 'Hủy',

        variant: 'primary'
      });

    if (!confirmed) {
      return;
    }

    try {
      const result =
        invoiceService
          .generateInvoicesForMonth(
            month
          );

      const messages = [
        `Đã tạo ${result.created.length} hóa đơn.`
      ];

      if (result.skipped.length > 0) {
        messages.push(
          `Bỏ qua ${result.skipped.length} phòng.`
        );
      }

      if (result.errors.length > 0) {
        messages.push(
          `${result.errors.length} phòng phát sinh lỗi.`
        );
      }

      showToast({
        type:
          result.errors.length > 0
            ? 'warning'
            : 'success',

        title:
          'Tạo hóa đơn hàng loạt',

        message:
          messages.join(' ')
      });

      state.month = month;
      monthInput.value = month;

      refreshInvoices();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể tạo hàng loạt',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tạo hóa đơn hàng loạt.'
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

  batchButton.addEventListener(
    'click',
    generateBatchInvoices
  );

  searchInput.addEventListener(
    'input',
    () => {
      state.keyword =
        searchInput.value;

      refreshInvoices();
    }
  );

  monthInput.addEventListener(
    'change',
    () => {
      state.month =
        monthInput.value;

      refreshInvoices();
    }
  );

  clearMonthButton.addEventListener(
    'click',
    () => {
      state.month = '';
      monthInput.value = '';

      refreshInvoices();
    }
  );

  roomFilter.addEventListener(
    'change',
    () => {
      state.roomId =
        roomFilter.value;

      refreshInvoices();
    }
  );

  statusFilter.addEventListener(
    'change',
    () => {
      state.status =
        statusFilter.value;

      refreshInvoices();
    }
  );

  tableBody.addEventListener(
    'click',
    (event) => {
      const button =
        event.target.closest(
          'button[data-action][data-invoice-id]'
        );

      if (!button) {
        return;
      }

      const invoice =
        invoiceService.getInvoiceById(
          button.dataset.invoiceId
        );

      if (!invoice) {
        showToast({
          type: 'danger',
          title:
            'Không tìm thấy hóa đơn',

          message:
            'Hóa đơn không còn tồn tại.'
        });

        refreshInvoices();
        return;
      }

      switch (button.dataset.action) {
        case 'view':
          invoiceDetail.open(invoice);
          break;

        case 'edit':
          invoiceForm.open({
            mode: 'edit',
            invoice,
            rooms: state.rooms
          });
          break;

        case 'finalize':
          finalizeInvoice(invoice);
          break;

        case 'cancel':
          cancelInvoice(invoice);
          break;

        case 'delete':
          deleteInvoice(invoice);
          break;

        default:
          break;
      }
    }
  );

  refreshInvoices();

  return page;
}

export const createPage =
  createInvoicesPage;

export default createInvoicesPage;