import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetAuthRuntime } from '../auth/session';

afterEach(() => {
  cleanup();
  resetAuthRuntime();
  localStorage.clear();
  sessionStorage.clear();
});
