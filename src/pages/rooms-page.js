import '../styles/rooms.css';

import roomService from '../services/room-service.js';
import { createRoomForm } from '../components/room-form.js';
import { showToast } from '../components/toast.js';
import {
  showConfirmDialog
} from '../components/confirm-dialog.js';

import {
  ROOM_STATUS,
  ROOM_STATUS_LABELS
} from '../constants/statuses.js';

import {
  formatVietnameseCurrency
} from '../utils/currency-utils.js';

const STATUS_BADGE_CLASSES = Object.freeze({
  [ROOM_STATUS.VACANT]:
    'rm-room-badge--vacant',

  [ROOM_STATUS.OCCUPIED]:
    'rm-room-badge--occupied',

  [ROOM_STATUS.MAINTENANCE]:
    'rm-room-badge--maintenance',

  [ROOM_STATUS.INACTIVE]:
    'rm-room-badge--inactive'
});

/**
 * Tạo phần tử HTML.
 *
 * @param {string} tagName Tên thẻ HTML.
 * @param {object} options Tùy chọn.
 * @param {Node[]} children Danh sách phần tử con.
 * @returns {HTMLElement}
 */
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

/**
 * Chuẩn hóa chuỗi tìm kiếm.
 *
 * @param {*} value Giá trị cần chuẩn hóa.
 * @returns {string}
 */
