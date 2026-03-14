import { createInitialMockState } from './mockData.js';

const TOKEN_KEY = 'medconnectToken';
const USER_KEY = 'medconnectUser';
const DB_KEY = 'medconnectMockDb';
const MODE_KEY = 'medconnectApiMode';

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function readDb() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        const seeded = createInitialMockState();
        localStorage.setItem(DB_KEY, JSON.stringify(seeded));
        return clone(seeded);
    }

    try {
        return JSON.parse(raw);
    } catch (err) {
        const seeded = createInitialMockState();
        localStorage.setItem(DB_KEY, JSON.stringify(seeded));
        return clone(seeded);
    }
}

function writeDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function setMode(mode) {
    localStorage.setItem(MODE_KEY, mode);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function updateStoredUser(user) {
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
}

function randomId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sortByDateTime(items) {
    return [...items].sort((a, b) => {
        const aValue = new Date(`${a.date} ${a.time}`).getTime();
        const bValue = new Date(`${b.date} ${b.time}`).getTime();
        return aValue - bValue;
    });
}

function sanitizeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: clone(user.profile || {})
    };
}

function getUserById(db, userId) {
    return db.users.find(user => user.id === userId) || null;
}

function getCurrentUser(db) {
    const token = getToken();
    if (!token) return null;
    const userId = db.sessions[token];
    if (!userId) return null;
    return getUserById(db, userId);
}

function requireUser(db) {
    const user = getCurrentUser(db);
    if (!user) {
        throw new Error('Please sign in to continue.');
    }
    return user;
}

function hydrateAppointment(db, appointment) {
    const doctor = getUserById(db, appointment.doctorId);
    const patient = getUserById(db, appointment.patientId);

    return {
        ...appointment,
        doctorName: doctor?.name || appointment.doctorName || 'Assigned Doctor',
        doctorSpecialty: doctor?.profile?.specialty || appointment.doctorSpecialty || 'General Medicine',
        patientName: patient?.name || appointment.patientName || 'Patient'
    };
}

function toDoctorSummary(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        specialty: user.profile?.specialty || 'General Medicine',
        clinic: user.profile?.clinic || 'MedConnect Clinic',
        rating: user.profile?.rating || 4.7,
        accepting: user.profile?.accepting ?? true,
        televisit: user.profile?.televisit ?? true,
        availability: clone(user.profile?.availability || [])
    };
}

function filterByCurrentRole(db, collection, fieldMap) {
    const user = requireUser(db);
    if (user.role === 'doctor') {
        return collection.filter(item => item[fieldMap.doctor] === user.id);
    }
    return collection.filter(item => item[fieldMap.patient] === user.id);
}

function withLatency(data) {
    return new Promise(resolve => {
        window.setTimeout(() => resolve(clone(data)), 120);
    });
}

