import '../styles/payments.css';

import paymentService from '../services/payment-service.js';
import invoiceService from '../services/invoice-service.js';
import roomService from '../services/room-service.js';

import {
  createPaymentForm
} from '../components/payment-form.js';

import {
  showToast
} from '../components/toast.js';

import {
  showConfirmDialog
} from '../components/confirm-dialog.js';

import {
  INVOICE_DOCUMENT_STATUS
} from '../constants/statuses.js';

import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

const PAYMENT_METHOD_LABELS = Object.freeze({
  cash: 'Tiền mặt',
  bankTransfer: 'Chuyển khoản',
  bank_transfer: 'Chuyển khoản',
  transfer: 'Chuyển khoản',
  eWallet: 'Ví điện tử',
  e_wallet: 'Ví điện tử',
  momo: 'Ví điện tử',
  other: 'Khác'
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

function formatDisplayDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
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

function normalizeMethod(method) {
  return String(method ?? '').trim();
}

function getMethodLabel(method) {
  const normalizedMethod =
    normalizeMethod(method);

  return (
    PAYMENT_METHOD_LABELS[
      normalizedMethod
    ] ??
    normalizedMethod ??
    'Không xác định'
  );
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

function createMethodBadge(method) {
  const normalizedMethod =
    normalizeMethod(method);

  return createElement('span', {
    className:
      `rm-payment-method-badge ` +
      `rm-payment-method-badge--${
        normalizedMethod || 'other'
      }`,

    text: getMethodLabel(
      normalizedMethod
    ),

    dataset: {
      testid:
        `payment-method-${normalizedMethod}`
    }
  });
}

function createDeleteButton(payment) {
  return createElement('button', {
    className:
      'btn btn-sm btn-outline-danger',

    text: 'Xóa',

    attributes: {
      type: 'button',

      'aria-label':
        `Xóa giao dịch ${
          payment.code ??
          payment.id
        }`
    },

    dataset: {
      action: 'delete',

      paymentId:
        payment.id,

      testid:
        `payment-delete-${payment.id}`
    }
  });
}

export function createPaymentsPage() {
  const state = {
    payments: [],
    invoices: [],
    rooms: [],

    fromDate: '',
    toDate: '',
    method: '',
    roomId: ''
  };

  const page = createElement('section', {
    className: 'rm-payments-page',

    dataset: {
      testid: 'payments-page'
    }
  });

  const titleGroup = createElement('div');

  titleGroup.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Quản lý thanh toán'
    }),

    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Ghi nhận các giao dịch và theo dõi công nợ hóa đơn.'
    })
  );

  const addButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm thanh toán',

    attributes: {
      type: 'button'
    },

    dataset: {
      testid:
        'payment-add-button'
    }
  });

  const heading = createElement(
    'div',
    {
      className:
        'rm-payments-heading'
    },
    [
      titleGroup,
      addButton
    ]
  );

  const fromDateInput = createElement(
    'input',
    {
      className: 'form-control',

      attributes: {
        id:
          'payment-from-date-filter',

        type: 'date',

        'aria-label':
          'Lọc từ ngày'
      },

      dataset: {
        testid:
          'payment-from-date-filter'
      }
    }
  );

  const toDateInput = createElement(
    'input',
    {
      className: 'form-control',

      attributes: {
        id:
          'payment-to-date-filter',

        type: 'date',

        'aria-label':
          'Lọc đến ngày'
      },

      dataset: {
        testid:
          'payment-to-date-filter'
      }
    }
  );

  const methodFilter = createElement(
    'select',
    {
      className: 'form-select',

      attributes: {
        id:
          'payment-method-filter',

        'aria-label':
          'Lọc theo phương thức'
      },

      dataset: {
        testid:
          'payment-method-filter'
      }
    }
  );

  const roomFilter = createElement(
    'select',
    {
      className: 'form-select',

      attributes: {
        id:
          'payment-room-filter',

        'aria-label':
          'Lọc theo phòng'
      },

      dataset: {
        testid:
          'payment-room-filter'
      }
    }
  );

  const clearFilterButton =
    createElement('button', {
      className:
        'btn btn-outline-secondary',

      text: 'Xóa bộ lọc',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'payment-clear-filter'
      }
    });

  const toolbar = createElement(
    'div',
    {
      className:
        'rm-payments-toolbar'
    },
    [
      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Từ ngày',

            attributes: {
              for:
                'payment-from-date-filter'
            }
          }),

          fromDateInput
        ]
      ),

      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Đến ngày',

            attributes: {
              for:
                'payment-to-date-filter'
            }
          }),

          toDateInput
        ]
      ),

      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Phương thức',

            attributes: {
              for:
                'payment-method-filter'
            }
          }),

          methodFilter
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
                'payment-room-filter'
            }
          }),

          roomFilter
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-payment-clear-filter'
        },
        [clearFilterButton]
      )
    ]
  );

  const transactionCountValue =
    createElement('strong', {
      text: '0',

      dataset: {
        testid:
          'payment-transaction-count'
      }
    });

  const totalPaidValue =
    createElement('strong', {
      text:
        formatVietnameseCurrency(0),

      dataset: {
        testid:
          'payment-visible-total'
      }
    });

  const remainingDebtValue =
    createElement('strong', {
      text:
        formatVietnameseCurrency(0),

      dataset: {
        testid:
          'payment-total-debt'
      }
    });

  const summary = createElement(
    'div',
    {
      className:
        'rm-payment-summary'
    },
    [
      createElement(
        'div',
        {
          className:
            'rm-payment-summary-card'
        },
        [
          createElement('span', {
            text:
              'Số giao dịch'
          }),

          transactionCountValue
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-payment-summary-card'
        },
        [
          createElement('span', {
            text:
              'Tổng đã thu'
          }),

          totalPaidValue
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-payment-summary-card rm-payment-summary-card--debt'
        },
        [
          createElement('span', {
            text:
              'Tổng công nợ hiện tại'
          }),

          remainingDebtValue
        ]
      )
    ]
  );

  const resultCount = createElement('span', {
    className:
      'small text-body-secondary',

    text: '0 giao dịch',

    dataset: {
      testid:
        'payment-result-count'
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
          'Mã giao dịch',
          'Ngày',
          'Hóa đơn',
          'Phòng',
          'Phương thức',
          'Số tiền',
          'Mã tham chiếu',
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

  const tableBody = createElement(
    'tbody',
    {
      dataset: {
        testid:
          'payment-table-body'
      }
    }
  );

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-payments-table',

      dataset: {
        testid:
          'payment-table'
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
        'table-responsive rm-payments-table-wrapper'
    },
    [table]
  );

  const emptyTitle = createElement('h3', {
    className: 'h5 mb-2',
    text: 'Chưa có giao dịch'
  });

  const emptyDescription = createElement(
    'p',
    {
      className:
        'mb-3 text-body-secondary',

      text:
        'Hãy thêm giao dịch thanh toán đầu tiên.'
    }
  );

  const emptyAddButton =
    createElement('button', {
      className: 'btn btn-primary',
      text: 'Thêm thanh toán',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'payment-empty-add-button'
      }
    });

  const emptyState = createElement(
    'div',
    {
      className:
        'rm-payments-empty',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'payments-empty-state'
      }
    },
    [
      createElement('div', {
        className:
          'rm-payments-empty-icon',

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
            text:
              'Lịch sử giao dịch'
          }),

          resultCount
        ]
      ),

      tableWrapper,
      emptyState
    ]
  );

  const paymentForm =
    createPaymentForm({
      async onSubmit(data) {
        const createdPayment =
          paymentService.createPayment(
            data
          );

        showToast({
          type: 'success',
          title:
            'Thanh toán thành công',

          message:
            `Đã ghi nhận giao dịch ${
              createdPayment.code ??
              createdPayment.id
            }.`
        });

        refreshData();
      }
    });

  page.append(
    heading,
    toolbar,
    summary,
    contentCard,
    paymentForm.element
  );

  function getInvoiceById(invoiceId) {
    return (
      state.invoices.find(
        (invoice) =>
          invoice.id === invoiceId
      ) ?? null
    );
  }

  function getRoomById(roomId) {
    return (
      state.rooms.find(
        (room) =>
          room.id === roomId
      ) ?? null
    );
  }

  function getInvoiceRoomLabel(invoice) {
    if (!invoice) {
      return 'Không xác định';
    }

    if (invoice.roomSnapshot) {
      return (
        `${invoice.roomSnapshot.code} — ` +
        `${invoice.roomSnapshot.name}`
      );
    }

    const room =
      getRoomById(invoice.roomId);

    return room
      ? `${room.code} — ${room.name}`
      : invoice.roomId;
  }

  function getPayableInvoices() {
    return state.invoices
      .filter((invoice) => {
        const remainingDebt =
          Number(
            invoice.remainingDebt ?? 0
          );

        return (
          invoice.documentStatus !==
            INVOICE_DOCUMENT_STATUS.CANCELLED &&
          Number.isFinite(
            remainingDebt
          ) &&
          remainingDebt > 0
        );
      })
      .sort(
        (firstInvoice, secondInvoice) => {
          const periodComparison =
            String(
              secondInvoice.period
            ).localeCompare(
              String(
                firstInvoice.period
              )
            );

          if (periodComparison !== 0) {
            return periodComparison;
          }

          return String(
            firstInvoice.code
          ).localeCompare(
            String(
              secondInvoice.code
            ),
            'vi'
          );
        }
      );
  }

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

  function populateMethodFilter() {
    const selectedMethod =
      state.method;

    const methods = new Set([
      'cash',
      'bankTransfer',
      'eWallet'
    ]);

    state.payments.forEach((payment) => {
      const method =
        normalizeMethod(
          payment.method
        );

      if (method) {
        methods.add(method);
      }
    });

    methodFilter.replaceChildren(
      createElement('option', {
        text:
          'Tất cả phương thức',

        attributes: {
          value: ''
        }
      })
    );

    [...methods].forEach((method) => {
      methodFilter.append(
        createElement('option', {
          text:
            getMethodLabel(method),

          attributes: {
            value: method
          }
        })
      );
    });

    methodFilter.value =
      selectedMethod;
  }

  function getFilteredPayments() {
    const filters = {};

    if (state.fromDate) {
      filters.fromDate =
        state.fromDate;
    }

    if (state.toDate) {
      filters.toDate =
        state.toDate;
    }

    if (state.method) {
      filters.method =
        state.method;
    }

    let payments =
      paymentService.filterPayments(
        filters
      );

    if (state.roomId) {
      payments = payments.filter(
        (payment) => {
          const invoice =
            getInvoiceById(
              payment.invoiceId
            );

          return (
            invoice?.roomId ===
            state.roomId
          );
        }
      );
    }

    return payments;
  }

  function renderSummary() {
    const visibleTotal =
      state.payments.reduce(
        (total, payment) =>
          total +
          Number(payment.amount ?? 0),
        0
      );

    const currentDebt =
      state.invoices
        .filter(
          (invoice) =>
            invoice.documentStatus !==
            INVOICE_DOCUMENT_STATUS.CANCELLED
        )
        .reduce(
          (total, invoice) =>
            total +
            Number(
              invoice.remainingDebt ?? 0
            ),
          0
        );

    transactionCountValue.textContent =
      String(state.payments.length);

    totalPaidValue.textContent =
      formatVietnameseCurrency(
        visibleTotal
      );

    remainingDebtValue.textContent =
      formatVietnameseCurrency(
        currentDebt
      );
  }

  function renderPayments() {
    resultCount.textContent =
      `${state.payments.length} giao dịch`;

    tableBody.replaceChildren();

    tableWrapper.hidden =
      state.payments.length === 0;

    emptyState.hidden =
      state.payments.length > 0;

    if (state.payments.length === 0) {
      const hasFilters =
        Boolean(state.fromDate) ||
        Boolean(state.toDate) ||
        Boolean(state.method) ||
        Boolean(state.roomId);

      if (hasFilters) {
        emptyTitle.textContent =
          'Không tìm thấy giao dịch';

        emptyDescription.textContent =
          'Không có giao dịch phù hợp với bộ lọc hiện tại.';

        emptyAddButton.hidden = true;
      } else {
        emptyTitle.textContent =
          'Chưa có giao dịch';

        emptyDescription.textContent =
          'Hãy thêm giao dịch thanh toán đầu tiên.';

        emptyAddButton.hidden = false;
      }

      return;
    }

    state.payments.forEach((payment) => {
      const invoice =
        getInvoiceById(
          payment.invoiceId
        );

      const transactionCode =
        payment.code ??
        payment.id;

      const row = createElement('tr', {
        dataset: {
          paymentId:
            payment.id,

          testid:
            `payment-row-${payment.id}`
        }
      });

      row.append(
        createTableCell(
          'Mã giao dịch',

          createElement('strong', {
            text:
              transactionCode
          })
        ),

        createTableCell(
          'Ngày',

          formatDisplayDate(
            payment.paymentDate ??
            payment.date
          ),

          'text-nowrap'
        ),

        createTableCell(
          'Hóa đơn',

          invoice?.code ??
          payment.invoiceId
        ),

        createTableCell(
          'Phòng',

          getInvoiceRoomLabel(
            invoice
          )
        ),

        createTableCell(
          'Phương thức',

          createMethodBadge(
            payment.method
          )
        ),

        createTableCell(
          'Số tiền',

          formatVietnameseCurrency(
            payment.amount
          ),

          'text-nowrap text-lg-end fw-semibold'
        ),

        createTableCell(
          'Mã tham chiếu',

          payment.reference ||
          '—'
        ),

        createTableCell(
          'Thao tác',

          createDeleteButton(
            payment
          ),

          'rm-payment-actions-cell'
        )
      );

      tableBody.append(row);
    });
  }

  function refreshData() {
    try {
      state.invoices =
        invoiceService.getInvoices();

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

      state.payments =
        getFilteredPayments();

      populateRoomFilter();
      populateMethodFilter();
      renderSummary();
      renderPayments();
    } catch (error) {
      state.payments = [];

      renderSummary();
      renderPayments();

      showToast({
        type: 'danger',
        title:
          'Không thể tải thanh toán',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách giao dịch.'
      });
    }
  }

  function openCreateForm() {
    /*
     * Đọc lại hóa đơn để số tiền công nợ trong form
     * luôn là dữ liệu mới nhất.
     */
    state.invoices =
      invoiceService.getInvoices();

    const invoices =
      getPayableInvoices();

    if (invoices.length === 0) {
      showToast({
        type: 'warning',
        title:
          'Không có hóa đơn còn nợ',

        message:
          'Hiện không có hóa đơn phù hợp để ghi nhận thanh toán.'
      });

      return;
    }

    paymentForm.open({
      invoices
    });
  }

  async function deletePayment(payment) {
    const invoice =
      getInvoiceById(
        payment.invoiceId
      );

    const confirmed =
      await showConfirmDialog({
        title:
          `Xóa giao dịch ${
            payment.code ??
            payment.id
          }?`,

        message:
          `Số tiền ${formatVietnameseCurrency(
            payment.amount
          )} sẽ được trừ khỏi số tiền đã trả của hóa đơn ${
            invoice?.code ??
            payment.invoiceId
          }.`,

        confirmText:
          'Xóa giao dịch',

        cancelText: 'Hủy',

        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      paymentService.deletePayment(
        payment.id
      );

      showToast({
        type: 'success',
        title:
          'Đã xóa giao dịch',

        message:
          'Công nợ hóa đơn đã được tính lại.'
      });

      refreshData();
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể xóa',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể xóa giao dịch thanh toán.'
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

  fromDateInput.addEventListener(
    'change',
    () => {
      state.fromDate =
        fromDateInput.value;

      refreshData();
    }
  );

  toDateInput.addEventListener(
    'change',
    () => {
      state.toDate =
        toDateInput.value;

      refreshData();
    }
  );

  methodFilter.addEventListener(
    'change',
    () => {
      state.method =
        methodFilter.value;

      refreshData();
    }
  );

  roomFilter.addEventListener(
    'change',
    () => {
      state.roomId =
        roomFilter.value;

      refreshData();
    }
  );

  clearFilterButton.addEventListener(
    'click',
    () => {
      state.fromDate = '';
      state.toDate = '';
      state.method = '';
      state.roomId = '';

      fromDateInput.value = '';
      toDateInput.value = '';
      methodFilter.value = '';
      roomFilter.value = '';

      refreshData();
    }
  );

  tableBody.addEventListener(
    'click',
    (event) => {
      const button =
        event.target.closest(
          'button[data-action][data-payment-id]'
        );

      if (!button) {
        return;
      }

      const payment =
        paymentService.getPaymentById(
          button.dataset.paymentId
        );

      if (!payment) {
        showToast({
          type: 'danger',
          title:
            'Không tìm thấy giao dịch',

          message:
            'Giao dịch không còn tồn tại.'
        });

        refreshData();
        return;
      }

      if (
        button.dataset.action ===
        'delete'
      ) {
        deletePayment(payment);
      }
    }
  );

  refreshData();

  return page;
}

export const createPage =
  createPaymentsPage;

export default createPaymentsPage;