import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import * as bootstrap from 'bootstrap';

import {
  createAppLayout,
  getLayoutOutlet,
  updateLayoutPage
} from './components/layout.js';

import {
  createHashRouter,
  navigate
} from './router.js';

/*
 * Nạp toàn bộ CSS nằm trong src/styles.
 * Cách này tránh bỏ sót layout.css, dashboard.css,
 * rooms.css và các CSS chức năng khác.
 */
import.meta.glob('./styles/*.css', {
  eager: true
});

/*
 * Các modal, offcanvas và dialog trong dự án
 * đang truy cập Bootstrap qua window.bootstrap.
 */
window.bootstrap = bootstrap;

function getAppRoot() {
  let root = document.getElementById('app');

  if (!root) {
    root = document.createElement('div');
    root.id = 'app';
    document.body.append(root);
  }

  return root;
}

function showStartupError(error) {
  const root = getAppRoot();

  const wrapper = document.createElement('div');

  wrapper.className =
    'container my-4 alert alert-danger';

  const title = document.createElement('h1');

  title.className = 'h4';
  title.textContent =
    'RoomMate không thể khởi động';

  const message = document.createElement('pre');

  message.className = 'mb-0';
  message.style.whiteSpace = 'pre-wrap';

  message.textContent =
    error instanceof Error
      ? `${error.name}: ${error.message}\n\n${error.stack ?? ''}`
      : String(error);

  wrapper.append(title, message);
  root.replaceChildren(wrapper);
}

function startApplication() {
  const root = getAppRoot();

  const layout = createAppLayout({
    onNavigate(target) {
      navigate(target);
    }
  });

  root.replaceChildren(layout);

  const outlet = getLayoutOutlet(layout);

  const router = createHashRouter({
    outlet,

    onRouteChange({
      route
    }) {
      updateLayoutPage(layout, {
        page: route.page,
        title: route.title
      });
    }
  });

  router.start();

  window.roomMateRouter = router;
}

function safelyStartApplication() {
  try {
    startApplication();
  } catch (error) {
    console.error(
      'Không thể khởi động RoomMate.',
      error
    );

    showStartupError(error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener(
    'DOMContentLoaded',
    safelyStartApplication,
    {
      once: true
    }
  );
} else {
  safelyStartApplication();
}