import '../styles/meter-readings.css';

import meterReadingService from '../services/meter-reading-service.js';
import roomService from '../services/room-service.js';

import {
  createMeterReadingForm
} from '../components/meter-reading-form.js';

import {
  showToast
} from '../components/toast.js';

import {
  showConfirmDialog
} from '../components/confirm-dialog.js';

import {
  detectAbnormalUsage
} from '../business/meter-calculator.js';

const ABNORMAL_USAGE_THRESHOLD_PERCENT = 50;

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

function formatNumber(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return '—';
  }

  return new Intl.NumberFormat(
    'vi-VN',
    {
      maximumFractionDigits: 2
    }
  ).format(numberValue);
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

function createStatusBadge({
  hasReading,
  hasInvoice,
  isAbnormal
}) {
  if (!hasReading) {
    return createElement('span', {
      className:
        'rm-meter-badge rm-meter-badge--missing',

      text: 'Chưa ghi',

      dataset: {
        testid: 'meter-status-badge',

        status: 'missing'
      }
    });
  }

  if (isAbnormal) {
    return createElement('span', {
      className:
        'rm-meter-badge rm-meter-badge--warning',

      text: 'Bất thường',

      dataset: {
        testid: 'meter-status-badge',

        status: 'abnormal'
      }
    });
  }

  if (hasInvoice) {
    return createElement('span', {
      className:
        'rm-meter-badge rm-meter-badge--invoiced',

      text: 'Đã lập hóa đơn',

      dataset: {
        testid: 'meter-status-badge',

        status: 'invoiced'
      }
    });
  }

  return createElement('span', {
    className:
      'rm-meter-badge rm-meter-badge--recorded',

    text: 'Đã ghi',

    dataset: {
      testid: 'meter-status-badge',

      status: 'recorded'
    }
  });
}

function createActionButton({
  action,
  roomId,
  readingId = '',
  label,
  className
}) {
  return createElement('button', {
    className,
    text: label,

    attributes: {
      type: 'button'
    },

    dataset: {
      action,
      roomId,
      readingId,
      testid:
        readingId
          ? `meter-${action}-${readingId}`
          : `meter-${action}-${roomId}`
    }
  });
}