function normalizeSearchText(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/**
 * Tạo badge trạng thái phòng.
 *
 * @param {string} status Trạng thái phòng.
 * @returns {HTMLElement}
 */
function createStatusBadge(status) {
  const label =
    ROOM_STATUS_LABELS[status] ??
    'Không xác định';

  const badgeClass =
    STATUS_BADGE_CLASSES[status] ??
    'rm-room-badge--inactive';

  return createElement('span', {
    className:
      `rm-room-badge ${badgeClass}`,

    text: label,

    dataset: {
      testid: 'room-status-badge',
      status
    }
  });
}

/**
 * Tạo một ô trong bảng.
 *
 * @param {string} label Nhãn cột.
 * @param {*} child Nội dung.
 * @param {string} className Class CSS.
 * @returns {HTMLTableCellElement}
 */
function createTableCell(
  label,
  child,
  className = ''
) {
  const cell =
    createElement('td', {
      className,

      attributes: {
        'data-label': label
      }
    });

  if (
    child instanceof HTMLElement ||
    child instanceof DocumentFragment
  ) {
    cell.append(child);
  } else {
    cell.textContent =
      String(child ?? '');
  }

  return cell;
}

/**
 * Lấy tên hiển thị của loại phòng.
 *
 * @param {string} roomType Loại phòng.
 * @returns {string}
 */
function getRoomTypeLabel(roomType) {
  const labels = {
    standard: 'Tiêu chuẩn',
    large: 'Phòng lớn',
    premium: 'Cao cấp'
  };

  return (
    labels[roomType] ??
    roomType ??
    '—'
  );
}

/**
 * Tạo một cặp nhãn và giá trị
 * trong phần chi tiết phòng.
 *
 * @param {string} label Nhãn.
 * @param {*} value Giá trị.
 * @returns {HTMLElement[]}
 */
function createDetailItem(
  label,
  value
) {
  const term =
    createElement('dt', {
      className:
        'col-sm-5 text-body-secondary',

      text: label
    });

  const description =
    createElement('dd', {
      className:
        'col-sm-7 fw-medium',

      text: String(value ?? '')
    });

  return [
    term,
    description
  ];
}

/**
 * Tạo modal xem chi tiết phòng.
 *
 * @returns {{
 *   element: HTMLElement,
 *   open: Function
 * }}
 */
function createRoomDetailDialog() {
  const title =
    createElement('h2', {
      className:
        'modal-title fs-5',

      text:
        'Chi tiết phòng',

      attributes: {
        id: 'roomDetailTitle'
      },

      dataset: {
        testid:
          'room-detail-title'
      }
    });

  const closeButton =
    createElement('button', {
      className: 'btn-close',

      attributes: {
        type: 'button',

        'data-bs-dismiss':
          'modal',

        'aria-label':
          'Đóng'
      },

      dataset: {
        testid:
          'room-detail-close-icon'
      }
    });

  const header =
    createElement(
      'div',
      {
        className:
          'modal-header'
      },
      [
        title,
        closeButton
      ]
    );

  const body =
    createElement('div', {
      className:
        'modal-body',

      dataset: {
        testid:
          'room-detail-content'
      }
    });

  const footerCloseButton =
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
          'room-detail-close'
      }
    });

  const footer =
    createElement(
      'div',
      {
        className:
          'modal-footer'
      },
      [
        footerCloseButton
      ]
    );

  const content =
    createElement(
      'div',
      {
        className:
          'modal-content'
      },
      [
        header,
        body,
        footer
      ]
    );

  const dialog =
    createElement(
      'div',
      {
        className:
          'modal-dialog modal-dialog-centered'
      },
      [
        content
      ]
    );

  const element =
    createElement(
      'div',
      {
        className:
          'modal fade',

        attributes: {
          id:
            'roomDetailModal',

          tabindex:
            '-1',

          role:
            'dialog',

          'aria-modal':
            'true',

          'aria-labelledby':
            'roomDetailTitle',

          'aria-hidden':
            'true'
        },

        dataset: {
          testid:
            'room-detail-modal'
        }
      },
      [
        dialog
      ]
    );

  /**
   * Mở modal chi tiết.
   *
   * @param {object} room Phòng.
   * @param {object} occupancy Thông tin sức chứa.
   */
  function open(
    room,
    occupancy
  ) {
    title.textContent =
      `${room.code} — ${room.name}`;

    const details =
      createElement('dl', {
        className:
          'row gy-3 mb-0'
      });

    const detailRows = [
      [
        'Mã phòng',
        room.code
      ],
      [
        'Tên phòng',
        room.name
      ],
      [
        'Khu vực',
        room.area || '—'
      ],
      [
        'Tầng',

        room.floor === null ||
          room.floor === undefined
          ? '—'
          : String(room.floor)
      ],
      [
        'Loại phòng',

        getRoomTypeLabel(
          room.roomType
        )
      ],
      [
        'Diện tích',

        room.areaM2
          ? `${room.areaM2} m²`
          : '—'
      ],
      [
        'Giá thuê',

        formatVietnameseCurrency(
          room.monthlyRent
        )
      ],
      [
        'Số người',

        `${occupancy.currentOccupants
        }/${room.maxOccupants}`
      ],
      [
        'Chỗ còn trống',

        String(
          occupancy.availableSpots ??
          Math.max(
            room.maxOccupants -
            (
              occupancy
                .currentOccupants ??
              0
            ),
            0
          )
        )
      ],
      [
        'Mô tả',

        room.description ||
        'Không có mô tả.'
      ]
    ];

    detailRows.forEach(
      ([label, value]) => {
        details.append(
          ...createDetailItem(
            label,
            value
          )
        );
      }
    );

    const statusRow =
      createElement('div', {
        className:
          'd-flex align-items-center justify-content-between border-top pt-3 mt-3'
      });

    statusRow.append(
      createElement('span', {
        className:
          'text-body-secondary',

        text:
          'Trạng thái'
      }),

      createStatusBadge(
        room.status
      )
    );

    body.replaceChildren(
      details,
      statusRow
    );

    const Modal =
      window.bootstrap?.Modal;

    if (!Modal) {
      throw new Error(
        'Bootstrap Modal chưa được tải.'
      );
    }

    Modal
      .getOrCreateInstance(element)
      .show();
  }

  return Object.freeze({
    element,
    open
  });
}

/**
 * Tạo trang quản lý phòng.
 *
 * @returns {HTMLElement}
 */
