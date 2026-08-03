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

/**
 * Tạo thẻ thống kê dùng trên Dashboard.
 *
 * @param {object} options Tùy chọn.
 * @param {string} options.label Nhãn chỉ số.
 * @param {string|number} options.value Giá trị hiển thị.
 * @param {string} [options.icon] Biểu tượng.
 * @param {string} [options.description] Nội dung phụ.
 * @param {'primary'|'success'|'warning'|'danger'|'info'|'neutral'} [options.variant]
 * @param {string} [options.testId] data-testid của thẻ.
 * @returns {{
 *   element: HTMLElement,
 *   setValue: (value: string|number) => void,
 *   setDescription: (description: string) => void,
 *   setLoading: (loading: boolean) => void
 * }}
 */
export function createStatCard({
  label,
  value = '—',
  icon = '•',
  description = '',
  variant = 'primary',
  testId = ''
} = {}) {
  if (
    typeof label !== 'string' ||
    !label.trim()
  ) {
    throw new TypeError(
      'StatCard cần một nhãn hợp lệ.'
    );
  }

  const iconElement = createElement('div', {
    className:
      `rm-stat-card__icon ` +
      `rm-stat-card__icon--${variant}`,

    text: icon,

    attributes: {
      'aria-hidden': 'true'
    }
  });

  const labelElement = createElement('span', {
    className:
      'rm-stat-card__label',

    text: label.trim()
  });

  const valueElement = createElement('strong', {
    className:
      'rm-stat-card__value',

    text: String(value),

    dataset: {
      testid:
        testId
          ? `${testId}-value`
          : 'stat-card-value'
    }
  });

  const descriptionElement =
    createElement('small', {
      className:
        'rm-stat-card__description',

      text: description,

      attributes: {
        hidden:
          description ? null : ''
      }
    });

  const element = createElement(
    'article',
    {
      className:
        `rm-stat-card ` +
        `rm-stat-card--${variant}`,

      dataset: {
        testid:
          testId ||
          'stat-card'
      }
    },
    [
      iconElement,

      createElement(
        'div',
        {
          className:
            'rm-stat-card__content'
        },
        [
          labelElement,
          valueElement,
          descriptionElement
        ]
      )
    ]
  );

  function setValue(nextValue) {
    valueElement.textContent =
      String(nextValue ?? '—');
  }

  function setDescription(
    nextDescription
  ) {
    const normalizedDescription =
      String(nextDescription ?? '');

    descriptionElement.textContent =
      normalizedDescription;

    descriptionElement.hidden =
      !normalizedDescription;
  }

  function setLoading(loading) {
    element.classList.toggle(
      'rm-stat-card--loading',
      Boolean(loading)
    );

    element.setAttribute(
      'aria-busy',
      String(Boolean(loading))
    );

    if (loading) {
      valueElement.textContent = '...';
    }
  }

  return Object.freeze({
    element,
    setValue,
    setDescription,
    setLoading
  });
}

export default createStatCard;