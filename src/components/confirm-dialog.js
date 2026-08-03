const CONFIRM_DIALOG_ID = 'roommateConfirmDialog';

const BUTTON_VARIANTS = new Set([
  'primary',
  'danger',
  'warning'
]);

let pendingResolver = null;
let actionConfirmed = false;

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

function resolvePendingRequest(result) {
  if (typeof pendingResolver === 'function') {
    pendingResolver(result);
  }

  pendingResolver = null;
  actionConfirmed = false;
}

export function createConfirmDialog() {
  const existingDialog = document.getElementById(CONFIRM_DIALOG_ID);

  if (existingDialog) {
    return existingDialog;
  }

  const title = createElement('h2', {
    className: 'modal-title',
    text: 'Xác nhận thao tác',
    attributes: {
      id: 'roommateConfirmDialogTitle',
      'data-testid': 'confirm-dialog-title'
    }
  });

  const closeButton = createElement('button', {
    className: 'btn-close',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal',
      'aria-label': 'Đóng hộp thoại',
      'data-testid': 'confirm-dialog-close'
    }
  });

  const header = createElement(
    'div',
    {
      className: 'modal-header'
    },
    [title, closeButton]
  );

  const message = createElement('p', {
    className: 'mb-0',
    text: 'Bạn có chắc chắn muốn thực hiện thao tác này?',
    attributes: {
      id: 'roommateConfirmDialogMessage',
      'data-testid': 'confirm-dialog-message'
    }
  });

  const body = createElement(
    'div',
    {
      className: 'modal-body'
    },
    [message]
  );

  const cancelButton = createElement('button', {
    className: 'btn btn-outline-secondary',
    text: 'Hủy',
    attributes: {
      type: 'button',
      'data-bs-dismiss': 'modal',
      'data-testid': 'confirm-dialog-cancel'
    }
  });

  const confirmButton = createElement('button', {
    className: 'btn btn-danger',
    text: 'Xác nhận',
    attributes: {
      type: 'button',
      'data-testid': 'confirm-dialog-confirm'
    }
  });

  const footer = createElement(
    'div',
    {
      className: 'modal-footer'
    },
    [cancelButton, confirmButton]
  );

  const content = createElement(
    'div',
    {
      className: 'modal-content'
    },
    [header, body, footer]
  );

  const dialog = createElement(
    'div',
    {
      className: 'modal-dialog modal-dialog-centered'
    },
    [content]
  );

  const modal = createElement(
    'div',
    {
      className: 'modal fade rm-confirm-dialog',
      attributes: {
        id: CONFIRM_DIALOG_ID,
        tabindex: '-1',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'roommateConfirmDialogTitle',
        'aria-describedby': 'roommateConfirmDialogMessage',
        'aria-hidden': 'true',
        'data-testid': 'confirm-dialog'
      }
    },
    [dialog]
  );

  confirmButton.addEventListener('click', () => {
    actionConfirmed = true;

    const Modal = window.bootstrap?.Modal;
    const instance = Modal?.getInstance(modal);

    instance?.hide();
  });

  modal.addEventListener('show.bs.modal', () => {
    actionConfirmed = false;
  });

  modal.addEventListener('hidden.bs.modal', () => {
    resolvePendingRequest(actionConfirmed);
  });

  return modal;
}

function getConfirmDialog() {
  let modal = document.getElementById(CONFIRM_DIALOG_ID);

  if (!modal) {
    modal = createConfirmDialog();
    document.body.append(modal);
  }

  return modal;
}

export function showConfirmDialog({
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger'
} = {}) {
  const modalElement = getConfirmDialog();
  const Modal = window.bootstrap?.Modal;

  if (!Modal) {
    return Promise.resolve(false);
  }

  if (pendingResolver) {
    resolvePendingRequest(false);
  }

  const titleElement = modalElement.querySelector(
    '[data-testid="confirm-dialog-title"]'
  );

  const messageElement = modalElement.querySelector(
    '[data-testid="confirm-dialog-message"]'
  );

  const confirmButton = modalElement.querySelector(
    '[data-testid="confirm-dialog-confirm"]'
  );

  const cancelButton = modalElement.querySelector(
    '[data-testid="confirm-dialog-cancel"]'
  );

  const normalizedVariant = BUTTON_VARIANTS.has(variant)
    ? variant
    : 'danger';

  titleElement.textContent = title;
  messageElement.textContent = message;
  confirmButton.textContent = confirmText;
  cancelButton.textContent = cancelText;

  confirmButton.className = `btn btn-${normalizedVariant}`;

  actionConfirmed = false;

  const modal = Modal.getOrCreateInstance(modalElement, {
    backdrop: 'static',
    keyboard: true,
    focus: true
  });

  return new Promise((resolve) => {
    pendingResolver = resolve;
    modal.show();
  });
}