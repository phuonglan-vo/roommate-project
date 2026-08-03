import '../styles/settings.css';

import backupService from '../services/backup-service.js';
import * as seedServiceModule
  from '../services/seed-service.js';

import {
  showToast
} from '../components/toast.js';

import {
  showConfirmDialog
} from '../components/confirm-dialog.js';

const COLLECTIONS = Object.freeze([
  {
    key: 'rooms',
    label: 'Phòng',
    icon: '▦'
  },
  {
    key: 'tenants',
    label: 'Người thuê',
    icon: '●'
  },
  {
    key: 'contracts',
    label: 'Hợp đồng',
    icon: '▤'
  },
  {
    key: 'meterReadings',
    label: 'Chỉ số điện nước',
    icon: '⚡'
  },
  {
    key: 'serviceConfigs',
    label: 'Dịch vụ',
    icon: '⚙'
  },
  {
    key: 'invoices',
    label: 'Hóa đơn',
    icon: '₫'
  },
  {
    key: 'payments',
    label: 'Thanh toán',
    icon: '✓'
  },
  {
    key: 'appSettings',
    label: 'Cài đặt',
    icon: '◉'
  }
]);

const IMPORT_MODE = Object.freeze({
  OVERWRITE: 'overwrite',
  MERGE: 'merge'
});

