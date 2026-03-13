const TOKEN_KEY = 'medconnectToken';
const USER_KEY = 'medconnectUser';

export const authStorage = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    clearToken() {
        localStorage.removeItem(TOKEN_KEY);
    },
    getUser() {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },
    clearUser() {
        localStorage.removeItem(USER_KEY);
    }
};

async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    const token = authStorage.getToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(path, {
        ...options,
        headers
    });

    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : null;
    if (!res.ok) {
        const message = payload?.message || 'Request failed.';
        throw new Error(message);
    }
    return payload;
}

export const api = {
    async login({ email, password, role }) {
        return request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        });
    },
    async register(payload) {
        return request('/api/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    async logout() {
        return request('/api/logout', { method: 'POST' });
    },
    async getMe() {
        return request('/api/me');
    },
    async updateProfile(payload) {
        return request('/api/me', {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
    },
    async getDoctors() {
        return request('/api/doctors');
    },
    async getAppointments(params = {}) {
        const query = new URLSearchParams(params).toString();
        const suffix = query ? `?${query}` : '';
        return request(`/api/appointments${suffix}`);
    },
    async createAppointment(payload) {
        return request('/api/appointments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    },
    async updateAppointment(id, payload) {
        return request(`/api/appointments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
    },
    async getAudit() {
        return request('/api/audit');
    },
    async getLabReports() {
        return request('/api/lab-reports');
    },
    async getPharmacyOrders() {
        return request('/api/pharmacy-orders');
    },
    async getDiagnosticTests() {
        return request('/api/diagnostic-tests');
    },
    async getHealthPackages() {
        return request('/api/health-packages');
    },
    async getBloodBank() {
        return request('/api/blood-bank');
    },
    async getClaims() {
        return request('/api/claims');
    },
    async getResearchTrials() {
        return request('/api/research/trials');
    },
    async getGuidelines() {
        return request('/api/research/guidelines');
    }
};
