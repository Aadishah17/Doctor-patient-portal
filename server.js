const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const { URL } = require('url');

const PORT = parseInt(process.env.PORT || '8080', 10);
const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'medconnect';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.json': 'application/json',
    '.map': 'application/json',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const DIST_DIR = path.join(__dirname, 'dist');

const SEED_HASH = {
    doctor: {
        salt: '9f566a69d3b14701b12ff87b4afdce34',
        hash: '865abac15ec6a7a6d8481bad5fb52c019befbc20e1c6eff6650fbdb2b5fe2b34bd1458e1a3ecc64eca3169ec0a2b0601db0e34afb9608c820a04d95bc3694dba'
    },
    patient: {
        salt: 'c3e6198d7965ad43dc871814edb41fc8',
        hash: '28e16465f10b2144660ec3dd8ca32949c997dbdeb00af881e25850939e30b8f15299a396beef3dc4561d874174c4b2834dcc3412501530c275e9d25081dac7a1'
    }
};

let dbClient;
let db;

function sendJson(res, status, payload) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
    res.writeHead(status, { 'Content-Type': 'text/plain' });
    res.end(text);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
            data += chunk;
            if (data.length > 1e6) {
                req.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

async function readJson(req) {
    const raw = await readBody(req);
    if (!raw) return {};
    try {
        return JSON.parse(raw);
    } catch (err) {
        throw new Error('Invalid JSON');
    }
}

function hashPassword(password, salt) {
    const saltValue = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, saltValue, 64).toString('hex');
    return { salt: saltValue, hash };
}

