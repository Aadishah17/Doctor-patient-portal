import React from 'react';
import { useLocation } from 'react-router-dom';

const OPTIONS = [
    { id: 'light', label: 'Light', icon: 'fa-sun' },
    { id: 'dark', label: 'Dark', icon: 'fa-moon' },
    { id: 'auto', label: 'Auto', icon: 'fa-desktop' }
];

export default function ThemeDock({ themePreference, resolvedTheme, onChange }) {
    const location = useLocation();
    const isAuthPage = location.pathname === '/';
    const dockClassName = `theme-dock ${isAuthPage ? 'theme-dock--auth' : 'theme-dock--app'}`;

    return (
        <div className={dockClassName} aria-label="Theme controls">
            <div className="theme-dock__status">
                <span className="eyebrow">Theme</span>
                <strong>{resolvedTheme === 'dark' ? 'Dark' : 'Light'}</strong>
            </div>
            <div className="theme-dock__controls" role="tablist" aria-label="Theme selection">
                {OPTIONS.map(option => (
                    <button
                        key={option.id}
                        type="button"
                        className={`theme-dock__button ${themePreference === option.id ? 'active' : ''}`}
                        onClick={() => onChange(option.id)}
                        aria-pressed={themePreference === option.id}
                        aria-label={`Use ${option.label.toLowerCase()} theme`}
                        title={option.label}
                    >
                        <i className={`fa-solid ${option.icon}`}></i>
                        <span>{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
