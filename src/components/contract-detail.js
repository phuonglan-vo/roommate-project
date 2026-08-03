import {
  CONTRACT_STATUS_LABELS
} from '../constants/statuses.js';

import {
  formatDateForDisplay
} from '../utils/date-utils.js';

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

function createDetailRow(label, value) {
  return [
    createElement('dt', {
      className:
        'col-sm-5 text-body-secondary',
      text: label
    }),
    createElement('dd', {
      className: 'col-sm-7 fw-medium',
      text: String(value ?? '—')
    })
  ];
}

export function createContractDetail() {
  const title = createElement('h2', {
    className: 'modal-title fs-5',
    text: 'Chi tiết hợp đồng',
    attributes: {
      id: 'contractDetailTitle'
    },
    dataset: {
      testid: 'contract-detail-title'
    }
  });

  const body = createElement('div', {
    className: 'modal-body',
    dataset: {
      testid: 'contract-detail-content'
    }
  });

  const element = createElement(
    'div',
    {
      className:
        'modal fade rm-contract-detail-modal',
      attributes: {
        id: 'contractDetailModal',
        tabindex: '-1',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby':
          'contractDetailTitle',
        'aria-hidden': 'true'
      },
      dataset: {
        testid: 'contract-detail-modal'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable'
        },
        [
          createElement(
            'div',
            {
              className: 'modal-content'
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
                    className: 'btn-close',
                    attributes: {
                      type: 'button',
                      'data-bs-dismiss':
                        'modal',
                      'aria-label': 'Đóng'
                    },
                    dataset: {
                      testid: 'contract-detail-close-icon'
                    }
                  })
                ]
              ),
              body,
              createElement(
                'div',
                {
                  className: 'modal-footer'
                },
                [
                  createElement('button', {
                    className:
                      'btn btn-outline-secondary',
                    text: 'Đóng',
                    attributes: {
                      type: 'button',
                      'data-bs-dismiss':
                        'modal'
                    },
                    dataset: {
                      testid:
                        'contract-detail-close'
                    }
                  })
                ]
              )
            ]
          )
        ]
      )
    ]
  );

  function open({
    contract,
    room,
    tenants = [],
    isExpiringSoon = false
  }) {
    if (
      !contract ||
      typeof contract !== 'object'
    ) {
      throw new TypeError(
        'Thông tin hợp đồng không hợp lệ.'
      );
    }

    title.textContent =
      contract.code ??
      'Chi tiết hợp đồng';

    const representative =
      tenants.find(
        (tenant) =>
          tenant.id ===
          contract.representativeTenantId
      );

    const roommates = tenants.filter(
      (tenant) =>
        tenant.id !==
        contract.representativeTenantId
    );

    const summary = createElement('dl', {
      className: 'row gy-3 mb-0'
    });

    const rows = [
      [
        'Mã hợp đồng',
        contract.code ?? contract.id
      ],
      [
        'Phòng',
        room
          ? `${room.code} — ${room.name}`
          : 'Phòng không tồn tại'
      ],
      [
        'Người đại diện',
        representative?.fullName ??
          'Không xác định'
      ],
      [
        'Ngày ký',
        formatDisplayDate(
          contract.signedDate
        )
      ],
      [
        'Ngày bắt đầu',
        formatDisplayDate(
          contract.startDate
        )
      ],
      [
        'Ngày kết thúc',
        formatDisplayDate(
          contract.endDate
        )
      ],
      [
        'Giá thuê',
        formatVietnameseCurrency(
          contract.rentAmount
        )
      ],
      [
        'Tiền cọc',
        formatVietnameseCurrency(
          contract.depositAmount
        )
      ],
      [
        'Ngày thanh toán',
        `Ngày ${contract.dueDay ?? 10} hằng tháng`
      ],
      [
        'Trạng thái',
        CONTRACT_STATUS_LABELS[
          contract.status
        ] ?? contract.status
      ]
    ];

    rows.forEach(([label, value]) => {
      summary.append(
        ...createDetailRow(label, value)
      );
    });

    const roommateSection =
      createElement('section', {
        className:
          'rm-contract-detail-section'
      });

    roommateSection.append(
      createElement('h3', {
        className:
          'rm-contract-detail-section-title',
        text: 'Người ở cùng'
      })
    );

    if (roommates.length === 0) {
      roommateSection.append(
        createElement('p', {
          className:
            'mb-0 text-body-secondary',
          text: 'Không có người ở cùng.'
        })
      );
    } else {
      const list = createElement('ul', {
        className:
          'list-group list-group-flush'
      });

      roommates.forEach((tenant) => {
        list.append(
          createElement('li', {
            className:
              'list-group-item px-0 d-flex justify-content-between gap-3',
            text:
              `${tenant.fullName} — ${tenant.phone}`
          })
        );
      });

      roommateSection.append(list);
    }

    const noteSection =
      createElement('section', {
        className:
          'rm-contract-detail-section'
      });

    noteSection.append(
      createElement('h3', {
        className:
          'rm-contract-detail-section-title',
        text: 'Điều khoản và ghi chú'
      }),
      createElement('p', {
        className: 'mb-2',
        text:
          contract.terms ||
          'Không có điều khoản bổ sung.'
      }),
      createElement('p', {
        className:
          'mb-0 text-body-secondary',
        text:
          contract.note ||
          'Không có ghi chú.'
      })
    );

    const content = [
      summary,
      roommateSection,
      noteSection
    ];

    if (isExpiringSoon) {
      content.unshift(
        createElement('div', {
          className: 'alert alert-warning',
          text:
            'Hợp đồng này sắp hết hạn.',
          dataset: {
            testid:
              'contract-detail-expiring'
          }
        })
      );
    }

    body.replaceChildren(...content);

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

export default createContractDetail;