function verifyPassword(password, salt, expectedHash) {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(expectedHash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function createSession(userId) {
    const token = crypto.randomBytes(24).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return {
        token,
        userId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
    };
}

function sanitizeUser(userDoc) {
    if (!userDoc) return null;
    return {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        profile: userDoc.profile || {},
        createdAt: userDoc.createdAt
    };
}

async function connectDb() {
    if (db) return db;
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not set');
    }
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    db = dbClient.db(DB_NAME);
    return db;
}

async function ensureIndexes(database) {
    await database.collection('users').createIndex({ emailLower: 1 }, { unique: true });
    await database.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await database.collection('appointments').createIndex({ doctorId: 1 });
    await database.collection('appointments').createIndex({ patientId: 1 });
    await database.collection('audit').createIndex({ userId: 1 });
}

async function seedDatabase(database) {
    const users = database.collection('users');
    const appointments = database.collection('appointments');
    const labReports = database.collection('labReports');
    const pharmacyOrders = database.collection('pharmacyOrders');
    const diagnosticTests = database.collection('diagnosticTests');
    const healthPackages = database.collection('healthPackages');
    const bloodBank = database.collection('bloodBank');
    const claims = database.collection('claims');
    const researchTrials = database.collection('researchTrials');
    const guidelines = database.collection('guidelines');
    const DEFAULT_PASSWORD = 'Welcome123!';

    const ensureUser = async ({ name, email, role, profile, password, seedHash }) => {
        const emailLower = email.toLowerCase();
        const existing = await users.findOne({ emailLower });
        if (existing) return existing;

        const { salt, hash } = seedHash || hashPassword(password || DEFAULT_PASSWORD);
        const now = new Date().toISOString();
        const userDoc = {
            name,
            email,
            emailLower,
            role,
            passwordHash: hash,
            passwordSalt: salt,
            createdAt: now,
            profile
        };
        const result = await users.insertOne(userDoc);
        return { ...userDoc, _id: result.insertedId };
    };

    const ensureDoc = async (collection, query, doc) => {
        const existing = await collection.findOne(query);
        if (existing) return existing;
        await collection.insertOne(doc);
        return doc;
    };

    const toDate = days => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const doctorSeed = await ensureUser({
        name: 'Dr. John Smith',
        email: 'doctor@test.com',
        role: 'doctor',
        seedHash: SEED_HASH.doctor,
        profile: {
            phone: '+1 (555) 123-4567',
            address: '123 Medical Pl, Health City',
            specialty: 'Cardiology',
            clinic: 'Bldg 4, MedConnect Campus',
            accepting: true,
            televisit: true,
            rating: 4.9,
            availability: [
                'Monday, 09:00 AM - 05:00 PM',
                'Wednesday, 10:00 AM - 02:00 PM'
            ],
            notifications: { email: true, sms: false, appt: true },
            privacy: { publicProfile: true, twoFactor: false }
        }
    });

    const additionalDoctors = await Promise.all([
        ensureUser({
            name: 'Dr. Priya Nair',
            email: 'priya.nair@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 222-9034',
                address: 'Neuro Wing, Block B',
                specialty: 'Neurology',
                clinic: 'Central Hospital Campus',
                accepting: true,
                televisit: true,
                rating: 4.8,
                availability: [
                    'Tuesday, 08:30 AM - 03:30 PM',
                    'Thursday, 10:00 AM - 04:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        }),
        ensureUser({
            name: 'Dr. Miguel Alvarez',
            email: 'miguel.alvarez@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 555-0113',
                address: "Children's Center, West Wing",
                specialty: 'Pediatrics',
                clinic: 'Community Health Center',
                accepting: false,
                televisit: true,
                rating: 4.6,
                availability: [
                    'Monday, 11:00 AM - 06:00 PM',
                    'Friday, 09:00 AM - 01:00 PM'
                ],
                notifications: { email: true, sms: true, appt: true },
                privacy: { publicProfile: true, twoFactor: false }
            }
        }),
        ensureUser({
            name: 'Dr. Hannah Lee',
            email: 'hannah.lee@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 390-2011',
                address: 'Dermatology Suite, Floor 3',
                specialty: 'Dermatology',
                clinic: 'Regional Medical Plaza',
                accepting: true,
                televisit: false,
                rating: 4.7,
                availability: [
                    'Wednesday, 09:00 AM - 01:00 PM',
                    'Friday, 12:00 PM - 05:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        }),
        ensureUser({
            name: 'Dr. Omar Siddiqui',
            email: 'omar.siddiqui@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 610-7731',
                address: 'Ortho Unit, Block D',
                specialty: 'Orthopedics',
                clinic: 'Metro Hospital Campus',
                accepting: true,
                televisit: true,
                rating: 4.5,
                availability: [
                    'Tuesday, 01:00 PM - 06:00 PM',
                    'Thursday, 08:00 AM - 12:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: false }
            }
        }),
        ensureUser({
            name: 'Dr. Sofia Chen',
            email: 'sofia.chen@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 730-4452',
                address: 'Oncology Center, Floor 5',
                specialty: 'Oncology',
                clinic: 'Regional Cancer Institute',
                accepting: true,
                televisit: true,
                rating: 4.8,
                availability: [
                    'Monday, 08:00 AM - 02:00 PM',
                    'Thursday, 01:00 PM - 05:00 PM'
                ],
                notifications: { email: true, sms: true, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        }),
        ensureUser({
            name: 'Dr. Nathan Brooks',
            email: 'nathan.brooks@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 480-6620',
                address: 'Family Medicine, East Wing',
                specialty: 'Family Medicine',
                clinic: 'Downtown Primary Care',
                accepting: true,
                televisit: false,
                rating: 4.4,
                availability: [
                    'Tuesday, 09:00 AM - 05:00 PM',
                    'Friday, 10:00 AM - 03:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: false, twoFactor: false }
            }
        }),
        ensureUser({
            name: 'Dr. Aisha Rahman',
            email: 'aisha.rahman@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 210-9981',
                address: 'Endocrinology Suite, Level 2',
                specialty: 'Endocrinology',
                clinic: 'City Specialty Clinic',
                accepting: true,
                televisit: true,
                rating: 4.7,
                availability: [
                    'Wednesday, 08:00 AM - 02:00 PM',
                    'Thursday, 02:00 PM - 06:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        }),
        ensureUser({
            name: 'Dr. Kavita Rao',
            email: 'kavita.rao@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 881-4420',
                address: 'Respiratory Unit, North Wing',
                specialty: 'Pulmonology',
                clinic: 'Metro Hospital Campus',
                accepting: true,
                televisit: true,
                rating: 4.6,
                availability: [
                    'Monday, 02:00 PM - 06:00 PM',
                    'Wednesday, 09:00 AM - 12:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: false }
            }
        }),
        ensureUser({
            name: 'Dr. Ethan Miller',
            email: 'ethan.miller@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 310-7722',
                address: 'GI Clinic, Floor 2',
                specialty: 'Gastroenterology',
                clinic: 'Regional Medical Plaza',
                accepting: true,
                televisit: false,
                rating: 4.5,
                availability: [
                    'Tuesday, 10:00 AM - 04:00 PM',
                    'Thursday, 09:30 AM - 01:30 PM'
                ],
                notifications: { email: true, sms: true, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        }),
        ensureUser({
            name: 'Dr. Layla Hassan',
            email: 'layla.hassan@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 444-3321',
                address: 'Women Health Center, Block C',
                specialty: 'Obstetrics & Gynecology',
                clinic: 'Central Hospital Campus',
                accepting: true,
                televisit: true,
                rating: 4.7,
                availability: [
                    'Monday, 09:00 AM - 01:00 PM',
                    'Friday, 02:00 PM - 06:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        }),
        ensureUser({
            name: 'Dr. Victor Petrov',
            email: 'victor.petrov@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 620-3319',
                address: 'Renal Care Unit, Floor 4',
                specialty: 'Nephrology',
                clinic: 'Regional Cancer Institute',
                accepting: false,
                televisit: true,
                rating: 4.4,
                availability: [
                    'Wednesday, 10:30 AM - 03:30 PM',
                    'Thursday, 01:00 PM - 04:00 PM'
                ],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: false, twoFactor: false }
            }
        }),
        ensureUser({
            name: 'Dr. Grace Kim',
            email: 'grace.kim@medconnect.gov',
            role: 'doctor',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 712-9044',
                address: 'Behavioral Health, South Wing',
                specialty: 'Psychiatry',
                clinic: 'Community Health Center',
                accepting: true,
                televisit: true,
                rating: 4.8,
                availability: [
                    'Tuesday, 01:00 PM - 05:00 PM',
                    'Thursday, 09:00 AM - 12:00 PM'
                ],
                notifications: { email: true, sms: true, appt: true },
                privacy: { publicProfile: true, twoFactor: true }
            }
        })
    ]);

    const allDoctors = [doctorSeed, ...additionalDoctors];

    const patientSeed = await ensureUser({
        name: 'Alex Johnson',
        email: 'alex@test.com',
        role: 'patient',
        seedHash: SEED_HASH.patient,
        profile: {
            phone: '+1 (555) 987-6543',
            address: '456 Elm St, Cityville',
            preferredDoctorId: doctorSeed._id.toString(),
            emergencyContact: {
                name: 'Jane Johnson',
                phone: '+1 (555) 000-1111'
            },
            notifications: { email: true, sms: false, appt: true },
            privacy: { researchSharing: false, twoFactor: false },
            medical: {
                bloodType: 'O+',
                allergies: 'Penicillin',
                medications: 'Atorvastatin',
                pharmacy: 'Cityville Pharmacy'
            }
        }
    });

    const additionalPatients = await Promise.all([
        ensureUser({
            name: 'Maya Patel',
            email: 'maya.patel@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 341-8890',
                address: '210 Lakeview Rd, Springfield',
                preferredDoctorId: allDoctors[1]._id.toString(),
                emergencyContact: { name: 'Raj Patel', phone: '+1 (555) 111-2233' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: true, twoFactor: true },
                medical: {
                    bloodType: 'A-',
                    allergies: 'Shellfish',
                    medications: 'Levothyroxine',
                    pharmacy: 'Springfield Care Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Jordan Lee',
            email: 'jordan.lee@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 703-4411',
                address: '87 Oak Street, Riverton',
                preferredDoctorId: allDoctors[2]._id.toString(),
                emergencyContact: { name: 'Harper Lee', phone: '+1 (555) 450-6621' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: false },
                medical: {
                    bloodType: 'B+',
                    allergies: 'None reported',
                    medications: 'Metformin',
                    pharmacy: 'Riverton Community Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Chris Ramirez',
            email: 'chris.ramirez@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 620-8874',
                address: '903 Pine Ave, Brookfield',
                preferredDoctorId: allDoctors[3]._id.toString(),
                emergencyContact: { name: 'Lucia Ramirez', phone: '+1 (555) 998-1133' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: true, twoFactor: false },
                medical: {
                    bloodType: 'AB+',
                    allergies: 'Latex',
                    medications: 'Albuterol',
                    pharmacy: 'Brookfield Health Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Lila Cohen',
            email: 'lila.cohen@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 812-3340',
                address: '14 Maple Court, Ashland',
                preferredDoctorId: allDoctors[4]._id.toString(),
                emergencyContact: { name: 'Evan Cohen', phone: '+1 (555) 902-1188' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: true },
                medical: {
                    bloodType: 'O-',
                    allergies: 'Aspirin',
                    medications: 'Lisinopril',
                    pharmacy: 'Ashland Community Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Arjun Mehta',
            email: 'arjun.mehta@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 275-4499',
                address: '77 Cedar Lane, Fairview',
                preferredDoctorId: allDoctors[5]._id.toString(),
                emergencyContact: { name: 'Nina Mehta', phone: '+1 (555) 662-4410' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: true, twoFactor: false },
                medical: {
                    bloodType: 'B-',
                    allergies: 'None reported',
                    medications: 'Sertraline',
                    pharmacy: 'Fairview Health Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Sophia Nguyen',
            email: 'sophia.nguyen@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 555-2413',
                address: '230 River Rd, Easton',
                preferredDoctorId: allDoctors[6]._id.toString(),
                emergencyContact: { name: 'Bao Nguyen', phone: '+1 (555) 771-0091' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: false, twoFactor: true },
                medical: {
                    bloodType: 'A+',
                    allergies: 'Sulfa drugs',
                    medications: 'Insulin',
                    pharmacy: 'Easton Care Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Rohan Das',
            email: 'rohan.das@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 644-1180',
                address: '18 Hillview Dr, Laketown',
                preferredDoctorId: allDoctors[7]._id.toString(),
                emergencyContact: { name: 'Anika Das', phone: '+1 (555) 311-2244' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: false },
                medical: {
                    bloodType: 'O+',
                    allergies: 'None reported',
                    medications: 'Montelukast',
                    pharmacy: 'Laketown Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Neha Singh',
            email: 'neha.singh@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 219-6603',
                address: '62 Park Lane, Brighton',
                preferredDoctorId: allDoctors[8]._id.toString(),
                emergencyContact: { name: 'Aman Singh', phone: '+1 (555) 669-2201' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: true, twoFactor: true },
                medical: {
                    bloodType: 'B+',
                    allergies: 'Dust mites',
                    medications: 'Omeprazole',
                    pharmacy: 'Brighton Care Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Fatima Noor',
            email: 'fatima.noor@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 902-7711',
                address: '402 Willow St, Northvale',
                preferredDoctorId: allDoctors[9]._id.toString(),
                emergencyContact: { name: 'Samir Noor', phone: '+1 (555) 118-0034' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: true },
                medical: {
                    bloodType: 'A-',
                    allergies: 'Peanuts',
                    medications: 'Sertraline',
                    pharmacy: 'Northvale Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Daniel Wright',
            email: 'daniel.wright@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 332-8855',
                address: '907 Harbor Rd, Seaside',
                preferredDoctorId: allDoctors[10]._id.toString(),
                emergencyContact: { name: 'Amy Wright', phone: '+1 (555) 900-2241' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: true, twoFactor: false },
                medical: {
                    bloodType: 'AB-',
                    allergies: 'Latex',
                    medications: 'Amlodipine',
                    pharmacy: 'Seaside Health Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Priyanka Iyer',
            email: 'priyanka.iyer@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 558-7710',
                address: '55 Suncrest Ave, Meadowbrook',
                preferredDoctorId: allDoctors[11]._id.toString(),
                emergencyContact: { name: 'Rahul Iyer', phone: '+1 (555) 301-4422' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: false },
                medical: {
                    bloodType: 'O-',
                    allergies: 'Ibuprofen',
                    medications: 'Metoprolol',
                    pharmacy: 'Meadowbrook Pharmacy'
                }
            }
        }),
        ensureUser({
            name: 'Marco Silva',
            email: 'marco.silva@patient.gov',
            role: 'patient',
            password: DEFAULT_PASSWORD,
            profile: {
                phone: '+1 (555) 440-9902',
                address: '204 Lake Shore Dr, Riverview',
                preferredDoctorId: allDoctors[12]._id.toString(),
                emergencyContact: { name: 'Isabel Silva', phone: '+1 (555) 118-7744' },
                notifications: { email: true, sms: true, appt: true },
                privacy: { researchSharing: true, twoFactor: true },
                medical: {
                    bloodType: 'B-',
                    allergies: 'None reported',
                    medications: 'Fluticasone',
                    pharmacy: 'Riverview Pharmacy'
                }
            }
        })
    ]);

    const allPatients = [patientSeed, ...additionalPatients];

    const ensureAppointment = async ({ patient, doctor, date, time, status, mode, visitType, reason }) => {
        const existing = await appointments.findOne({
            patientId: patient._id.toString(),
            doctorId: doctor._id.toString(),
            date,
            time
        });
        if (existing) return;

        const now = new Date().toISOString();
        await appointments.insertOne({
            patientId: patient._id.toString(),
            doctorId: doctor._id.toString(),
            patientName: patient.name,
            doctorName: doctor.name,
            doctorSpecialty: doctor.profile?.specialty || 'General Medicine',
            date,
            time,
            status,
            mode,
            visitType,
            reason,
            createdAt: now,
            updatedAt: now
        });
    };

    await Promise.all([
        ensureAppointment({
            patient: patientSeed,
            doctor: doctorSeed,
            date: toDate(1),
            time: '10:00 AM',
            status: 'Confirmed',
            mode: 'In-Person',
            visitType: 'Follow-up',
            reason: 'Routine cardiac review'
        }),
        ensureAppointment({
            patient: patientSeed,
            doctor: doctorSeed,
            date: toDate(4),
            time: '02:30 PM',
            status: 'Pending',
            mode: 'Televisit',
            visitType: 'Lab Review',
            reason: 'Discuss lab findings'
        }),
        ensureAppointment({
            patient: additionalPatients[0],
            doctor: additionalDoctors[0],
            date: toDate(2),
            time: '09:00 AM',
            status: 'Confirmed',
            mode: 'Televisit',
            visitType: 'Consult',
            reason: 'Neurology consult for migraines'
        }),
        ensureAppointment({
            patient: additionalPatients[0],
            doctor: additionalDoctors[2],
            date: toDate(10),
            time: '01:15 PM',
            status: 'Pending',
            mode: 'In-Person',
            visitType: 'Skin Screening',
            reason: 'Annual skin check'
        }),
        ensureAppointment({
            patient: additionalPatients[1],
            doctor: additionalDoctors[1],
            date: toDate(6),
            time: '03:30 PM',
            status: 'Completed',
            mode: 'Televisit',
            visitType: 'Follow-up',
            reason: 'Pediatric follow-up visit'
        }),
        ensureAppointment({
            patient: additionalPatients[1],
            doctor: doctorSeed,
            date: toDate(12),
            time: '11:45 AM',
            status: 'Cancelled',
            mode: 'In-Person',
            visitType: 'Consult',
            reason: 'Cardiology intake'
        }),
        ensureAppointment({
            patient: additionalPatients[2],
            doctor: additionalDoctors[3],
            date: toDate(3),
            time: '08:20 AM',
            status: 'Confirmed',
            mode: 'In-Person',
            visitType: 'Physical Therapy',
            reason: 'Post-surgery assessment'
        }),
        ensureAppointment({
            patient: additionalPatients[2],
            doctor: additionalDoctors[0],
            date: toDate(9),
            time: '04:10 PM',
            status: 'Declined',
            mode: 'Televisit',
            visitType: 'Consult',
            reason: 'Specialist availability limited'
        }),
        ensureAppointment({
            patient: additionalPatients[3],
            doctor: additionalDoctors[3],
            date: toDate(7),
            time: '09:40 AM',
            status: 'Confirmed',
            mode: 'In-Person',
            visitType: 'Orthopedic Consult',
            reason: 'Knee pain and mobility concerns'
        }),
        ensureAppointment({
            patient: additionalPatients[3],
            doctor: additionalDoctors[4],
            date: toDate(-14),
            time: '01:20 PM',
            status: 'Completed',
            mode: 'Televisit',
            visitType: 'Follow-up',
            reason: 'Treatment check-in'
        }),
        ensureAppointment({
            patient: additionalPatients[4],
            doctor: additionalDoctors[5],
            date: toDate(5),
            time: '11:10 AM',
            status: 'Pending',
            mode: 'In-Person',
            visitType: 'Annual Physical',
            reason: 'Annual wellness exam'
        }),
        ensureAppointment({
            patient: additionalPatients[4],
            doctor: additionalDoctors[6],
            date: toDate(15),
            time: '03:15 PM',
            status: 'Confirmed',
            mode: 'Televisit',
            visitType: 'Diabetes Review',
            reason: 'Glucose monitoring review'
        }),
        ensureAppointment({
            patient: additionalPatients[5],
            doctor: additionalDoctors[6],
            date: toDate(2),
            time: '10:05 AM',
            status: 'Confirmed',
            mode: 'Televisit',
            visitType: 'Care Plan',
            reason: 'Thyroid management'
        }),
        ensureAppointment({
            patient: additionalPatients[5],
            doctor: additionalDoctors[0],
            date: toDate(-7),
            time: '04:45 PM',
            status: 'Cancelled',
            mode: 'In-Person',
            visitType: 'Consult',
            reason: 'Neurology consult rescheduled'
        }),
        ensureAppointment({
            patient: additionalPatients[6],
            doctor: additionalDoctors[7],
            date: toDate(8),
            time: '09:20 AM',
            status: 'Confirmed',
            mode: 'Televisit',
            visitType: 'Pulmonology Review',
            reason: 'Breathing assessment follow-up'
        }),
        ensureAppointment({
            patient: additionalPatients[6],
            doctor: doctorSeed,
            date: toDate(18),
            time: '02:10 PM',
            status: 'Pending',
            mode: 'In-Person',
            visitType: 'Consult',
            reason: 'Cardiac clearance for travel'
        }),
        ensureAppointment({
            patient: additionalPatients[7],
            doctor: additionalDoctors[8],
            date: toDate(6),
            time: '11:30 AM',
            status: 'Confirmed',
            mode: 'In-Person',
            visitType: 'GI Consult',
            reason: 'Digestive health evaluation'
        }),
        ensureAppointment({
            patient: additionalPatients[8],
            doctor: additionalDoctors[9],
            date: toDate(9),
            time: '03:40 PM',
            status: 'Pending',
            mode: 'Televisit',
            visitType: 'Women Wellness',
            reason: 'Annual wellness planning'
        }),
        ensureAppointment({
            patient: additionalPatients[9],
            doctor: additionalDoctors[10],
            date: toDate(4),
            time: '10:15 AM',
            status: 'Confirmed',
            mode: 'In-Person',
            visitType: 'Nephrology Review',
            reason: 'Kidney function follow-up'
        }),
        ensureAppointment({
            patient: additionalPatients[10],
            doctor: additionalDoctors[11],
            date: toDate(12),
            time: '01:05 PM',
            status: 'Pending',
            mode: 'Televisit',
            visitType: 'Mental Health',
            reason: 'Stress management consult'
        }),
        ensureAppointment({
            patient: additionalPatients[11],
            doctor: additionalDoctors[8],
            date: toDate(14),
            time: '08:50 AM',
            status: 'Confirmed',
            mode: 'Televisit',
            visitType: 'Follow-up',
            reason: 'GI medication review'
        })
    ]);

    const appointmentStatusCycle = ['Confirmed', 'Pending', 'Completed', 'Declined'];
    const appointmentModeCycle = ['In-Person', 'Televisit'];
    const appointmentVisitCycle = ['Consult', 'Follow-up', 'Review', 'Care Plan', 'Screening', 'New Patient'];
    const appointmentReasons = [
        'Care plan review and medication adjustments',
        'Post-discharge check-in and vitals review',
        'Preventive health screening consultation',
        'Specialist intake and symptom review',
        'Therapy progress update and planning',
        'Diagnostic follow-up and next steps'
    ];
    const appointmentTimes = ['08:30 AM', '09:45 AM', '11:20 AM', '01:05 PM', '02:40 PM', '04:15 PM'];

    const expandedAppointments = allDoctors.flatMap((doctor, index) => {
        const firstPatient = allPatients[index % allPatients.length];
        const secondPatient = allPatients[(index + 4) % allPatients.length];
        return [
            ensureAppointment({
                patient: firstPatient,
                doctor,
                date: toDate(20 + index),
                time: appointmentTimes[index % appointmentTimes.length],
                status: appointmentStatusCycle[index % appointmentStatusCycle.length],
                mode: appointmentModeCycle[index % appointmentModeCycle.length],
                visitType: appointmentVisitCycle[index % appointmentVisitCycle.length],
                reason: appointmentReasons[index % appointmentReasons.length]
            }),
            ensureAppointment({
                patient: secondPatient,
                doctor,
                date: toDate(32 + index),
                time: appointmentTimes[(index + 3) % appointmentTimes.length],
                status: appointmentStatusCycle[(index + 1) % appointmentStatusCycle.length],
                mode: appointmentModeCycle[(index + 1) % appointmentModeCycle.length],
                visitType: appointmentVisitCycle[(index + 2) % appointmentVisitCycle.length],
                reason: appointmentReasons[(index + 2) % appointmentReasons.length]
            })
        ];
    });

    await Promise.all(expandedAppointments);

    const labReportSeed = [
        {
            reportId: 'LAB-1001',
            patientId: patientSeed._id.toString(),
            patientName: patientSeed.name,
            testName: 'Complete Blood Count',
            collectedDate: toDate(-7),
            status: 'Ready',
            provider: 'Central Lab',
            summary: 'All parameters within expected range.',
            orderedBy: doctorSeed.name
        },
        {
            reportId: 'LAB-1002',
            patientId: patientSeed._id.toString(),
            patientName: patientSeed.name,
            testName: 'Lipid Profile',
            collectedDate: toDate(-30),
            status: 'Ready',
            provider: 'Cardiology Lab',
            summary: 'LDL slightly elevated. Dietary counseling advised.',
            orderedBy: doctorSeed.name
        },
        {
            reportId: 'LAB-1003',
            patientId: additionalPatients[0]._id.toString(),
            patientName: additionalPatients[0].name,
            testName: 'Thyroid Panel',
            collectedDate: toDate(-4),
            status: 'Ready',
            provider: 'Endocrine Lab',
            summary: 'TSH within range.',
            orderedBy: additionalDoctors[6].name
        },
        {
            reportId: 'LAB-1004',
            patientId: additionalPatients[1]._id.toString(),
            patientName: additionalPatients[1].name,
            testName: 'HbA1c',
            collectedDate: toDate(-20),
            status: 'Ready',
            provider: 'Diabetes Care Lab',
            summary: 'HbA1c 7.1%. Continue current plan.',
            orderedBy: additionalDoctors[6].name
        },
        {
            reportId: 'LAB-1005',
            patientId: additionalPatients[2]._id.toString(),
            patientName: additionalPatients[2].name,
            testName: 'MRI Knee',
            collectedDate: toDate(-2),
            status: 'In Review',
            provider: 'Radiology Center',
            summary: 'Radiologist review in progress.',
            orderedBy: additionalDoctors[3].name
        },
        {
            reportId: 'LAB-1006',
            patientId: additionalPatients[3]._id.toString(),
            patientName: additionalPatients[3].name,
            testName: 'Oncology Panel',
            collectedDate: toDate(-12),
            status: 'Ready',
            provider: 'Oncology Lab',
            summary: 'Markers stable compared to prior visit.',
            orderedBy: additionalDoctors[4].name
        },
        {
            reportId: 'LAB-1007',
            patientId: additionalPatients[4]._id.toString(),
            patientName: additionalPatients[4].name,
            testName: 'Comprehensive Metabolic Panel',
            collectedDate: toDate(-5),
            status: 'Ready',
            provider: 'Primary Care Lab',
            summary: 'Electrolytes within range.',
            orderedBy: additionalDoctors[5].name
        },
        {
            reportId: 'LAB-1008',
            patientId: additionalPatients[5]._id.toString(),
            patientName: additionalPatients[5].name,
            testName: 'Endocrine Review Panel',
            collectedDate: toDate(-3),
            status: 'Ready',
            provider: 'Endocrinology Lab',
            summary: 'Requires follow-up consult.',
            orderedBy: additionalDoctors[6].name
        },
        {
            reportId: 'LAB-1009',
            patientId: additionalPatients[6]._id.toString(),
            patientName: additionalPatients[6].name,
            testName: 'Pulmonary Function Test',
            collectedDate: toDate(-1),
            status: 'Ready',
            provider: 'Respiratory Lab',
            summary: 'Mild obstruction noted.',
            orderedBy: additionalDoctors[7].name
        },
        {
            reportId: 'LAB-1010',
            patientId: additionalPatients[7]._id.toString(),
            patientName: additionalPatients[7].name,
            testName: 'Liver Function Panel',
            collectedDate: toDate(-6),
            status: 'Ready',
            provider: 'GI Lab',
            summary: 'ALT slightly elevated. Monitor diet.',
            orderedBy: additionalDoctors[8].name
        },
        {
            reportId: 'LAB-1011',
            patientId: additionalPatients[8]._id.toString(),
            patientName: additionalPatients[8].name,
            testName: 'Hormone Panel',
            collectedDate: toDate(-8),
            status: 'Ready',
            provider: 'Women Health Lab',
            summary: 'Hormone levels within range.',
            orderedBy: additionalDoctors[9].name
        },
        {
            reportId: 'LAB-1012',
            patientId: additionalPatients[9]._id.toString(),
            patientName: additionalPatients[9].name,
            testName: 'Kidney Function Panel',
            collectedDate: toDate(-3),
            status: 'Ready',
            provider: 'Renal Lab',
            summary: 'Creatinine stable.',
            orderedBy: additionalDoctors[10].name
        },
        {
            reportId: 'LAB-1013',
            patientId: additionalPatients[10]._id.toString(),
            patientName: additionalPatients[10].name,
            testName: 'Sleep Quality Assessment',
            collectedDate: toDate(-10),
            status: 'Ready',
            provider: 'Behavioral Health Lab',
            summary: 'Sleep efficiency improved.',
            orderedBy: additionalDoctors[11].name
        },
        {
            reportId: 'LAB-1014',
            patientId: additionalPatients[11]._id.toString(),
            patientName: additionalPatients[11].name,
            testName: 'Gastrointestinal Panel',
            collectedDate: toDate(-5),
            status: 'Ready',
            provider: 'GI Lab',
            summary: 'No abnormalities detected.',
            orderedBy: additionalDoctors[8].name
        }
    ];

    await Promise.all(labReportSeed.map(item => ensureDoc(labReports, { reportId: item.reportId }, item)));

    const pharmacyOrderSeed = [
        {
            orderId: 'RX-2001',
            patientId: patientSeed._id.toString(),
            patientName: patientSeed.name,
            medication: 'Atorvastatin 20mg',
            quantity: '30 tablets',
            refills: 2,
            status: 'Ready for pickup',
            pharmacy: 'Cityville Pharmacy',
            orderedDate: toDate(-2)
        },
        {
            orderId: 'RX-2002',
            patientId: additionalPatients[0]._id.toString(),
            patientName: additionalPatients[0].name,
            medication: 'Levothyroxine 75mcg',
            quantity: '30 tablets',
            refills: 1,
            status: 'Shipped',
            pharmacy: 'Springfield Care Pharmacy',
            orderedDate: toDate(-1)
        },
        {
            orderId: 'RX-2003',
            patientId: additionalPatients[1]._id.toString(),
            patientName: additionalPatients[1].name,
            medication: 'Metformin 500mg',
            quantity: '60 tablets',
            refills: 3,
            status: 'Pending approval',
            pharmacy: 'Riverton Community Pharmacy',
            orderedDate: toDate(0)
        },
        {
            orderId: 'RX-2004',
            patientId: additionalPatients[2]._id.toString(),
            patientName: additionalPatients[2].name,
            medication: 'Albuterol Inhaler',
            quantity: '1 inhaler',
            refills: 0,
            status: 'Ready for pickup',
            pharmacy: 'Brookfield Health Pharmacy',
            orderedDate: toDate(-6)
        },
        {
            orderId: 'RX-2005',
            patientId: additionalPatients[3]._id.toString(),
            patientName: additionalPatients[3].name,
            medication: 'Lisinopril 10mg',
            quantity: '30 tablets',
            refills: 2,
            status: 'Shipped',
            pharmacy: 'Ashland Community Pharmacy',
            orderedDate: toDate(-4)
        },
        {
            orderId: 'RX-2006',
            patientId: additionalPatients[6]._id.toString(),
            patientName: additionalPatients[6].name,
            medication: 'Montelukast 10mg',
            quantity: '30 tablets',
            refills: 1,
            status: 'Ready for pickup',
            pharmacy: 'Laketown Pharmacy',
            orderedDate: toDate(-1)
        },
        {
            orderId: 'RX-2007',
            patientId: additionalPatients[7]._id.toString(),
            patientName: additionalPatients[7].name,
            medication: 'Omeprazole 20mg',
            quantity: '30 capsules',
            refills: 2,
            status: 'Shipped',
            pharmacy: 'Brighton Care Pharmacy',
            orderedDate: toDate(-2)
        },
        {
            orderId: 'RX-2008',
            patientId: additionalPatients[8]._id.toString(),
            patientName: additionalPatients[8].name,
            medication: 'Sertraline 50mg',
            quantity: '30 tablets',
            refills: 1,
            status: 'Pending approval',
            pharmacy: 'Northvale Pharmacy',
            orderedDate: toDate(1)
        },
        {
            orderId: 'RX-2009',
            patientId: additionalPatients[9]._id.toString(),
            patientName: additionalPatients[9].name,
            medication: 'Amlodipine 5mg',
            quantity: '30 tablets',
            refills: 3,
            status: 'Ready for pickup',
            pharmacy: 'Seaside Health Pharmacy',
            orderedDate: toDate(-3)
        },
        {
            orderId: 'RX-2010',
            patientId: additionalPatients[10]._id.toString(),
            patientName: additionalPatients[10].name,
            medication: 'Metoprolol 25mg',
            quantity: '60 tablets',
            refills: 2,
            status: 'Shipped',
            pharmacy: 'Meadowbrook Pharmacy',
            orderedDate: toDate(-6)
        },
        {
            orderId: 'RX-2011',
            patientId: additionalPatients[11]._id.toString(),
            patientName: additionalPatients[11].name,
            medication: 'Fluticasone Inhaler',
            quantity: '1 inhaler',
            refills: 1,
            status: 'Ready for pickup',
            pharmacy: 'Riverview Pharmacy',
            orderedDate: toDate(-2)
        }
    ];

    await Promise.all(pharmacyOrderSeed.map(item => ensureDoc(pharmacyOrders, { orderId: item.orderId }, item)));

    const diagnosticTestSeed = [
        {
            testId: 'DX-1001',
            name: 'Complete Blood Count',
            category: 'Lab Test',
            homeCollection: true,
            turnaround: '24 hrs',
            price: 600
        },
        {
            testId: 'DX-1002',
            name: 'Thyroid Profile (T3/T4/TSH)',
            category: 'Lab Test',
            homeCollection: true,
            turnaround: '24-48 hrs',
            price: 900
        },
        {
            testId: 'DX-1003',
            name: 'Lipid Profile',
            category: 'Lab Test',
            homeCollection: true,
            turnaround: '24 hrs',
            price: 800
        },
        {
            testId: 'DX-1004',
            name: 'MRI Knee',
            category: 'Radiology',
            homeCollection: false,
            turnaround: '48 hrs',
            price: 4200
        },
        {
            testId: 'DX-1005',
            name: 'Vitamin D & B12 Panel',
            category: 'Lab Test',
            homeCollection: true,
            turnaround: '24 hrs',
            price: 950
        },
        {
            testId: 'DX-1006',
            name: 'Pulmonary Function Test',
            category: 'Pulmonology',
            homeCollection: false,
            turnaround: '48 hrs',
            price: 1600
        },
        {
            testId: 'DX-1007',
            name: 'Ultrasound Abdomen',
            category: 'Radiology',
            homeCollection: false,
            turnaround: '24-48 hrs',
            price: 1800
        },
        {
            testId: 'DX-1008',
            name: 'Mental Wellness Screening',
            category: 'Behavioral Health',
            homeCollection: true,
            turnaround: '24 hrs',
            price: 700
        }
    ];

    await Promise.all(diagnosticTestSeed.map(item => ensureDoc(diagnosticTests, { testId: item.testId }, item)));

    const healthPackageSeed = [
        {
            packageId: 'PKG-3001',
            name: 'Executive Health Check',
            includes: 'Blood work, cardiac screening, physician consult',
            price: 4500,
            duration: '1 day'
        },
        {
            packageId: 'PKG-3002',
            name: 'Women Wellness Package',
            includes: 'Hormone panel, nutrition consult, preventive screening',
            price: 5200,
            duration: '1 day'
        },
        {
            packageId: 'PKG-3003',
            name: 'Diabetes Care Bundle',
            includes: 'HbA1c, kidney function, dietician consult',
            price: 3200,
            duration: '2 days'
        },
        {
            packageId: 'PKG-3004',
            name: 'Senior Citizen Screening',
            includes: 'Full body check, bone health, vision screening',
            price: 6100,
            duration: '2 days'
        },
        {
            packageId: 'PKG-3005',
            name: 'Respiratory Wellness Package',
            includes: 'Pulmonary function test, chest X-ray, pulmonology consult',
            price: 3800,
            duration: '1 day'
        },
        {
            packageId: 'PKG-3006',
            name: 'Gut Health Package',
            includes: 'Liver function, ultrasound abdomen, GI consult',
            price: 4200,
            duration: '1 day'
        },
        {
            packageId: 'PKG-3007',
            name: 'Mental Wellness Package',
            includes: 'Psychiatric screening, counseling session, stress profile',
            price: 3500,
            duration: '1 day'
        },
        {
            packageId: 'PKG-3008',
            name: 'Women Comprehensive Care',
            includes: 'Hormone panel, gyne consult, preventive screening',
            price: 5400,
            duration: '1 day'
        }
    ];

    await Promise.all(healthPackageSeed.map(item => ensureDoc(healthPackages, { packageId: item.packageId }, item)));

    const bloodBankSeed = [
        { bloodType: 'A+', units: 14, status: 'Available', updatedAt: new Date().toISOString() },
        { bloodType: 'A-', units: 6, status: 'Low', updatedAt: new Date().toISOString() },
        { bloodType: 'B+', units: 10, status: 'Available', updatedAt: new Date().toISOString() },
        { bloodType: 'B-', units: 4, status: 'Low', updatedAt: new Date().toISOString() },
        { bloodType: 'AB+', units: 5, status: 'Low', updatedAt: new Date().toISOString() },
        { bloodType: 'AB-', units: 2, status: 'Critical', updatedAt: new Date().toISOString() },
        { bloodType: 'O+', units: 18, status: 'Available', updatedAt: new Date().toISOString() },
        { bloodType: 'O-', units: 3, status: 'Critical', updatedAt: new Date().toISOString() }
    ];

    await Promise.all(bloodBankSeed.map(item => ensureDoc(bloodBank, { bloodType: item.bloodType }, item)));

    const claimSeed = [
        {
            claimId: 'CLM-4001',
            patientId: patientSeed._id.toString(),
            patientName: patientSeed.name,
            description: 'Cardiology follow-up visit',
            amount: 1800,
            status: 'Approved',
            dueDate: toDate(5),
            insurer: 'Gov Health Plan'
        },
        {
            claimId: 'CLM-4002',
            patientId: additionalPatients[0]._id.toString(),
            patientName: additionalPatients[0].name,
            description: 'Neurology teleconsult',
            amount: 1200,
            status: 'Pending',
            dueDate: toDate(7),
            insurer: 'Employee Health Scheme'
        },
        {
            claimId: 'CLM-4003',
            patientId: additionalPatients[4]._id.toString(),
            patientName: additionalPatients[4].name,
            description: 'Annual wellness exam',
            amount: 2400,
            status: 'Payment Due',
            dueDate: toDate(3),
            insurer: 'CityCare Insurance'
        },
        {
            claimId: 'CLM-4004',
            patientId: additionalPatients[6]._id.toString(),
            patientName: additionalPatients[6].name,
            description: 'Pulmonology teleconsult',
            amount: 1100,
            status: 'Approved',
            dueDate: toDate(4),
            insurer: 'Gov Health Plan'
        },
        {
            claimId: 'CLM-4005',
            patientId: additionalPatients[7]._id.toString(),
            patientName: additionalPatients[7].name,
            description: 'GI in-person consult',
            amount: 1600,
            status: 'Pending',
            dueDate: toDate(6),
            insurer: 'Employee Health Scheme'
        },
        {
            claimId: 'CLM-4006',
            patientId: additionalPatients[9]._id.toString(),
            patientName: additionalPatients[9].name,
            description: 'Nephrology review',
            amount: 1900,
            status: 'Approved',
            dueDate: toDate(2),
            insurer: 'CityCare Insurance'
        },
        {
            claimId: 'CLM-4007',
            patientId: additionalPatients[11]._id.toString(),
            patientName: additionalPatients[11].name,
            description: 'GI follow-up',
            amount: 1300,
            status: 'Payment Due',
            dueDate: toDate(5),
            insurer: 'Metro Health Cover'
        }
    ];

    await Promise.all(claimSeed.map(item => ensureDoc(claims, { claimId: item.claimId }, item)));

    const trialSeed = [
        {
            trialId: 'CTRI-2025-05-010321',
            title: 'Hypertension Telemonitoring Program',
            phase: 'Phase III',
            status: 'Recruiting',
            location: 'MedConnect Research Hub',
            sponsor: 'ICMR Network'
        },
        {
            trialId: 'CTRI-2025-11-014982',
            title: 'Diabetes Lifestyle Intervention Study',
            phase: 'Phase II',
            status: 'Recruiting',
            location: 'Central Hospital Campus',
            sponsor: 'State Health Research Board'
        },
        {
            trialId: 'CTRI-2024-08-009554',
            title: 'Post-surgery Rehabilitation Pathway',
            phase: 'Phase IV',
            status: 'Active, not recruiting',
            location: 'Metro Hospital Campus',
            sponsor: 'Orthopedic Council'
        },
        {
            trialId: 'CTRI-2026-02-021774',
            title: 'Chronic Respiratory Care Pathway',
            phase: 'Phase III',
            status: 'Recruiting',
            location: 'Metro Hospital Campus',
            sponsor: 'Pulmonary Research Consortium'
        },
        {
            trialId: 'CTRI-2025-09-017204',
            title: 'Women Wellness Preventive Screening Study',
            phase: 'Phase II',
            status: 'Recruiting',
            location: 'Central Hospital Campus',
            sponsor: 'Women Health Council'
        }
    ];

    await Promise.all(trialSeed.map(item => ensureDoc(researchTrials, { trialId: item.trialId }, item)));

    const guidelineSeed = [
        {
            guidelineId: 'ICMR-G-2019-AMR',
            title: 'Treatment Guidelines for Antimicrobial Use in Common Syndromes',
            year: 2019,
            category: 'Clinical Practice'
        },
        {
            guidelineId: 'ICMR-G-2015-RICK',
            title: 'ICMR Guidelines on diagnosis and management of Rickettsial diseases in India',
            year: 2015,
            category: 'Clinical Practice'
        },
        {
            guidelineId: 'ICMR-G-2020-COVID',
            title: 'ICMR Guidance on COVID-19 Testing Strategy',
            year: 2020,
            category: 'Diagnostics'
        },
        {
            guidelineId: 'ICMR-G-2017-MCH',
            title: 'Maternal and Child Health Research Priorities',
            year: 2017,
            category: 'Public Health'
        }
    ];

    await Promise.all(guidelineSeed.map(item => ensureDoc(guidelines, { guidelineId: item.guidelineId }, item)));
}

async function getAuthContext(req, database) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-auth-token'];
    if (!token) return { user: null, session: null };

    const session = await database.collection('sessions').findOne({ token });
    if (!session) return { user: null, session: null };

    const now = new Date();
    if (new Date(session.expiresAt) < now) {
        await database.collection('sessions').deleteOne({ token });
        return { user: null, session: null };
    }

    const user = await database.collection('users').findOne({ _id: new ObjectId(session.userId) });
    if (!user) return { user: null, session: null };

    return { user, session };
}

async function logAudit(database, userId, action, details, req) {
    await database.collection('audit').insertOne({
        userId,
        action,
        details,
        ip: req.socket.remoteAddress || 'unknown',
        timestamp: new Date().toISOString()
    });
}

async function handleApi(req, res, database) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;

    if (pathname === '/api/health' && req.method === 'GET') {
        return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/register' && req.method === 'POST') {
        const body = await readJson(req);
        const name = String(body.name || '').trim();
        const email = String(body.email || '').trim();
        const password = String(body.password || '').trim();
        const role = String(body.role || '').trim();

        if (!name || !email || !password || !role) {
            return sendJson(res, 400, { message: 'All fields are required.' });
        }
        if (!['doctor', 'patient'].includes(role)) {
            return sendJson(res, 400, { message: 'Invalid role.' });
        }

        const emailLower = email.toLowerCase();
        const existing = await database.collection('users').findOne({ emailLower });
        if (existing) {
            return sendJson(res, 409, { message: 'An account with this email already exists.' });
        }

        const { salt, hash } = hashPassword(password);
        const profile = role === 'doctor'
            ? {
                phone: '',
                address: '',
                specialty: body.specialty || 'General Medicine',
                clinic: body.clinic || 'Main Campus',
                accepting: true,
                televisit: true,
                rating: 4.7,
                availability: [],
                notifications: { email: true, sms: false, appt: true },
                privacy: { publicProfile: true, twoFactor: false }
            }
            : {
                phone: '',
                address: '',
                preferredDoctorId: '',
                emergencyContact: { name: '', phone: '' },
                notifications: { email: true, sms: false, appt: true },
                privacy: { researchSharing: false, twoFactor: false }
            };

        const userDoc = {
            name,
            email,
            emailLower,
            role,
            passwordHash: hash,
            passwordSalt: salt,
            createdAt: new Date().toISOString(),
            profile
        };

        const result = await database.collection('users').insertOne(userDoc);
        await logAudit(database, result.insertedId.toString(), 'register', { role }, req);
        return sendJson(res, 201, { user: sanitizeUser({ ...userDoc, _id: result.insertedId }) });
    }

    if (pathname === '/api/login' && req.method === 'POST') {
        const body = await readJson(req);
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '').trim();
        const role = String(body.role || '').trim();

        if (!email || !password || !role) {
            return sendJson(res, 400, { message: 'Email, password, and role are required.' });
        }

        const user = await database.collection('users').findOne({ emailLower: email });
        if (!user || user.role !== role) {
            return sendJson(res, 401, { message: 'Invalid credentials.' });
        }
        if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
            return sendJson(res, 401, { message: 'Invalid credentials.' });
        }

        const session = createSession(user._id.toString());
        await database.collection('sessions').insertOne(session);
        await logAudit(database, user._id.toString(), 'login', { role }, req);
        return sendJson(res, 200, { token: session.token, user: sanitizeUser(user) });
    }

    if (pathname === '/api/logout' && req.method === 'POST') {
        const auth = await getAuthContext(req, database);
        if (!auth.session) {
            return sendJson(res, 200, { ok: true });
        }
        await database.collection('sessions').deleteOne({ token: auth.session.token });
        await logAudit(database, auth.user._id.toString(), 'logout', {}, req);
        return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/me' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        return sendJson(res, 200, { user: sanitizeUser(auth.user) });
    }

    if (pathname === '/api/me' && req.method === 'PATCH') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });

        const body = await readJson(req);
        const updates = {};
        if (body.name) updates.name = String(body.name).trim();
        if (body.phone !== undefined) updates['profile.phone'] = String(body.phone).trim();
        if (body.address !== undefined) updates['profile.address'] = String(body.address).trim();

        if (auth.user.role === 'doctor') {
            if (body.specialty !== undefined) updates['profile.specialty'] = String(body.specialty).trim();
            if (body.clinic !== undefined) updates['profile.clinic'] = String(body.clinic).trim();
            if (Array.isArray(body.availability)) updates['profile.availability'] = body.availability;
            if (body.accepting !== undefined) updates['profile.accepting'] = !!body.accepting;
            if (body.televisit !== undefined) updates['profile.televisit'] = !!body.televisit;
        } else {
            if (body.preferredDoctorId !== undefined) updates['profile.preferredDoctorId'] = String(body.preferredDoctorId);
            if (body.emergencyContact) {
                updates['profile.emergencyContact'] = {
                    name: String(body.emergencyContact.name || '').trim(),
                    phone: String(body.emergencyContact.phone || '').trim()
                };
            }
            if (body.medical) {
                updates['profile.medical'] = {
                    bloodType: String(body.medical.bloodType || '').trim(),
                    allergies: String(body.medical.allergies || '').trim(),
                    medications: String(body.medical.medications || '').trim(),
                    pharmacy: String(body.medical.pharmacy || '').trim()
                };
            }
        }

        if (body.notifications) {
            updates['profile.notifications'] = {
                email: !!body.notifications.email,
                sms: !!body.notifications.sms,
                appt: !!body.notifications.appt
            };
        }
        if (body.privacy) {
            updates['profile.privacy'] = {
                ...auth.user.profile?.privacy,
                ...body.privacy
            };
        }

        if (Object.keys(updates).length === 0) {
            return sendJson(res, 400, { message: 'No updates provided.' });
        }

        await database.collection('users').updateOne(
            { _id: auth.user._id },
            { $set: updates }
        );
        const updatedUser = await database.collection('users').findOne({ _id: auth.user._id });
        await logAudit(database, auth.user._id.toString(), 'profile_update', { fields: Object.keys(updates) }, req);
        return sendJson(res, 200, { user: sanitizeUser(updatedUser) });
    }

    if (pathname === '/api/doctors' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });

        const doctors = await database.collection('users').find({ role: 'doctor' }).toArray();
        const list = doctors.map(doc => ({
            id: doc._id.toString(),
            name: doc.name,
            specialty: doc.profile?.specialty || 'General Medicine',
            clinic: doc.profile?.clinic || 'Main Campus',
            rating: doc.profile?.rating || 4.6,
            accepting: doc.profile?.accepting !== false,
            televisit: doc.profile?.televisit !== false
        }));
        return sendJson(res, 200, { doctors: list });
    }

    if (pathname === '/api/appointments' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });

        const status = url.searchParams.get('status');
        const mode = url.searchParams.get('mode');
        const q = url.searchParams.get('q');

        const query = auth.user.role === 'doctor'
            ? { doctorId: auth.user._id.toString() }
            : { patientId: auth.user._id.toString() };

        if (status && status !== 'all') query.status = status;
        if (mode && mode !== 'all') query.mode = mode;
        if (q) {
            const regex = new RegExp(q, 'i');
            query.$or = [
                { patientName: regex },
                { doctorName: regex },
                { reason: regex },
                { visitType: regex }
            ];
        }

        const appointments = await database.collection('appointments')
            .find(query)
            .sort({ date: 1 })
            .toArray();

        const mapped = appointments.map(a => ({
            id: a._id.toString(),
            doctorId: a.doctorId,
            patientId: a.patientId,
            patientName: a.patientName,
            doctorName: a.doctorName,
            doctorSpecialty: a.doctorSpecialty,
            date: a.date,
            time: a.time,
            status: a.status,
            mode: a.mode,
            visitType: a.visitType,
            reason: a.reason
        }));

        return sendJson(res, 200, { appointments: mapped });
    }

    if (pathname === '/api/appointments' && req.method === 'POST') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        if (auth.user.role !== 'patient') {
            return sendJson(res, 403, { message: 'Only patients can book appointments.' });
        }

        const body = await readJson(req);
        const doctorId = String(body.doctorId || '').trim();
        const date = String(body.date || '').trim();
        const time = String(body.time || '').trim();
        const visitType = String(body.visitType || '').trim();
        const mode = String(body.mode || '').trim();
        const reason = String(body.reason || '').trim();

        if (!doctorId || !date || !time || !visitType || !mode) {
            return sendJson(res, 400, { message: 'Missing required appointment details.' });
        }

        const doctor = await database.collection('users').findOne({ _id: new ObjectId(doctorId), role: 'doctor' });
        if (!doctor) {
            return sendJson(res, 404, { message: 'Doctor not found.' });
        }

        const now = new Date().toISOString();
        const appointment = {
            patientId: auth.user._id.toString(),
            doctorId,
            patientName: auth.user.name,
            doctorName: doctor.name,
            doctorSpecialty: doctor.profile?.specialty || 'General Medicine',
            date,
            time,
            status: 'Pending',
            mode,
            visitType,
            reason,
            createdAt: now,
            updatedAt: now
        };

        const result = await database.collection('appointments').insertOne(appointment);
        await logAudit(database, auth.user._id.toString(), 'appointment_create', { appointmentId: result.insertedId.toString() }, req);
        return sendJson(res, 201, { id: result.insertedId.toString() });
    }

    if (pathname.startsWith('/api/appointments/') && req.method === 'PATCH') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });

        const appointmentId = pathname.split('/').pop();
        if (!appointmentId) return sendJson(res, 400, { message: 'Invalid appointment.' });

        const appointment = await database.collection('appointments').findOne({ _id: new ObjectId(appointmentId) });
        if (!appointment) return sendJson(res, 404, { message: 'Appointment not found.' });

        const body = await readJson(req);
        const updates = { updatedAt: new Date().toISOString() };

        if (auth.user.role === 'doctor' && appointment.doctorId === auth.user._id.toString()) {
            if (body.status && ['Confirmed', 'Declined', 'Completed'].includes(body.status)) {
                updates.status = body.status;
            }
        }

        if (auth.user.role === 'patient' && appointment.patientId === auth.user._id.toString()) {
            if (body.status && ['Cancelled', 'Pending'].includes(body.status)) {
                updates.status = body.status;
            }
            if (body.date) updates.date = String(body.date).trim();
            if (body.time) updates.time = String(body.time).trim();
            if (body.visitType) updates.visitType = String(body.visitType).trim();
            if (body.mode) updates.mode = String(body.mode).trim();
            if (body.reason !== undefined) updates.reason = String(body.reason).trim();
        }

        if (Object.keys(updates).length === 1) {
            return sendJson(res, 400, { message: 'No updates provided.' });
        }

        await database.collection('appointments').updateOne(
            { _id: appointment._id },
            { $set: updates }
        );
        await logAudit(database, auth.user._id.toString(), 'appointment_update', { appointmentId, updates }, req);
        return sendJson(res, 200, { ok: true });
    }

    if (pathname === '/api/audit' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });

        const logs = await database.collection('audit')
            .find({ userId: auth.user._id.toString() })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        return sendJson(res, 200, { logs });
    }

    if (pathname === '/api/lab-reports' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const query = auth.user.role === 'patient' ? { patientId: auth.user._id.toString() } : {};
        const reports = await database.collection('labReports')
            .find(query)
            .sort({ collectedDate: -1 })
            .toArray();
        const mapped = reports.map(r => ({
            id: r._id.toString(),
            reportId: r.reportId,
            patientId: r.patientId,
            patientName: r.patientName,
            testName: r.testName,
            collectedDate: r.collectedDate,
            status: r.status,
            provider: r.provider,
            summary: r.summary,
            orderedBy: r.orderedBy
        }));
        return sendJson(res, 200, { reports: mapped });
    }

    if (pathname === '/api/pharmacy-orders' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const query = auth.user.role === 'patient' ? { patientId: auth.user._id.toString() } : {};
        const orders = await database.collection('pharmacyOrders')
            .find(query)
            .sort({ orderedDate: -1 })
            .toArray();
        const mapped = orders.map(o => ({
            id: o._id.toString(),
            orderId: o.orderId,
            patientId: o.patientId,
            patientName: o.patientName,
            medication: o.medication,
            quantity: o.quantity,
            refills: o.refills,
            status: o.status,
            pharmacy: o.pharmacy,
            orderedDate: o.orderedDate
        }));
        return sendJson(res, 200, { orders: mapped });
    }

    if (pathname === '/api/diagnostic-tests' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const tests = await database.collection('diagnosticTests').find({}).toArray();
        const mapped = tests.map(t => ({
            id: t._id.toString(),
            testId: t.testId,
            name: t.name,
            category: t.category,
            homeCollection: t.homeCollection,
            turnaround: t.turnaround,
            price: t.price
        }));
        return sendJson(res, 200, { tests: mapped });
    }

    if (pathname === '/api/health-packages' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const packages = await database.collection('healthPackages').find({}).toArray();
        const mapped = packages.map(p => ({
            id: p._id.toString(),
            packageId: p.packageId,
            name: p.name,
            includes: p.includes,
            price: p.price,
            duration: p.duration
        }));
        return sendJson(res, 200, { packages: mapped });
    }

    if (pathname === '/api/blood-bank' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const inventory = await database.collection('bloodBank').find({}).sort({ bloodType: 1 }).toArray();
        const mapped = inventory.map(b => ({
            id: b._id.toString(),
            bloodType: b.bloodType,
            units: b.units,
            status: b.status,
            updatedAt: b.updatedAt
        }));
        return sendJson(res, 200, { inventory: mapped });
    }

    if (pathname === '/api/claims' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const query = auth.user.role === 'patient' ? { patientId: auth.user._id.toString() } : {};
        const claimItems = await database.collection('claims')
            .find(query)
            .sort({ dueDate: 1 })
            .toArray();
        const mapped = claimItems.map(c => ({
            id: c._id.toString(),
            claimId: c.claimId,
            patientId: c.patientId,
            patientName: c.patientName,
            description: c.description,
            amount: c.amount,
            status: c.status,
            dueDate: c.dueDate,
            insurer: c.insurer
        }));
        return sendJson(res, 200, { claims: mapped });
    }

    if (pathname === '/api/research/trials' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const trials = await database.collection('researchTrials').find({}).toArray();
        const mapped = trials.map(t => ({
            id: t._id.toString(),
            trialId: t.trialId,
            title: t.title,
            phase: t.phase,
            status: t.status,
            location: t.location,
            sponsor: t.sponsor
        }));
        return sendJson(res, 200, { trials: mapped });
    }

    if (pathname === '/api/research/guidelines' && req.method === 'GET') {
        const auth = await getAuthContext(req, database);
        if (!auth.user) return sendJson(res, 401, { message: 'Unauthorized.' });
        const docs = await database.collection('guidelines').find({}).toArray();
        const mapped = docs.map(g => ({
            id: g._id.toString(),
            guidelineId: g.guidelineId,
            title: g.title,
            year: g.year,
            category: g.category
        }));
        return sendJson(res, 200, { guidelines: mapped });
    }

    return sendJson(res, 404, { message: 'Not found.' });
}

function serveStatic(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';

    const safePath = path.normalize(path.join(DIST_DIR, pathname));
    if (!safePath.startsWith(DIST_DIR)) {
        return sendText(res, 403, 'Forbidden');
    }

    const serveFile = filePath => {
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Server error');
                return;
            }

            const extname = String(path.extname(filePath)).toLowerCase();
            const contentType = MIME_TYPES[extname] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    };

    if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
        return serveFile(safePath);
    }

    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
        return serveFile(indexPath);
    }

    return sendText(res, 404, 'Build not found. Run npm run build to generate the production bundle.');
}

async function start() {
    try {
        const database = await connectDb();
        await ensureIndexes(database);
        await seedDatabase(database);

        const server = http.createServer(async (req, res) => {
            try {
                if (req.url.startsWith('/api/')) {
                    await handleApi(req, res, database);
                } else {
                    serveStatic(req, res);
                }
            } catch (err) {
                sendJson(res, 500, { message: 'Server error.' });
            }
        });

        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
}

start();
