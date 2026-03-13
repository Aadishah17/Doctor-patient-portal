import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { api, authStorage } from './lib/api.js';

function RequireAuth({ auth, role, children }) {
    if (!auth.user) {
        return <Navigate to="/" replace />;
    }
    if (role && auth.user.role !== role) {
        return <Navigate to={auth.user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
    }
    return children;
}

export default function App() {
    const [auth, setAuth] = useState({
        token: authStorage.getToken(),
        user: authStorage.getUser()
    });
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'success') => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(item => item.id !== id));
        }, 3200);
    }, []);

    const roleRedirect = useMemo(() => {
        if (!auth.user) return '/';
        return auth.user.role === 'doctor' ? '/doctor' : '/patient';
    }, [auth.user]);

    useEffect(() => {
        let active = true;
        const token = authStorage.getToken();
        if (!token) {
            setAuth({ token: null, user: null });
            setChecking(false);
            return () => {};
        }

        api.getMe()
            .then(({ user }) => {
                if (!active) return;
                authStorage.setUser(user);
                setAuth({ token, user });
            })
            .catch(() => {
                authStorage.clearToken();
                authStorage.clearUser();
                if (active) {
                    setAuth({ token: null, user: null });
                }
            })
            .finally(() => {
                if (active) setChecking(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const handleLogin = async ({ email, password, role, remember }) => {
        setLoading(true);
        try {
            if (remember) {
                localStorage.setItem('medconnectRememberEmail', email);
            } else {
                localStorage.removeItem('medconnectRememberEmail');
            }
            const result = await api.login({ email, password, role });
            authStorage.setToken(result.token);
            authStorage.setUser(result.user);
            setAuth({ token: result.token, user: result.user });
            toast('Welcome back. You are signed in.');
            return result.user.role;
        } catch (err) {
            toast(err.message || 'Unable to sign in.', 'error');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async payload => {
        setLoading(true);
        try {
            await api.register(payload);
            toast('Account created. Please sign in.');
            return true;
        } catch (err) {
            toast(err.message || 'Unable to register.', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.logout();
        } catch (err) {
            // ignore logout network failures
        }
        authStorage.clearToken();
        authStorage.clearUser();
        setAuth({ token: null, user: null });
        toast('You have been signed out.', 'info');
    };

    const handleUserUpdate = user => {
        authStorage.setUser(user);
        setAuth(prev => ({ ...prev, user }));
    };

    if (checking) {
        return (
            <div className="loading-screen">
                <div className="loading-card">
                    <div className="spinner" />
                    <div>
                        <h2>Preparing your workspace</h2>
                        <p>Verifying your session and loading secure data.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <ToastContainer toasts={toasts} />
            <Routes>
                <Route
                    path="/"
                    element={
                        auth.user ? (
                            <Navigate to={roleRedirect} replace />
                        ) : (
                            <AuthPage onLogin={handleLogin} onRegister={handleRegister} loading={loading} />
                        )
                    }
                />
                <Route
                    path="/doctor"
                    element={
                        <RequireAuth auth={auth} role="doctor">
                            <DoctorDashboard auth={auth} onLogout={handleLogout} onUserUpdate={handleUserUpdate} toast={toast} />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/patient"
                    element={
                        <RequireAuth auth={auth} role="patient">
                            <PatientDashboard auth={auth} onLogout={handleLogout} onUserUpdate={handleUserUpdate} toast={toast} />
                        </RequireAuth>
                    }
                />
                <Route path="*" element={<Navigate to={roleRedirect} replace />} />
            </Routes>
        </BrowserRouter>
    );
}
