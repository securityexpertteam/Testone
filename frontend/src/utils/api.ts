const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiOrigin = configuredApiUrl
  ? `${/^https?:\/\//i.test(configuredApiUrl) ? configuredApiUrl : `https://${configuredApiUrl}`}`.replace(/\/$/, '')
  : '';

export const API_BASE_URL = `${apiOrigin}/api`;