import '../styles/debts.css';

import debtService from '../services/debt-service.js';
import invoiceService from '../services/invoice-service.js';

const CURRENCY_FORMATTER =
  new Intl.NumberFormat(
    'vi-VN',
    {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }
  );

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    'vi-VN',
    {
      maximumFractionDigits: 2
    }
  );

const PAYMENT_STATUS_LABELS =
  Object.freeze({
    unpaid: 'Chưa thanh toán',
    partiallyPaid:
      'Thanh toán một phần',
    partially_paid:
      'Thanh toán một phần',
    partial:
      'Thanh toán một phần',
    paid: 'Đã thanh toán',
    overdue: 'Quá hạn'
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
  const element =
    document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== null) {
    element.textContent = text;
  }

  Object.entries(attributes)
    .forEach(([name, value]) => {
      if (
        value !== null &&
        value !== undefined
      ) {
        element.setAttribute(
          name,
          String(value)
        );
      }
    });

  Object.entries(dataset)
    .forEach(([name, value]) => {
      element.dataset[name] =
        String(value);
    });

  element.append(...children);

  return element;
}

function formatCurrency(value) {
  const numericValue = Number(value);

  return CURRENCY_FORMATTER.format(
    Number.isFinite(numericValue)
      ? numericValue
      : 0
  );
}

function formatNumber(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? NUMBER_FORMATTER.format(
        numericValue
      )
    : '—';
}

