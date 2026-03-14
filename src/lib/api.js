import { mockApi } from './mockApi.js';

const TOKEN_KEY = 'medconnectToken';
const USER_KEY = 'medconnectUser';
const MODE_KEY = 'medconnectApiMode';

function updateMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
}

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
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (err) {
            localStorage.removeItem(USER_KEY);
            return null;
        }
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

    let res;
    try {
        res = await fetch(path, {
            ...options,
            headers
        });
    } catch (err) {
        const error = new Error('Unable to reach the API server.');
        error.code = 'NETWORK_ERROR';
        throw error;
    }

    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : null;
    if (!res.ok) {
        const message = payload?.message || 'Request failed.';
        const error = new Error(message);
        error.status = res.status;
        throw error;
    }
    return payload;
}

function shouldFallbackToMock(error) {
    return error?.code === 'NETWORK_ERROR';
}

async function withFallback(serverCall, mockCall) {
    try {
        const result = await serverCall();
        updateMode('server');
        return result;
    } catch (error) {
        if (!shouldFallbackToMock(error)) {
            throw error;
        }
        const result = await mockCall();
        updateMode('mock');
        return result;
    }
}

export const api = {
    async login({ email, password, role }) {
        return withFallback(
            () => request('/api/login', {
                method: 'POST',
                body: JSON.stringify({ email, password, role })
            }),
            () => mockApi.login({ email, password, role })
        );
    },
    async register(payload) {
        return withFallback(
            () => request('/api/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            }),
            () => mockApi.register(payload)
        );
    },
    async logout() {
        return withFallback(
            () => request('/api/logout', { method: 'POST' }),
            () => mockApi.logout()
        );
    },
    async getMe() {
        return withFallback(
            () => request('/api/me'),
            () => mockApi.getMe()
        );
    },
    async updateProfile(payload) {
        return withFallback(
            () => request('/api/me', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            }),
            () => mockApi.updateProfile(payload)
        );
    },
    async getDoctors() {
        return withFallback(
            () => request('/api/doctors'),
            () => mockApi.getDoctors()
        );
    },
    async getAppointments(params = {}) {
        const query = new URLSearchParams(params).toString();
        const suffix = query ? `?${query}` : '';
        return withFallback(
            () => request(`/api/appointments${suffix}`),
            () => mockApi.getAppointments(params)
        );
    },
    async createAppointment(payload) {
        return withFallback(
            () => request('/api/appointments', {
                method: 'POST',
                body: JSON.stringify(payload)
            }),
            () => mockApi.createAppointment(payload)
        );
    },
    async updateAppointment(id, payload) {
        return withFallback(
            () => request(`/api/appointments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            }),
            () => mockApi.updateAppointment(id, payload)
        );
    },
    async getAudit() {
        return withFallback(
            () => request('/api/audit'),
            () => mockApi.getAudit()
        );
    },
    async getLabReports() {
        return withFallback(
            () => request('/api/lab-reports'),
            () => mockApi.getLabReports()
        );
    },
    async getPharmacyOrders() {
        return withFallback(
            () => request('/api/pharmacy-orders'),
            () => mockApi.getPharmacyOrders()
        );
    },
    async getDiagnosticTests() {
        return withFallback(
            () => request('/api/diagnostic-tests'),
            () => mockApi.getDiagnosticTests()
        );
    },
    async getHealthPackages() {
        return withFallback(
            () => request('/api/health-packages'),
            () => mockApi.getHealthPackages()
        );
    },
    async getBloodBank() {
        return withFallback(
            () => request('/api/blood-bank'),
            () => mockApi.getBloodBank()
        );
    },
    async getClaims() {
        return withFallback(
            () => request('/api/claims'),
            () => mockApi.getClaims()
        );
    },
    async getResearchTrials() {
        return withFallback(
            () => request('/api/research/trials'),
            () => mockApi.getResearchTrials()
        );
    },
    async getGuidelines() {
        return withFallback(
            () => request('/api/research/guidelines'),
            () => mockApi.getGuidelines()
        );
    }
};
