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

function createInformationItem(
  label,
  value
) {
  return createElement(
    'div',
    {
      className:
        'rm-invoice-detail-info-item'
    },
    [
      createElement('span', {
        text: label
      }),

      createElement('strong', {
        text: String(value ?? '—')
      })
    ]
  );
}

function createStatusBadge(
  label,
  className,
  testId
) {
  return createElement('span', {
    className:
      `rm-invoice-badge ${className}`,

    text: label,

    dataset: {
      testid: testId
    }
  });
}

export function createInvoiceDetail() {
  const title = createElement('h2', {
    className:
      'modal-title fs-5',

    text: 'Chi tiết hóa đơn',

    attributes: {
      id:
        'invoiceDetailTitle'
    },

    dataset: {
      testid:
        'invoice-detail-title'
    }
  });

  const body = createElement('div', {
    className: 'modal-body',

    dataset: {
      testid:
        'invoice-detail-content'
    }
  });

  const printButton =
    createElement('button', {
      className:
        'btn btn-primary rm-invoice-no-print',

      text: 'In hóa đơn',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'invoice-detail-print'
      }
    });

  const modalContent = createElement(
    'div',
    {
      className:
        'modal-content rm-invoice-print-area'
    },
    [
      createElement(
        'div',
        {
          className: 'modal-header'
        },
        [
          title,

          createElement('button', {
            className:
              'btn-close rm-invoice-no-print',

            attributes: {
              type: 'button',
              'data-bs-dismiss': 'modal',
              'aria-label': 'Đóng'
            }
          })
        ]
      ),

      body,

      createElement(
        'div',
        {
          className:
            'modal-footer rm-invoice-no-print'
        },
        [
          createElement('button', {
            className:
              'btn btn-outline-secondary',

            text: 'Đóng',

            attributes: {
              type: 'button',
              'data-bs-dismiss': 'modal'
            },

            dataset: {
              testid:
                'invoice-detail-close'
            }
          }),

          printButton
        ]
      )
    ]
  );

  const element = createElement(
    'div',
    {
      className:
        'modal fade rm-invoice-detail-modal',

      attributes: {
        id:
          'invoiceDetailModal',

        tabindex: '-1',

        'aria-labelledby':
          'invoiceDetailTitle',

        'aria-hidden': 'true'
      },

      dataset: {
        testid:
          'invoice-detail-modal'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable'
        },
        [modalContent]
      )
    ]
  );

  function renderItems(invoice) {
    const tableBody =
      createElement('tbody');

    invoice.items.forEach(
      (item, index) => {
        const row = createElement('tr', {
          dataset: {
            testid:
              `invoice-detail-item-${item.id ?? index}`
          }
        });

        row.append(
          createElement('td', {
            text:
              item.name ??
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
              new Intl.NumberFormat(
                'vi-VN',
                {
                  maximumFractionDigits: 2
                }
              ).format(
                Number(
                  item.quantity ?? 0
                )
              )
          }),

          createElement('td', {
            className:
              'text-end text-nowrap',

            text:
              formatVietnameseCurrency(
                item.unitPrice ?? 0
              )
          }),

          createElement('td', {
            className:
              'text-end text-nowrap fw-semibold',

            text:
              formatVietnameseCurrency(
                item.amount ?? 0
              )
          })
        );

        tableBody.append(row);
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
              'table align-middle rm-invoice-detail-items-table',

            dataset: {
              testid:
                'invoice-detail-items-table'
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

            tableBody
          ]
        )
      ]
    );
  }

  function open(invoice) {
    if (
      !invoice ||
      typeof invoice !== 'object'
    ) {
      throw new TypeError(
        'Thông tin hóa đơn không hợp lệ.'
      );
    }

    title.textContent =
      `Hóa đơn ${invoice.code}`;

    const roomLabel =
      invoice.roomSnapshot
        ? `${invoice.roomSnapshot.code} — ${invoice.roomSnapshot.name}`
        : invoice.roomId;

    const statuses =
      createElement('div', {
        className:
          'd-flex flex-wrap gap-2'
      });

    const documentBadgeClass =
      invoice.documentStatus ===
      INVOICE_DOCUMENT_STATUS.DRAFT
        ? 'rm-invoice-badge--draft'
        : (
            invoice.documentStatus ===
            INVOICE_DOCUMENT_STATUS.FINALIZED
              ? 'rm-invoice-badge--finalized'
              : 'rm-invoice-badge--cancelled'
          );

    statuses.append(
      createStatusBadge(
        DOCUMENT_STATUS_LABELS[
          invoice.documentStatus
        ] ??
          invoice.documentStatus,

        documentBadgeClass,

        'invoice-detail-document-status'
      )
    );

    if (
      invoice.documentStatus !==
      INVOICE_DOCUMENT_STATUS.CANCELLED
    ) {
      const paymentBadgeClass =
        invoice.paymentStatus ===
        INVOICE_PAYMENT_STATUS.PAID
          ? 'rm-invoice-badge--paid'
          : (
              invoice.paymentStatus ===
              INVOICE_PAYMENT_STATUS.PARTIALLY_PAID
                ? 'rm-invoice-badge--partial'
                : (
                    invoice.paymentStatus ===
                    INVOICE_PAYMENT_STATUS.OVERDUE
                      ? 'rm-invoice-badge--overdue'
                      : 'rm-invoice-badge--unpaid'
                  )
            );

      statuses.append(
        createStatusBadge(
          PAYMENT_STATUS_LABELS[
            invoice.paymentStatus
          ] ??
            invoice.paymentStatus,

          paymentBadgeClass,

          'invoice-detail-payment-status'
        )
      );
    }

    const header = createElement(
      'section',
      {
        className:
          'rm-invoice-detail-header'
      },
      [
        createElement(
          'div',
          {},
          [
            createElement('div', {
              className:
                'rm-invoice-detail-brand',

              text: 'RoomMate'
            }),

            createElement('h3', {
              className:
                'h4 mb-1',

              text:
                'HÓA ĐƠN TIỀN PHÒNG'
            }),

            createElement('p', {
              className:
                'mb-0 text-body-secondary',

              text:
                `Tháng ${invoice.period}`
            })
          ]
        ),

        statuses
      ]
    );

    const information = createElement(
      'section',
      {
        className:
          'rm-invoice-detail-information'
      },
      [
        createInformationItem(
          'Mã hóa đơn',
          invoice.code
        ),

        createInformationItem(
          'Phòng',
          roomLabel
        ),

        createInformationItem(
          'Ngày lập',
          formatDisplayDate(
            invoice.issueDate
          )
        ),

        createInformationItem(
          'Hạn thanh toán',
          formatDisplayDate(
            invoice.dueDate
          )
        )
      ]
    );

    const totals = createElement(
      'section',
      {
        className:
          'rm-invoice-detail-totals'
      },
      [
        createElement(
          'div',
          {},
          [
            createElement('span', {
              text: 'Tạm tính'
            }),

            createElement('strong', {
              text:
                formatVietnameseCurrency(
                  invoice.subtotal ?? 0
                )
            })
          ]
        ),

        createElement(
          'div',
          {},
          [
            createElement('span', {
              text: 'Giảm giá'
            }),

            createElement('strong', {
              text:
                formatVietnameseCurrency(
                  invoice.discount ?? 0
                )
            })
          ]
        ),

        createElement(
          'div',
          {
            className:
              'rm-invoice-detail-total-row'
          },
          [
            createElement('span', {
              text: 'Tổng tiền'
            }),

            createElement('strong', {
              text:
                formatVietnameseCurrency(
                  invoice.total ?? 0
                )
            })
          ]
        ),

        createElement(
          'div',
          {},
          [
            createElement('span', {
              text: 'Đã trả'
            }),

            createElement('strong', {
              text:
                formatVietnameseCurrency(
                  invoice.paidAmount ?? 0
                )
            })
          ]
        ),

        createElement(
          'div',
          {
            className:
              'rm-invoice-detail-debt-row'
          },
          [
            createElement('span', {
              text: 'Còn nợ'
            }),

            createElement('strong', {
              text:
                formatVietnameseCurrency(
                  invoice.remainingDebt ?? 0
                )
            })
          ]
        )
      ]
    );

    const content = [
      header,
      information,
      renderItems(invoice),
      totals
    ];

    if (invoice.note) {
      content.push(
        createElement(
          'section',
          {
            className:
              'rm-invoice-detail-note'
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

    content.push(
      createElement('p', {
        className:
          'rm-invoice-detail-footer-text',

        text:
          'Cảm ơn quý khách đã sử dụng dịch vụ của RoomMate.'
      })
    );

    body.replaceChildren(...content);

    const Modal =
      window.bootstrap?.Modal;

    if (!Modal) {
      throw new Error(
        'Bootstrap Modal chưa được tải.'
      );
    }

    Modal.getOrCreateInstance(
      element
    ).show();
  }

  printButton.addEventListener(
    'click',
    () => {
      const cleanup = () => {
        document.body.classList.remove(
          'rm-printing-invoice'
        );
      };

      document.body.classList.add(
        'rm-printing-invoice'
      );

      window.addEventListener(
        'afterprint',
        cleanup,
        {
          once: true
        }
      );

      window.print();

      window.setTimeout(
        cleanup,
        1000
      );
    }
  );

  return Object.freeze({
    element,
    open
  });
}

export default createInvoiceDetail;