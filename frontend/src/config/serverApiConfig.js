const normalizeBaseUrl = (value) => `${value.replace(/\/+$/, '')}/`;

const configuredBackend = import.meta.env.VITE_BACKEND_SERVER;
const backendBaseUrl = configuredBackend
  ? normalizeBaseUrl(configuredBackend)
  : import.meta.env.PROD
    ? '/'
    : 'http://localhost:8888/';

export const API_BASE_URL = `${backendBaseUrl}api/`;
export const BASE_URL = backendBaseUrl;
export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || backendBaseUrl;
export const DOWNLOAD_BASE_URL = `${backendBaseUrl}download/`;
export const ACCESS_TOKEN_NAME = 'x-auth-token';
export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || backendBaseUrl;