export const mockApi = {
    async login({ email, password, role }) {
        const db = readDb();
        const user = db.users.find(item =>
            item.email.toLowerCase() === email.toLowerCase() &&
            item.role === role &&
            item.password === password
        );

        if (!user) {
            throw new Error('Invalid email, password, or role.');
        }

        const token = randomId('mock-token');
        db.sessions[token] = user.id;
        writeDb(db);
        setMode('mock');
        return withLatency({ token, user: sanitizeUser(user) });
    },

    async register(payload) {
        const db = readDb();
        const emailLower = payload.email.toLowerCase();
        const exists = db.users.some(user => user.email.toLowerCase() === emailLower);
        if (exists) {
            throw new Error('An account with this email already exists.');
        }

        const isDoctor = payload.role === 'doctor';
        const user = {
            id: randomId(isDoctor ? 'doc' : 'pat'),
            name: payload.name,
            email: payload.email,
            role: payload.role,
            password: payload.password,
            profile: isDoctor ? {
                phone: '',
                address: '',
                specialty: '',
                clinic: '',
                accepting: true,
                televisit: true,
                rating: 4.6,
                availability: ['Update availability in Settings'],
                notifications: { email: true, sms: false, appt: true }
            } : {
                phone: '',
                address: '',
                preferredDoctorId: '',
                emergencyContact: { name: '', phone: '' },
                medical: { bloodType: '', allergies: '', medications: '', pharmacy: '' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: false }
            }
        };

        db.users.push(user);
        writeDb(db);
        setMode('mock');
        return withLatency({ user: sanitizeUser(user) });
    },

    async logout() {
        const db = readDb();
        const token = getToken();
        if (token && db.sessions[token]) {
            delete db.sessions[token];
            writeDb(db);
        }
        setMode('mock');
        return withLatency({ success: true });
    },

    async getMe() {
        const db = readDb();
        const user = requireUser(db);
        const sanitized = sanitizeUser(user);
        updateStoredUser(sanitized);
        setMode('mock');
        return withLatency({ user: sanitized });
    },

    async updateProfile(payload) {
        const db = readDb();
        const user = requireUser(db);
        const userIndex = db.users.findIndex(item => item.id === user.id);
        const current = db.users[userIndex];

        const nextProfile = {
            ...current.profile,
            ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
            ...(payload.address !== undefined ? { address: payload.address } : {}),
            ...(payload.preferredDoctorId !== undefined ? { preferredDoctorId: payload.preferredDoctorId } : {}),
            ...(payload.specialty !== undefined ? { specialty: payload.specialty } : {}),
            ...(payload.clinic !== undefined ? { clinic: payload.clinic } : {}),
            emergencyContact: payload.emergencyContact ? {
                ...(current.profile?.emergencyContact || {}),
                ...payload.emergencyContact
            } : current.profile?.emergencyContact,
            notifications: payload.notifications ? {
                ...(current.profile?.notifications || {}),
                ...payload.notifications
            } : current.profile?.notifications,
            privacy: payload.privacy ? {
                ...(current.profile?.privacy || {}),
                ...payload.privacy
            } : current.profile?.privacy,
            medical: payload.medical ? {
                ...(current.profile?.medical || {}),
                ...payload.medical
            } : current.profile?.medical
        };

        const nextUser = {
            ...current,
            ...(payload.name !== undefined ? { name: payload.name } : {}),
            profile: nextProfile
        };

        db.users[userIndex] = nextUser;
        writeDb(db);
        const sanitized = sanitizeUser(nextUser);
        updateStoredUser(sanitized);
        setMode('mock');
        return withLatency({ user: sanitized });
    },

    async getDoctors() {
        const db = readDb();
        const doctors = db.users
            .filter(user => user.role === 'doctor')
            .map(toDoctorSummary)
            .sort((a, b) => b.rating - a.rating);

        setMode('mock');
        return withLatency({ doctors });
    },

    async getAppointments() {
        const db = readDb();
        const user = requireUser(db);
        const appointments = sortByDateTime(
            db.appointments
                .filter(item => (user.role === 'doctor' ? item.doctorId === user.id : item.patientId === user.id))
                .map(item => hydrateAppointment(db, item))
        );

        setMode('mock');
        return withLatency({ appointments });
    },

    async createAppointment(payload) {
        const db = readDb();
        const user = requireUser(db);
        if (user.role !== 'patient') {
            throw new Error('Only patients can create appointments.');
        }

        const doctor = getUserById(db, payload.doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            throw new Error('Doctor not found.');
        }

        const appointment = {
            id: randomId('appt'),
            doctorId: doctor.id,
            patientId: user.id,
            date: payload.date,
            time: payload.time,
            status: 'Pending',
            mode: payload.mode,
            visitType: payload.visitType,
            reason: payload.reason
        };

        db.appointments.unshift(appointment);
        db.audit.unshift({
            id: randomId('audit'),
            userId: user.id,
            icon: 'fa-calendar-plus',
            label: 'Appointment booked',
            text: `New ${payload.mode.toLowerCase()} visit requested with ${doctor.name}.`,
            createdAt: new Date().toISOString()
        });
        writeDb(db);
        setMode('mock');
        return withLatency({ id: appointment.id, appointment: hydrateAppointment(db, appointment) });
    },

    async updateAppointment(id, payload) {
        const db = readDb();
        const user = requireUser(db);
        const index = db.appointments.findIndex(item => item.id === id);
        if (index === -1) {
            throw new Error('Appointment not found.');
        }

        const current = db.appointments[index];
        const allowed = current.doctorId === user.id || current.patientId === user.id;
        if (!allowed) {
            throw new Error('You do not have access to this appointment.');
        }

        db.appointments[index] = {
            ...current,
            ...(payload.status !== undefined ? { status: payload.status } : {}),
            ...(payload.date !== undefined ? { date: payload.date } : {}),
            ...(payload.time !== undefined ? { time: payload.time } : {}),
            ...(payload.mode !== undefined ? { mode: payload.mode } : {}),
            ...(payload.visitType !== undefined ? { visitType: payload.visitType } : {}),
            ...(payload.reason !== undefined ? { reason: payload.reason } : {})
        };
        writeDb(db);
        setMode('mock');
        return withLatency({ appointment: hydrateAppointment(db, db.appointments[index]) });
    },

    async getAudit() {
        const db = readDb();
        const user = requireUser(db);
        const relatedPatientIds = user.role === 'doctor'
            ? db.appointments.filter(item => item.doctorId === user.id).map(item => item.patientId)
            : [];
        const audit = db.audit.filter(entry =>
            entry.userId === user.id ||
            relatedPatientIds.includes(entry.userId)
        );

        setMode('mock');
        return withLatency({ audit });
    },

    async getLabReports() {
        const db = readDb();
        const reports = filterByCurrentRole(db, db.labReports, { doctor: 'doctorId', patient: 'patientId' })
            .map(report => ({
                ...report,
                patientName: getUserById(db, report.patientId)?.name || 'Patient'
            }));

        setMode('mock');
        return withLatency({ reports });
    },

    async getPharmacyOrders() {
        const db = readDb();
        const user = requireUser(db);
        const patientIds = user.role === 'doctor'
            ? db.appointments.filter(item => item.doctorId === user.id).map(item => item.patientId)
            : [user.id];
        const orders = db.pharmacyOrders
            .filter(order => patientIds.includes(order.patientId))
            .map(order => ({
                ...order,
                patientName: getUserById(db, order.patientId)?.name || 'Patient'
            }));

        setMode('mock');
        return withLatency({ orders });
    },

    async getDiagnosticTests() {
        setMode('mock');
        return withLatency({ tests: readDb().diagnosticTests });
    },

    async getHealthPackages() {
        setMode('mock');
        return withLatency({ packages: readDb().healthPackages });
    },

    async getBloodBank() {
        setMode('mock');
        return withLatency({ inventory: readDb().bloodBank });
    },

    async getClaims() {
        const db = readDb();
        const user = requireUser(db);
        const patientIds = user.role === 'doctor'
            ? db.appointments.filter(item => item.doctorId === user.id).map(item => item.patientId)
            : [user.id];
        const claims = db.claims
            .filter(claim => patientIds.includes(claim.patientId))
            .map(claim => ({
                ...claim,
                patientName: getUserById(db, claim.patientId)?.name || 'Patient'
            }));

        setMode('mock');
        return withLatency({ claims });
    },

    async getResearchTrials() {
        setMode('mock');
        return withLatency({ trials: readDb().researchTrials });
    },

    async getGuidelines() {
        setMode('mock');
        return withLatency({ guidelines: readDb().guidelines });
    }
};
