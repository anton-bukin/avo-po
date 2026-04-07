const API_BASE = '/avo-po/api/v1';

function getToken(): string | null {
  return localStorage.getItem('pspay_token');
}

// Normalizes response keys from snake_case to camelCase.
// Values are not touched — safe for currency codes and numeric ID keys
// since they don't contain underscores.
function camelizeKeys(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelizeKeys);
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      out[camelKey] = camelizeKeys(v);
    }
    return out;
  }
  return obj;
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return camelizeKeys(data);
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  register: (email: string, password: string, fullName: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName }) }),

  getDirections: () => request('/directions'),
  getCountries: () => request('/countries'),
  getProviders: () => request('/providers'),
  getPaymentMethods: () => request('/payment-methods'),
  getRates: () => request('/rates'),

  createTransfer: (data: any) =>
    request('/transfers', { method: 'POST', body: JSON.stringify(data) }),

  calculateTransfer: (id: string, amountSend: number) =>
    request(`/transfers/${id}/calculate`, { method: 'POST', body: JSON.stringify({ amountSend }) }),

  confirmTransfer: (id: string) =>
    request(`/transfers/${id}/confirm`, { method: 'POST' }),

  getTransfer: (id: string) => request(`/transfers/${id}`),
  getTransfers: () => request('/transfers'),

  // Admin
  adminGetStats: () => request('/admin/stats'),
  adminGetUsers: () => request('/admin/users'),
  adminGetTransfers: (params?: { status?: string; userId?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.userId) q.set('userId', params.userId);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));
    return request(`/admin/transfers?${q.toString()}`);
  },
  adminExportUrl: (params?: { status?: string; userId?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.userId) q.set('userId', params.userId);
    return `/avo-po/api/v1/admin/transfers/export?${q.toString()}`;
  },
  adminGetDirections: () => request('/admin/directions'),
  adminUpdateDirection: (id: number, data: { marginPercent?: number; commissionPercent?: number; minCommission?: number; isActive?: boolean }) =>
    request(`/admin/directions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};
