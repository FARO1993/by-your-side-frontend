import {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

type MockResult = { status: number; data: unknown };

export function installAdapter(
  client: AxiosInstance,
  handler: (config: InternalAxiosRequestConfig) => MockResult | Promise<MockResult>,
): void {
  client.defaults.adapter = async (config) => {
    const result = await handler(config);
    const response = {
      data: result.data,
      status: result.status,
      statusText: String(result.status),
      headers: {},
      config,
    } as AxiosResponse;

    if (result.status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${result.status}`,
        AxiosError.ERR_BAD_REQUEST,
        config,
        null,
        response,
      );
    }

    return response;
  };
}

export function authorizationHeader(config: InternalAxiosRequestConfig): string {
  const value = config.headers.get('Authorization');
  return typeof value === 'string' ? value : '';
}

export function requestBody(config: InternalAxiosRequestConfig): Record<string, unknown> {
  if (!config.data) return {};
  if (typeof config.data === 'string') return JSON.parse(config.data) as Record<string, unknown>;
  return config.data as Record<string, unknown>;
}
