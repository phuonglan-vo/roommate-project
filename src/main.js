import './styles/main.css';

import {
  createAppLayout,
  getLayoutOutlet,
  updateLayoutPage
} from './components/layout.js';

import {
  createHashRouter,
  navigate
} from './router.js';

import { createToastRegion } from './components/toast.js';
import { createConfirmDialog } from './components/confirm-dialog.js';

const appRoot = document.querySelector('#app');

if (!appRoot) {
  throw new Error(
    'Không tìm thấy phần tử #app để khởi tạo RoomMate.'
  );
}

const appLayout = createAppLayout({
  onNavigate: navigate
});

appRoot.replaceChildren(appLayout);

document.body.append(
  createToastRegion(),
  createConfirmDialog()
);

const outlet = getLayoutOutlet(appLayout);

const router = createHashRouter({
  outlet,

  onRouteChange({
    route,
    isNotFound
  }) {
    updateLayoutPage(appLayout, {
      page: isNotFound ? null : route.page,
      title: route.title
    });

    document.title = `${route.title} | RoomMate`;
  }
});

router.start();