import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/**
 * Adapter do axios que responde sem rede: status 2xx resolve e os demais
 * rejeitam com o `AxiosError` que o adapter real produziria. A resposta passa
 * pelos interceptors do `axiosApi` como uma de verdade, então o toast do
 * interceptor e o `.parse` do serviço rodam como em produção.
 *
 * Por chamada: `api.get(url, { adapter: respondWith(401, { message }) })`.
 * Para a tela inteira: `axiosApi.defaults.adapter = respondWith(...)`.
 */
export function respondWith(status: number, data: unknown): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    const response: AxiosResponse = {
      data,
      status,
      statusText: '',
      headers: {},
      config,
    };

    if (status >= 200 && status < 300) {
      return response;
    }

    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response
    );
  };
}

/**
 * Adapter do axios que falha como a rede fora (servidor parado, sem conexão):
 * rejeita com o `AxiosError` `ERR_NETWORK`, sem `response`.
 */
export function failWithNetworkError(): AxiosAdapter {
  return async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
  };
}