function formatDisplayDate(value) {
  if (
    typeof value !== 'string' ||
    !value
  ) {
    return '—';
  }

  const [year, month, day] =
    value.split('-');

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function getCurrentDateInVietnam() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(new Date());

  const values =
    Object.fromEntries(
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

function getRoomLabel(invoice) {
  if (invoice.roomSnapshot) {
    const roomCode =
      invoice.roomSnapshot.code ??
      invoice.roomId;

    const roomName =
      invoice.roomSnapshot.name ??
      '';

    return roomName
      ? `${roomCode} — ${roomName}`
      : roomCode;
  }

  return invoice.roomId;
}

function createPaymentStatusBadge(
  status
) {
  const normalizedStatus =
    String(status ?? 'unpaid');

  return createElement('span', {
    className:
      `rm-debt-badge ` +
      `rm-debt-badge--${normalizedStatus}`,

    text:
      PAYMENT_STATUS_LABELS[
        normalizedStatus
      ] ??
      normalizedStatus,

    dataset: {
      testid:
        `debt-payment-status-${normalizedStatus}`
    }
  });
}

function createOverdueBadge(
  daysOverdue
) {
  if (daysOverdue <= 0) {
    return createElement('span', {
      className:
        'rm-debt-due-label rm-debt-due-label--normal',

      text: 'Chưa quá hạn',

      dataset: {
        testid:
          'debt-not-overdue'
      }
    });
  }

  return createElement('span', {
    className:
      'rm-debt-due-label rm-debt-due-label--overdue',

    text:
      `${daysOverdue} ngày`,

    dataset: {
      testid:
        'debt-days-overdue'
    }
  });
}

export function createDebtsPage() {
  const state = {
    currentDate:
      getCurrentDateInVietnam(),

    allInvoices: [],
    visibleInvoices: [],
    roomGroups: [],
    monthGroups: [],

    roomId: '',
    month: '',
    overdueOnly: false
  };

  const page = createElement('section', {
    className: 'rm-debts-page',

    dataset: {
      testid: 'debts-page'
    }
  });

  const titleGroup =
    createElement('div');

  titleGroup.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Theo dõi công nợ'
    }),

    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Theo dõi các phòng còn nợ và hóa đơn quá hạn.'
    })
  );

  const heading = createElement(
    'div',
    {
      className:
        'rm-debts-heading'
    },
    [titleGroup]
  );

  const roomFilter =
    createElement('select', {
      className: 'form-select',

      attributes: {
        id: 'debt-room-filter',

        'aria-label':
          'Lọc công nợ theo phòng'
      },

      dataset: {
        testid:
          'debt-room-filter'
      }
    });

  const monthFilter =
    createElement('select', {
      className: 'form-select',

      attributes: {
        id: 'debt-month-filter',

        'aria-label':
          'Lọc công nợ theo tháng'
      },

      dataset: {
        testid:
          'debt-month-filter'
      }
    });

  const overdueFilter =
    createElement('select', {
      className: 'form-select',

      attributes: {
        id:
          'debt-overdue-filter',

        'aria-label':
          'Lọc hóa đơn quá hạn'
      },

      dataset: {
        testid:
          'debt-overdue-filter'
      }
    });

  overdueFilter.append(
    createElement('option', {
      text:
        'Tất cả hóa đơn còn nợ',

      attributes: {
        value: 'all'
      }
    }),

    createElement('option', {
      text:
        'Chỉ hóa đơn quá hạn',

      attributes: {
        value: 'overdue'
      }
    })
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
          'debt-clear-filter'
      }
    });

  const toolbar = createElement(
    'div',
    {
      className:
        'rm-debts-toolbar'
    },
    [
      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Phòng',

            attributes: {
              for:
                'debt-room-filter'
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
            text: 'Tháng',

            attributes: {
              for:
                'debt-month-filter'
            }
          }),

          monthFilter
        ]
      ),

      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Quá hạn',

            attributes: {
              for:
                'debt-overdue-filter'
            }
          }),

          overdueFilter
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-debt-clear-filter'
        },
        [clearFilterButton]
      )
    ]
  );

  const totalDebtValue =
    createElement('strong', {
      text: formatCurrency(0),

      dataset: {
        testid:
          'debt-total-value'
      }
    });

  const overdueDebtValue =
    createElement('strong', {
      text: formatCurrency(0),

      dataset: {
        testid:
          'debt-overdue-value'
      }
    });

  const roomCountValue =
    createElement('strong', {
      text: '0',

      dataset: {
        testid:
          'debt-room-count'
      }
    });

  const visibleDebtValue =
    createElement('strong', {
      text: formatCurrency(0),

      dataset: {
        testid:
          'debt-visible-value'
      }
    });

  function createSummaryCard({
    label,
    valueElement,
    className = ''
  }) {
    return createElement(
      'article',
      {
        className:
          `rm-debt-summary-card ${className}`
      },
      [
        createElement('span', {
          text: label
        }),

        valueElement
      ]
    );
  }

  const summary = createElement(
    'div',
    {
      className:
        'rm-debt-summary'
    },
    [
      createSummaryCard({
        label:
          'Tổng công nợ',

        valueElement:
          totalDebtValue
      }),

      createSummaryCard({
        label:
          'Công nợ quá hạn',

        valueElement:
          overdueDebtValue,

        className:
          'rm-debt-summary-card--overdue'
      }),

      createSummaryCard({
        label:
          'Phòng còn nợ',

        valueElement:
          roomCountValue
      }),

      createSummaryCard({
        label:
          'Công nợ theo bộ lọc',

        valueElement:
          visibleDebtValue
      })
    ]
  );

  const resultCount =
    createElement('span', {
      className:
        'small text-body-secondary',

      text: '0 hóa đơn',

      dataset: {
        testid:
          'debt-result-count'
      }
    });

  const tableBody =
    createElement('tbody', {
      dataset: {
        testid:
          'debt-table-body'
      }
    });

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-debts-table',

      dataset: {
        testid:
          'debt-table'
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
              'Phòng',
              'Hóa đơn',
              'Tháng',
              'Hạn thanh toán',
              'Số ngày quá hạn',
              'Trạng thái',
              'Còn nợ',
              'Chi tiết'
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

      tableBody
    ]
  );

  const tableWrapper =
    createElement(
      'div',
      {
        className:
          'table-responsive rm-debts-table-wrapper'
      },
      [table]
    );

  const emptyTitle =
    createElement('h3', {
      className: 'h5 mb-2',
      text:
        'Không có công nợ'
    });

  const emptyDescription =
    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Không có hóa đơn còn nợ phù hợp với bộ lọc hiện tại.'
    });

  const emptyState =
    createElement(
      'div',
      {
        className:
          'rm-debts-empty',

        attributes: {
          hidden: ''
        },

        dataset: {
          testid:
            'debts-empty-state'
        }
      },
      [
        createElement('div', {
          className:
            'rm-debts-empty-icon',

          text: '✓',

          attributes: {
            'aria-hidden': 'true'
          }
        }),

        emptyTitle,
        emptyDescription
      ]
    );

  const card = createElement(
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
              'Danh sách phòng còn nợ'
          }),

          resultCount
        ]
      ),

      tableWrapper,
      emptyState
    ]
  );

  const detailTitle =
    createElement('h2', {
      className:
        'rm-debt-detail-title',

      text:
        'Chi tiết hóa đơn',

      attributes: {
        id:
          'debtInvoiceDetailTitle'
      },

      dataset: {
        testid:
          'debt-invoice-detail-title'
      }
    });

  const detailContent =
    createElement('div', {
      className:
        'rm-debt-detail-content',

      dataset: {
        testid:
          'debt-invoice-detail-content'
      }
    });

  const closeDetailButton =
    createElement('button', {
      className:
        'btn btn-outline-secondary',

      text: 'Đóng',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'debt-invoice-detail-close'
      }
    });

  const detailDialog =
    createElement(
      'dialog',
      {
        className:
          'rm-debt-detail-dialog',

        attributes: {
          'aria-labelledby':
            'debtInvoiceDetailTitle'
        },

        dataset: {
          testid:
            'debt-invoice-detail-dialog'
        }
      },
      [
        createElement(
          'div',
          {
            className:
              'rm-debt-detail-dialog-inner'
          },
          [
            createElement(
              'header',
              {
                className:
                  'rm-debt-detail-header'
              },
              [
                detailTitle,

                createElement('button', {
                  className:
                    'btn-close',

                  attributes: {
                    type: 'button',
                    'aria-label':
                      'Đóng chi tiết hóa đơn'
                  },

                  dataset: {
                    action:
                      'close-detail'
                  }
                })
              ]
            ),

            detailContent,

            createElement(
              'footer',
              {
                className:
                  'rm-debt-detail-footer'
              },
              [closeDetailButton]
            )
          ]
        )
      ]
    );

  page.append(
    heading,
    toolbar,
    summary,
    card,
    detailDialog
  );

  function populateRoomFilter() {
    const selectedRoomId =
      state.roomId;

    roomFilter.replaceChildren(
      createElement('option', {
        text:
          'Tất cả phòng',

        attributes: {
          value: ''
        }
      })
    );

    state.roomGroups.forEach(
      (group) => {
        const roomCode =
          group.roomSnapshot?.code ??
          group.roomId;

        const roomName =
          group.roomSnapshot?.name ??
          '';

        const label = roomName
          ? `${roomCode} — ${roomName}`
          : roomCode;

        roomFilter.append(
          createElement('option', {
            text:
              `${label} (${formatCurrency(
                group.totalDebt
              )})`,

            attributes: {
              value: group.roomId
            }
          })
        );
      }
    );

    if (
      state.roomGroups.some(
        (group) =>
          group.roomId ===
          selectedRoomId
      )
    ) {
      roomFilter.value =
        selectedRoomId;
    } else {
      state.roomId = '';
      roomFilter.value = '';
    }
  }

  function populateMonthFilter() {
    const selectedMonth =
      state.month;

    monthFilter.replaceChildren(
      createElement('option', {
        text:
          'Tất cả tháng',

        attributes: {
          value: ''
        }
      })
    );

    state.monthGroups.forEach(
      (group) => {
        monthFilter.append(
          createElement('option', {
            text:
              `${group.month} (${formatCurrency(
                group.totalDebt
              )})`,

            attributes: {
              value: group.month
            }
          })
        );
      }
    );

    if (
      state.monthGroups.some(
        (group) =>
          group.month ===
          selectedMonth
      )
    ) {
      monthFilter.value =
        selectedMonth;
    } else {
      state.month = '';
      monthFilter.value = '';
    }
  }

  function applyFilters() {
    state.visibleInvoices =
      state.allInvoices
        .filter((invoice) => {
          if (
            state.roomId &&
            invoice.roomId !==
              state.roomId
          ) {
            return false;
          }

          if (
            state.month &&
            invoice.period !==
              state.month
          ) {
            return false;
          }

          if (
            state.overdueOnly &&
            debtService
              .calculateDaysOverdue(
                invoice.dueDate,
                state.currentDate
              ) <= 0
          ) {
            return false;
          }

          return true;
        })
        .sort(
          (
            firstInvoice,
            secondInvoice
          ) =>
            secondInvoice
              .remainingDebt -
            firstInvoice
              .remainingDebt
        );
  }

  function renderSummary() {
    const overdueInvoices =
      debtService.getOverdueInvoices(
        state.currentDate
      );

    const overdueDebt =
      overdueInvoices.reduce(
        (total, invoice) =>
          total +
          invoice.remainingDebt,
        0
      );

    const visibleDebt =
      state.visibleInvoices.reduce(
        (total, invoice) =>
          total +
          invoice.remainingDebt,
        0
      );

    totalDebtValue.textContent =
      formatCurrency(
        debtService.getTotalDebt()
      );

    overdueDebtValue.textContent =
      formatCurrency(overdueDebt);

    roomCountValue.textContent =
      String(
        state.roomGroups.length
      );

    visibleDebtValue.textContent =
      formatCurrency(visibleDebt);
  }

  function renderTable() {
    resultCount.textContent =
      `${state.visibleInvoices.length} hóa đơn`;

    tableBody.replaceChildren();

    tableWrapper.hidden =
      state.visibleInvoices.length ===
      0;

    emptyState.hidden =
      state.visibleInvoices.length >
      0;

    if (
      state.visibleInvoices.length ===
      0
    ) {
      return;
    }

    state.visibleInvoices.forEach(
      (invoice) => {
        const daysOverdue =
          debtService
            .calculateDaysOverdue(
              invoice.dueDate,
              state.currentDate
            );

        const detailLink =
          createElement('a', {
            className:
              'rm-debt-detail-link',

            text: 'Xem chi tiết',

            attributes: {
              href:
                `#/invoices?invoiceId=` +
                encodeURIComponent(
                  invoice.id
                )
            },

            dataset: {
              action:
                'view-invoice',

              invoiceId:
                invoice.id,

              testid:
                `debt-view-invoice-${invoice.id}`
            }
          });

        const invoiceInformation =
          createElement('div');

        invoiceInformation.append(
          createElement('strong', {
            text:
              invoice.code ??
              invoice.id
          }),

          createElement('div', {
            className:
              'small text-body-secondary',

            text:
              `Tổng: ${formatCurrency(
                invoice.total ?? 0
              )}`
          })
        );

        const row =
          createElement('tr', {
            className:
              daysOverdue > 0
                ? 'rm-debt-row--overdue'
                : '',

            dataset: {
              invoiceId:
                invoice.id,

              roomId:
                invoice.roomId,

              testid:
                `debt-row-${invoice.id}`
            }
          });

        row.append(
          createTableCell(
            'Phòng',

            createElement('strong', {
              text:
                getRoomLabel(invoice)
            })
          ),

          createTableCell(
            'Hóa đơn',
            invoiceInformation
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
            'Số ngày quá hạn',

            createOverdueBadge(
              daysOverdue
            )
          ),

          createTableCell(
            'Trạng thái',

            createPaymentStatusBadge(
              invoice.paymentStatus ??
              (
                daysOverdue > 0
                  ? 'overdue'
                  : 'unpaid'
              )
            )
          ),

          createTableCell(
            'Còn nợ',

            formatCurrency(
              invoice.remainingDebt
            ),

            'text-nowrap text-lg-end rm-debt-amount'
          ),

          createTableCell(
            'Chi tiết',
            detailLink,
            'text-end'
          )
        );

        tableBody.append(row);
      }
    );
  }

  function refreshView() {
    applyFilters();
    renderSummary();
    renderTable();
  }

  function refreshData() {
    try {
      state.allInvoices =
        debtService
          .getOutstandingInvoices();

      state.roomGroups =
        debtService.getDebtByRoom();

      state.monthGroups =
        debtService.getDebtByMonth();

      populateRoomFilter();
      populateMonthFilter();
      refreshView();
    } catch (error) {
      state.allInvoices = [];
      state.visibleInvoices = [];
      state.roomGroups = [];
      state.monthGroups = [];

      populateRoomFilter();
      populateMonthFilter();
      renderSummary();
      renderTable();

      emptyTitle.textContent =
        'Không thể tải công nợ';

      emptyDescription.textContent =
        error instanceof Error
          ? error.message
          : 'Dữ liệu công nợ không hợp lệ.';
    }
  }

  function createDetailInformationItem(
    label,
    value
  ) {
    return createElement(
      'div',
      {
        className:
          'rm-debt-detail-info-item'
      },
      [
        createElement('span', {
          text: label
        }),

        createElement('strong', {
          text:
            String(value ?? '—')
        })
      ]
    );
  }

  function createInvoiceItemsTable(
    invoice
  ) {
    const items = Array.isArray(
      invoice.items
    )
      ? invoice.items
      : [];

    const body =
      createElement('tbody');

    if (items.length === 0) {
      body.append(
        createElement('tr', {}, [
          createElement('td', {
            className:
              'text-center text-body-secondary py-4',

            text:
              'Hóa đơn không có khoản thu.',

            attributes: {
              colspan: '5'
            }
          })
        ])
      );
    }

    items.forEach(
      (item, index) => {
        body.append(
          createElement(
            'tr',
            {
              dataset: {
                testid:
                  `debt-detail-item-${item.id ?? index}`
              }
            },
            [
              createElement('td', {
                text:
                  item.name ??
                  item.serviceName ??
                  `Khoản ${index + 1}`
              }),

              createElement('td', {
                text:
                  item.unit ?? '—'
              }),

              createElement('td', {
                className:
                  'text-end',

                text:
                  formatNumber(
                    item.quantity ?? 0
                  )
              }),

              createElement('td', {
                className:
                  'text-end text-nowrap',

                text:
                  formatCurrency(
                    item.unitPrice ??
                    item.unitPriceAtInvoice ??
                    0
                  )
              }),

              createElement('td', {
                className:
                  'text-end text-nowrap fw-semibold',

                text:
                  formatCurrency(
                    item.amount ?? 0
                  )
              })
            ]
          )
        );
      }
    );

    return createElement(
      'div',
      {
        className:
          'table-responsive'
      },
      [
        createElement(
          'table',
          {
            className:
              'table align-middle rm-debt-detail-items-table',

            dataset: {
              testid:
                'debt-detail-items-table'
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
                    'Đơn vị',
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

            body
          ]
        )
      ]
    );
  }

  function openInvoiceDetail(
    invoiceId
  ) {
    const invoice =
      invoiceService.getInvoiceById(
        invoiceId
      );

    if (!invoice) {
      emptyTitle.textContent =
        'Không tìm thấy hóa đơn';

      emptyDescription.textContent =
        'Hóa đơn được chọn không còn tồn tại.';

      return;
    }

    detailTitle.textContent =
      `Chi tiết hóa đơn ${
        invoice.code ?? invoice.id
      }`;

    const information =
      createElement(
        'section',
        {
          className:
            'rm-debt-detail-information'
        },
        [
          createDetailInformationItem(
            'Mã hóa đơn',
            invoice.code ??
            invoice.id
          ),

          createDetailInformationItem(
            'Phòng',
            getRoomLabel(invoice)
          ),

          createDetailInformationItem(
            'Tháng',
            invoice.period ??
            invoice.month
          ),

          createDetailInformationItem(
            'Hạn thanh toán',
            formatDisplayDate(
              invoice.dueDate
            )
          )
        ]
      );

    const totals =
      createElement(
        'section',
        {
          className:
            'rm-debt-detail-totals'
        },
        [
          createElement('div', {}, [
            createElement('span', {
              text: 'Tạm tính'
            }),

            createElement('strong', {
              text:
                formatCurrency(
                  invoice.subtotal ?? 0
                )
            })
          ]),

          createElement('div', {}, [
            createElement('span', {
              text: 'Giảm giá'
            }),

            createElement('strong', {
              text:
                formatCurrency(
                  invoice.discount ?? 0
                )
            })
          ]),

          createElement(
            'div',
            {
              className:
                'rm-debt-detail-total'
            },
            [
              createElement('span', {
                text: 'Tổng tiền'
              }),

              createElement('strong', {
                text:
                  formatCurrency(
                    invoice.total ?? 0
                  )
              })
            ]
          ),

          createElement('div', {}, [
            createElement('span', {
              text: 'Đã trả'
            }),

            createElement('strong', {
              text:
                formatCurrency(
                  invoice.paidAmount ?? 0
                )
            })
          ]),

          createElement(
            'div',
            {
              className:
                'rm-debt-detail-remaining'
            },
            [
              createElement('span', {
                text: 'Còn nợ'
              }),

              createElement('strong', {
                text:
                  formatCurrency(
                    invoice.remainingDebt ??
                    0
                  )
              })
            ]
          )
        ]
      );

    const content = [
      information,
      createInvoiceItemsTable(
        invoice
      ),
      totals
    ];

    if (invoice.note) {
      content.push(
        createElement(
          'section',
          {
            className:
              'rm-debt-detail-note'
          },
          [
            createElement('strong', {
              text: 'Ghi chú'
            }),

            createElement('p', {
              className: 'mb-0',
              text: invoice.note
            })
          ]
        )
      );
    }

    detailContent.replaceChildren(
      ...content
    );

    if (
      typeof detailDialog.showModal ===
      'function'
    ) {
      if (!detailDialog.open) {
        detailDialog.showModal();
      }

      return;
    }

    detailDialog.setAttribute(
      'open',
      ''
    );
  }

  function closeInvoiceDetail() {
    if (
      typeof detailDialog.close ===
        'function' &&
      detailDialog.open
    ) {
      detailDialog.close();
      return;
    }

    detailDialog.removeAttribute(
      'open'
    );
  }

  roomFilter.addEventListener(
    'change',
    () => {
      state.roomId =
        roomFilter.value;

      refreshView();
    }
  );

  monthFilter.addEventListener(
    'change',
    () => {
      state.month =
        monthFilter.value;

      refreshView();
    }
  );

  overdueFilter.addEventListener(
    'change',
    () => {
      state.overdueOnly =
        overdueFilter.value ===
        'overdue';

      refreshView();
    }
  );

  clearFilterButton.addEventListener(
    'click',
    () => {
      state.roomId = '';
      state.month = '';
      state.overdueOnly = false;

      roomFilter.value = '';
      monthFilter.value = '';
      overdueFilter.value = 'all';

      refreshView();
    }
  );

  tableBody.addEventListener(
    'click',
    (event) => {
      const link =
        event.target.closest(
          'a[data-action="view-invoice"][data-invoice-id]'
        );

      if (!link) {
        return;
      }

      event.preventDefault();

      openInvoiceDetail(
        link.dataset.invoiceId
      );
    }
  );

  closeDetailButton.addEventListener(
    'click',
    closeInvoiceDetail
  );

  detailDialog.addEventListener(
    'click',
    (event) => {
      const closeButton =
        event.target.closest(
          '[data-action="close-detail"]'
        );

      if (closeButton) {
        closeInvoiceDetail();
        return;
      }

      if (
        event.target === detailDialog
      ) {
        closeInvoiceDetail();
      }
    }
  );

  refreshData();

  return page;
}

export const createPage =
  createDebtsPage;

export default createDebtsPage;