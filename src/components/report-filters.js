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

function isValidMonth(value) {
  if (value === '') {
    return true;
  }

  return /^\d{4}-(0[1-9]|1[0-2])$/.test(
    value
  );
}

/**
 * Tạo bộ lọc thời gian cho trang báo cáo.
 *
 * @param {object} options Tùy chọn.
 * @param {string} [options.initialFromMonth]
 * @param {string} [options.initialToMonth]
 * @param {(filters: object) => void|Promise<void>} options.onApply
 * @returns {{
 *   element: HTMLElement,
 *   getValues: () => object,
 *   setValues: (values: object) => void,
 *   reset: () => void,
 *   setLoading: (loading: boolean) => void
 * }}
 */
export function createReportFilters({
  initialFromMonth = '',
  initialToMonth = '',
  onApply
} = {}) {
  if (typeof onApply !== 'function') {
    throw new TypeError(
      'ReportFilters cần hàm onApply.'
    );
  }

  let isSubmitting = false;

  const fromMonthInput = createElement(
    'input',
    {
      className: 'form-control',

      attributes: {
        id: 'report-from-month',
        type: 'month',
        value: initialFromMonth,

        'aria-label':
          'Tháng bắt đầu'
      },

      dataset: {
        testid:
          'report-filter-from-month'
      }
    }
  );

  const toMonthInput = createElement(
    'input',
    {
      className: 'form-control',

      attributes: {
        id: 'report-to-month',
        type: 'month',
        value: initialToMonth,

        'aria-label':
          'Tháng kết thúc'
      },

      dataset: {
        testid:
          'report-filter-to-month'
      }
    }
  );

  const errorElement = createElement(
    'div',
    {
      className:
        'rm-report-filters__error',

      attributes: {
        hidden: '',
        role: 'alert'
      },

      dataset: {
        testid:
          'report-filter-error'
      }
    }
  );

  const applyButton = createElement(
    'button',
    {
      className: 'btn btn-primary',
      text: 'Áp dụng',

      attributes: {
        type: 'submit'
      },

      dataset: {
        testid:
          'report-filter-apply'
      }
    }
  );

  const resetButton = createElement(
    'button',
    {
      className:
        'btn btn-outline-secondary',

      text: 'Xóa bộ lọc',

      attributes: {
        type: 'button'
      },

      dataset: {
        testid:
          'report-filter-reset'
      }
    }
  );

  const form = createElement(
    'form',
    {
      className:
        'rm-report-filters',

      attributes: {
        novalidate: ''
      },

      dataset: {
        testid:
          'report-filters'
      }
    },
    [
      createElement(
        'div',
        {
          className:
            'rm-report-filters__field'
        },
        [
          createElement('label', {
            className: 'form-label',
            text: 'Từ tháng',

            attributes: {
              for: 'report-from-month'
            }
          }),

          fromMonthInput
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-report-filters__field'
        },
        [
          createElement('label', {
            className: 'form-label',
            text: 'Đến tháng',

            attributes: {
              for: 'report-to-month'
            }
          }),

          toMonthInput
        ]
      ),

      createElement(
        'div',
        {
          className:
            'rm-report-filters__actions'
        },
        [
          applyButton,
          resetButton
        ]
      ),

      errorElement
    ]
  );

  function clearError() {
    errorElement.hidden = true;
    errorElement.textContent = '';

    fromMonthInput.classList.remove(
      'is-invalid'
    );

    toMonthInput.classList.remove(
      'is-invalid'
    );
  }

  function showError(message) {
    errorElement.textContent = message;
    errorElement.hidden = false;
  }

  function getValues() {
    return {
      fromMonth:
        fromMonthInput.value,

      toMonth:
        toMonthInput.value
    };
  }

  function validate() {
    const values = getValues();

    clearError();

    if (
      !isValidMonth(
        values.fromMonth
      )
    ) {
      fromMonthInput.classList.add(
        'is-invalid'
      );

      showError(
        'Tháng bắt đầu không hợp lệ.'
      );

      fromMonthInput.focus();

      return null;
    }

    if (
      !isValidMonth(
        values.toMonth
      )
    ) {
      toMonthInput.classList.add(
        'is-invalid'
      );

      showError(
        'Tháng kết thúc không hợp lệ.'
      );

      toMonthInput.focus();

      return null;
    }

    if (
      values.fromMonth &&
      values.toMonth &&
      values.fromMonth >
        values.toMonth
    ) {
      fromMonthInput.classList.add(
        'is-invalid'
      );

      toMonthInput.classList.add(
        'is-invalid'
      );

      showError(
        'Tháng bắt đầu không được sau tháng kết thúc.'
      );

      fromMonthInput.focus();

      return null;
    }

    return values;
  }

  function setLoading(loading) {
    isSubmitting = Boolean(loading);

    fromMonthInput.disabled =
      isSubmitting;

    toMonthInput.disabled =
      isSubmitting;

    applyButton.disabled =
      isSubmitting;

    resetButton.disabled =
      isSubmitting;

    applyButton.textContent =
      isSubmitting
        ? 'Đang tải...'
        : 'Áp dụng';

    form.setAttribute(
      'aria-busy',
      String(isSubmitting)
    );
  }

  function setValues({
    fromMonth = '',
    toMonth = ''
  } = {}) {
    fromMonthInput.value =
      fromMonth;

    toMonthInput.value =
      toMonth;

    clearError();
  }

  function reset() {
    setValues({
      fromMonth: '',
      toMonth: ''
    });
  }

  fromMonthInput.addEventListener(
    'change',
    clearError
  );

  toMonthInput.addEventListener(
    'change',
    clearError
  );

  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (isSubmitting) {
        return;
      }

      const values = validate();

      if (!values) {
        return;
      }

      try {
        await onApply(values);
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : 'Không thể áp dụng bộ lọc.'
        );
      }
    }
  );

  resetButton.addEventListener(
    'click',
    async () => {
      if (isSubmitting) {
        return;
      }

      reset();

      try {
        await onApply(getValues());
      } catch (error) {
        showError(
          error instanceof Error
            ? error.message
            : 'Không thể xóa bộ lọc.'
        );
      }
    }
  );

  return Object.freeze({
    element: form,
    getValues,
    setValues,
    reset,
    setLoading
  });
}

export default createReportFilters;