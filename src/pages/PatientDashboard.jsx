import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { badgeClass, formatCurrency, formatDate, initials } from '../utils/format.js';

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'search', label: 'Find Doctor', icon: 'fa-magnifying-glass' },
    { id: 'book', label: 'Book Appointment', icon: 'fa-calendar-plus' },
    { id: 'appointments', label: 'My Appointments', icon: 'fa-calendar-check' },
    { id: 'services', label: 'Services', icon: 'fa-layer-group' },
    { id: 'research', label: 'Research', icon: 'fa-flask' },
    { id: 'settings', label: 'Settings', icon: 'fa-gear' }
];

export default function PatientDashboard({ auth, onLogout, onUserUpdate, toast }) {
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [labReports, setLabReports] = useState([]);
    const [pharmacyOrders, setPharmacyOrders] = useState([]);
    const [diagnosticTests, setDiagnosticTests] = useState([]);
    const [healthPackages, setHealthPackages] = useState([]);
    const [bloodInventory, setBloodInventory] = useState([]);
    const [claims, setClaims] = useState([]);
    const [researchTrials, setResearchTrials] = useState([]);
    const [guidelines, setGuidelines] = useState([]);
    const [guidelineQuery, setGuidelineQuery] = useState('');
    const [guidelineCategory, setGuidelineCategory] = useState('all');
    const [trialQuery, setTrialQuery] = useState('');
    const [trialStatus, setTrialStatus] = useState('all');
    const [trialPhase, setTrialPhase] = useState('all');
    const [researchModal, setResearchModal] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        specialty: 'all',
        rating: 'all',
        availability: 'all'
    });
    const [booking, setBooking] = useState({
        doctorId: '',
        date: '',
        time: '',
        visitType: '',
        mode: '',
        reason: ''
    });
    const [apptFilters, setApptFilters] = useState({
        search: '',
        status: 'all',
        mode: 'all'
    });
    const [settingsTab, setSettingsTab] = useState('profile');
    const [profileForm, setProfileForm] = useState({
        name: auth.user?.name || '',
        phone: auth.user?.profile?.phone || '',
        address: auth.user?.profile?.address || '',
        preferredDoctorId: auth.user?.profile?.preferredDoctorId || '',
        emergencyName: auth.user?.profile?.emergencyContact?.name || '',
        emergencyPhone: auth.user?.profile?.emergencyContact?.phone || ''
    });
    const [notifications, setNotifications] = useState({
        email: auth.user?.profile?.notifications?.email ?? true,
        sms: auth.user?.profile?.notifications?.sms ?? false,
        appt: auth.user?.profile?.notifications?.appt ?? true
    });
    const [privacy, setPrivacy] = useState({
        researchSharing: auth.user?.profile?.privacy?.researchSharing ?? false,
        twoFactor: auth.user?.profile?.privacy?.twoFactor ?? false
    });
    const [medical, setMedical] = useState({
        bloodType: auth.user?.profile?.medical?.bloodType || '',
        allergies: auth.user?.profile?.medical?.allergies || '',
        medications: auth.user?.profile?.medical?.medications || '',
        pharmacy: auth.user?.profile?.medical?.pharmacy || ''
    });

    useEffect(() => {
        api.getDoctors()
            .then(({ doctors: items }) => setDoctors(items))
            .catch(err => toast(err.message, 'error'));
        api.getAppointments()
            .then(({ appointments: items }) => setAppointments(items))
            .catch(err => toast(err.message, 'error'));
        api.getLabReports()
            .then(({ reports }) => setLabReports(reports))
            .catch(err => toast(err.message, 'error'));
        api.getPharmacyOrders()
            .then(({ orders }) => setPharmacyOrders(orders))
            .catch(err => toast(err.message, 'error'));
        api.getDiagnosticTests()
            .then(({ tests }) => setDiagnosticTests(tests))
            .catch(err => toast(err.message, 'error'));
        api.getHealthPackages()
            .then(({ packages: items }) => setHealthPackages(items))
            .catch(err => toast(err.message, 'error'));
        api.getBloodBank()
            .then(({ inventory }) => setBloodInventory(inventory))
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
            preferredDoctorId: auth.user?.profile?.preferredDoctorId || '',
            emergencyName: auth.user?.profile?.emergencyContact?.name || '',
            emergencyPhone: auth.user?.profile?.emergencyContact?.phone || ''
        });
        setNotifications({
            email: auth.user?.profile?.notifications?.email ?? true,
            sms: auth.user?.profile?.notifications?.sms ?? false,
            appt: auth.user?.profile?.notifications?.appt ?? true
        });
        setPrivacy({
            researchSharing: auth.user?.profile?.privacy?.researchSharing ?? false,
            twoFactor: auth.user?.profile?.privacy?.twoFactor ?? false
        });
        setMedical({
            bloodType: auth.user?.profile?.medical?.bloodType || '',
            allergies: auth.user?.profile?.medical?.allergies || '',
            medications: auth.user?.profile?.medical?.medications || '',
            pharmacy: auth.user?.profile?.medical?.pharmacy || ''
        });
    }, [auth.user]);

    const specialties = useMemo(() => ['all', ...new Set(doctors.map(d => d.specialty))], [doctors]);
    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc => {
            if (filters.search) {
                const q = filters.search.toLowerCase();
                if (!(`${doc.name} ${doc.specialty}`.toLowerCase().includes(q))) return false;
            }
            if (filters.specialty !== 'all' && doc.specialty !== filters.specialty) return false;
            if (filters.rating !== 'all' && doc.rating < parseFloat(filters.rating)) return false;
            if (filters.availability === 'accepting' && !doc.accepting) return false;
            if (filters.availability === 'televisit' && !doc.televisit) return false;
            return true;
        });
    }, [doctors, filters]);

    const stats = useMemo(() => {
        const confirmed = appointments.filter(a => a.status === 'Confirmed').length;
        const pending = appointments.filter(a => a.status === 'Pending').length;
        const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
        return { total: appointments.length, confirmed, pending, cancelled };
    }, [appointments]);

    const appointmentMix = useMemo(() => {
        const total = stats.total;
        if (!total) {
            return { confirmed: 0, pending: 0, cancelled: 0 };
        }
        const toPct = count => Math.round((count / total) * 100);
        return {
            confirmed: toPct(stats.confirmed),
            pending: toPct(stats.pending),
            cancelled: toPct(stats.cancelled)
        };
    }, [stats]);

    const appointmentResults = useMemo(() => {
        return appointments
            .filter(appt => {
                if (apptFilters.search) {
                    const q = apptFilters.search.toLowerCase();
                    if (!(`${appt.doctorName || ''} ${appt.reason || ''}`.toLowerCase().includes(q))) return false;
                }
                if (apptFilters.status !== 'all' && appt.status !== apptFilters.status) return false;
                if (apptFilters.mode !== 'all' && appt.mode !== apptFilters.mode) return false;
                return true;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [appointments, apptFilters]);

    const selectedDoctor = useMemo(() => doctors.find(doc => doc.id === booking.doctorId), [doctors, booking.doctorId]);
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

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

    const serviceCards = [
        {
            id: 'pharmacy',
            title: 'Online Pharmacy',
            desc: 'Order medicines, refills, and delivery updates.',
            icon: 'fa-pills',
            action: 'Start Order',
            onClick: () => toast('Pharmacy order flow started.', 'info')
        },
        {
            id: 'lab-home',
            title: 'Lab Tests at Home',
            desc: 'Schedule home sample collection for diagnostics.',
            icon: 'fa-vial',
            action: 'Schedule',
            onClick: () => toast('Home sample collection requested.', 'info')
        },
        {
            id: 'teleconsult',
            title: 'Online Consultation',
            desc: 'Start a video consult with your care team.',
            icon: 'fa-video',
            action: 'Join Now',
            onClick: () => toast('Teleconsultation room opened.', 'info')
        },
        {
            id: 'health-packages',
            title: 'Health Packages',
            desc: 'Bundle screenings and preventive care.',
            icon: 'fa-box-medical',
            action: 'Browse',
            onClick: () => toast('Health packages opened.', 'info')
        },
        {
            id: 'blood-bank',
            title: 'Blood Bank',
            desc: 'Check availability by blood group.',
            icon: 'fa-droplet',
            action: 'View Stock',
            onClick: () => setActiveSection('services')
        },
        {
            id: 'insurance',
            title: 'Insurance Desk',
            desc: 'Verify coverage and track claims.',
            icon: 'fa-file-shield',
            action: 'Verify',
            onClick: () => toast('Coverage verification started.', 'info')
        },
        {
            id: 'second-opinion',
            title: 'Second Opinion',
            desc: 'Request specialist review of your records.',
            icon: 'fa-user-doctor',
            action: 'Request',
            onClick: () => toast('Second opinion request created.', 'info')
        }
    ];

    const bookAppointment = async event => {
        event.preventDefault();
        try {
            const result = await api.createAppointment({
                doctorId: booking.doctorId,
                date: booking.date,
                time: booking.time,
                visitType: booking.visitType,
                mode: booking.mode,
                reason: booking.reason
            });
            const doctor = doctors.find(d => d.id === booking.doctorId);
            setAppointments(prev => [{
                id: result.id,
                doctorId: booking.doctorId,
                doctorName: doctor?.name || 'Assigned Doctor',
                doctorSpecialty: doctor?.specialty || 'General Medicine',
                date: booking.date,
                time: booking.time,
                status: 'Pending',
                mode: booking.mode,
                visitType: booking.visitType,
                reason: booking.reason
            }, ...prev]);
            setBooking({ doctorId: '', date: '', time: '', visitType: '', mode: '', reason: '' });
            toast('Appointment booked successfully.');
            setActiveSection('appointments');
        } catch (err) {
            toast(err.message || 'Unable to book appointment.', 'error');
        }
    };

    const updateAppointment = async (id, payload, message) => {
        try {
            await api.updateAppointment(id, payload);
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...payload } : a));
            toast(message || 'Appointment updated.');
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
                preferredDoctorId: profileForm.preferredDoctorId,
                emergencyContact: {
                    name: profileForm.emergencyName,
                    phone: profileForm.emergencyPhone
                },
                notifications,
                privacy,
                medical
            };
            const result = await api.updateProfile(payload);
            onUserUpdate(result.user);
            toast('Profile saved.');
        } catch (err) {
            toast(err.message || 'Unable to save profile.', 'error');
        }
    };

    const handleSelectDoctor = doctor => {
        setBooking(prev => ({
            ...prev,
            doctorId: doctor.id,
            mode: prev.mode || (doctor.televisit ? 'Televisit' : 'In-Person')
        }));
        setActiveSection('book');
    };

    const handleReschedule = appointment => {
        const doctor = doctors.find(doc => doc.id === appointment.doctorId || doc.name === appointment.doctorName);
        setBooking({
            doctorId: doctor?.id || '',
            date: appointment.date,
            time: appointment.time,
            visitType: appointment.visitType || '',
            mode: appointment.mode || '',
            reason: appointment.reason || ''
        });
        setActiveSection('book');
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
                            <h1>Patient Dashboard</h1>
                            <p className="sub">Welcome back, {auth.user?.name || 'Patient'}.</p>
                        </div>
                    </div>
                    <div className="top-bar-actions">
                        <div className="quick-actions">
                            <button className="action-pill" onClick={() => setActiveSection('book')}>
                                <i className="fa-solid fa-calendar-plus"></i> Book Visit
                            </button>
                            <button className="action-pill" onClick={() => toast('Refill request started.', 'info')}>
                                <i className="fa-solid fa-prescription-bottle"></i> Refill Request
                            </button>
                            <button className="action-pill" onClick={() => toast('Care team notified.', 'info')}>
                                <i className="fa-solid fa-message"></i> Message Care Team
                            </button>
                        </div>
                        <div className="profile-pill">
                            <div className="avatar"><i className="fa-solid fa-user"></i></div>
                            <span>{auth.user?.name || 'Patient'}</span>
                        </div>
                    </div>
                </nav>

                <div className="alert-banner">
                    <i className="fa-solid fa-circle-info"></i>
                    <div>
                        <strong>Reminder:</strong> Bring your updated insurance card for in-person appointments this week.
                    </div>
                </div>

                {activeSection === 'overview' && (
                    <section>
                        <div className="stats-row">
                            <div className="stat-card blue">
                                <p className="label">Total Appointments</p>
                                <p className="value">{stats.total}</p>
                                <p className="trend" style={{ color: 'var(--secondary)' }}>Since joining</p>
                            </div>
                            <div className="stat-card green">
                                <p className="label">Confirmed</p>
                                <p className="value">{stats.confirmed}</p>
                                <p className="trend" style={{ color: 'var(--success)' }}>Ready</p>
                            </div>
                            <div className="stat-card amber">
                                <p className="label">Pending</p>
                                <p className="value">{stats.pending}</p>
                                <p className="trend" style={{ color: 'var(--warning)' }}>Awaiting</p>
                            </div>
                            <div className="stat-card red">
                                <p className="label">Cancelled</p>
                                <p className="value">{stats.cancelled}</p>
                                <p className="trend" style={{ color: 'var(--muted)' }}>This month</p>
                            </div>
                        </div>

                        <div className="overview-grid">
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-calendar-day"></i> Next Appointment</h2>
                                    <span className="status-chip status-chip--info">Upcoming</span>
                                </div>
                                <div className="panel-list">
                                    {appointments.slice(0, 1).map(appt => (
                                        <div className="panel-item" key={appt.id}>
                                            <div className="panel-meta">
                                                <strong>{appt.doctorName}</strong>
                                                <span>{appt.doctorSpecialty} · {formatDate(appt.date)} at {appt.time}</span>
                                            </div>
                                            <div className="panel-actions">
                                                <button className="btn btn-success btn-sm">Confirm</button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}>
                                                    Reschedule
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {appointments.length === 0 && (
                                        <div className="panel-item">
                                            <div className="panel-meta">
                                                <strong>No upcoming appointments</strong>
                                                <span>Book a visit to get started.</span>
                                            </div>
                                            <span className="tag">Open</span>
                                        </div>
                                    )}
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>Pre-Visit Checklist</strong>
                                            <span>Bring medication list and recent lab results.</span>
                                        </div>
                                        <span className="tag"><i className="fa-solid fa-clipboard-check"></i> Ready</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-user-group"></i> Care Team</h2>
                                </div>
                                <div className="panel-list">
                                    {doctors.slice(0, 3).map(doc => (
                                        <div className="panel-item" key={doc.id}>
                                            <div className="panel-meta">
                                                <strong>{doc.name}</strong>
                                                <span>{doc.specialty} · {doc.accepting ? 'Accepting new patients' : 'Waitlist'}</span>
                                            </div>
                                            <span className="tag">{doc.televisit ? 'Televisit' : 'In-person'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-chart-pie"></i> Appointment Snapshot</h2>
                                </div>
                                <div className="mini-chart">
                                    <div className="chart-row">
                                        <span>Confirmed ({stats.confirmed})</span>
                                        <div className="chart-bar"><div style={{ width: `${appointmentMix.confirmed}%` }}></div></div>
                                    </div>
                                    <div className="chart-row">
                                        <span>Pending ({stats.pending})</span>
                                        <div className="chart-bar"><div style={{ width: `${appointmentMix.pending}%` }}></div></div>
                                    </div>
                                    <div className="chart-row">
                                        <span>Cancelled ({stats.cancelled})</span>
                                        <div className="chart-bar"><div style={{ width: `${appointmentMix.cancelled}%` }}></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                {activeSection === 'search' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-magnifying-glass"></i> Find a Doctor</h2>
                                <span className="filter-meta">{filteredDoctors.length} matches</span>
                            </div>
                            <div className="table-filters">
                                <div className="filter-group">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name or specialty"
                                        value={filters.search}
                                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    />
                                </div>
                                <select
                                    className="filter-select"
                                    value={filters.specialty}
                                    onChange={e => setFilters(prev => ({ ...prev, specialty: e.target.value }))}
                                >
                                    {specialties.map(item => (
                                        <option key={item} value={item}>{item === 'all' ? 'All specialties' : item}</option>
                                    ))}
                                </select>
                                <select
                                    className="filter-select"
                                    value={filters.rating}
                                    onChange={e => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                                >
                                    <option value="all">All ratings</option>
                                    <option value="4.5">4.5+ rating</option>
                                    <option value="4.7">4.7+ rating</option>
                                    <option value="4.9">4.9+ rating</option>
                                </select>
                                <select
                                    className="filter-select"
                                    value={filters.availability}
                                    onChange={e => setFilters(prev => ({ ...prev, availability: e.target.value }))}
                                >
                                    <option value="all">All availability</option>
                                    <option value="accepting">Accepting new patients</option>
                                    <option value="televisit">Televisit available</option>
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => setFilters({ search: '', specialty: 'all', rating: 'all', availability: 'all' })}
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="doctors-grid">
                                {filteredDoctors.length === 0 && (
                                    <div className="empty-state">
                                        <strong>No providers match your filters.</strong>
                                        <p>Try widening your search or removing a filter.</p>
                                    </div>
                                )}
                                {filteredDoctors.map(doc => (
                                    <div className="doc-card" key={doc.id}>
                                        <div
                                            className="doc-avatar"
                                            style={{ background: doc.televisit ? 'linear-gradient(135deg, #0f7c7d, #0b2f3a)' : 'linear-gradient(135deg, #f0b429, #e4574f)' }}
                                        >
                                            {initials(doc.name)}
                                        </div>
                                        <div className="doc-body">
                                            <h4>{doc.name}</h4>
                                            <p>{doc.specialty} · {doc.clinic}</p>
                                            <div className="doc-tags">
                                                <span className="tag"><i className="fa-solid fa-star"></i> {doc.rating.toFixed(1)}</span>
                                                <span className="tag">{doc.televisit ? 'Televisit' : 'In-person'}</span>
                                                <span className={`tag ${doc.accepting ? 'tag--success' : 'tag--muted'}`}>
                                                    {doc.accepting ? 'Accepting' : 'Waitlist'}
                                                </span>
                                            </div>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={() => handleSelectDoctor(doc)}>
                                            Select
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
                {activeSection === 'book' && (
                    <section>
                        <div className="book-layout">
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-calendar-plus"></i> Book an Appointment</h2>
                                </div>
                                <form onSubmit={bookAppointment}>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label><i className="fa-solid fa-user-doctor"></i> Select Doctor</label>
                                            <select
                                                value={booking.doctorId}
                                                onChange={e => setBooking(prev => ({ ...prev, doctorId: e.target.value }))}
                                                required
                                            >
                                                <option value="" disabled>Choose a provider</option>
                                                {doctors.map(doc => (
                                                    <option key={doc.id} value={doc.id}>{doc.name} · {doc.specialty}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label><i className="fa-solid fa-calendar-day"></i> Preferred Date</label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={booking.date}
                                                onChange={e => setBooking(prev => ({ ...prev, date: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label><i className="fa-solid fa-clock"></i> Preferred Time</label>
                                            <input
                                                type="text"
                                                placeholder="09:30 AM"
                                                value={booking.time}
                                                onChange={e => setBooking(prev => ({ ...prev, time: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label><i className="fa-solid fa-stethoscope"></i> Visit Type</label>
                                            <select
                                                value={booking.visitType}
                                                onChange={e => setBooking(prev => ({ ...prev, visitType: e.target.value }))}
                                                required
                                            >
                                                <option value="" disabled>Select visit type</option>
                                                <option value="Consult">Initial consultation</option>
                                                <option value="Follow-up">Follow-up</option>
                                                <option value="Lab Review">Lab review</option>
                                                <option value="Care Plan">Care plan review</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <label><i className="fa-solid fa-laptop-medical"></i> Appointment Mode</label>
                                            <select
                                                value={booking.mode}
                                                onChange={e => setBooking(prev => ({ ...prev, mode: e.target.value }))}
                                                required
                                            >
                                                <option value="" disabled>Select mode</option>
                                                <option value="In-Person">In-Person</option>
                                                <option value="Televisit">Televisit</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-field">
                                        <label><i className="fa-solid fa-notes-medical"></i> Reason for Visit</label>
                                        <textarea
                                            rows="4"
                                            placeholder="Share any additional details that help your care team prepare."
                                            value={booking.reason}
                                            onChange={e => setBooking(prev => ({ ...prev, reason: e.target.value }))}
                                        ></textarea>
                                    </div>
                                    <button className="btn btn-primary" type="submit">
                                        <i className="fa-solid fa-check"></i> Submit Request
                                    </button>
                                    <p className="form-footnote">Requests are reviewed within 24 hours. You will receive a confirmation once approved.</p>
                                </form>
                            </div>
                            <div className="card">
                                <div className="card-header">
                                    <h2><i className="fa-solid fa-clipboard-list"></i> Appointment Summary</h2>
                                </div>
                                {selectedDoctor ? (
                                    <div className="summary-list">
                                        <div className="summary-item">
                                            <span>Provider</span>
                                            <strong>{selectedDoctor.name}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Specialty</span>
                                            <strong>{selectedDoctor.specialty}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Clinic</span>
                                            <strong>{selectedDoctor.clinic}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Date</span>
                                            <strong>{booking.date ? formatDate(booking.date) : 'Select a date'}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Time</span>
                                            <strong>{booking.time || 'Select a time'}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Mode</span>
                                            <strong>{booking.mode || 'Select mode'}</strong>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <strong>No doctor selected</strong>
                                        <p>Pick a provider from the Find Doctor tab to continue.</p>
                                    </div>
                                )}
                                <div className="summary-note">
                                    <h4><i className="fa-solid fa-shield-heart"></i> Coverage Check</h4>
                                    <p>We will verify coverage and notify you of any co-pay requirements before confirmation.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                {activeSection === 'appointments' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-calendar-check"></i> My Appointments</h2>
                                <span className="filter-meta">{appointmentResults.length} scheduled</span>
                            </div>
                            <div className="table-filters">
                                <div className="filter-group">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Search by provider or reason"
                                        value={apptFilters.search}
                                        onChange={e => setApptFilters(prev => ({ ...prev, search: e.target.value }))}
                                    />
                                </div>
                                <select
                                    className="filter-select"
                                    value={apptFilters.status}
                                    onChange={e => setApptFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="all">All statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Declined">Declined</option>
                                </select>
                                <select
                                    className="filter-select"
                                    value={apptFilters.mode}
                                    onChange={e => setApptFilters(prev => ({ ...prev, mode: e.target.value }))}
                                >
                                    <option value="all">All modes</option>
                                    <option value="In-Person">In-Person</option>
                                    <option value="Televisit">Televisit</option>
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                    onClick={() => setApptFilters({ search: '', status: 'all', mode: 'all' })}
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="appt-list">
                                {appointmentResults.length === 0 && (
                                    <div className="empty-state">
                                        <strong>No appointments found.</strong>
                                        <p>Book a visit to see upcoming appointments here.</p>
                                    </div>
                                )}
                                {appointmentResults.map(appt => (
                                    <div className="appt-card" key={appt.id}>
                                        <div className="appt-left">
                                            <div className="appt-icon" style={{ background: 'rgba(15, 124, 125, 0.14)', color: 'var(--secondary)' }}>
                                                <i className="fa-solid fa-calendar-check"></i>
                                            </div>
                                            <div>
                                                <h4>{appt.doctorName}</h4>
                                                <div className="appt-meta">{appt.doctorSpecialty} · {formatDate(appt.date)} at {appt.time}</div>
                                                <span className={`badge ${badgeClass(appt.status)}`}>{appt.status}</span>
                                            </div>
                                        </div>
                                        <div className="appt-right">
                                            <span className="tag">{appt.visitType || 'Visit'}</span>
                                            <span className="tag">{appt.mode}</span>
                                            {appt.status === 'Pending' && (
                                                <>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                                        onClick={() => handleReschedule(appt)}
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => updateAppointment(appt.id, { status: 'Cancelled' }, 'Appointment cancelled.')}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            {appt.status === 'Confirmed' && (
                                                <>
                                                    {appt.mode === 'Televisit' && (
                                                        <button className="btn btn-success btn-sm" onClick={() => toast('Televisit link opened.', 'info')}>
                                                            Join Televisit
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}
                                                        onClick={() => handleReschedule(appt)}
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => updateAppointment(appt.id, { status: 'Cancelled' }, 'Appointment cancelled.')}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            {['Cancelled', 'Declined'].includes(appt.status) && (
                                                <button className="btn btn-primary btn-sm" onClick={() => handleReschedule(appt)}>
                                                    Rebook
                                                </button>
                                            )}
                                            {appt.status === 'Completed' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => toast('Feedback form opened.')} >
                                                    Leave Feedback
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
                {activeSection === 'services' && (
                    <section>
                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-layer-group"></i> Digital Care Services</h2>
                                <span className="filter-meta">Online access to hospital services</span>
                            </div>
                            <div className="service-grid">
                                {serviceCards.map(card => (
                                    <div className="service-card" key={card.id}>
                                        <div className="service-icon">
                                            <i className={`fa-solid ${card.icon}`}></i>
                                        </div>
                                        <div className="service-body">
                                            <h4>{card.title}</h4>
                                            <p>{card.desc}</p>
                                        </div>
                                        <button className="btn btn-primary btn-sm" onClick={card.onClick}>
                                            {card.action}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-flask-vial"></i> Lab Reports</h2>
                            </div>
                            <div className="panel-list">
                                {labReports.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No lab reports yet</strong>
                                            <span>Reports will appear after tests are completed.</span>
                                        </div>
                                        <span className="tag">Pending</span>
                                    </div>
                                )}
                                {labReports.slice(0, 6).map(report => (
                                    <div className="panel-item" key={report.id}>
                                        <div className="panel-meta">
                                            <strong>{report.testName}</strong>
                                            <span>{formatDate(report.collectedDate)} · {report.provider}</span>
                                            <span>{report.summary}</span>
                                        </div>
                                        <div className="panel-actions">
                                            <span className="tag">{report.status}</span>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }} onClick={() => toast('Report download started.', 'info')}>
                                                View Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-prescription-bottle-medical"></i> Pharmacy & Refills</h2>
                            </div>
                            <div className="panel-list">
                                {pharmacyOrders.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No pharmacy orders</strong>
                                            <span>Prescription refills will show up here.</span>
                                        </div>
                                        <span className="tag">Ready</span>
                                    </div>
                                )}
                                {pharmacyOrders.slice(0, 6).map(order => (
                                    <div className="panel-item" key={order.id}>
                                        <div className="panel-meta">
                                            <strong>{order.medication}</strong>
                                            <span>{order.quantity} · Refills: {order.refills}</span>
                                            <span>{order.pharmacy} · Ordered {formatDate(order.orderedDate)}</span>
                                        </div>
                                        <div className="panel-actions">
                                            <span className="tag">{order.status}</span>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }} onClick={() => toast('Tracking details opened.', 'info')}>
                                                Track
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-microscope"></i> Diagnostics & Health Packages</h2>
                            </div>
                            <div className="split-grid">
                                <div>
                                    <h3 className="section-title">Popular Diagnostic Tests</h3>
                                    <div className="panel-list">
                                        {diagnosticTests.map(test => (
                                            <div className="panel-item" key={test.id}>
                                                <div className="panel-meta">
                                                    <strong>{test.name}</strong>
                                                    <span>{test.category} · Turnaround: {test.turnaround}</span>
                                                    <span>{test.homeCollection ? 'Home sample collection available' : 'On-site visit required'}</span>
                                                </div>
                                                <div className="panel-actions">
                                                    <span className="tag">{formatCurrency(test.price)}</span>
                                                    <button className="btn btn-primary btn-sm" onClick={() => toast('Diagnostic test scheduled.', 'info')}>Schedule</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="section-title">Preventive Health Packages</h3>
                                    <div className="panel-list">
                                        {healthPackages.map(pack => (
                                            <div className="panel-item" key={pack.id}>
                                                <div className="panel-meta">
                                                    <strong>{pack.name}</strong>
                                                    <span>{pack.includes}</span>
                                                    <span>Duration: {pack.duration}</span>
                                                </div>
                                                <div className="panel-actions">
                                                    <span className="tag">{formatCurrency(pack.price)}</span>
                                                    <button className="btn btn-primary btn-sm" onClick={() => toast('Package booking started.', 'info')}>Book</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-file-invoice-dollar"></i> Billing & Insurance</h2>
                            </div>
                            <div className="panel-list">
                                {claims.length === 0 && (
                                    <div className="panel-item">
                                        <div className="panel-meta">
                                            <strong>No active claims</strong>
                                            <span>Your insurance submissions will appear here.</span>
                                        </div>
                                        <span className="tag">Clear</span>
                                    </div>
                                )}
                                {claims.map(claim => (
                                    <div className="panel-item" key={claim.id}>
                                        <div className="panel-meta">
                                            <strong>{claim.description}</strong>
                                            <span>{claim.insurer} · Due {formatDate(claim.dueDate)}</span>
                                            <span>Claim ID: {claim.claimId}</span>
                                        </div>
                                        <div className="panel-actions">
                                            <span className="tag">{claim.status}</span>
                                            <span className="tag">{formatCurrency(claim.amount)}</span>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }} onClick={() => toast('Billing statement opened.', 'info')}>
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2><i className="fa-solid fa-droplet"></i> Blood Bank Availability</h2>
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }} onClick={() => toast('Blood donation scheduling opened.', 'info')}>
                                    Schedule Donation
                                </button>
                            </div>
                            <div className="blood-grid">
                                {bloodInventory.map(item => (
                                    <div className="blood-card" key={item.id}>
                                        <div className="blood-type">{item.bloodType}</div>
                                        <div className="blood-units">{item.units} units</div>
                                        <span className={`tag ${item.status === 'Available' ? 'tag--success' : item.status === 'Low' ? 'tag--muted' : ''}`}>
                                            {item.status}
                                        </span>
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
                                    { id: 'privacy', label: 'Privacy', icon: 'fa-shield' },
                                    { id: 'medical', label: 'Medical', icon: 'fa-notes-medical' }
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
                                                    <label>Home Address</label>
                                                    <input value={profileForm.address} onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Preferred Provider</label>
                                                    <select
                                                        value={profileForm.preferredDoctorId}
                                                        onChange={e => setProfileForm(prev => ({ ...prev, preferredDoctorId: e.target.value }))}
                                                    >
                                                        <option value="">No preference</option>
                                                        {doctors.map(doc => (
                                                            <option key={doc.id} value={doc.id}>{doc.name} · {doc.specialty}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="form-field">
                                                    <label>Emergency Contact Name</label>
                                                    <input value={profileForm.emergencyName} onChange={e => setProfileForm(prev => ({ ...prev, emergencyName: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Emergency Contact Phone</label>
                                                    <input value={profileForm.emergencyPhone} onChange={e => setProfileForm(prev => ({ ...prev, emergencyPhone: e.target.value }))} />
                                                </div>
                                                <div className="form-field">
                                                    <label>Preferred Pharmacy</label>
                                                    <input value={medical.pharmacy} onChange={e => setMedical(prev => ({ ...prev, pharmacy: e.target.value }))} />
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
                                                { id: 'email', title: 'Email Notifications', text: 'Daily summaries, portal updates, and urgent alerts.' },
                                                { id: 'sms', title: 'SMS Notifications', text: 'Appointment reminders and time-sensitive alerts.' },
                                                { id: 'appt', title: 'Appointment Reminders', text: 'Automatic reminders before each visit.' }
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

                                {settingsTab === 'privacy' && (
                                    <div className="settings-panel active">
                                        <div className="card">
                                            <div className="card-header">
                                                <h2><i className="fa-solid fa-shield"></i> Privacy Controls</h2>
                                            </div>
                                            {[
                                                { id: 'researchSharing', title: 'Research Sharing', text: 'Share anonymized data to improve care quality.' },
                                                { id: 'twoFactor', title: 'Two-Factor Authentication', text: 'Require a second step when logging in.' }
                                            ].map(item => (
                                                <div className="settings-row" key={item.id}>
                                                    <div className="settings-info">
                                                        <h4>{item.title}</h4>
                                                        <p>{item.text}</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={privacy[item.id]}
                                                            onChange={e => setPrivacy(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            ))}
                                            <div className="settings-row">
                                                <div className="settings-info">
                                                    <h4>Download Records</h4>
                                                    <p>Request a portable copy of your visit history.</p>
                                                </div>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text)', borderColor: '#cbd5e1' }}>
                                                    Request Export
                                                </button>
                                            </div>
                                            <div style={{ marginTop: '24px' }}>
                                                <button className="btn btn-primary" onClick={saveProfile}>Save Privacy Settings</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'medical' && (
                                    <div className="settings-panel active">
                                        <div className="card">
                                            <div className="card-header">
                                                <h2><i className="fa-solid fa-notes-medical"></i> Medical Profile</h2>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Blood Type</label>
                                                    <input value={medical.bloodType} onChange={e => setMedical(prev => ({ ...prev, bloodType: e.target.value }))} />
                                                </div>
                                                <div className="form-field">
                                                    <label>Primary Pharmacy</label>
                                                    <input value={medical.pharmacy} onChange={e => setMedical(prev => ({ ...prev, pharmacy: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-field">
                                                    <label>Allergies</label>
                                                    <textarea
                                                        rows="3"
                                                        value={medical.allergies}
                                                        onChange={e => setMedical(prev => ({ ...prev, allergies: e.target.value }))}
                                                    ></textarea>
                                                </div>
                                                <div className="form-field">
                                                    <label>Current Medications</label>
                                                    <textarea
                                                        rows="3"
                                                        value={medical.medications}
                                                        onChange={e => setMedical(prev => ({ ...prev, medications: e.target.value }))}
                                                    ></textarea>
                                                </div>
                                            </div>
                                            <button className="btn btn-primary" onClick={saveProfile}>Update Medical Profile</button>
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
