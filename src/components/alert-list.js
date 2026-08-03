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

const ALERT_ICONS = Object.freeze({
  danger: '!',
  warning: '!',
  info: 'i',
  success: '✓'
});

/**
 * Tạo danh sách cảnh báo Dashboard.
 *
 * Mỗi cảnh báo có dạng:
 * {
 *   id,
 *   title,
 *   message,
 *   type,
 *   href,
 *   linkLabel
 * }
 *
 * @param {object} options Tùy chọn.
 * @param {object[]} [options.items=[]] Danh sách cảnh báo.
 * @param {string} [options.emptyMessage] Nội dung khi không có cảnh báo.
 * @returns {{
 *   element: HTMLElement,
 *   render: (items: object[]) => void,
 *   setLoading: (loading: boolean) => void
 * }}
 */
export function createAlertList({
  items = [],
  emptyMessage =
    'Hiện không có cảnh báo cần xử lý.'
} = {}) {
  const list = createElement('div', {
    className:
      'rm-alert-list__items',

    dataset: {
      testid:
        'dashboard-alert-items'
    }
  });

  const emptyState = createElement(
    'div',
    {
      className:
        'rm-alert-list__empty',

      attributes: {
        hidden: ''
      },

      dataset: {
        testid:
          'dashboard-alert-empty'
      }
    },
    [
      createElement('span', {
        className:
          'rm-alert-list__empty-icon',

        text: '✓',

        attributes: {
          'aria-hidden': 'true'
        }
      }),

      createElement('p', {
        className: 'mb-0',
        text: emptyMessage
      })
    ]
  );

  const loadingState = createElement(
    'div',
    {
      className:
        'rm-alert-list__loading',

      attributes: {
        hidden: '',
        role: 'status'
      },

      dataset: {
        testid:
          'dashboard-alert-loading'
      }
    },
    [
      createElement('span', {
        className:
          'spinner-border spinner-border-sm',

        attributes: {
          'aria-hidden': 'true'
        }
      }),

      createElement('span', {
        text:
          'Đang tải cảnh báo...'
      })
    ]
  );

  const element = createElement(
    'section',
    {
      className:
        'rm-alert-list',

      dataset: {
        testid:
          'dashboard-alert-list'
      }
    },
    [
      createElement(
        'header',
        {
          className:
            'rm-alert-list__header'
        },
        [
          createElement('div', {}, [
            createElement('h3', {
              className:
                'rm-alert-list__title',

              text:
                'Cảnh báo cần chú ý'
            }),

            createElement('p', {
              className:
                'rm-alert-list__subtitle',

              text:
                'Các vấn đề cần được kiểm tra sớm.'
            })
          ])
        ]
      ),

      loadingState,
      list,
      emptyState
    ]
  );

  function createAlertItem(
    item,
    index
  ) {
    const type =
      ['danger', 'warning', 'info', 'success']
        .includes(item?.type)
        ? item.type
        : 'warning';

    const title =
      String(
        item?.title ??
        `Cảnh báo ${index + 1}`
      );

    const message =
      String(item?.message ?? '');

    const content =
      createElement(
        'div',
        {
          className:
            'rm-alert-list__content'
        },
        [
          createElement('strong', {
            text: title
          }),

          createElement('p', {
            text: message
          })
        ]
      );

    const children = [
      createElement('span', {
        className:
          `rm-alert-list__icon ` +
          `rm-alert-list__icon--${type}`,

        text:
          ALERT_ICONS[type],

        attributes: {
          'aria-hidden': 'true'
        }
      }),

      content
    ];

    if (
      typeof item?.href === 'string' &&
      item.href.trim()
    ) {
      children.push(
        createElement('a', {
          className:
            'rm-alert-list__link',

          text:
            item.linkLabel ??
            'Xem chi tiết',

          attributes: {
            href: item.href
          },

          dataset: {
            testid:
              `dashboard-alert-link-${item.id ?? index}`
          }
        })
      );
    }

    return createElement(
      'article',
      {
        className:
          `rm-alert-list__item ` +
          `rm-alert-list__item--${type}`,

        dataset: {
          testid:
            `dashboard-alert-${item?.id ?? index}`
        }
      },
      children
    );
  }

  function render(nextItems = []) {
    if (!Array.isArray(nextItems)) {
      throw new TypeError(
        'Danh sách cảnh báo phải là một mảng.'
      );
    }

    list.replaceChildren(
      ...nextItems.map(
        createAlertItem
      )
    );

    list.hidden =
      nextItems.length === 0;

    emptyState.hidden =
      nextItems.length > 0;
  }

  function setLoading(loading) {
    const isLoading =
      Boolean(loading);

    loadingState.hidden =
      !isLoading;

    list.hidden =
      isLoading;

    emptyState.hidden =
      isLoading;

    element.setAttribute(
      'aria-busy',
      String(isLoading)
    );
  }

  render(items);

  return Object.freeze({
    element,
    render,
    setLoading
  });
}

export default createAlertList;