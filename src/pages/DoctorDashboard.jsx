import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { badgeClass, formatCurrency, formatDate, initials } from '../utils/format.js';

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'appointments', label: 'Appointments', icon: 'fa-calendar-check' },
    { id: 'patients', label: 'My Patients', icon: 'fa-user-injured' },
    { id: 'operations', label: 'Operations', icon: 'fa-layer-group' },
    { id: 'research', label: 'Research', icon: 'fa-flask' },
    { id: 'settings', label: 'Settings', icon: 'fa-gear' }
];

export default function DoctorDashboard({ auth, onLogout, onUserUpdate, toast }) {
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [labReports, setLabReports] = useState([]);
    const [pharmacyOrders, setPharmacyOrders] = useState([]);
    const [claims, setClaims] = useState([]);
    const [researchTrials, setResearchTrials] = useState([]);
    const [guidelines, setGuidelines] = useState([]);
    const [guidelineQuery, setGuidelineQuery] = useState('');
    const [guidelineCategory, setGuidelineCategory] = useState('all');
    const [trialQuery, setTrialQuery] = useState('');
    const [trialStatus, setTrialStatus] = useState('all');
    const [trialPhase, setTrialPhase] = useState('all');
    const [researchModal, setResearchModal] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: 'all', type: 'all', showCompleted: false });
    const [settingsTab, setSettingsTab] = useState('profile');
    const [profileForm, setProfileForm] = useState({
        name: auth.user?.name || '',
        phone: auth.user?.profile?.phone || '',
        address: auth.user?.profile?.address || '',
        specialty: auth.user?.profile?.specialty || '',
        clinic: auth.user?.profile?.clinic || ''
    });
    const [notifications, setNotifications] = useState({
        email: auth.user?.profile?.notifications?.email ?? true,
        sms: auth.user?.profile?.notifications?.sms ?? false,
        appt: auth.user?.profile?.notifications?.appt ?? true
    });

    useEffect(() => {
        api.getAppointments()
            .then(({ appointments: items }) => setAppointments(items))
            .catch(err => toast(err.message, 'error'));
        api.getLabReports()
            .then(({ reports }) => setLabReports(reports))
            .catch(err => toast(err.message, 'error'));
        api.getPharmacyOrders()
            .then(({ orders }) => setPharmacyOrders(orders))
            .catch(err => toast(err.message, 'error'));
        api.getClaims()
            .then(({ claims: items }) => setClaims(items))
            .catch(err => toast(err.message, 'error'));
        api.getResearchTrials()
            .then(({ trials }) => setResearchTrials(trials))
            .catch(err => toast(err.message, 'error'));
        api.getGuidelines()
            .then(({ guidelines: items }) => setGuidelines(items))
            .catch(err => toast(err.message, 'error'));
    }, [toast]);

    useEffect(() => {
        setProfileForm({
            name: auth.user?.name || '',
            phone: auth.user?.profile?.phone || '',
            address: auth.user?.profile?.address || '',
            specialty: auth.user?.profile?.specialty || '',
            clinic: auth.user?.profile?.clinic || ''
        });
        setNotifications({
            email: auth.user?.profile?.notifications?.email ?? true,
            sms: auth.user?.profile?.notifications?.sms ?? false,
            appt: auth.user?.profile?.notifications?.appt ?? true
        });
    }, [auth.user]);

    const stats = useMemo(() => {
        const pending = appointments.filter(a => a.status === 'Pending').length;
        const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
        const declined = appointments.filter(a => a.status === 'Declined').length;
        return { pending, confirmed, declined };
    }, [appointments]);

    const utilization = useMemo(() => {
        const total = appointments.length;
        if (!total) {
            return {
                inPerson: 0,
                televisits: 0,
                followUps: 0,
                inPersonPct: 0,
                televisitsPct: 0,
                followUpsPct: 0
            };
        }

        const inPerson = appointments.filter(a => a.mode === 'In-Person').length;
        const televisits = appointments.filter(a => a.mode === 'Televisit').length;
        const followUps = appointments.filter(a => a.visitType === 'Follow-up').length;
        const toPct = count => Math.round((count / total) * 100);
        return {
            inPerson,
            televisits,
            followUps,
            inPersonPct: toPct(inPerson),
            televisitsPct: toPct(televisits),
            followUpsPct: toPct(followUps)
        };
    }, [appointments]);

    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            if (!filters.showCompleted && ['Completed', 'Declined'].includes(a.status)) return false;
            if (filters.search) {
                const q = filters.search.toLowerCase();
                if (!(`${a.patientName || ''} ${a.reason || ''}`.toLowerCase().includes(q))) return false;
            }
            if (filters.status !== 'all' && a.status !== filters.status) return false;
            if (filters.type !== 'all' && a.mode !== filters.type) return false;
            return true;
        });
    }, [appointments, filters]);

    const guidelineCategories = useMemo(() => ['all', ...new Set(guidelines.map(item => item.category))], [guidelines]);
    const trialStatuses = useMemo(() => ['all', ...new Set(researchTrials.map(item => item.status))], [researchTrials]);
    const trialPhases = useMemo(() => ['all', ...new Set(researchTrials.map(item => item.phase))], [researchTrials]);

    const filteredGuidelines = useMemo(() => {
        return guidelines
            .filter(item => {
                if (guidelineQuery) {
                    const q = guidelineQuery.toLowerCase();
                    if (!(`${item.title} ${item.guidelineId}`.toLowerCase().includes(q))) return false;
                }
                if (guidelineCategory !== 'all' && item.category !== guidelineCategory) return false;
                return true;
            })
            .sort((a, b) => (b.year || 0) - (a.year || 0));
    }, [guidelines, guidelineQuery, guidelineCategory]);

    const filteredTrials = useMemo(() => {
        return researchTrials.filter(item => {
            if (trialQuery) {
                const q = trialQuery.toLowerCase();
                if (!(`${item.title} ${item.trialId}`.toLowerCase().includes(q))) return false;
            }
            if (trialStatus !== 'all' && item.status !== trialStatus) return false;
            if (trialPhase !== 'all' && item.phase !== trialPhase) return false;
            return true;
        });
    }, [researchTrials, trialQuery, trialStatus, trialPhase]);

    const openExternal = url => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const updateAppointmentStatus = async (id, status) => {
        try {
            await api.updateAppointment(id, { status });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            toast(`Appointment updated to ${status.toLowerCase()}.`);
        } catch (err) {
            toast(err.message || 'Unable to update appointment.', 'error');
        }
    };

    const saveProfile = async () => {
        try {
            const payload = {
                name: profileForm.name,
                phone: profileForm.phone,
                address: profileForm.address,
                specialty: profileForm.specialty,
                clinic: profileForm.clinic,
                notifications
            };
            const result = await api.updateProfile(payload);
            onUserUpdate(result.user);
            toast('Profile saved.');
        } catch (err) {
            toast(err.message || 'Unable to save profile.', 'error');
        }
    };

    return (
        <>
            <a className="skip-link" href="#main-content">Skip to main content</a>
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <i className="fa-solid fa-house-medical"></i>
                    <h2>MedConnect</h2>
                </div>
                <ul className="nav-menu">
                    {NAV_ITEMS.map(item => (
                        <li key={item.id}>
                            <a
                                href="#"
                                className={activeSection === item.id ? 'active' : ''}
                                onClick={e => {
                                    e.preventDefault();
                                    setActiveSection(item.id);
                                    setSidebarOpen(false);
                                }}
                            >
                                <i className={`fa-solid ${item.icon}`}></i> {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="sidebar-footer">
                    <a href="#" onClick={e => { e.preventDefault(); onLogout(); }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                    </a>
                </div>
            </aside>

            <main className="main-content" id="main-content">
                <nav className="top-bar">
                    <div className="top-bar-left">
                        <button className="nav-toggle" onClick={() => setSidebarOpen(prev => !prev)} aria-label="Toggle navigation">
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <div>
                            <h1>Welcome, {auth.user?.name || 'Doctor'}</h1>
                            <p className="sub">You have {stats.pending} pending and {stats.confirmed} confirmed appointments today.</p>
                        </div>
                    </div>
                    <div className="top-bar-actions">
                        <div className="quick-actions">
                            <button className="action-pill" onClick={() => toast('Quick slot created. Update availability in Settings.')}>
                                <i className="fa-solid fa-clock"></i> Add Slot
                            </button>
                            <button className="action-pill" onClick={() => toast('Televisit room opened.', 'info')}>
                                <i className="fa-solid fa-video"></i> Start Televisit
                            </button>
                        </div>
                        <div className="profile-pill">
                            <div className="avatar"><i className="fa-solid fa-user-doctor"></i></div>
                            <span>{auth.user?.name || 'Doctor'}</span>
                        </div>
                    </div>
                </nav>

                <div className="alert-banner">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <div>
                        <strong>Service notice:</strong> Lab result uploads may be delayed between 6:00 PM and 8:00 PM due to scheduled maintenance.
                    </div>
                </div>

                {activeSection === 'overview' && (
                    <section>
                        <div className="stats-row">
                            <div className="stat-card blue">
                                <p className="label">Total Patients</p>
                                <p className="value">{new Set(appointments.map(a => a.patientName)).size}</p>
                                <p className="trend" style={{ color: 'var(--success)' }}>12% this month</p>
                            </div>
                            <div className="stat-card green">
                                <p className="label">Confirmed</p>
                                <p className="value">{stats.confirmed}</p>
                                <p className="trend" style={{ color: 'var(--secondary)' }}>Ready for review</p>
                            </div>
                            <div className="stat-card amber">
                                <p className="label">Pending</p>
                                <p className="value">{stats.pending}</p>
                                <p className="trend" style={{ color: 'var(--warning)' }}>Awaiting action</p>
                            </div>
                            <div className="stat-card red">
                                <p className="label">Declined</p>
                                <p className="value">{stats.declined}</p>
                                <p className="trend" style={{ color: 'var(--muted)' }}>This week</p>
                            </div>
                        </div>

                        <div className="overview-grid">
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-calendar-day"></i> Today&apos;s Schedule</h2>
                                    <span className="status-chip status-chip--info">Next 3 hours</span>
                                </div>
                                <div className="panel-list">
                                    {appointments.slice(0, 3).map(appt => (
                                        <div className="panel-item" key={appt.id}>
                                            <div className="panel-meta">
                                                <strong>{appt.patientName}</strong>
                                                <span>{appt.time} · {appt.visitType || 'Consult'} · {appt.mode}</span>
                                            </div>
                                            <div className="panel-actions">
                                                <button className="btn btn-success btn-sm">Start Visit</button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}>
                                                    Message
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {appointments.length === 0 && (
                                        <div className="panel-item">
                                            <div className="panel-meta">
                                                <strong>No appointments scheduled</strong>
                                                <span>Coordinate your next clinic session.</span>
                                            </div>
                                            <span className="tag">Open schedule</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-bell"></i> Clinical Alerts</h2>
                                </div>
                                <div className="panel-list">
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>Medication Review</strong>
                                            <span>2 patients require review before 2:00 PM.</span>
                                        </div>
                                        <span className="tag"><i className="fa-solid fa-clock"></i> Priority</span>
                                    </div>
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>Lab Results</strong>
                                            <span>4 new results awaiting acknowledgement.</span>
                                        </div>
                                        <span className="tag"><i className="fa-solid fa-flask"></i> New</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-chart-column"></i> Monthly Utilization</h2>
                                </div>
                                <div className="mini-chart">
                                    <div className="chart-row">
                                        <span>In-person ({utilization.inPerson})</span>
                                        <div className="chart-bar"><div style={{ width: `${utilization.inPersonPct}%` }}></div></div>
                                    </div>
                                    <div className="chart-row">
                                        <span>Televisits ({utilization.televisits})</span>
                                        <div className="chart-bar"><div style={{ width: `${utilization.televisitsPct}%` }}></div></div>
                                    </div>
                                    <div className="chart-row">
                                        <span>Follow-ups ({utilization.followUps})</span>
                                        <div className="chart-bar"><div style={{ width: `${utilization.followUpsPct}%` }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'appointments' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-calendar-check"></i> Patient Appointments</h2>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setFilters(prev => ({ ...prev, showCompleted: !prev.showCompleted }))}
                                >
                                    <i className={`fa-solid ${filters.showCompleted ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    {filters.showCompleted ? ' Hide Completed' : ' Show Completed'}
                                </button>
                            </div>
                            <div className="table-filters">
                                <div className="filter-group">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by patient or reason"
                                        value={filters.search}
                                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    />
                                </div>
                                <select
                                    className="filter-select"
                                    value={filters.status}
                                    onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Declined">Declined</option>
                                </select>
                                <select
                                    className="filter-select"
                                    value={filters.type}
                                    onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
                                >
                                    <option value="all">All Types</option>
                                    <option value="In-Person">In-Person</option>
                                    <option value="Televisit">Televisit</option>
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => setFilters({ search: '', status: 'all', type: 'all', showCompleted: false })}
                                >
                                    Reset
                                </button>
                                <span className="filter-meta">Showing {filteredAppointments.length} appointments</span>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Patient</th>
                                            <th>Date</th>
                                            <th>Time</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAppointments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="empty-cell">No appointments match your filters.</td>
                                            </tr>
                                        ) : filteredAppointments.map(appt => (
                                            <tr key={appt.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', background: 'var(--secondary)', color: 'white' }}>
                                                            {initials(appt.patientName)}
                                                        </div>
                                                        <span>{appt.patientName}</span>
                                                    </div>
                                                </td>
                                                <td>{formatDate(appt.date)}</td>
                                                <td>{appt.time}</td>
                                                <td>{appt.mode}</td>
                                                <td><span className={`badge ${badgeClass(appt.status)}`}>{appt.status}</span></td>
                                                <td className="action-btns">
                                                    {appt.status === 'Pending' && (
                                                        <>
                                                            <button className="btn btn-success btn-sm" onClick={() => updateAppointmentStatus(appt.id, 'Confirmed')}>
                                                                <i className="fa-solid fa-check"></i> Confirm
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => updateAppointmentStatus(appt.id, 'Declined')}>
                                                                <i className="fa-solid fa-xmark"></i> Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    {appt.status === 'Confirmed' && (
                                                        <>
                                                            <button className="btn btn-success btn-sm" onClick={() => updateAppointmentStatus(appt.id, 'Completed')}>
                                                                <i className="fa-solid fa-check-double"></i> Complete
                                                            </button>
                                                            <button className="btn btn-danger btn-sm" onClick={() => updateAppointmentStatus(appt.id, 'Declined')}>
                                                                <i className="fa-solid fa-xmark"></i> Decline
                                                            </button>
                                                        </>
                                                    )}
                                                    {['Completed', 'Declined'].includes(appt.status) && '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'patients' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-user-injured"></i> My Patients</h2>
                                <span className="filter-meta">Active caseload</span>
                            </div>
                            <div className="panel-list">
                                {[...new Set(appointments.map(a => a.patientName))].slice(0, 6).map(name => (
                                    <div className="panel-item" key={name}>
                                        <div className="panel-meta">
                                            <strong>{name}</strong>
                                            <span>Care plan review · Last visit 14 days ago</span>
                                        </div>
                                        <div className="panel-actions">
                                            <button className="btn btn-primary btn-sm">Open Chart</button>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}>
                                                Message
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {appointments.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No patients assigned</strong>
                                            <span>Appointments will populate this list automatically.</span>
                                        </div>
                                        <span className="tag">Awaiting</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'operations' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-flask-vial"></i> Lab Results Queue</h2>
                                <span className="filter-meta">{labReports.length} reports</span>
                            </div>
                            <div className="panel-list">
                                {labReports.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No lab reports yet</strong>
                                            <span>Incoming diagnostic results will populate here.</span>
                                        </div>
                                        <span className="tag">Clear</span>
                                    </div>
                                )}
                                {labReports.slice(0, 6).map(report => (
                                    <div className="panel-item" key={report.id}>
                                        <div className="panel-meta">
                                            <strong>{report.testName}</strong>
                                            <span>{report.patientName} · {formatDate(report.collectedDate)}</span>
                                            <span>{report.summary}</span>
                                        </div>
                                        <div className="panel-actions">
                                            <span className="tag">{report.status}</span>
                                            <button className="btn btn-primary btn-sm" onClick={() => toast('Lab report opened.', 'info')}>
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-prescription-bottle-medical"></i> Medication Refill Requests</h2>
                            </div>
                            <div className="panel-list">
                                {pharmacyOrders.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No refill requests</strong>
                                            <span>Pharmacy requests will appear here.</span>
                                        </div>
                                        <span className="tag">Clear</span>
                                    </div>
                                )}
                                {pharmacyOrders.slice(0, 6).map(order => (
                                    <div className="panel-item" key={order.id}>
                                        <div className="panel-meta">
                                            <strong>{order.medication}</strong>
                                            <span>{order.patientName} · {order.quantity}</span>
                                            <span>{order.pharmacy}</span>
                                        </div>
                                        <div className="panel-actions">
                                            <span className="tag">{order.status}</span>
                                            <button className="btn btn-success btn-sm" onClick={() => toast('Refill approved.', 'info')}>
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-file-invoice-dollar"></i> Insurance & Billing</h2>
                            </div>
                            <div className="panel-list">
                                {claims.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No pending claims</strong>
                                            <span>Pre-authorization items will appear here.</span>
                                        </div>
                                        <span className="tag">Clear</span>
                                    </div>
                                )}
                                {claims.map(claim => (
                                    <div className="panel-item" key={claim.id}>
                                        <div className="panel-meta">
                                            <strong>{claim.description}</strong>
                                            <span>{claim.patientName} · {claim.insurer}</span>
                                            <span>Due {formatDate(claim.dueDate)}</span>
                                        </div>
                                        <div className="panel-actions">
                                            <span className="tag">{claim.status}</span>
                                            <span className="tag">{formatCurrency(claim.amount)}</span>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }} onClick={() => toast('Claim review opened.', 'info')}>
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {activeSection === 'research' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-book-medical"></i> ICMR Guidelines Library</h2>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => openExternal('https://icmr.gov.in/')}
                                >
                                    Browse Library
                                </button>
                            </div>
                            <div className="table-filters">
                                <div className="filter-group">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Search guidelines or IDs"
                                        value={guidelineQuery}
                                        onChange={e => setGuidelineQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="filter-select"
                                    value={guidelineCategory}
                                    onChange={e => setGuidelineCategory(e.target.value)}
                                >
                                    {guidelineCategories.map(item => (
                                        <option key={item} value={item}>{item === 'all' ? 'All categories' : item}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => {
                                        setGuidelineQuery('');
                                        setGuidelineCategory('all');
                                    }}
                                >
                                    Reset
                                </button>
                                <span className="filter-meta">{filteredGuidelines.length} guidelines</span>
                            </div>
                            <div className="panel-list">
                                {filteredGuidelines.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No guidelines found</strong>
                                            <span>Try a different search or category filter.</span>
                                        </div>
                                        <span className="tag">Empty</span>
                                    </div>
                                )}
                                {filteredGuidelines.map(item => (
                                    <div className="panel-item" key={item.id}>
                                        <div className="panel-meta">
                                            <strong>{item.title}</strong>
                                            <span>{item.category} · {item.year}</span>
                                            <span>Document ID: {item.guidelineId}</span>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={() => setResearchModal({ type: 'guideline', data: item })}>
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-flask"></i> Clinical Trials Registry</h2>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => openExternal('https://ctri.nic.in/')}
                                >
                                    Search Registry
                                </button>
                            </div>
                            <div className="table-filters">
                                <div className="filter-group">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Search trials or IDs"
                                        value={trialQuery}
                                        onChange={e => setTrialQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="filter-select"
                                    value={trialStatus}
                                    onChange={e => setTrialStatus(e.target.value)}
                                >
                                    {trialStatuses.map(item => (
                                        <option key={item} value={item}>{item === 'all' ? 'All statuses' : item}</option>
                                    ))}
                                </select>
                                <select
                                    className="filter-select"
                                    value={trialPhase}
                                    onChange={e => setTrialPhase(e.target.value)}
                                >
                                    {trialPhases.map(item => (
                                        <option key={item} value={item}>{item === 'all' ? 'All phases' : item}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => {
                                        setTrialQuery('');
                                        setTrialStatus('all');
                                        setTrialPhase('all');
                                    }}
                                >
                                    Reset
                                </button>
                                <span className="filter-meta">{filteredTrials.length} trials</span>
                            </div>
                            <div className="panel-list">
                                {filteredTrials.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No trials found</strong>
                                            <span>Try a different search or filter selection.</span>
                                        </div>
                                        <span className="tag">Empty</span>
                                    </div>
                                )}
                                {filteredTrials.map(trial => (
                                    <div className="panel-item" key={trial.id}>
                                        <div className="panel-meta">
                                            <strong>{trial.title}</strong>
                                            <span>{trial.trialId} · {trial.phase} · {trial.status}</span>
                                            <span>{trial.location} · Sponsor: {trial.sponsor}</span>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={() => setResearchModal({ type: 'trial', data: trial })}>
                                            View Details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {researchModal && (
                            <div className="modal-overlay active" onClick={() => setResearchModal(null)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()}>
                                    <div className="modal-header">
                                        <h3>{researchModal.type === 'guideline' ? 'Guideline Details' : 'Clinical Trial Details'}</h3>
                                        <button className="modal-close" onClick={() => setResearchModal(null)} aria-label="Close">
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        {researchModal.type === 'guideline' ? (
                                            <div className="panel-list">
                                                <div className="panel-item">
                                                    <div className="panel-meta">
                                                        <strong>{researchModal.data.title}</strong>
                                                        <span>Category: {researchModal.data.category}</span>
                                                        <span>Year: {researchModal.data.year}</span>
                                                        <span>ID: {researchModal.data.guidelineId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="panel-list">
                                                <div className="panel-item">
                                                    <div className="panel-meta">
                                                        <strong>{researchModal.data.title}</strong>
                                                        <span>ID: {researchModal.data.trialId}</span>
                                                        <span>Phase: {researchModal.data.phase}</span>
                                                        <span>Status: {researchModal.data.status}</span>
                                                        <span>Location: {researchModal.data.location}</span>
                                                        <span>Sponsor: {researchModal.data.sponsor}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-ghost" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }} onClick={() => setResearchModal(null)}>
                                            Close
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => openExternal(researchModal.type === 'guideline' ? 'https://icmr.gov.in/' : 'https://ctri.nic.in/')}
                                        >
                                            Open Portal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {activeSection === 'settings' && (
                    <section>
                        <div className="settings-layout">
                            <div className="settings-sidebar">
                                {[
                                    { id: 'profile', label: 'Profile', icon: 'fa-user-gear' },
                                    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
                                    { id: 'professional', label: 'Professional', icon: 'fa-user-doctor' }
                                ].map(item => (
                                    <a
                                        key={item.id}
                                        className={`settings-nav-item ${settingsTab === item.id ? 'active' : ''}`}
                                        onClick={() => setSettingsTab(item.id)}
                                    >
                                        <i className={`fa-solid ${item.icon}`}></i> {item.label}
                                    </a>
                                ))}
                            </div>
                            <div className="settings-content">
                                {settingsTab === 'profile' && (
                                    <div className="settings-panel active">
                                        <div className="card">
                                            <div className="card-header">
                                                <h2><i className="fa-solid fa-user-gear"></i> Profile Settings</h2>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Full Name</label>
                                                    <input value={profileForm.name} onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
                                                </div>
                                                <div className="form-field">
                                                    <label>Email Address</label>
                                                    <input value={auth.user?.email || ''} disabled />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Phone Number</label>
                                                    <input value={profileForm.phone} onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} />
                                                </div>
                                                <div className="form-field">
                                                    <label>Address</label>
                                                    <input value={profileForm.address} onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))} />
                                                </div>
                                            </div>
                                            <button className="btn btn-primary" onClick={saveProfile}>Save Changes</button>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'notifications' && (
                                    <div className="settings-panel active">
                                        <div className="card">
                                            <div className="card-header">
                                                <h2><i className="fa-solid fa-bell"></i> Notification Settings</h2>
                                            </div>
                                            {[
                                                { id: 'email', title: 'Email Notifications', text: 'Daily summaries and urgent updates.' },
                                                { id: 'sms', title: 'SMS Notifications', text: 'Critical alerts by text.' },
                                                { id: 'appt', title: 'Appointment Reminders', text: 'Automatic scheduling reminders.' }
                                            ].map(item => (
                                                <div className="settings-row" key={item.id}>
                                                    <div className="settings-info">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.text}</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={notifications[item.id]}
                                                            onChange={e => setNotifications(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            ))}
                                            <div style={{ marginTop: '24px' }}>
                                                <button className="btn btn-primary" onClick={saveProfile}>Save Notification Settings</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'professional' && (
                                    <div className="settings-panel active">
                                        <div className="card">
                                            <div className="card-header">
                                                <h2><i className="fa-solid fa-user-doctor"></i> Professional Details</h2>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Specialization</label>
                                                    <input value={profileForm.specialty} onChange={e => setProfileForm(prev => ({ ...prev, specialty: e.target.value }))} />
                                                </div>
                                                <div className="form-field">
                                                    <label>Clinic Address</label>
                                                    <input value={profileForm.clinic} onChange={e => setProfileForm(prev => ({ ...prev, clinic: e.target.value }))} />
                                                </div>
                                            </div>
                                            <button className="btn btn-primary" onClick={saveProfile}>Update Details</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                <footer>&copy; 2026 MedConnect Hospital Portal. All rights reserved.</footer>
            </main>
        </>
    );
}
