import {
  beforeEach,
  afterEach,
  vi
} from 'vitest';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});