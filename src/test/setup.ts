import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { resetAuthTransition } from '../components/auth/authTransition';
import { resetAuthRuntime } from '../auth/session';

afterEach(() => {
  cleanup();
  resetAuthRuntime();
  resetAuthTransition();
  localStorage.clear();
  sessionStorage.clear();
});
