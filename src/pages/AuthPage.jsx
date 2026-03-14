import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEMO_ACCOUNTS, MOCK_DEFAULT_PASSWORD } from '../lib/mockData.js';
import { scorePassword, strengthLabel } from '../utils/format.js';

const SHOWCASE_METRICS = [
    { id: 'appointments', value: '24/7', label: 'Booking and updates' },
    { id: 'records', value: '1 hub', label: 'Records, claims, and labs' },
    { id: 'demo', value: 'Demo ready', label: 'Works without local Mongo' }
];

const SHOWCASE_POINTS = [
    {
        id: 'coordination',
        icon: 'fa-people-group',
        title: 'Coordinated care',
        text: 'Patients, doctors, reports, pharmacy orders, and research activity stay connected in one workflow.'
    },
    {
        id: 'actions',
        icon: 'fa-bolt',
        title: 'Fast actions',
        text: 'Use quick access to book visits, update settings, and work through next-best actions from each dashboard.'
    },
    {
        id: 'continuity',
        icon: 'fa-shield-heart',
        title: 'Demo continuity',
        text: 'If the API server is unavailable, the portal falls back to seeded mock data so the product remains usable.'
    }
];

export default function AuthPage({ onLogin, onRegister, loading }) {
    const navigate = useNavigate();
    const remembered = localStorage.getItem('medconnectRememberEmail') || '';
    const [mode, setMode] = useState('login');
    const [loginForm, setLoginForm] = useState({
        email: remembered,
        password: '',
        role: '',
        remember: !!remembered
    });
    const [registerForm, setRegisterForm] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        agree: false
    });
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const strength = useMemo(() => scorePassword(registerForm.password), [registerForm.password]);
    const demoMode = localStorage.getItem('medconnectApiMode') === 'mock';

    const handleLoginSubmit = async event => {
        event.preventDefault();
        const role = await onLogin(loginForm);
        if (role) {
            navigate(role === 'doctor' ? '/doctor' : '/patient');
        }
    };

    const handleRegisterSubmit = async event => {
        event.preventDefault();
        const ok = await onRegister({
            name: registerForm.name,
            email: registerForm.email,
            password: registerForm.password,
            role: registerForm.role
        });
        if (!ok) return;

        setMode('login');
        setLoginForm(prev => ({
            ...prev,
            email: registerForm.email,
            role: registerForm.role
        }));
        setRegisterForm({
            name: '',
            email: '',
            password: '',
            role: '',
            agree: false
        });
    };

    const handleDemoAccess = async account => {
        setLoginForm({
            email: account.email,
            password: account.password,
            role: account.role,
            remember: true
        });
        const role = await onLogin({
            email: account.email,
            password: account.password,
            role: account.role,
            remember: true
        });
        if (role) {
            navigate(role === 'doctor' ? '/doctor' : '/patient');
        }
    };

    return (
        <>
            <a className="skip-link" href="#auth-main">Skip to main content</a>
            <div className="auth-page auth-page-v2">
                <div className="auth-grid" id="auth-main">
                    <section className="auth-showcase">
                        <div className="brand-lockup brand-lockup--stacked">
                            <div className="brand-icon"><i className="fa-solid fa-house-medical"></i></div>
                            <div>
                                <p className="brand-title">MedConnect</p>
                                <p className="brand-subtitle">Doctor and patient operations center</p>
                            </div>
                        </div>

                        <div className="auth-showcase-copy">
                            <span className="eyebrow">Healthcare operations, redesigned</span>
                            <h1>One portal for visits, records, claims, labs, and clinical follow-through.</h1>
                            <p>
                                The app now supports a full mock-backed workflow, richer overview dashboards, and a more
                                usable experience for both doctors and patients.
                            </p>
                        </div>

                        <div className="auth-metric-row">
                            {SHOWCASE_METRICS.map(item => (
                                <div className="auth-metric-card" key={item.id}>
                                    <strong>{item.value}</strong>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="showcase-list">
                            {SHOWCASE_POINTS.map(item => (
                                <article className="showcase-item" key={item.id}>
                                    <div className="showcase-icon">
                                        <i className={`fa-solid ${item.icon}`}></i>
                                    </div>
                                    <div>
                                        <h3>{item.title}</h3>
                                        <p>{item.text}</p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="demo-access-card">
                            <div className="demo-access-header">
                                <div>
                                    <span className="eyebrow">Quick access</span>
                                    <h2>Start with demo accounts</h2>
                                </div>
                                <span className={`status-chip ${demoMode ? 'status-chip--success' : 'status-chip--info'}`}>
                                    {demoMode ? 'Mock mode active' : 'Live or fallback'}
                                </span>
                            </div>
                            <div className="demo-account-grid">
                                {DEMO_ACCOUNTS.map(account => (
                                    <button
                                        key={account.id}
                                        type="button"
                                        className="demo-account-button"
                                        onClick={() => handleDemoAccess(account)}
                                        disabled={loading}
                                    >
                                        <div>
                                            <strong>{account.label}</strong>
                                            <span>{account.name}</span>
                                        </div>
                                        <small>{account.email}</small>
                                    </button>
                                ))}
                            </div>
                            <p className="demo-password-note">Default password: {MOCK_DEFAULT_PASSWORD}</p>
                        </div>
                    </section>

                    <section className="auth-shell">
                        <div className="auth-shell-header">
                            <div>
                                <span className="eyebrow">Secure access</span>
                                <h2>{mode === 'login' ? 'Sign in to continue' : 'Create your portal account'}</h2>
                                <p>
                                    {mode === 'login'
                                        ? 'Pick your role, sign in, and continue into your workspace.'
                                        : 'Register as a doctor or patient and start with seeded data and streamlined workflows.'}
                                </p>
                            </div>
                            <div className="auth-tab-row" role="tablist" aria-label="Authentication mode">
                                <button
                                    type="button"
                                    className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                                    onClick={() => setMode('login')}
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                                    onClick={() => setMode('register')}
                                >
                                    Create account
                                </button>
                            </div>
                        </div>

                        {demoMode && (
                            <div className="auth-mode-banner">
                                <i className="fa-solid fa-database"></i>
                                <span>The API server is offline. MedConnect is currently running on local mock data.</span>
                            </div>
                        )}

                        {mode === 'login' ? (
                            <form className="auth-form" onSubmit={handleLoginSubmit}>
                                <label className="auth-field">
                                    <span>Email address</span>
                                    <div className="input-group">
                                        <i className="fa-solid fa-envelope"></i>
                                        <input
                                            type="email"
                                            placeholder="doctor@test.com"
                                            autoComplete="username"
                                            value={loginForm.email}
                                            onChange={event => setLoginForm(prev => ({ ...prev, email: event.target.value }))}
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="auth-field">
                                    <span>Password</span>
                                    <div className="input-group has-toggle">
                                        <i className="fa-solid fa-lock"></i>
                                        <input
                                            type={showLoginPassword ? 'text' : 'password'}
                                            placeholder="Enter your password"
                                            autoComplete="current-password"
                                            value={loginForm.password}
                                            onChange={event => setLoginForm(prev => ({ ...prev, password: event.target.value }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-visibility"
                                            onClick={() => setShowLoginPassword(prev => !prev)}
                                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fa-regular ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </label>

                                <label className="auth-field">
                                    <span>Role</span>
                                    <div className="input-group">
                                        <i className="fa-solid fa-user-tag"></i>
                                        <select
                                            value={loginForm.role}
                                            onChange={event => setLoginForm(prev => ({ ...prev, role: event.target.value }))}
                                            required
                                        >
                                            <option value="" disabled>Select role</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="patient">Patient</option>
                                        </select>
                                    </div>
                                </label>

                                <div className="auth-inline-row">
                                    <label className="check-row">
                                        <input
                                            type="checkbox"
                                            checked={loginForm.remember}
                                            onChange={event => setLoginForm(prev => ({ ...prev, remember: event.target.checked }))}
                                        />
                                        Remember this device
                                    </label>
                                    <span className="auth-inline-hint">Demo credentials are pre-seeded.</span>
                                </div>

                                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                                    <i className="fa-solid fa-right-to-bracket"></i>
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </button>
                            </form>
                        ) : (
                            <form className="auth-form" onSubmit={handleRegisterSubmit}>
                                <label className="auth-field">
                                    <span>Full name</span>
                                    <div className="input-group">
                                        <i className="fa-solid fa-user"></i>
                                        <input
                                            type="text"
                                            placeholder="Your full name"
                                            autoComplete="name"
                                            value={registerForm.name}
                                            onChange={event => setRegisterForm(prev => ({ ...prev, name: event.target.value }))}
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="auth-field">
                                    <span>Email address</span>
                                    <div className="input-group">
                                        <i className="fa-solid fa-envelope"></i>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            autoComplete="email"
                                            value={registerForm.email}
                                            onChange={event => setRegisterForm(prev => ({ ...prev, email: event.target.value }))}
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="auth-field">
                                    <span>Password</span>
                                    <div className="input-group has-toggle">
                                        <i className="fa-solid fa-lock"></i>
                                        <input
                                            type={showRegisterPassword ? 'text' : 'password'}
                                            placeholder="Create a password"
                                            autoComplete="new-password"
                                            value={registerForm.password}
                                            onChange={event => setRegisterForm(prev => ({ ...prev, password: event.target.value }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="toggle-visibility"
                                            onClick={() => setShowRegisterPassword(prev => !prev)}
                                            aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                                        >
                                            <i className={`fa-regular ${showRegisterPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                    <div className="password-meter">
                                        <div className="password-bar">
                                            <span data-score={strength} style={{ width: `${(strength / 4) * 100}%` }}></span>
                                        </div>
                                        <span className="password-strength">{strengthLabel(strength)}</span>
                                    </div>
                                </label>

                                <label className="auth-field">
                                    <span>Role</span>
                                    <div className="input-group">
                                        <i className="fa-solid fa-id-badge"></i>
                                        <select
                                            value={registerForm.role}
                                            onChange={event => setRegisterForm(prev => ({ ...prev, role: event.target.value }))}
                                            required
                                        >
                                            <option value="" disabled>Select role</option>
                                            <option value="doctor">Doctor</option>
                                            <option value="patient">Patient</option>
                                        </select>
                                    </div>
                                </label>

                                <label className="check-row check-row--block">
                                    <input
                                        type="checkbox"
                                        checked={registerForm.agree}
                                        onChange={event => setRegisterForm(prev => ({ ...prev, agree: event.target.checked }))}
                                        required
                                    />
                                    I agree to use this portal for authorized healthcare workflows.
                                </label>

                                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                                    <i className="fa-solid fa-user-plus"></i>
                                    {loading ? 'Creating account...' : 'Create account'}
                                </button>
                            </form>
                        )}

                        <div className="auth-support-strip">
                            <button type="button" className="support-link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                                {mode === 'login' ? 'Need an account? Create one' : 'Already registered? Sign in'}
                            </button>
                            <span>Demo password for seeded accounts: {MOCK_DEFAULT_PASSWORD}</span>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