const MERGE_CONFLICT = Object.freeze({
  REPLACE: 'replace',
  KEEP_EXISTING: 'keep-existing',
  ERROR: 'error'
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
        value !== undefined &&
        value !== null
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

function resolveSeedService() {
  const candidates = [
    seedServiceModule.default,
    seedServiceModule.seedService,
    seedServiceModule
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        (
          typeof candidate.seedIfEmpty ===
            'function' ||
          typeof candidate.resetToSeedData ===
            'function'
        )
    ) ?? null
  );
}

function formatFileSize(bytes) {
  const numericBytes = Number(bytes);

  if (
    !Number.isFinite(numericBytes) ||
    numericBytes < 0
  ) {
    return 'Không xác định';
  }

  if (numericBytes < 1024) {
    return `${numericBytes} B`;
  }

  if (
    numericBytes <
    1024 * 1024
  ) {
    return (
      `${(
        numericBytes / 1024
      ).toFixed(1)} KB`
    );
  }

  return (
    `${(
      numericBytes /
      (1024 * 1024)
    ).toFixed(2)} MB`
  );
}

function formatDateTime(value) {
  if (!value) {
    return 'Không xác định';
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định';
  }

  return new Intl.DateTimeFormat(
    'vi-VN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ).format(date);
}

function getCollectionCount(
  data,
  collectionName
) {
  return Array.isArray(
    data?.[collectionName]
  )
    ? data[collectionName].length
    : 0;
}

function getTotalRecordCount(data) {
  return COLLECTIONS.reduce(
    (total, collection) =>
      total +
      getCollectionCount(
        data,
        collection.key
      ),
    0
  );
}

function createInformationRow(
  label,
  value
) {
  return createElement(
    'div',
    {
      className:
        'rm-settings-file-info__row'
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

export function createSettingsPage() {
  const seedService =
    resolveSeedService();

  const state = {
    selectedFile: null,
    validatedData: null,
    currentData: null,
    isProcessing: false
  };

  const page = createElement('section', {
    className:
      'rm-settings-page',

    dataset: {
      testid: 'settings-page'
    }
  });

  const heading = createElement(
    'div',
    {
      className:
        'rm-settings-heading'
    },
    [
      createElement('div', {}, [
        createElement('h2', {
          className: 'h4 mb-1',
          text:
            'Cài đặt và sao lưu dữ liệu'
        }),

        createElement('p', {
          className:
            'mb-0 text-body-secondary',

          text:
            'Xuất, nhập, khôi phục và quản lý dữ liệu RoomMate.'
        })
      ])
    ]
  );

  const totalRecordsValue =
    createElement('strong', {
      text: '0',

      dataset: {
        testid:
          'settings-total-records'
      }
    });

  const collectionCountGrid =
    createElement('div', {
      className:
        'rm-settings-collection-grid',

      dataset: {
        testid:
          'settings-collection-counts'
      }
    });

  const dataSummarySection =
    createElement(
      'section',
      {
        className:
          'rm-settings-card'
      },
      [
        createElement(
          'header',
          {
            className:
              'rm-settings-card__header'
          },
          [
            createElement('div', {}, [
              createElement('h3', {
                text:
                  'Thống kê dữ liệu'
              }),

              createElement('p', {
                text:
                  'Số lượng bản ghi hiện có trong từng collection.'
              })
            ]),

            createElement(
              'div',
              {
                className:
                  'rm-settings-total-records'
              },
              [
                createElement('span', {
                  text:
                    'Tổng bản ghi'
                }),

                totalRecordsValue
              ]
            )
          ]
        ),

        collectionCountGrid
      ]
    );

  const exportButton =
    createElement('button', {
      className: 'btn btn-primary',
      text:
        'Export dữ liệu JSON',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'settings-export-button'
      }
    });

  const exportSection = createElement(
    'section',
    {
      className:
        'rm-settings-card'
    },
    [
      createElement(
        'header',
        {
          className:
            'rm-settings-card__header'
        },
        [
          createElement('div', {}, [
            createElement('h3', {
              text: 'Sao lưu dữ liệu'
            }),

            createElement('p', {
              text:
                'Tải toàn bộ dữ liệu RoomMate xuống dưới dạng file JSON.'
            })
          ])
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-settings-card__content'
        },
        [
          createElement(
            'div',
            {
              className:
                'rm-settings-notice rm-settings-notice--info'
            },
            [
              createElement('strong', {
                text:
                  'Nên sao lưu định kỳ'
              }),

              createElement('p', {
                text:
                  'File backup chứa phòng, người thuê, hợp đồng, hóa đơn, thanh toán và các cấu hình liên quan.'
              })
            ]
          ),

          exportButton
        ]
      )
    ]
  );

  const fileInput =
    createElement('input', {
      className: 'form-control',

      attributes: {
        id:
          'settings-import-file',

        type: 'file',

        accept:
          '.json,application/json'
      },

      dataset: {
        testid:
          'settings-import-file'
      }
    });

  const fileInformation =
    createElement('div', {
      className:
        'rm-settings-file-info',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'settings-file-info'
      }
    });

  const validationStatus =
    createElement('div', {
      className:
        'rm-settings-validation-status',

      attributes: {
        hidden: '',
        role: 'status'
      },

      dataset: {
        testid:
          'settings-validation-status'
      }
    });

  const importedCollectionGrid =
    createElement('div', {
      className:
        'rm-settings-import-counts',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'settings-import-counts'
      }
    });

  const importModeSelect =
    createElement('select', {
      className: 'form-select',

      attributes: {
        id:
          'settings-import-mode'
      },

      dataset: {
        testid:
          'settings-import-mode'
      }
    });

  importModeSelect.append(
    createElement('option', {
      text:
        'Ghi đè toàn bộ dữ liệu',

      attributes: {
        value:
          IMPORT_MODE.OVERWRITE
      }
    }),

    createElement('option', {
      text:
        'Gộp với dữ liệu hiện tại',

      attributes: {
        value:
          IMPORT_MODE.MERGE
      }
    })
  );

  const conflictSelect =
    createElement('select', {
      className: 'form-select',

      attributes: {
        id:
          'settings-import-conflict'
      },

      dataset: {
        testid:
          'settings-import-conflict'
      }
    });

  conflictSelect.append(
    createElement('option', {
      text:
        'Thay thế bản ghi trùng ID',

      attributes: {
        value:
          MERGE_CONFLICT.REPLACE
      }
    }),

    createElement('option', {
      text:
        'Giữ bản ghi hiện tại',

      attributes: {
        value:
          MERGE_CONFLICT
            .KEEP_EXISTING
      }
    }),

    createElement('option', {
      text:
        'Báo lỗi khi trùng ID',

      attributes: {
        value:
          MERGE_CONFLICT.ERROR
      }
    })
  );

  const conflictField =
    createElement(
      'div',
      {
        className:
          'rm-settings-import-field',

        attributes: {
          hidden: ''
        }
      },
      [
        createElement('label', {
          className: 'form-label',

          text:
            'Khi trùng dữ liệu',

          attributes: {
            for:
              'settings-import-conflict'
          }
        }),

        conflictSelect
      ]
    );

  const validateButton =
    createElement('button', {
      className:
        'btn btn-outline-primary',

      text:
        'Kiểm tra dữ liệu',

      attributes: {
        type: 'button',
        disabled: ''
      },

      dataset: {
        testid:
          'settings-validate-import'
      }
    });

  const importButton =
    createElement('button', {
      className: 'btn btn-primary',
      text: 'Import dữ liệu',

      attributes: {
        type: 'button',
        disabled: ''
      },

      dataset: {
        testid:
          'settings-import-button'
      }
    });

  const clearFileButton =
    createElement('button', {
      className:
        'btn btn-outline-secondary',

      text: 'Bỏ chọn file',

      attributes: {
        type: 'button',
        disabled: ''
      },

      dataset: {
        testid:
          'settings-clear-file'
      }
    });

  const importSection = createElement(
    'section',
    {
      className:
        'rm-settings-card'
    },
    [
      createElement(
        'header',
        {
          className:
            'rm-settings-card__header'
        },
        [
          createElement('div', {}, [
            createElement('h3', {
              text:
                'Import dữ liệu JSON'
            }),

            createElement('p', {
              text:
                'Chọn file backup, kiểm tra dữ liệu rồi mới thực hiện import.'
            })
          ])
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-settings-card__content'
        },
        [
          createElement(
            'div',
            {
              className:
                'rm-settings-import-form'
            },
            [
              createElement(
                'div',
                {
                  className:
                    'rm-settings-import-field rm-settings-import-field--file'
                },
                [
                  createElement('label', {
                    className:
                      'form-label',

                    text: 'File JSON',

                    attributes: {
                      for:
                        'settings-import-file'
                    }
                  }),

                  fileInput
                ]
              ),

              createElement(
                'div',
                {
                  className:
                    'rm-settings-import-field'
                },
                [
                  createElement('label', {
                    className:
                      'form-label',

                    text:
                      'Chế độ import',

                    attributes: {
                      for:
                        'settings-import-mode'
                    }
                  }),

                  importModeSelect
                ]
              ),

              conflictField
            ]
          ),

          fileInformation,
          validationStatus,
          importedCollectionGrid,

          createElement(
            'div',
            {
              className:
                'rm-settings-import-actions'
            },
            [
              validateButton,
              importButton,
              clearFileButton
            ]
          )
        ]
      )
    ]
  );

  const createSeedButton =
    createElement('button', {
      className:
        'btn btn-outline-primary',

      text:
        'Tạo dữ liệu mẫu',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'settings-create-seed'
      }
    });

  const restoreSeedButton =
    createElement('button', {
      className:
        'btn btn-outline-warning',

      text:
        'Khôi phục dữ liệu mẫu',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'settings-restore-seed'
      }
    });

  const deleteAllButton =
    createElement('button', {
      className: 'btn btn-danger',
      text:
        'Xóa toàn bộ dữ liệu',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'settings-delete-all'
      }
    });

  const dangerousSection =
    createElement(
      'section',
      {
        className:
          'rm-settings-card rm-settings-card--danger'
      },
      [
        createElement(
          'header',
          {
            className:
              'rm-settings-card__header'
          },
          [
            createElement('div', {}, [
              createElement('h3', {
                text:
                  'Quản lý dữ liệu hệ thống'
              }),

              createElement('p', {
                text:
                  'Các thao tác bên dưới có thể làm thay đổi hoặc xóa dữ liệu hiện tại.'
              })
            ])
          ]
        ),

        createElement(
          'div',
          {
            className:
              'rm-settings-card__content'
          },
          [
            createElement(
              'div',
              {
                className:
                  'rm-settings-notice rm-settings-notice--danger'
              },
              [
                createElement('strong', {
                  text:
                    'Cảnh báo thao tác nguy hiểm'
                }),

                createElement('p', {
                  text:
                    'Khôi phục dữ liệu mẫu hoặc xóa toàn bộ dữ liệu có thể làm mất thông tin đang sử dụng. Hãy export backup trước khi tiếp tục.'
                })
              ]
            ),

            createElement(
              'div',
              {
                className:
                  'rm-settings-danger-actions'
              },
              [
                createSeedButton,
                restoreSeedButton,
                deleteAllButton
              ]
            )
          ]
        )
      ]
    );

  page.append(
    heading,
    dataSummarySection,
    exportSection,
    importSection,
    dangerousSection
  );

  function renderCurrentCounts(data) {
    state.currentData = data;

    collectionCountGrid
      .replaceChildren();

    COLLECTIONS.forEach(
      (collection) => {
        const count =
          getCollectionCount(
            data,
            collection.key
          );

        collectionCountGrid.append(
          createElement(
            'article',
            {
              className:
                'rm-settings-collection-card',

              dataset: {
                testid:
                  `settings-count-${collection.key}`
              }
            },
            [
              createElement('span', {
                className:
                  'rm-settings-collection-card__icon',

                text: collection.icon,

                attributes: {
                  'aria-hidden': 'true'
                }
              }),

              createElement(
                'div',
                {},
                [
                  createElement('span', {
                    text:
                      collection.label
                  }),

                  createElement('strong', {
                    text:
                      String(count)
                  })
                ]
              )
            ]
          )
        );
      }
    );

    totalRecordsValue.textContent =
      String(
        getTotalRecordCount(data)
      );
  }

  function refreshCounts() {
    const data =
      backupService.exportData();

    renderCurrentCounts(data);
  }

  function renderSelectedFile(file) {
    if (!file) {
      fileInformation.hidden = true;
      fileInformation.replaceChildren();
      return;
    }

    fileInformation.replaceChildren(
      createElement('h4', {
        text:
          'Thông tin file đã chọn'
      }),

      createInformationRow(
        'Tên file',
        file.name
      ),

      createInformationRow(
        'Dung lượng',
        formatFileSize(file.size)
      ),

      createInformationRow(
        'Loại file',
        file.type ||
        'application/json'
      ),

      createInformationRow(
        'Chỉnh sửa lần cuối',
        formatDateTime(
          file.lastModified
        )
      )
    );

    fileInformation.hidden = false;
  }

  function renderImportCounts(data) {
    importedCollectionGrid
      .replaceChildren();

    COLLECTIONS.forEach(
      (collection) => {
        importedCollectionGrid.append(
          createElement(
            'div',
            {
              className:
                'rm-settings-import-count',

              dataset: {
                testid:
                  `settings-import-count-${collection.key}`
              }
            },
            [
              createElement('span', {
                text:
                  collection.label
              }),

              createElement('strong', {
                text:
                  String(
                    getCollectionCount(
                      data,
                      collection.key
                    )
                  )
              })
            ]
          )
        );
      }
    );

    importedCollectionGrid.hidden =
      false;
  }

  function showValidationStatus(
    type,
    message
  ) {
    validationStatus.className =
      `rm-settings-validation-status ` +
      `rm-settings-validation-status--${type}`;

    validationStatus.textContent =
      message;

    validationStatus.hidden = false;
  }

  function clearValidation() {
    state.validatedData = null;

    validationStatus.hidden = true;
    validationStatus.textContent = '';

    importedCollectionGrid.hidden =
      true;

    importedCollectionGrid
      .replaceChildren();

    importButton.disabled = true;
  }

  function clearSelectedFile() {
    state.selectedFile = null;
    state.validatedData = null;

    fileInput.value = '';

    renderSelectedFile(null);
    clearValidation();

    validateButton.disabled = true;
    clearFileButton.disabled = true;
  }

  function setProcessing(processing) {
    state.isProcessing =
      Boolean(processing);

    exportButton.disabled =
      state.isProcessing;

    fileInput.disabled =
      state.isProcessing;

    importModeSelect.disabled =
      state.isProcessing;

    conflictSelect.disabled =
      state.isProcessing;

    validateButton.disabled =
      state.isProcessing ||
      !state.selectedFile;

    importButton.disabled =
      state.isProcessing ||
      !state.validatedData;

    clearFileButton.disabled =
      state.isProcessing ||
      !state.selectedFile;

    createSeedButton.disabled =
      state.isProcessing;

    restoreSeedButton.disabled =
      state.isProcessing;

    deleteAllButton.disabled =
      state.isProcessing;
  }

  async function validateSelectedFile() {
    if (!state.selectedFile) {
      showValidationStatus(
        'danger',
        'Vui lòng chọn file JSON.'
      );

      return false;
    }

    setProcessing(true);

    showValidationStatus(
      'loading',
      'Đang đọc và kiểm tra dữ liệu...'
    );

    try {
      const parsedData =
        await backupService
          .readJsonFile(
            state.selectedFile
          );

      const validatedData =
        backupService
          .validateBackupData(
            parsedData
          );

      state.validatedData =
        validatedData;

      renderImportCounts(
        validatedData
      );

      showValidationStatus(
        'success',
        `Dữ liệu hợp lệ. Tìm thấy ${getTotalRecordCount(
          validatedData
        )} bản ghi.`
      );

      return true;
    } catch (error) {
      state.validatedData = null;

      importedCollectionGrid.hidden =
        true;

      importButton.disabled = true;

      showValidationStatus(
        'danger',

        error instanceof Error
          ? error.message
          : 'File backup không hợp lệ.'
      );

      return false;
    } finally {
      setProcessing(false);
    }
  }

  async function importValidatedData() {
    if (!state.validatedData) {
      const valid =
        await validateSelectedFile();

      if (!valid) {
        return;
      }
    }

    const mode =
      importModeSelect.value;

    const conflict =
      conflictSelect.value;

    if (
      mode === IMPORT_MODE.OVERWRITE
    ) {
      const confirmed =
        await showConfirmDialog({
          title:
            'Ghi đè toàn bộ dữ liệu?',

          message:
            'Toàn bộ dữ liệu hiện tại sẽ bị thay thế bằng dữ liệu trong file. RoomMate sẽ tự tạo một file backup trước khi import.',

          confirmText:
            'Ghi đè dữ liệu',

          cancelText: 'Hủy',

          variant: 'danger'
        });

      if (!confirmed) {
        return;
      }
    }

    setProcessing(true);

    try {
      const result =
        backupService.importData(
          state.validatedData,
          {
            mode,
            conflict
          }
        );

      showToast({
        type: 'success',
        title:
          'Import thành công',

        message:
          result.mode ===
          IMPORT_MODE.OVERWRITE
            ? 'Dữ liệu đã được ghi đè và backup cũ đã được tạo.'
            : 'Dữ liệu đã được gộp với dữ liệu hiện tại.'
      });

      clearSelectedFile();
      refreshCounts();
    } catch (error) {
      showValidationStatus(
        'danger',

        error instanceof Error
          ? error.message
          : 'Không thể import dữ liệu.'
      );

      showToast({
        type: 'danger',
        title:
          'Import thất bại',

        message:
          error instanceof Error
            ? error.message
            : 'Dữ liệu hiện tại không bị thay đổi.'
      });
    } finally {
      setProcessing(false);
    }
  }

  async function createSeedData() {
    if (
      !seedService ||
      typeof seedService.seedIfEmpty !==
        'function'
    ) {
      showToast({
        type: 'danger',
        title:
          'Không thể tạo dữ liệu mẫu',

        message:
          'SeedService chưa cung cấp seedIfEmpty().'
      });

      return;
    }

    setProcessing(true);

    try {
      seedService.seedIfEmpty();

      refreshCounts();

      showToast({
        type: 'success',
        title:
          'Tạo dữ liệu mẫu',

        message:
          'Đã bổ sung dữ liệu mẫu cho các collection đang trống.'
      });
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể tạo dữ liệu mẫu',

        message:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi tạo dữ liệu mẫu.'
      });
    } finally {
      setProcessing(false);
    }
  }

  async function restoreSeedData() {
    const confirmed =
      await showConfirmDialog({
        title:
          'Khôi phục dữ liệu mẫu?',

        message:
          'Dữ liệu hiện tại sẽ bị thay thế bằng bộ dữ liệu mẫu ban đầu. Hãy export backup trước khi tiếp tục.',

        confirmText:
          'Khôi phục dữ liệu mẫu',

        cancelText: 'Hủy',

        variant: 'danger'
      });

    if (!confirmed) {
      return;
    }

    setProcessing(true);

    try {
      backupService.restoreSeedData();

      clearSelectedFile();
      refreshCounts();

      showToast({
        type: 'success',
        title:
          'Đã khôi phục dữ liệu mẫu',

        message:
          'Toàn bộ collection đã được đưa về dữ liệu mẫu.'
      });
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể khôi phục',

        message:
          error instanceof Error
            ? error.message
            : 'Không thể khôi phục dữ liệu mẫu.'
      });
    } finally {
      setProcessing(false);
    }
  }

  async function deleteAllData() {
    const firstConfirmation =
      await showConfirmDialog({
        title:
          'Xóa toàn bộ dữ liệu?',

        message:
          'Tất cả phòng, người thuê, hợp đồng, hóa đơn, thanh toán và cấu hình sẽ bị xóa.',

        confirmText:
          'Tiếp tục xóa',

        cancelText: 'Hủy',

        variant: 'danger'
      });

    if (!firstConfirmation) {
      return;
    }

    const finalConfirmation =
      await showConfirmDialog({
        title:
          'Xác nhận lần cuối',

        message:
          'Thao tác này không thể hoàn tác nếu chưa có file backup. Bạn chắc chắn muốn xóa toàn bộ dữ liệu?',

        confirmText:
          'Xóa vĩnh viễn',

        cancelText:
          'Không xóa',

        variant: 'danger'
      });

    if (!finalConfirmation) {
      return;
    }

    setProcessing(true);

    try {
      backupService.resetAllData();

      clearSelectedFile();
      refreshCounts();

      showToast({
        type: 'success',
        title:
          'Đã xóa dữ liệu',

        message:
          'Toàn bộ collection RoomMate hiện đang trống.'
      });
    } catch (error) {
      showToast({
        type: 'danger',
        title:
          'Không thể xóa dữ liệu',

        message:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi khi xóa dữ liệu.'
      });
    } finally {
      setProcessing(false);
    }
  }

  exportButton.addEventListener(
    'click',
    () => {
      setProcessing(true);

      try {
        const result =
          backupService
            .downloadBackup();

        showToast({
          type: 'success',
          title:
            'Đã tạo file backup',

          message:
            result.downloaded
              ? `Đang tải file ${result.fileName}.`
              : `Đã tạo dữ liệu backup ${result.fileName}.`
        });
      } catch (error) {
        showToast({
          type: 'danger',
          title:
            'Không thể export',

          message:
            error instanceof Error
              ? error.message
              : 'Không thể tạo file backup.'
        });
      } finally {
        setProcessing(false);
      }
    }
  );

  fileInput.addEventListener(
    'change',
    () => {
      const file =
        fileInput.files?.[0] ??
        null;

      state.selectedFile = file;

      clearValidation();
      renderSelectedFile(file);

      validateButton.disabled =
        !file;

      clearFileButton.disabled =
        !file;

      if (!file) {
        return;
      }

      showValidationStatus(
        'info',
        'File chưa được kiểm tra. Nhấn “Kiểm tra dữ liệu” trước khi import.'
      );
    }
  );

  importModeSelect.addEventListener(
    'change',
    () => {
      conflictField.hidden =
        importModeSelect.value !==
        IMPORT_MODE.MERGE;
    }
  );

  validateButton.addEventListener(
    'click',
    validateSelectedFile
  );

  importButton.addEventListener(
    'click',
    importValidatedData
  );

  clearFileButton.addEventListener(
    'click',
    clearSelectedFile
  );

  createSeedButton.addEventListener(
    'click',
    createSeedData
  );

  restoreSeedButton.addEventListener(
    'click',
    restoreSeedData
  );

  deleteAllButton.addEventListener(
    'click',
    deleteAllData
  );

  refreshCounts();

  return page;
}

export const createPage =
  createSettingsPage;

export default createSettingsPage;