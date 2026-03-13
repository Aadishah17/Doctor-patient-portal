import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scorePassword, strengthLabel } from '../utils/format.js';

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
        if (ok) {
            setMode('login');
            setRegisterForm({
                name: '',
                email: '',
                password: '',
                role: '',
                agree: false
            });
        }
    };

    return (
        <>
            <a className="skip-link" href="#auth-box">Skip to main content</a>
            <div className="auth-page">
                <header className="auth-header">
                    <div className="brand-lockup">
                        <div className="brand-icon"><i className="fa-solid fa-house-medical"></i></div>
                        <div>
                            <p className="brand-title">MedConnect</p>
                            <p className="brand-subtitle">Government Medical Services Portal</p>
                        </div>
                    </div>
                    <div className="brand-actions">
                        <a className="link-pill" href="#">Accessibility</a>
                        <a className="link-pill" href="#">Help Center</a>
                    </div>
                </header>

                <div className={`auth-box ${mode === 'register' ? 'register-mode' : ''}`} id="auth-box">
                    <div className="form-panel panel-register">
                        <form id="register-form" onSubmit={handleRegisterSubmit}>
                            <h1>
                                <i className="fa-solid fa-user-plus" style={{ color: 'var(--secondary)', marginRight: '8px' }}></i>
                                Create Account
                            </h1>
                            <p className="subtitle">Join our healthcare network today</p>

                            <div className="input-group">
                                <i className="fa-solid fa-user"></i>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    autoComplete="name"
                                    value={registerForm.name}
                                    onChange={e => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <i className="fa-solid fa-envelope"></i>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    autoComplete="email"
                                    value={registerForm.email}
                                    onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="input-group has-toggle">
                                <i className="fa-solid fa-lock"></i>
                                <input
                                    type={showRegisterPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    autoComplete="new-password"
                                    value={registerForm.password}
                                    onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
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
                                <span className="password-text">Strength: {strengthLabel(strength)}</span>
                            </div>
                            <div className="input-group">
                                <i className="fa-solid fa-user-tag"></i>
                                <select
                                    value={registerForm.role}
                                    onChange={e => setRegisterForm(prev => ({ ...prev, role: e.target.value }))}
                                    required
                                >
                                    <option value="" disabled>Select Role</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="patient">Patient</option>
                                </select>
                            </div>

                            <label className="check-row">
                                <input
                                    type="checkbox"
                                    checked={registerForm.agree}
                                    onChange={e => setRegisterForm(prev => ({ ...prev, agree: e.target.checked }))}
                                    required
                                />
                                I agree to the portal terms and privacy notice.
                            </label>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                <i className="fa-solid fa-user-plus"></i> {loading ? 'Creating...' : 'Sign Up'}
                            </button>
                            <p className="form-footnote">We protect your information with modern encryption and audit controls.</p>
                            <p className="mobile-switch" style={{ display: 'none', textAlign: 'center', marginTop: '18px', fontSize: '0.9rem' }}>
                                Already have an account?{' '}
                                <a href="#" onClick={() => setMode('login')} style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                                    Sign In
                                </a>
                            </p>
                        </form>
                    </div>

                    <div className="form-panel panel-login">
                        <form id="login-form" onSubmit={handleLoginSubmit}>
                            <h1>
                                <i className="fa-solid fa-right-to-bracket" style={{ color: 'var(--secondary)', marginRight: '8px' }}></i>
                                Welcome Back
                            </h1>
                            <p className="subtitle">Login to access your dashboard</p>

                            <div className="input-group">
                                <i className="fa-solid fa-envelope"></i>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    autoComplete="username"
                                    value={loginForm.email}
                                    onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="input-group has-toggle">
                                <i className="fa-solid fa-lock"></i>
                                <input
                                    type={showLoginPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    value={loginForm.password}
                                    onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
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
                            <div className="input-group">
                                <i className="fa-solid fa-user-tag"></i>
                                <select
                                    value={loginForm.role}
                                    onChange={e => setLoginForm(prev => ({ ...prev, role: e.target.value }))}
                                    required
                                >
                                    <option value="" disabled>Select Role</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="patient">Patient</option>
                                </select>
                            </div>

                            <div className="form-inline">
                                <label className="check-row">
                                    <input
                                        type="checkbox"
                                        checked={loginForm.remember}
                                        onChange={e => setLoginForm(prev => ({ ...prev, remember: e.target.checked }))}
                                    />
                                    Remember this device
                                </label>
                                <a href="#" className="forgot-link">Forgot your password?</a>
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                <i className="fa-solid fa-right-to-bracket"></i> {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                            <p className="form-footnote">Use a trusted device. You can manage sessions in Settings.</p>

                            <p className="mobile-switch" style={{ display: 'none', textAlign: 'center', marginTop: '18px', fontSize: '0.9rem' }}>
                                Do not have an account?{' '}
                                <a href="#" onClick={() => setMode('register')} style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                                    Sign Up
                                </a>
                            </p>
                        </form>
                    </div>

                    <div className="overlay-container">
                        <div className="overlay">
                            <div className="overlay-panel overlay-left">
                                <h1>Already a Member?</h1>
                                <p>Sign in with your credentials to access your personalized healthcare dashboard.</p>
                                <ul className="trust-list">
                                    <li><i className="fa-solid fa-shield-heart"></i> Verified clinician access</li>
                                    <li><i className="fa-solid fa-file-shield"></i> Secure record handling</li>
                                    <li><i className="fa-solid fa-bell"></i> Smart appointment reminders</li>
                                </ul>
                                <button className="btn btn-ghost" onClick={() => setMode('login')}>
                                    <i className="fa-solid fa-right-to-bracket"></i> Sign In
                                </button>
                            </div>
                            <div className="overlay-panel overlay-right">
                                <h1>New Here?</h1>
                                <p>Register as a Doctor or Patient and start managing your appointments seamlessly.</p>
                                <ul className="trust-list">
                                    <li><i className="fa-solid fa-user-check"></i> Streamlined onboarding</li>
                                    <li><i className="fa-solid fa-calendar-check"></i> One-click scheduling</li>
                                    <li><i className="fa-solid fa-headset"></i> Help desk support</li>
                                </ul>
                                <button className="btn btn-ghost" onClick={() => setMode('register')}>
                                    <i className="fa-solid fa-user-plus"></i> Sign Up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
