import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

function makeWelcomeMessage(auth) {
    if (auth.user?.role === 'doctor') {
        return {
            id: 'welcome-doctor',
            role: 'assistant',
            text: `MedConnect AI is ready. I can help you navigate appointments, patient operations, lab reviews, and demo accounts like Dr. Aadi Shah.`,
            suggestions: ['What can I do here?', 'How do I confirm appointments?', 'Show demo logins']
        };
    }

    if (auth.user?.role === 'patient') {
        return {
            id: 'welcome-patient',
            role: 'assistant',
            text: 'MedConnect AI can help with booking visits, lab reports, claims, pharmacy orders, and navigating the mock portal data.',
            suggestions: ['How do I book a visit?', 'Where are lab reports?', 'How do claims work?']
        };
    }

    return {
        id: 'welcome-guest',
        role: 'assistant',
        text: 'MedConnect AI can guide you through demo logins, account creation, and the seeded mock data in this project.',
        suggestions: ['Show demo logins', 'How do I sign in?', 'Who is Dr. Aadi Shah?']
    };
}

function getFallbackReply(message, auth) {
    const text = message.toLowerCase();

    if (/(aadi|shah)/.test(text)) {
        return {
            text: 'Dr. Aadi Shah is available as a seeded doctor account. Use `aadi.shah@medconnect.gov` with password `Welcome123!` and role `doctor`.',
            suggestions: ['Show demo logins', 'What can doctors do here?']
        };
    }

    if (/(demo|login|sign in|password|account)/.test(text)) {
        return {
            text: 'Current seeded logins include `doctor@test.com`, `alex@test.com`, and `aadi.shah@medconnect.gov`. The default password is `Welcome123!`.',
            suggestions: ['Who is Dr. Aadi Shah?', 'How do I book a visit?']
        };
    }

    if (/(book|appointment|visit|reschedule|schedule)/.test(text)) {
        return {
            text: auth.user?.role === 'doctor'
                ? 'Open the Appointments section to confirm, decline, or complete visits. The overview cards also surface the next priority visits.'
                : 'Use the `Book Appointment` section in the patient dashboard, choose a doctor, date, mode, and reason, then submit the request.',
            suggestions: ['Where are lab reports?', 'How do claims work?']
        };
    }

    if (/(lab|report|test|diagnostic)/.test(text)) {
        return {
            text: auth.user?.role === 'doctor'
                ? 'Lab Reports are available in the doctor dashboard. Mock data now includes more seeded reports across cardiology, orthopedics, endocrinology, and internal medicine.'
                : 'Check the Services and overview areas for diagnostics and recent reports. The seeded data includes multiple ready, pending, and in-review reports.',
            suggestions: ['What about pharmacy orders?', 'What research data exists?']
        };
    }

    if (/(pharmacy|medicine|refill|rx|medication)/.test(text)) {
        return {
            text: 'The portal includes mock pharmacy orders with different statuses like shipped, in transit, ready for pickup, and delivered. Use the Services section to review them.',
            suggestions: ['How do claims work?', 'Where are lab reports?']
        };
    }

    if (/(claim|insurance|coverage|reimbursement)/.test(text)) {
        return {
            text: 'Claims data is seeded for multiple patients with statuses such as approved, pending documents, submitted, and payment due. Patients can review coverage progress from their dashboard.',
            suggestions: ['What research data exists?', 'How do I book a visit?']
        };
    }

    if (/(research|trial|guideline)/.test(text)) {
        return {
            text: 'The mock portal includes seeded clinical trials and guidelines so both dashboards have research content to browse and filter.',
            suggestions: ['Show demo logins', 'What can I do here?']
        };
    }

    if (/(what can i do|help|features|portal)/.test(text)) {
        return {
            text: auth.user?.role === 'doctor'
                ? 'You can manage appointments, review patients, monitor operations, browse research, update your profile, and test mock workflows from the doctor dashboard.'
                : auth.user?.role === 'patient'
                    ? 'You can search doctors, book appointments, review services, claims, reports, and update your care preferences from the patient dashboard.'
                    : 'You can sign in with demo accounts, create a new account, and explore a seeded doctor-patient portal with local backend support.',
            suggestions: ['Show demo logins', 'How do I sign in?']
        };
    }

    return {
        text: 'I can help with demo logins, appointments, reports, claims, pharmacy orders, research, and navigation. Try asking about Aadi Shah, appointments, or lab reports.',
        suggestions: ['Show demo logins', 'How do I book a visit?', 'Where are lab reports?']
    };
}

