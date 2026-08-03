import { beforeEach } from 'vitest';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();

  document.body.replaceChildren();
});