export function createMeterReadingsPage() {
  const state = {
    month: getCurrentMonthInVietnam(),
    roomId: '',
    rows: [],
    rooms: [],
    missingCount: 0,
    abnormalCount: 0
  };

  const page = createElement('section', {
    className: 'rm-meter-page',

    dataset: {
      testid: 'meter-readings-page'
    }
  });

  const headingText = createElement('div');

  headingText.append(
    createElement('h2', {
      className: 'h4 mb-1',
      text: 'Ghi chỉ số điện nước'
    }),

    createElement('p', {
      className:
        'mb-0 text-body-secondary',

      text:
        'Theo dõi chỉ số điện, nước và lượng tiêu thụ của từng phòng.'
    })
  );

  const addButton = createElement('button', {
    className: 'btn btn-primary',
    text: 'Thêm bản ghi mới',

    attributes: {
      type: 'button'
    },

    dataset: {
      testid:
        'meter-add-button'
    }
  });

  const heading = createElement(
    'div',
    {
      className:
        'rm-meter-heading'
    },
    [headingText, addButton]
  );

  const monthInput = createElement('input', {
    className: 'form-control',

    attributes: {
      type: 'month',
      value: state.month,
      'aria-label': 'Chọn tháng'
    },

    dataset: {
      testid:
        'meter-month-filter'
    }
  });

  const roomFilter = createElement('select', {
    className: 'form-select',

    attributes: {
      'aria-label':
        'Lọc theo phòng'
    },

    dataset: {
      testid:
        'meter-room-filter'
    }
  });

  const toolbar = createElement(
    'div',
    {
      className:
        'rm-meter-toolbar'
    },
    [
      createElement(
        'div',
        {},
        [
          createElement('label', {
            className: 'form-label',
            text: 'Tháng',

            attributes: {
              for: 'meter-month-filter'
            }
          }),

          monthInput
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
              for: 'meter-room-filter'
            }
          }),

          roomFilter
        ]
      )
    ]
  );

  monthInput.id = 'meter-month-filter';
  roomFilter.id = 'meter-room-filter';

  const missingAlert = createElement('div', {
    className:
      'alert alert-warning rm-meter-alert',

    attributes: {
      hidden: '',
      role: 'status'
    },

    dataset: {
      testid:
        'meter-missing-alert'
    }
  });

  const abnormalAlert = createElement('div', {
    className:
      'alert alert-danger rm-meter-alert',

    attributes: {
      hidden: '',
      role: 'status'
    },

    dataset: {
      testid:
        'meter-abnormal-alert'
    }
  });

  const alerts = createElement(
    'div',
    {
      className:
        'rm-meter-alerts'
    },
    [
      missingAlert,
      abnormalAlert
    ]
  );

  const resultCount = createElement('span', {
    className:
      'small text-body-secondary',

    text: '0 phòng',

    dataset: {
      testid:
        'meter-result-count'
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
          'Phòng',
          'Điện cũ',
          'Điện mới',
          'Điện dùng',
          'Nước cũ',
          'Nước mới',
          'Nước dùng',
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
        'meter-table-body'
    }
  });

  const table = createElement(
    'table',
    {
      className:
        'table align-middle mb-0 rm-meter-table',

      dataset: {
        testid:
          'meter-table'
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
        'table-responsive rm-meter-table-wrapper'
    },
    [table]
  );

  const emptyTitle = createElement('h3', {
    className: 'h5 mb-2',
    text: 'Không có phòng cần ghi chỉ số'
  });

  const emptyDescription = createElement('p', {
    className:
      'mb-0 text-body-secondary',

    text:
      'Không có phòng nào có hợp đồng hiệu lực trong tháng đã chọn.'
  });

  const emptyState = createElement(
    'div',
    {
      className:
        'rm-meter-empty',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'meter-empty-state'
      }
    },
    [
      createElement('div', {
        className:
          'rm-meter-empty-icon',

        text: '⚡',

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
              'Chỉ số theo phòng'
          }),

          resultCount
        ]
      ),

      tableWrapper,
      emptyState
    ]
  );

  const meterForm =
    createMeterReadingForm({
      async onSubmit(
        data,
        context
      ) {
        const savedReading =
          context.mode === 'edit'
            ? meterReadingService
                .updateReading(
                  context.readingId,
                  data
                )
            : meterReadingService
                .createReading(data);

        showToast({
          type: 'success',

          title:
            context.mode === 'edit'
              ? 'Cập nhật chỉ số'
              : 'Lưu chỉ số',

          message:
            `Đã lưu chỉ số phòng ${
              getRoomLabel(
                savedReading.roomId
              )
            } tháng ${
              savedReading.period
            }.`
        });

        const warnings =
          savedReading.warnings ?? [];

        if (warnings.length > 0) {
          showToast({
            type: 'warning',
            title:
              'Cảnh báo chỉ số',

            message: warnings
              .map(
                (warning) =>
                  warning.message
              )
              .join(' ')
          });
        }

        refreshData();
      }
    });

  page.append(
    heading,
    toolbar,
    alerts,
    card,
    meterForm.element
  );

  function getRoomLabel(roomId) {
    const room = state.rooms.find(
      (item) =>
        item.id === roomId
    ) ?? roomService.getRoomById(roomId);

    return room
      ? `${room.code} — ${room.name}`
      : roomId;
  }

  function getPreviousUsage(reading) {
    const previousReading =
      meterReadingService
        .getPreviousReading(
          reading.roomId,
          reading.period
        );

    if (!previousReading) {
      return {
        previousReading: null,
        electricityAbnormal: false,
        waterAbnormal: false
      };
    }

    let electricityAbnormal = false;
    let waterAbnormal = false;

    try {
      electricityAbnormal =
        detectAbnormalUsage(
          reading.electricityUsage,
          previousReading.electricityUsage,
          ABNORMAL_USAGE_THRESHOLD_PERCENT
        );

      waterAbnormal =
        detectAbnormalUsage(
          reading.waterUsage,
          previousReading.waterUsage,
          ABNORMAL_USAGE_THRESHOLD_PERCENT
        );
    } catch (error) {
      console.error(
        'Không thể kiểm tra mức sử dụng bất thường.',
        error
      );
    }

    return {
      previousReading,
      electricityAbnormal,
      waterAbnormal
    };
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

    const selectedRoomExists =
      state.rooms.some(
        (room) =>
          room.id === selectedRoomId
      );

    if (selectedRoomExists) {
      roomFilter.value =
        selectedRoomId;
    } else {
      state.roomId = '';
      roomFilter.value = '';
    }
  }

  function getVisibleRows() {
    if (!state.roomId) {
      return state.rows;
    }

    return state.rows.filter(
      (row) =>
        row.room.id === state.roomId
    );
  }

  function renderAlerts() {
    missingAlert.hidden =
      state.missingCount === 0;

    abnormalAlert.hidden =
      state.abnormalCount === 0;

    if (state.missingCount > 0) {
      missingAlert.textContent =
        `${state.missingCount} phòng chưa ghi chỉ số trong tháng ${state.month}.`;
    }

    if (state.abnormalCount > 0) {
      abnormalAlert.textContent =
        `${state.abnormalCount} phòng có mức sử dụng tăng từ ${ABNORMAL_USAGE_THRESHOLD_PERCENT}% so với tháng trước.`;
    }
  }

  function renderTable() {
    const rows = getVisibleRows();

    resultCount.textContent =
      `${rows.length} phòng`;

    tableBody.replaceChildren();

    tableWrapper.hidden =
      rows.length === 0;

    emptyState.hidden =
      rows.length > 0;

    if (rows.length === 0) {
      if (
        state.rows.length > 0 &&
        state.roomId
      ) {
        emptyTitle.textContent =
          'Không tìm thấy phòng';

        emptyDescription.textContent =
          'Không có dữ liệu phù hợp với bộ lọc phòng hiện tại.';
      } else {
        emptyTitle.textContent =
          'Không có phòng cần ghi chỉ số';

        emptyDescription.textContent =
          'Không có phòng nào có hợp đồng hiệu lực trong tháng đã chọn.';
      }

      return;
    }

    rows.forEach((rowData) => {
      const {
        room,
        reading,
        previousReading,
        hasInvoice,
        electricityAbnormal,
        waterAbnormal
      } = rowData;

      const hasReading =
        Boolean(reading);

      const isAbnormal =
        electricityAbnormal ||
        waterAbnormal;

      const actions = createElement('div', {
        className:
          'rm-meter-actions'
      });

      if (hasReading) {
        actions.append(
          createActionButton({
            action: 'edit',
            roomId: room.id,
            readingId: reading.id,
            label: 'Sửa',

            className:
              'btn btn-sm btn-outline-primary'
          }),

          createActionButton({
            action: 'delete',
            roomId: room.id,
            readingId: reading.id,
            label: 'Xóa',

            className:
              'btn btn-sm btn-outline-danger'
          })
        );
      } else {
        actions.append(
          createActionButton({
            action: 'create',
            roomId: room.id,
            label: 'Ghi chỉ số',

            className:
              'btn btn-sm btn-primary'
          })
        );
      }

      const electricityUsageContent =
        createElement('div', {
          className:
            'rm-meter-usage-value'
        });

      electricityUsageContent.append(
        createElement('strong', {
          text: hasReading
            ? formatNumber(
                reading.electricityUsage
              )
            : '—'
        })
      );

      if (electricityAbnormal) {
        electricityUsageContent.append(
          createElement('span', {
            className:
              'rm-meter-abnormal-mark',

            text: 'Tăng cao',

            dataset: {
              testid:
                `meter-electricity-abnormal-${reading.id}`
            }
          })
        );
      }

      const waterUsageContent =
        createElement('div', {
          className:
            'rm-meter-usage-value'
        });

      waterUsageContent.append(
        createElement('strong', {
          text: hasReading
            ? formatNumber(
                reading.waterUsage
              )
            : '—'
        })
      );

      if (waterAbnormal) {
        waterUsageContent.append(
          createElement('span', {
            className:
              'rm-meter-abnormal-mark',

            text: 'Tăng cao',

            dataset: {
              testid:
                `meter-water-abnormal-${reading.id}`
            }
          })
        );
      }

      const row = createElement('tr', {
        className:
          isAbnormal
            ? 'rm-meter-row--abnormal'
            : '',

        dataset: {
          roomId: room.id,
          readingId:
            reading?.id ?? '',
          testid:
            `meter-row-${room.id}`
        }
      });

      row.append(
        createTableCell(
          'Phòng',

          createElement(
            'div',
            {},
            [
              createElement('strong', {
                text: room.code
              }),

              createElement('div', {
                className:
                  'small text-body-secondary',

                text: room.name
              })
            ]
          )
        ),

        createTableCell(
          'Điện cũ',

          hasReading
            ? formatNumber(
                reading.electricityPrevious
              )
            : formatNumber(
                previousReading
                  ?.electricityCurrent ?? 0
              ),

          'text-nowrap'
        ),

        createTableCell(
          'Điện mới',

          hasReading
            ? formatNumber(
                reading.electricityCurrent
              )
            : '—',

          'text-nowrap'
        ),

        createTableCell(
          'Điện dùng',
          electricityUsageContent,
          'text-nowrap'
        ),

        createTableCell(
          'Nước cũ',

          hasReading
            ? formatNumber(
                reading.waterPrevious
              )
            : formatNumber(
                previousReading
                  ?.waterCurrent ?? 0
              ),

          'text-nowrap'
        ),

        createTableCell(
          'Nước mới',

          hasReading
            ? formatNumber(
                reading.waterCurrent
              )
            : '—',

          'text-nowrap'
        ),

        createTableCell(
          'Nước dùng',
          waterUsageContent,
          'text-nowrap'
        ),

        createTableCell(
          'Trạng thái',

          createStatusBadge({
            hasReading,
            hasInvoice,
            isAbnormal
          })
        ),

        createTableCell(
          'Thao tác',
          actions,
          'rm-meter-actions-cell'
        )
      );

      tableBody.append(row);
    });
  }

  function refreshData() {
    try {
      const readings =
        meterReadingService
          .filterReadings({
            month: state.month
          });

      const roomsWithoutReading =
        meterReadingService
          .getRoomsWithoutReading(
            state.month
          );

      let invoicedReadings = [];

      try {
        invoicedReadings =
          meterReadingService
            .filterReadings({
              month: state.month,
              hasInvoice: true
            });
      } catch (error) {
        console.error(
          'Không thể lấy trạng thái hóa đơn của chỉ số.',
          error
        );
      }

      const invoicedReadingIds =
        new Set(
          invoicedReadings.map(
            (reading) => reading.id
          )
        );

      const roomMap = new Map();

      roomsWithoutReading.forEach(
        (room) => {
          roomMap.set(room.id, room);
        }
      );

      readings.forEach((reading) => {
        if (!roomMap.has(reading.roomId)) {
          const room =
            roomService.getRoomById(
              reading.roomId
            );

          if (room) {
            roomMap.set(
              room.id,
              room
            );
          }
        }
      });

      state.rooms = [
        ...roomMap.values()
      ].sort(
        (firstRoom, secondRoom) =>
          String(firstRoom.code)
            .localeCompare(
              String(secondRoom.code),
              'vi'
            )
      );

      const readingByRoomId = new Map(
        readings.map(
          (reading) => [
            reading.roomId,
            reading
          ]
        )
      );

      state.rows = state.rooms.map(
        (room) => {
          const reading =
            readingByRoomId.get(
              room.id
            ) ?? null;

          const previousReading =
            meterReadingService
              .getPreviousReading(
                room.id,
                state.month
              );

          let electricityAbnormal =
            false;

          let waterAbnormal = false;

          if (reading) {
            const abnormalResult =
              getPreviousUsage(
                reading
              );

            electricityAbnormal =
              abnormalResult
                .electricityAbnormal;

            waterAbnormal =
              abnormalResult
                .waterAbnormal;
          }

          return {
            room,
            reading,
            previousReading,

            hasInvoice:
              reading
                ? invoicedReadingIds.has(
                    reading.id
                  )
                : false,

            electricityAbnormal,
            waterAbnormal
          };
        }
      );

      state.missingCount =
        state.rows.filter(
          (row) => !row.reading
        ).length;

      state.abnormalCount =
        state.rows.filter(
          (row) =>
            row.electricityAbnormal ||
            row.waterAbnormal
        ).length;

      populateRoomFilter();
      renderAlerts();
      renderTable();
    } catch (error) {
      state.rows = [];
      state.rooms = [];
      state.missingCount = 0;
      state.abnormalCount = 0;

      populateRoomFilter();
      renderAlerts();
      renderTable();

      showToast({
        type: 'danger',
        title:
          'Không thể tải chỉ số',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể tải dữ liệu điện nước.'
      });
    }
  }

  function getRoomsAvailableForCreate() {
    return state.rows
      .filter(
        (row) => !row.reading
      )
      .map(
        (row) => row.room
      );
  }

  function openCreateForm(
    selectedRoomId = ''
  ) {
    const rooms =
      getRoomsAvailableForCreate();

    if (rooms.length === 0) {
      showToast({
        type: 'warning',
        title:
          'Không còn phòng cần ghi',

        message:
          `Tất cả phòng trong tháng ${state.month} đã có bản ghi chỉ số.`
      });

      return;
    }

    meterForm.open({
      mode: 'create',
      month: state.month,
      rooms,
      selectedRoomId
    });
  }

  async function deleteReading(
    reading
  ) {
    const roomLabel =
      getRoomLabel(reading.roomId);

    const confirmed =
      await showConfirmDialog({
        title:
          `Xóa chỉ số ${roomLabel}?`,

        message:
          `Bản ghi tháng ${reading.period} sẽ bị xóa. Bản ghi đã dùng trong hóa đơn không thể xóa.`,

        confirmText:
          'Xóa bản ghi',

        cancelText: 'Hủy',

        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    try {
      meterReadingService
        .deleteReading(reading.id);

      showToast({
        type: 'success',
        title:
          'Đã xóa chỉ số',

        message:
          `Đã xóa bản ghi của ${roomLabel}.`
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
            : 'Không thể xóa bản ghi chỉ số.'
      });
    }
  }

  addButton.addEventListener(
    'click',
    () => {
      openCreateForm();
    }
  );

  monthInput.addEventListener(
    'change',
    () => {
      if (!monthInput.value) {
        monthInput.value =
          state.month;

        return;
      }

      state.month =
        monthInput.value;

      state.roomId = '';

      refreshData();
    }
  );

  roomFilter.addEventListener(
    'change',
    () => {
      state.roomId =
        roomFilter.value;

      renderTable();
    }
  );

  tableBody.addEventListener(
    'click',
    (event) => {
      const button =
        event.target.closest(
          'button[data-action][data-room-id]'
        );

      if (!button) {
        return;
      }

      const action =
        button.dataset.action;

      const roomId =
        button.dataset.roomId;

      if (action === 'create') {
        openCreateForm(roomId);
        return;
      }

      const reading =
        meterReadingService
          .getReadingById(
            button.dataset.readingId
          );

      if (!reading) {
        showToast({
          type: 'danger',
          title:
            'Không tìm thấy bản ghi',

          message:
            'Bản ghi chỉ số không còn tồn tại.'
        });

        refreshData();
        return;
      }

      if (action === 'edit') {
        const room =
          roomService.getRoomById(
            reading.roomId
          );

        meterForm.open({
          mode: 'edit',
          month: reading.period,
          reading,
          rooms: room
            ? [room]
            : []
        });

        return;
      }

      if (action === 'delete') {
        deleteReading(reading);
      }
    }
  );

  refreshData();

  return page;
}

export const createPage =
  createMeterReadingsPage;

export default createMeterReadingsPage;