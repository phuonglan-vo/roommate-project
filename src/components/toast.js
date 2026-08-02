const TOAST_REGION_ID = 'roommateToastRegion';

const TOAST_TYPES = new Set([
  'success',
  'warning',
  'danger',
  'info'
]);

function createElement(
  tagName,
  {
    className = '',
    text = '',
    attributes = {}
  } = {},
  children = []
) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });

  element.append(...children);

  return element;
}

export function createToastRegion() {
  const existingRegion = document.getElementById(TOAST_REGION_ID);

  if (existingRegion) {
    return existingRegion;
  }

  return createElement('div', {
    className:
      'toast-container position-fixed top-0 end-0 p-3 rm-toast-region',
    attributes: {
      id: TOAST_REGION_ID,
      'aria-live': 'polite',
      'aria-atomic': 'true',
      'data-testid': 'toast-region'
    }
  });
}

function getToastRegion() {
  let region = document.getElementById(TOAST_REGION_ID);

  if (!region) {
    region = createToastRegion();
    document.body.append(region);
  }

  return region;
}

export function showToast({
  title = 'RoomMate',
  message,
  type = 'info',
  delay = 3500
} = {}) {
  if (!message || typeof message !== 'string') {
    throw new TypeError('Toast cần có nội dung thông báo.');
  }

  const normalizedType = TOAST_TYPES.has(type)
    ? type
    : 'info';

  const indicator = createElement('span', {
    className: 'rm-toast-indicator',
    attributes: {
      'aria-hidden': 'true'
    }
  });

  const titleElement = createElement('strong', {
    className: 'me-auto',
    text: title
  });

  const timeElement = createElement('small', {
    className: 'text-body-secondary',
    text: 'Vừa xong'
  });

  const closeButton = createElement('button', {
    className: 'btn-close ms-2 mb-1',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'toast',
      'aria-label': 'Đóng thông báo'
    }
  });

  const header = createElement(
    'div',
    {
      className: 'toast-header'
    },
    [indicator, titleElement, timeElement, closeButton]
  );

  const body = createElement('div', {
    className: 'toast-body',
    text: message,
    attributes: {
      'data-testid': 'toast-message'
    }
  });

  const toastElement = createElement(
    'div',
    {
      className: `toast rm-toast rm-toast--${normalizedType}`,
      attributes: {
        role: normalizedType === 'danger' ? 'alert' : 'status',
        'aria-live':
          normalizedType === 'danger'
            ? 'assertive'
            : 'polite',
        'aria-atomic': 'true',
        'data-testid': 'toast'
      }
    },
    [header, body]
  );

  const region = getToastRegion();

  region.append(toastElement);

  const Toast = window.bootstrap?.Toast;

  if (!Toast) {
    toastElement.classList.add('show');

    window.setTimeout(() => {
      toastElement.remove();
    }, delay);

    return toastElement;
  }

  const toast = Toast.getOrCreateInstance(toastElement, {
    autohide: true,
    delay
  });

  toastElement.addEventListener(
    'hidden.bs.toast',
    () => {
      toast.dispose();
      toastElement.remove();
    },
    {
      once: true
    }
  );

  toast.show();

  return toastElement;
}