import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
  }

  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}
