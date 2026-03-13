import React from 'react';

export default function ToastContainer({ toasts }) {
    return (
        <div className="toast-stack">
            {toasts.map(toast => (
                <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>
            ))}
        </div>
    );
}