export function createRoomsPage() {
  const state = {
    rooms: [],
    keyword: '',
    status: '',
    sort: ''
  };

  const page =
    createElement('section', {
      className:
        'rm-rooms-page',

      dataset: {
        testid:
          'rooms-page'
      }
    });

  /*
   * ==========================================================
   * TIÊU ĐỀ TRANG
   * ==========================================================
   */

  const heading =
    createElement('div', {
      className:
        'rm-rooms-heading'
    });

  const headingText =
    createElement('div');

  headingText.append(
    createElement('h2', {
      className:
        'h4 mb-1',

      text:
        'Danh sách phòng'
    }),

    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Theo dõi trạng thái, giá thuê và sức chứa của các phòng.'
    })
  );

  const addButton =
    createElement('button', {
      className:
        'btn btn-primary',

      text:
        'Thêm phòng',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'add-room-button'
      }
    });

  heading.append(
    headingText,
    addButton
  );

  /*
   * ==========================================================
   * THANH TÌM KIẾM VÀ BỘ LỌC
   * ==========================================================
   */

  const searchInput =
    createElement('input', {
      className:
        'form-control',

      attributes: {
        id:
          'room-search-input',

        type:
          'search',

        placeholder:
          'Tìm theo mã hoặc tên phòng',

        'aria-label':
          'Tìm kiếm phòng'
      },

      dataset: {
        testid:
          'room-search-input'
      }
    });

  const statusFilter =
    createElement('select', {
      className:
        'form-select',

      attributes: {
        id:
          'room-status-filter',

        'aria-label':
          'Lọc theo trạng thái'
      },

      dataset: {
        testid:
          'room-status-filter'
      }
    });

  statusFilter.append(
    createElement('option', {
      text:
        'Tất cả trạng thái',

      attributes: {
        value: ''
      }
    })
  );

  Object
    .values(ROOM_STATUS)
    .forEach((status) => {
      statusFilter.append(
        createElement('option', {
          text:
            ROOM_STATUS_LABELS[
            status
            ],

          attributes: {
            value: status
          }
        })
      );
    });

  const sortSelect =
    createElement('select', {
      className:
        'form-select',

      attributes: {
        id:
          'room-price-sort',

        'aria-label':
          'Sắp xếp theo giá thuê'
      },

      dataset: {
        testid:
          'room-price-sort'
      }
    });

  sortSelect.append(
    createElement('option', {
      text:
        'Sắp xếp mặc định',

      attributes: {
        value: ''
      }
    }),

    createElement('option', {
      text:
        'Giá thấp đến cao',

      attributes: {
        value:
          'price-asc'
      }
    }),

    createElement('option', {
      text:
        'Giá cao đến thấp',

      attributes: {
        value:
          'price-desc'
      }
    })
  );

  const toolbar =
    createElement(
      'div',
      {
        className:
          'rm-rooms-toolbar'
      },
      [
        createElement(
          'div',
          {
            className:
              'rm-rooms-search'
          },
          [
            createElement(
              'label',
              {
                className:
                  'visually-hidden',

                text:
                  'Tìm kiếm phòng',

                attributes: {
                  for:
                    'room-search-input'
                }
              }
            ),

            searchInput
          ]
        ),

        createElement(
          'div',
          {
            className:
              'rm-rooms-filter'
          },
          [
            createElement(
              'label',
              {
                className:
                  'visually-hidden',

                text:
                  'Trạng thái phòng',

                attributes: {
                  for:
                    'room-status-filter'
                }
              }
            ),

            statusFilter
          ]
        ),

        createElement(
          'div',
          {
            className:
              'rm-rooms-sort'
          },
          [
            createElement(
              'label',
              {
                className:
                  'visually-hidden',

                text:
                  'Sắp xếp theo giá thuê',

                attributes: {
                  for:
                    'room-price-sort'
                }
              }
            ),

            sortSelect
          ]
        )
      ]
    );

  /*
   * ==========================================================
   * BẢNG PHÒNG
   * ==========================================================
   */

  const countText =
    createElement('span', {
      className:
        'text-body-secondary small',

      text:
        '0 phòng',

      dataset: {
        testid:
          'room-result-count'
      }
    });

  const tableHead =
    createElement('thead');

  const headerRow =
    createElement('tr');

  [
    'Mã phòng',
    'Tên phòng',
    'Khu vực',
    'Giá thuê',
    'Số người',
    'Trạng thái',
    'Thao tác'
  ].forEach((label) => {
    headerRow.append(
      createElement('th', {
        text: label,

        attributes: {
          scope: 'col'
        }
      })
    );
  });

  tableHead.append(
    headerRow
  );

  const tableBody =
    createElement('tbody', {
      dataset: {
        testid:
          'room-table-body'
      }
    });

  const table =
    createElement(
      'table',
      {
        className:
          'table align-middle mb-0 rm-rooms-table',

        dataset: {
          testid:
            'rooms-table'
        }
      },
      [
        tableHead,
        tableBody
      ]
    );

  const tableWrapper =
    createElement(
      'div',
      {
        className:
          'table-responsive rm-rooms-table-wrapper'
      },
      [
        table
      ]
    );

  /*
   * ==========================================================
   * TRẠNG THÁI DANH SÁCH TRỐNG
   * ==========================================================
   */

  const emptyTitle =
    createElement('h3', {
      className:
        'h5 mb-2',

      text:
        'Chưa có phòng'
    });

  const emptyDescription =
    createElement('p', {
      className:
        'mb-3 text-body-secondary',

      text:
        'Hãy thêm phòng đầu tiên để bắt đầu quản lý.'
    });

  const emptyAddButton =
    createElement('button', {
      className:
        'btn btn-primary',

      text:
        'Thêm phòng',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'room-empty-add-button'
      }
    });

  const emptyState =
    createElement(
      'div',
      {
        className:
          'rm-rooms-empty',

        attributes: {
          hidden: ''
        },

        dataset: {
          testid:
            'rooms-empty-state'
        }
      },
      [
        createElement('div', {
          className:
            'rm-rooms-empty-icon',

          text:
            '▦',

          attributes: {
            'aria-hidden':
              'true'
          }
        }),

        emptyTitle,
        emptyDescription,
        emptyAddButton
      ]
    );

  /*
   * ==========================================================
   * THẺ NỘI DUNG
   * ==========================================================
   */

  const contentCard =
    createElement(
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
            createElement(
              'strong',
              {
                text:
                  'Phòng trọ'
              }
            ),

            countText
          ]
        ),

        tableWrapper,
        emptyState
      ]
    );

  /*
   * ==========================================================
   * MODAL VÀ FORM
   * ==========================================================
   */

  const roomDetailDialog =
    createRoomDetailDialog();

  const roomForm =
    createRoomForm({
      async onSubmit(
        data,
        context
      ) {
        if (
          context.mode ===
          'edit'
        ) {
          const updatedRoom =
            roomService
              .updateRoom(
                context.roomId,
                data
              );

          showToast({
            type:
              'success',

            title:
              'Cập nhật phòng',

            message:
              `Đã cập nhật phòng ${updatedRoom.code}.`
          });
        } else {
          const createdRoom =
            roomService
              .createRoom(data);

          showToast({
            type:
              'success',

            title:
              'Thêm phòng',

            message:
              `Đã thêm phòng ${createdRoom.code}.`
          });
        }

        /*
         * Tải lại danh sách ngay sau
         * khi tạo hoặc cập nhật phòng.
         */
        refreshRooms();
      }
    });

  page.append(
    heading,
    toolbar,
    contentCard,
    roomForm.element,
    roomDetailDialog.element
  );

  /*
   * ==========================================================
   * LỌC VÀ SẮP XẾP
   * ==========================================================
   */

  function getVisibleRooms() {
    let rooms =
      [...state.rooms];

    const normalizedKeyword =
      normalizeSearchText(
        state.keyword
      );

    if (normalizedKeyword) {
      rooms =
        rooms.filter((room) => {
          const code =
            normalizeSearchText(
              room.code
            );

          const name =
            normalizeSearchText(
              room.name
            );

          return (
            code.includes(
              normalizedKeyword
            ) ||
            name.includes(
              normalizedKeyword
            )
          );
        });
    }

    if (state.status) {
      rooms =
        rooms.filter(
          (room) =>
            room.status ===
            state.status
        );
    }

    if (
      state.sort ===
      'price-asc'
    ) {
      rooms.sort(
        (
          firstRoom,
          secondRoom
        ) =>
          Number(
            firstRoom.monthlyRent
          ) -
          Number(
            secondRoom.monthlyRent
          )
      );
    }

    if (
      state.sort ===
      'price-desc'
    ) {
      rooms.sort(
        (
          firstRoom,
          secondRoom
        ) =>
          Number(
            secondRoom.monthlyRent
          ) -
          Number(
            firstRoom.monthlyRent
          )
      );
    }

    return rooms;
  }

  /*
   * ==========================================================
   * RENDER BẢNG
   * ==========================================================
   */

  function renderTable() {
    const visibleRooms =
      getVisibleRooms();

    countText.textContent =
      `${visibleRooms.length} phòng`;

    /*
     * Xóa các dòng cũ trước khi render
     * danh sách mới.
     */
    tableBody.replaceChildren();

    const hasAnyRooms =
      state.rooms.length > 0;

    const hasVisibleRooms =
      visibleRooms.length > 0;

    /*
     * Luôn giữ bảng hiển thị.
     */
    tableWrapper.hidden = false;

    emptyState.hidden =
      hasVisibleRooms;

    if (!hasVisibleRooms) {
      if (hasAnyRooms) {
        emptyTitle.textContent =
          'Không tìm thấy phòng';

        emptyDescription.textContent =
          'Không có phòng nào phù hợp với từ khóa hoặc bộ lọc hiện tại.';

        emptyAddButton.hidden = true;
      } else {
        emptyTitle.textContent =
          'Chưa có phòng';

        emptyDescription.textContent =
          'Hãy thêm phòng đầu tiên để bắt đầu quản lý.';

        emptyAddButton.hidden = false;
      }

      return;
    }

    visibleRooms.forEach((room) => {
      let occupancy;

      try {
        occupancy =
          roomService.getRoomOccupancy(
            room.id
          );
      } catch {
        occupancy = {
          currentOccupants: 0,

          maxOccupants:
            room.maxOccupants,

          availableSpots:
            room.maxOccupants
        };
      }

      /*
       * Khu vực chứa các nút thao tác.
       */
      const actions =
        createElement('div', {
          className:
            'rm-room-actions'
        });

      const viewButton =
        createElement(
          'button',
          {
            className:
              'btn btn-sm btn-outline-secondary',

            text: 'Xem',

            attributes: {
              type: 'button',

              'aria-label':
                `Xem phòng ${room.code}`
            },

            dataset: {
              action: 'view',

              roomId: room.id,

              testid:
                'room-view-button'
            }
          }
        );

      const editButton =
        createElement(
          'button',
          {
            className:
              'btn btn-sm btn-outline-primary',

            text: 'Sửa',

            attributes: {
              type: 'button',

              'aria-label':
                `Sửa phòng ${room.code}`
            },

            dataset: {
              action: 'edit',

              roomId: room.id,

              testid:
                'room-edit-button'
            }
          }
        );

      const deleteButton =
        createElement(
          'button',
          {
            className:
              'btn btn-sm btn-outline-danger',

            text: 'Xóa',

            attributes: {
              type: 'button',

              'aria-label':
                `Xóa phòng ${room.code}`
            },

            dataset: {
              action: 'delete',

              roomId: room.id,

              testid:
                'room-delete-button'
            }
          }
        );

      actions.append(
        viewButton,
        editButton,
        deleteButton
      );

      /*
       * Tạo dòng trong bảng.
       */
      const row =
        createElement('tr', {
          dataset: {
            roomId: room.id,

            testid:
              `room-row-${room.id}`
          }
        });

      row.append(
        createTableCell(
          'Mã phòng',

          createElement(
            'strong',
            {
              text: room.code
            }
          )
        ),

        createTableCell(
          'Tên phòng',
          room.name
        ),

        createTableCell(
          'Khu vực',
          room.area || '—'
        ),

        createTableCell(
          'Giá thuê',

          formatVietnameseCurrency(
            room.monthlyRent
          ),

          'text-lg-end text-nowrap'
        ),

        createTableCell(
          'Số người',

          `${occupancy.currentOccupants ?? 0
          }/${room.maxOccupants}`,

          'text-nowrap'
        ),

        createTableCell(
          'Trạng thái',

          createStatusBadge(
            room.status
          )
        ),

        createTableCell(
          'Thao tác',
          actions,
          'rm-room-actions-cell'
        )
      );

      tableBody.append(row);
    });
  }

  /*
   * ==========================================================
   * LÀM MỚI DANH SÁCH
   * ==========================================================
   */

  function refreshRooms() {
    try {
      state.rooms =
        roomService.getRooms();

      renderTable();
    } catch (error) {
      state.rooms = [];

      renderTable();

      showToast({
        type:
          'danger',

        title:
          'Không thể tải phòng',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách phòng.'
      });
    }
  }

  /*
   * ==========================================================
   * XÓA PHÒNG
   * ==========================================================
   */

  async function deleteRoom(
    roomId
  ) {
    const room =
      roomService.getRoomById(
        roomId
      );

    if (!room) {
      showToast({
        type:
          'danger',

        title:
          'Không tìm thấy phòng',

        message:
          'Phòng cần xóa không còn tồn tại.'
      });

      refreshRooms();

      return;
    }

    const confirmed =
      await showConfirmDialog({
        title:
          `Xóa phòng ${room.code}?`,

        message:
          'Phòng sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác.',

        confirmText:
          'Xóa phòng',

        cancelText:
          'Hủy',

        variant:
          'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      roomService.deleteRoom(
        room.id
      );

      showToast({
        type:
          'success',

        title:
          'Xóa phòng',

        message:
          `Đã xóa phòng ${room.code}.`
      });

      refreshRooms();
    } catch (error) {
      showToast({
        type:
          'danger',

        title:
          'Không thể xóa phòng',

        message:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi xóa phòng.'
      });
    }
  }

  /*
   * ==========================================================
   * SỰ KIỆN THÊM PHÒNG
   * ==========================================================
   */

  addButton.addEventListener(
    'click',
    () => {
      roomForm.open({
        mode: 'create'
      });
    }
  );

  emptyAddButton.addEventListener(
    'click',
    () => {
      roomForm.open({
        mode: 'create'
      });
    }
  );

  /*
   * ==========================================================
   * SỰ KIỆN TÌM KIẾM
   * ==========================================================
   */

  searchInput.addEventListener(
    'input',
    () => {
      state.keyword =
        searchInput.value;

      renderTable();
    }
  );

  /*
   * ==========================================================
   * SỰ KIỆN LỌC
   * ==========================================================
   */

  statusFilter.addEventListener(
    'change',
    () => {
      state.status =
        statusFilter.value;

      renderTable();
    }
  );

  /*
   * ==========================================================
   * SỰ KIỆN SẮP XẾP
   * ==========================================================
   */

  sortSelect.addEventListener(
    'change',
    () => {
      state.sort =
        sortSelect.value;

      renderTable();
    }
  );

  /*
   * ==========================================================
   * SỰ KIỆN NÚT TRONG BẢNG
   * ==========================================================
   */

  tableBody.addEventListener(
    'click',
    (event) => {
      const target =
        event.target;

      if (
        !(target instanceof Element)
      ) {
        return;
      }

      const actionButton =
        target.closest(
          'button[data-action][data-room-id]'
        );

      if (!actionButton) {
        return;
      }

      const roomId =
        actionButton.dataset.roomId;

      const action =
        actionButton.dataset.action;

      if (!roomId || !action) {
        return;
      }

      if (
        action ===
        'delete'
      ) {
        deleteRoom(roomId);

        return;
      }

      const room =
        roomService.getRoomById(
          roomId
        );

      if (!room) {
        showToast({
          type:
            'danger',

          title:
            'Không tìm thấy phòng',

          message:
            'Dữ liệu phòng không còn tồn tại.'
        });

        refreshRooms();

        return;
      }

      if (
        action ===
        'edit'
      ) {
        roomForm.open({
          mode:
            'edit',

          room
        });

        return;
      }

      if (
        action ===
        'view'
      ) {
        let occupancy;

        try {
          occupancy =
            roomService
              .getRoomOccupancy(
                room.id
              );
        } catch {
          occupancy = {
            currentOccupants:
              0,

            maxOccupants:
              room.maxOccupants,

            availableSpots:
              room.maxOccupants
          };
        }

        roomDetailDialog.open(
          room,
          occupancy
        );
      }
    }
  );

  /*
   * Tải dữ liệu lần đầu.
   */
  refreshRooms();

  return page;
}

export const createPage =
  createRoomsPage;

export default createRoomsPage;