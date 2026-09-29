import axios, { type AxiosRequestConfig } from 'axios';

import { thenHandler, catchHandler } from './errorHandlers';

import { env } from '@/lib/env';

//#region CONFIG
// Exportada para os helpers de transporte que precisam da resposta COMPLETA (o
// `api` abaixo devolve só o `data`) — ex.: o download, que lê o nome do arquivo
// do `Content-Disposition`.
export const axiosApi = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
});

axiosApi.interceptors.response.use(
  (response) => {
    thenHandler(response);
    return response;
  },
  (error) => {
    catchHandler(error);
    return Promise.reject(error);
  }
);
//#endregion

export const api = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosApi.get<T>(url, config);
    return response.data;
  },

  post: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosApi.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosApi.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosApi.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await axiosApi.delete<T>(url, config);
    return response.data;
  },
};