export default function HelpChatbot({ auth }) {
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([makeWelcomeMessage(auth)]);
    const listRef = useRef(null);

    const title = useMemo(() => auth.user ? 'MedConnect AI Help' : 'MedConnect AI Guide', [auth.user]);
    const isAuthPage = location.pathname === '/';

    useEffect(() => {
        setMessages([makeWelcomeMessage(auth)]);
    }, [auth.user?.role]);

    useEffect(() => {
        if (!listRef.current) return;
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }, [messages, open]);

    useEffect(() => {
        document.documentElement.dataset.chatbotOpen = open ? 'true' : 'false';
        return () => {
            document.documentElement.dataset.chatbotOpen = 'false';
        };
    }, [open]);

    const sendMessage = rawValue => {
        const value = rawValue.trim();
        if (!value) return;

        const userMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: value
        };
        const assistantReply = getFallbackReply(value, auth);
        const assistantMessage = {
            id: `assistant-${Date.now() + 1}`,
            role: 'assistant',
            text: assistantReply.text,
            suggestions: assistantReply.suggestions
        };

        setMessages(prev => [...prev, userMessage, assistantMessage]);
        setInput('');
        setOpen(true);
    };

    return (
        <div className={`chatbot-shell ${open ? 'open' : ''} ${isAuthPage ? 'chatbot-shell--auth' : ''}`}>
            {open && (
                <section className="chatbot-panel" aria-label="AI help chatbot">
                    <header className="chatbot-header">
                        <div>
                            <span className="eyebrow">AI help</span>
                            <h3>{title}</h3>
                        </div>
                        <button
                            type="button"
                            className="chatbot-close"
                            onClick={() => setOpen(false)}
                            aria-label="Close chatbot"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </header>

                    <div className="chatbot-note">
                        <i className="fa-solid fa-circle-info"></i>
                        <span>This assistant uses built-in portal guidance and seeded project data.</span>
                    </div>

                    <div className="chatbot-messages" ref={listRef}>
                        {messages.map(message => (
                            <div key={message.id} className={`chatbot-message chatbot-message--${message.role}`}>
                                <p>{message.text}</p>
                                {message.role === 'assistant' && message.suggestions?.length > 0 && (
                                    <div className="chatbot-suggestions">
                                        {message.suggestions.map(suggestion => (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                className="chatbot-chip"
                                                onClick={() => sendMessage(suggestion)}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <form
                        className="chatbot-form"
                        onSubmit={event => {
                            event.preventDefault();
                            sendMessage(input);
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={event => setInput(event.target.value)}
                            placeholder="Ask about logins, reports, claims, or appointments"
                        />
                        <button type="submit" className="btn btn-primary btn-sm">
                            <i className="fa-solid fa-paper-plane"></i> Send
                        </button>
                    </form>
                </section>
            )}

            <button
                type="button"
                className="chatbot-trigger"
                onClick={() => setOpen(prev => !prev)}
                aria-label={open ? 'Hide help chatbot' : 'Open help chatbot'}
            >
                <span className="chatbot-trigger-icon">
                    <i className="fa-solid fa-robot"></i>
                </span>
                <span className={`chatbot-trigger-copy ${isAuthPage ? 'chatbot-trigger-copy--compact' : ''}`}>
                    <strong>AI Help</strong>
                    <small>Portal guidance</small>
                </span>
            </button>
        </div>
    );
}
