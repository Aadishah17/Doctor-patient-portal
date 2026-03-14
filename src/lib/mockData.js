export const MOCK_DEFAULT_PASSWORD = 'Welcome123!';

export const DEMO_ACCOUNTS = [
    {
        id: 'doctor-demo',
        label: 'Doctor demo',
        role: 'doctor',
        name: 'Dr. John Smith',
        email: 'doctor@test.com',
        password: MOCK_DEFAULT_PASSWORD
    },
    {
        id: 'patient-demo',
        label: 'Patient demo',
        role: 'patient',
        name: 'Alex Johnson',
        email: 'alex@test.com',
        password: MOCK_DEFAULT_PASSWORD
    },
    {
        id: 'aadi-demo',
        label: 'Aadi Shah',
        role: 'doctor',
        name: 'Dr. Aadi Shah',
        email: 'aadi.shah@medconnect.gov',
        password: MOCK_DEFAULT_PASSWORD
    }
];

function isoDate(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
}

const doctorUsers = [
    {
        id: 'doc-1',
        name: 'Dr. John Smith',
        email: 'doctor@test.com',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 123-4567',
            address: '123 Medical Plaza, Health City',
            specialty: 'Cardiology',
            clinic: 'North Tower, MedConnect Campus',
            accepting: true,
            televisit: true,
            rating: 4.9,
            availability: ['Mon 09:00 AM - 05:00 PM', 'Wed 10:00 AM - 03:00 PM'],
            notifications: { email: true, sms: false, appt: true }
        }
    },
    {
        id: 'doc-2',
        name: 'Dr. Priya Nair',
        email: 'priya.nair@medconnect.gov',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 222-9034',
            address: 'Neuro Wing, Block B',
            specialty: 'Neurology',
            clinic: 'Central Hospital Campus',
            accepting: true,
            televisit: true,
            rating: 4.8,
            availability: ['Tue 08:30 AM - 03:30 PM', 'Thu 10:00 AM - 04:00 PM'],
            notifications: { email: true, sms: true, appt: true }
        }
    },
    {
        id: 'doc-3',
        name: 'Dr. Miguel Alvarez',
        email: 'miguel.alvarez@medconnect.gov',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 555-0113',
            address: "Children's Center, West Wing",
            specialty: 'Pediatrics',
            clinic: 'Community Health Center',
            accepting: false,
            televisit: true,
            rating: 4.6,
            availability: ['Mon 11:00 AM - 06:00 PM', 'Fri 09:00 AM - 01:00 PM'],
            notifications: { email: true, sms: false, appt: true }
        }
    },
    {
        id: 'doc-4',
        name: 'Dr. Hannah Lee',
        email: 'hannah.lee@medconnect.gov',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 654-9811',
            address: 'Women Wellness Building',
            specialty: 'Gynecology',
            clinic: 'Eastside Specialty Hospital',
            accepting: true,
            televisit: false,
            rating: 4.7,
            availability: ['Tue 09:00 AM - 02:00 PM', 'Thu 09:30 AM - 05:00 PM'],
            notifications: { email: true, sms: false, appt: true }
        }
    },
    {
        id: 'doc-5',
        name: 'Dr. Omar Siddiqui',
        email: 'omar.siddiqui@medconnect.gov',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 744-8200',
            address: 'Orthopedic and Trauma Center',
            specialty: 'Orthopedics',
            clinic: 'Metro Care Hospital',
            accepting: true,
            televisit: false,
            rating: 4.8,
            availability: ['Mon 08:00 AM - 12:00 PM', 'Wed 01:00 PM - 05:00 PM'],
            notifications: { email: true, sms: true, appt: true }
        }
    },
    {
        id: 'doc-6',
        name: 'Dr. Sofia Chen',
        email: 'sofia.chen@medconnect.gov',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 912-7701',
            address: 'Virtual Care and Diabetes Hub',
            specialty: 'Endocrinology',
            clinic: 'SmartCare Center',
            accepting: true,
            televisit: true,
            rating: 4.9,
            availability: ['Wed 11:00 AM - 07:00 PM', 'Sat 09:00 AM - 01:00 PM'],
            notifications: { email: true, sms: false, appt: true }
        }
    }
];

const extraDoctorUsers = [
    {
        id: 'doc-7',
        name: 'Dr. Aadi Shah',
        email: 'aadi.shah@medconnect.gov',
        role: 'doctor',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 809-2214',
            address: 'Integrated Care Unit, Innovation Block',
            specialty: 'Internal Medicine',
            clinic: 'MedConnect Advanced Care Center',
            accepting: true,
            televisit: true,
            rating: 4.9,
            availability: ['Mon 10:00 AM - 04:00 PM', 'Wed 09:00 AM - 01:00 PM', 'Fri 01:00 PM - 06:00 PM'],
            notifications: { email: true, sms: true, appt: true }
        }
    }
];

const patientUsers = [
    {
        id: 'pat-1',
        name: 'Alex Johnson',
        email: 'alex@test.com',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 998-2103',
            address: '44 Riverwalk Avenue, Springfield',
            preferredDoctorId: 'doc-1',
            emergencyContact: { name: 'Mia Johnson', phone: '+1 (555) 110-2200' },
            medical: {
                bloodType: 'O+',
                allergies: 'Penicillin',
                medications: 'Atorvastatin 20mg, Vitamin D',
                pharmacy: 'MedConnect Central Pharmacy'
            },
            notifications: { email: true, sms: true, appt: true },
            privacy: { researchSharing: true, twoFactor: true }
        }
    },
    {
        id: 'pat-2',
        name: 'Maya Patel',
        email: 'maya.patel@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 201-3004',
            address: '21 Cedar Street, Newark',
            preferredDoctorId: 'doc-2',
            emergencyContact: { name: 'Rohit Patel', phone: '+1 (555) 201-3100' },
            medical: {
                bloodType: 'A+',
                allergies: 'Peanuts',
                medications: 'Migraine preventive therapy',
                pharmacy: 'WellSpring Pharmacy'
            },
            notifications: { email: true, sms: false, appt: true },
            privacy: { researchSharing: false, twoFactor: false }
        }
    },
    {
        id: 'pat-3',
        name: 'Jordan Lee',
        email: 'jordan.lee@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 402-1198',
            address: '8 Harbor View, Seattle',
            preferredDoctorId: 'doc-6',
            emergencyContact: { name: 'Chris Lee', phone: '+1 (555) 402-1200' },
            medical: {
                bloodType: 'B+',
                allergies: 'None recorded',
                medications: 'Metformin 500mg',
                pharmacy: 'Harbor Pharmacy'
            },
            notifications: { email: true, sms: true, appt: true },
            privacy: { researchSharing: true, twoFactor: false }
        }
    },
    {
        id: 'pat-4',
        name: 'Lila Cohen',
        email: 'lila.cohen@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 633-2011',
            address: '90 Greenpoint Road, Boston',
            preferredDoctorId: 'doc-4',
            emergencyContact: { name: 'Sara Cohen', phone: '+1 (555) 633-2099' },
            medical: {
                bloodType: 'AB+',
                allergies: 'Latex',
                medications: 'Prenatal vitamins',
                pharmacy: 'CareFirst Pharmacy'
            },
            notifications: { email: true, sms: true, appt: true },
            privacy: { researchSharing: false, twoFactor: true }
        }
    }
];

const extraPatientUsers = [
    {
        id: 'pat-5',
        name: 'Aarav Malhotra',
        email: 'aarav.malhotra@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 782-1180',
            address: '82 Maple Ridge, Edison',
            preferredDoctorId: 'doc-7',
            emergencyContact: { name: 'Ritu Malhotra', phone: '+1 (555) 782-1199' },
            medical: {
                bloodType: 'A+',
                allergies: 'Sulfa drugs',
                medications: 'Rosuvastatin 10mg',
                pharmacy: 'Edison Family Pharmacy'
            },
            notifications: { email: true, sms: true, appt: true },
            privacy: { researchSharing: true, twoFactor: true }
        }
    },
    {
        id: 'pat-6',
        name: 'Nisha Verma',
        email: 'nisha.verma@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 660-4178',
            address: '17 Rose Garden Lane, Austin',
            preferredDoctorId: 'doc-7',
            emergencyContact: { name: 'Anil Verma', phone: '+1 (555) 660-4100' },
            medical: {
                bloodType: 'AB-',
                allergies: 'Latex',
                medications: 'Iron supplements',
                pharmacy: 'Austin Community Pharmacy'
            },
            notifications: { email: true, sms: false, appt: true },
            privacy: { researchSharing: false, twoFactor: true }
        }
    },
    {
        id: 'pat-7',
        name: 'Zoe Carter',
        email: 'zoe.carter@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 930-2208',
            address: '11 Harbor Circle, Portland',
            preferredDoctorId: 'doc-6',
            emergencyContact: { name: 'Mason Carter', phone: '+1 (555) 930-2211' },
            medical: {
                bloodType: 'B+',
                allergies: 'Peanuts',
                medications: 'Sertraline 50mg',
                pharmacy: 'Portland Wellness Pharmacy'
            },
            notifications: { email: true, sms: true, appt: true },
            privacy: { researchSharing: true, twoFactor: false }
        }
    },
    {
        id: 'pat-8',
        name: 'Imran Sheikh',
        email: 'imran.sheikh@patient.gov',
        role: 'patient',
        password: MOCK_DEFAULT_PASSWORD,
        profile: {
            phone: '+1 (555) 214-8870',
            address: '99 Orchard Square, Fremont',
            preferredDoctorId: 'doc-7',
            emergencyContact: { name: 'Sana Sheikh', phone: '+1 (555) 214-8801' },
            medical: {
                bloodType: 'O-',
                allergies: 'Dust mites',
                medications: 'Budesonide inhaler',
                pharmacy: 'Fremont Care Pharmacy'
            },
            notifications: { email: true, sms: true, appt: true },
            privacy: { researchSharing: false, twoFactor: false }
        }
    }
];

const users = [...doctorUsers, ...extraDoctorUsers, ...patientUsers, ...extraPatientUsers];

const appointments = [
    {
        id: 'appt-1001',
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: isoDate(2),
        time: '09:30 AM',
        status: 'Confirmed',
        mode: 'Televisit',
        visitType: 'Follow-up',
        reason: 'Blood pressure review'
    },
    {
        id: 'appt-1002',
        doctorId: 'doc-2',
        patientId: 'pat-2',
        date: isoDate(1),
        time: '01:15 PM',
        status: 'Pending',
        mode: 'In-Person',
        visitType: 'Consultation',
        reason: 'Migraine care plan'
    },
    {
        id: 'appt-1003',
        doctorId: 'doc-6',
        patientId: 'pat-3',
        date: isoDate(4),
        time: '11:00 AM',
        status: 'Confirmed',
        mode: 'Televisit',
        visitType: 'Follow-up',
        reason: 'Diabetes medication review'
    },
    {
        id: 'appt-1004',
        doctorId: 'doc-4',
        patientId: 'pat-4',
        date: isoDate(6),
        time: '03:45 PM',
        status: 'Pending',
        mode: 'In-Person',
        visitType: 'Routine',
        reason: 'Prenatal wellness review'
    },
    {
        id: 'appt-1005',
        doctorId: 'doc-5',
        patientId: 'pat-1',
        date: isoDate(-8),
        time: '10:00 AM',
        status: 'Completed',
        mode: 'In-Person',
        visitType: 'Consultation',
        reason: 'Knee pain evaluation'
    },
    {
        id: 'appt-1006',
        doctorId: 'doc-1',
        patientId: 'pat-1',
        date: isoDate(-18),
        time: '02:00 PM',
        status: 'Cancelled',
        mode: 'In-Person',
        visitType: 'Routine',
        reason: 'Annual heart screening'
    },
    {
        id: 'appt-1007',
        doctorId: 'doc-1',
        patientId: 'pat-2',
        date: isoDate(0),
        time: '11:30 AM',
        status: 'Pending',
        mode: 'Televisit',
        visitType: 'Consultation',
        reason: 'Medication side effect review'
    },
    {
        id: 'appt-1008',
        doctorId: 'doc-1',
        patientId: 'pat-3',
        date: isoDate(0),
        time: '04:00 PM',
        status: 'Confirmed',
        mode: 'In-Person',
        visitType: 'Routine',
        reason: 'Cholesterol progress check'
    },
    {
        id: 'appt-1009',
        doctorId: 'doc-1',
        patientId: 'pat-4',
        date: isoDate(-2),
        time: '12:45 PM',
        status: 'Declined',
        mode: 'Televisit',
        visitType: 'Consultation',
        reason: 'General cardiac consult'
    }
];

const extraAppointments = [
    {
        id: 'appt-1010',
        doctorId: 'doc-7',
        patientId: 'pat-5',
        date: isoDate(1),
        time: '12:20 PM',
        status: 'Confirmed',
        mode: 'Televisit',
        visitType: 'New Patient',
        reason: 'Chest discomfort after high-intensity training'
    },
    {
        id: 'appt-1011',
        doctorId: 'doc-7',
        patientId: 'pat-6',
        date: isoDate(3),
        time: '02:05 PM',
        status: 'Pending',
        mode: 'In-Person',
        visitType: 'Care Plan',
        reason: 'Fatigue, anemia review, and nutrition planning'
    },
    {
        id: 'appt-1012',
        doctorId: 'doc-6',
        patientId: 'pat-7',
        date: isoDate(5),
        time: '11:55 AM',
        status: 'Confirmed',
        mode: 'Televisit',
        visitType: 'Mental Health',
        reason: 'Stress and sleep quality review'
    },
    {
        id: 'appt-1013',
        doctorId: 'doc-7',
        patientId: 'pat-8',
        date: isoDate(-4),
        time: '01:40 PM',
        status: 'Completed',
        mode: 'Televisit',
        visitType: 'Internal Medicine Review',
        reason: 'Respiratory recovery check and care coordination'
    },
    {
        id: 'appt-1014',
        doctorId: 'doc-7',
        patientId: 'pat-7',
        date: isoDate(23),
        time: '03:10 PM',
        status: 'Pending',
        mode: 'In-Person',
        visitType: 'Follow-up',
        reason: 'Medication tolerance and annual screening'
    },
    {
        id: 'appt-1015',
        doctorId: 'doc-1',
        patientId: 'pat-5',
        date: isoDate(19),
        time: '09:55 AM',
        status: 'Pending',
        mode: 'In-Person',
        visitType: 'Cardiac Review',
        reason: 'Preventive cardiac screening and vitals review'
    },
    {
        id: 'appt-1016',
        doctorId: 'doc-7',
        patientId: 'pat-1',
        date: isoDate(2),
        time: '09:10 AM',
        status: 'Confirmed',
        mode: 'In-Person',
        visitType: 'Internal Medicine Intake',
        reason: 'General preventive screening and medication review'
    },
    {
        id: 'appt-1017',
        doctorId: 'doc-7',
        patientId: 'pat-2',
        date: isoDate(6),
        time: '10:25 AM',
        status: 'Pending',
        mode: 'Televisit',
        visitType: 'Follow-up',
        reason: 'Migraine care coordination and chronic medication review'
    },
    {
        id: 'appt-1018',
        doctorId: 'doc-7',
        patientId: 'pat-3',
        date: isoDate(7),
        time: '04:20 PM',
        status: 'Confirmed',
        mode: 'In-Person',
        visitType: 'Complex Review',
        reason: 'Diabetes and long-term care planning'
    },
    {
        id: 'appt-1019',
        doctorId: 'doc-7',
        patientId: 'pat-4',
        date: isoDate(10),
        time: '01:50 PM',
        status: 'Pending',
        mode: 'Televisit',
        visitType: 'Wellness Review',
        reason: 'Preventive review and maternity-safe medication questions'
    },
    {
        id: 'appt-1020',
        doctorId: 'doc-7',
        patientId: 'pat-5',
        date: isoDate(13),
        time: '11:35 AM',
        status: 'Confirmed',
        mode: 'In-Person',
        visitType: 'Care Plan',
        reason: 'Metabolic follow-up and diet adherence review'
    },
    {
        id: 'appt-1021',
        doctorId: 'doc-7',
        patientId: 'pat-6',
        date: isoDate(17),
        time: '03:25 PM',
        status: 'Pending',
        mode: 'Televisit',
        visitType: 'Internal Medicine Review',
        reason: 'Fatigue management checkpoint and lab follow-up'
    }
];

const labReports = [
    {
        id: 'lab-1',
        patientId: 'pat-1',
        doctorId: 'doc-1',
        testName: 'Lipid Profile',
        collectedDate: isoDate(-5),
        provider: 'MedConnect Labs',
        status: 'Ready',
        summary: 'LDL improved by 8% from the previous panel.'
    },
    {
        id: 'lab-2',
        patientId: 'pat-2',
        doctorId: 'doc-2',
        testName: 'MRI Brain Screening',
        collectedDate: isoDate(-3),
        provider: 'Central Imaging',
        status: 'Processing',
        summary: 'Radiologist review in progress.'
    },
    {
        id: 'lab-3',
        patientId: 'pat-3',
        doctorId: 'doc-6',
        testName: 'HbA1c',
        collectedDate: isoDate(-12),
        provider: 'SmartCare Diagnostics',
        status: 'Ready',
        summary: 'HbA1c reduced to 6.8%. Continue current regimen.'
    },
    {
        id: 'lab-4',
        patientId: 'pat-4',
        doctorId: 'doc-4',
        testName: 'CBC Panel',
        collectedDate: isoDate(-1),
        provider: 'Women Wellness Lab',
        status: 'Ready',
        summary: 'Results are within expected range for this trimester.'
    }
];

const extraLabReports = [
    {
        id: 'lab-5',
        patientId: 'pat-5',
        doctorId: 'doc-7',
        testName: 'Cardiac Risk Marker Panel',
        collectedDate: isoDate(-2),
        provider: 'Advanced Care Diagnostics',
        status: 'Ready',
        summary: 'Markers are within range. Lifestyle counseling advised.'
    },
    {
        id: 'lab-6',
        patientId: 'pat-6',
        doctorId: 'doc-7',
        testName: 'Iron Studies',
        collectedDate: isoDate(-6),
        provider: 'Austin Central Lab',
        status: 'Ready',
        summary: 'Ferritin is below range. Continue supplementation and repeat testing.'
    },
    {
        id: 'lab-7',
        patientId: 'pat-7',
        doctorId: 'doc-6',
        testName: 'Sleep and Stress Assessment',
        collectedDate: isoDate(-8),
        provider: 'Behavioral Health Diagnostics',
        status: 'Ready',
        summary: 'Sleep consistency improved. Moderate work-related stress persists.'
    },
    {
        id: 'lab-8',
        patientId: 'pat-8',
        doctorId: 'doc-7',
        testName: 'Inflammatory Marker Review',
        collectedDate: isoDate(-3),
        provider: 'Pulmonary Research Lab',
        status: 'Processing',
        summary: 'Panel uploaded and awaiting clinician acknowledgment.'
    }
];

const pharmacyOrders = [
    {
        id: 'rx-1',
        patientId: 'pat-1',
        medication: 'Atorvastatin 20mg',
        pharmacy: 'MedConnect Central Pharmacy',
        quantity: '30 tablets',
        refills: 2,
        orderedDate: isoDate(-4),
        status: 'Ready for pickup'
    },
    {
        id: 'rx-2',
        patientId: 'pat-2',
        medication: 'Sumatriptan refill',
        pharmacy: 'WellSpring Pharmacy',
        quantity: '12 tablets',
        refills: 1,
        orderedDate: isoDate(-2),
        status: 'In transit'
    },
    {
        id: 'rx-3',
        patientId: 'pat-3',
        medication: 'Metformin 500mg',
        pharmacy: 'Harbor Pharmacy',
        quantity: '60 tablets',
        refills: 3,
        orderedDate: isoDate(-9),
        status: 'Delivered'
    }
];

const extraPharmacyOrders = [
    {
        id: 'rx-4',
        patientId: 'pat-5',
        medication: 'Rosuvastatin 10mg',
        pharmacy: 'Edison Family Pharmacy',
        quantity: '30 tablets',
        refills: 2,
        orderedDate: isoDate(-1),
        status: 'Ready for pickup'
    },
    {
        id: 'rx-5',
        patientId: 'pat-6',
        medication: 'Ferrous Sulfate 325mg',
        pharmacy: 'Austin Community Pharmacy',
        quantity: '60 tablets',
        refills: 1,
        orderedDate: isoDate(0),
        status: 'In transit'
    },
    {
        id: 'rx-6',
        patientId: 'pat-7',
        medication: 'Sertraline 50mg',
        pharmacy: 'Portland Wellness Pharmacy',
        quantity: '30 tablets',
        refills: 2,
        orderedDate: isoDate(1),
        status: 'Pending approval'
    },
    {
        id: 'rx-7',
        patientId: 'pat-8',
        medication: 'Budesonide inhaler',
        pharmacy: 'Fremont Care Pharmacy',
        quantity: '1 inhaler',
        refills: 1,
        orderedDate: isoDate(-3),
        status: 'Shipped'
    }
];

const diagnosticTests = [
    {
        id: 'diag-1',
        category: 'Cardiology',
        name: '2D Echo',
        price: 3800,
        turnaround: 'Same day summary',
        homeCollection: false
    },
    {
        id: 'diag-2',
        category: 'Pathology',
        name: 'Advanced Thyroid Panel',
        price: 2200,
        turnaround: '24 hours',
        homeCollection: true
    },
    {
        id: 'diag-3',
        category: 'Diabetes',
        name: 'Home HbA1c Test',
        price: 1600,
        turnaround: '48 hours',
        homeCollection: true
    },
    {
        id: 'diag-4',
        category: 'Imaging',
        name: 'MRI Cervical Spine',
        price: 8200,
        turnaround: '2 business days',
        homeCollection: false
    }
];

const extraDiagnosticTests = [
    {
        id: 'diag-5',
        category: 'Cardiology',
        name: 'Cardiac CT Calcium Score',
        price: 5200,
        turnaround: '72 hours',
        homeCollection: false
    },
    {
        id: 'diag-6',
        category: 'Internal Medicine',
        name: 'Comprehensive Iron Deficiency Panel',
        price: 1250,
        turnaround: '24 hours',
        homeCollection: true
    },
    {
        id: 'diag-7',
        category: 'Behavioral Health',
        name: 'Home Sleep Apnea Study',
        price: 2600,
        turnaround: '48 hours',
        homeCollection: true
    }
];

const healthPackages = [
    {
        id: 'pack-1',
        name: 'Heart Health 360',
        duration: '1 day',
        includes: ['ECG', 'Lipid profile', 'Cardiology consult'],
        price: 5400
    },
    {
        id: 'pack-2',
        name: 'Women Wellness Plus',
        duration: '2 days',
        includes: ['CBC', 'Thyroid panel', 'Gynecology consult'],
        price: 6900
    },
    {
        id: 'pack-3',
        name: 'Diabetes Track Pro',
        duration: 'Monthly',
        includes: ['HbA1c', 'Dietitian review', 'Teleconsult'],
        price: 4200
    }
];

const extraHealthPackages = [
    {
        id: 'pack-4',
        name: 'Internal Medicine Precision Check',
        duration: '1 day',
        includes: ['Cardiac risk review', 'Metabolic panel', 'Physician consult'],
        price: 4800
    },
    {
        id: 'pack-5',
        name: 'Mind and Sleep Recovery Program',
        duration: '2 days',
        includes: ['Sleep study', 'Behavioral screening', 'Counseling review'],
        price: 3900
    }
];

const bloodBank = [
    { id: 'blood-1', bloodType: 'A+', units: 18 },
    { id: 'blood-2', bloodType: 'A-', units: 7 },
    { id: 'blood-3', bloodType: 'B+', units: 14 },
    { id: 'blood-4', bloodType: 'B-', units: 5 },
    { id: 'blood-5', bloodType: 'O+', units: 23 },
    { id: 'blood-6', bloodType: 'O-', units: 9 },
    { id: 'blood-7', bloodType: 'AB+', units: 11 },
    { id: 'blood-8', bloodType: 'AB-', units: 4 }
];

const claims = [
    {
        id: 'claim-1',
        patientId: 'pat-1',
        claimId: 'CLM-2026-101',
        description: 'Cardiology follow-up reimbursement',
        insurer: 'National Health Cover',
        dueDate: isoDate(12),
        amount: 4200,
        status: 'Submitted'
    },
    {
        id: 'claim-2',
        patientId: 'pat-2',
        claimId: 'CLM-2026-114',
        description: 'Neurology imaging coverage',
        insurer: 'Apex Assurance',
        dueDate: isoDate(8),
        amount: 11800,
        status: 'Pending documents'
    },
    {
        id: 'claim-3',
        patientId: 'pat-3',
        claimId: 'CLM-2026-126',
        description: 'Chronic care management benefit',
        insurer: 'Harbor Mutual',
        dueDate: isoDate(15),
        amount: 3600,
        status: 'Approved'
    }
];

const extraClaims = [
    {
        id: 'claim-4',
        patientId: 'pat-5',
        claimId: 'CLM-2026-140',
        description: 'Internal medicine teleconsult and cardiac review',
        insurer: 'PrimeCare Shield',
        dueDate: isoDate(6),
        amount: 2100,
        status: 'Approved'
    },
    {
        id: 'claim-5',
        patientId: 'pat-6',
        claimId: 'CLM-2026-152',
        description: 'Iron studies and follow-up consultation',
        insurer: 'Gov Health Plan',
        dueDate: isoDate(9),
        amount: 1750,
        status: 'Pending'
    },
    {
        id: 'claim-6',
        patientId: 'pat-8',
        claimId: 'CLM-2026-165',
        description: 'Pulmonology review and inhaler management',
        insurer: 'Employee Health Scheme',
        dueDate: isoDate(11),
        amount: 2400,
        status: 'Submitted'
    }
];

const researchTrials = [
    {
        id: 'trial-1',
        trialId: 'CTRI/2026/01/000101',
        title: 'Tele-cardiology support for hypertension management',
        phase: 'Phase III',
        status: 'Recruiting',
        sponsor: 'National Institute of Digital Health',
        location: 'Delhi, India'
    },
    {
        id: 'trial-2',
        trialId: 'CTRI/2026/02/000220',
        title: 'Hybrid migraine monitoring program',
        phase: 'Phase II',
        status: 'Active',
        sponsor: 'MedConnect Research Collaborative',
        location: 'Mumbai, India'
    },
    {
        id: 'trial-3',
        trialId: 'CTRI/2026/03/000303',
        title: 'Community diabetes prevention and adherence study',
        phase: 'Phase IV',
        status: 'Recruiting',
        sponsor: 'SmartCare Center',
        location: 'Bengaluru, India'
    }
];

const extraResearchTrials = [
    {
        id: 'trial-4',
        trialId: 'CTRI/2026/03/022118',
        title: 'AI-assisted internal medicine triage workflow',
        phase: 'Phase II',
        status: 'Recruiting',
        sponsor: 'Digital Health Innovation Board',
        location: 'Ahmedabad, India'
    },
    {
        id: 'trial-5',
        trialId: 'CTRI/2026/01/020884',
        title: 'Remote sleep and stress recovery study',
        phase: 'Phase III',
        status: 'Active',
        sponsor: 'Behavioral Health Alliance',
        location: 'Pune, India'
    }
];

const guidelines = [
    {
        id: 'guide-1',
        guidelineId: 'ICMR-CARD-2026',
        title: 'Outpatient hypertension escalation pathway',
        category: 'Cardiology',
        year: 2026
    },
    {
        id: 'guide-2',
        guidelineId: 'ICMR-NEUR-2025',
        title: 'Structured migraine triage in telehealth',
        category: 'Neurology',
        year: 2025
    },
    {
        id: 'guide-3',
        guidelineId: 'ICMR-ENDO-2026',
        title: 'Quarterly diabetes review checklist',
        category: 'Endocrinology',
        year: 2026
    },
    {
        id: 'guide-4',
        guidelineId: 'ICMR-OBG-2025',
        title: 'Prenatal preventive care and follow-up cadence',
        category: 'Gynecology',
        year: 2025
    }
];

const extraGuidelines = [
    {
        id: 'guide-5',
        guidelineId: 'ICMR-IM-2026',
        title: 'Integrated adult preventive care pathway for internal medicine clinics',
        category: 'Internal Medicine',
        year: 2026
    },
    {
        id: 'guide-6',
        guidelineId: 'ICMR-DHT-2026',
        title: 'Digital health triage and follow-up best practices',
        category: 'Digital Health',
        year: 2026
    }
];

const audit = [
    {
        id: 'audit-1',
        userId: 'pat-1',
        icon: 'fa-shield-check',
        label: 'Profile updated',
        text: 'Emergency contact details were refreshed.',
        createdAt: `${isoDate(-2)}T10:15:00Z`
    },
    {
        id: 'audit-2',
        userId: 'doc-1',
        icon: 'fa-calendar-check',
        label: 'Appointment confirmed',
        text: 'Alex Johnson follow-up was confirmed for teleconsult.',
        createdAt: `${isoDate(-1)}T07:40:00Z`
    },
    {
        id: 'audit-3',
        userId: 'pat-1',
        icon: 'fa-flask',
        label: 'Lab report ready',
        text: 'Lipid profile results were posted to the portal.',
        createdAt: `${isoDate(-1)}T12:25:00Z`
    }
];

const extraAudit = [
    {
        id: 'audit-4',
        userId: 'doc-7',
        icon: 'fa-user-doctor',
        label: 'New specialist profile ready',
        text: 'Dr. Aadi Shah was seeded with internal medicine availability and mock appointments.',
        createdAt: `${isoDate(-1)}T09:05:00Z`
    },
    {
        id: 'audit-5',
        userId: 'pat-5',
        icon: 'fa-calendar-plus',
        label: 'Appointment booked',
        text: 'A new telehealth consult was scheduled with Dr. Aadi Shah.',
        createdAt: `${isoDate(0)}T08:10:00Z`
    }
];

export function createInitialMockState() {
    return {
        users,
        appointments: [...appointments, ...extraAppointments],
        labReports: [...labReports, ...extraLabReports],
        pharmacyOrders: [...pharmacyOrders, ...extraPharmacyOrders],
        diagnosticTests: [...diagnosticTests, ...extraDiagnosticTests],
        healthPackages: [...healthPackages, ...extraHealthPackages],
        bloodBank,
        claims: [...claims, ...extraClaims],
        researchTrials: [...researchTrials, ...extraResearchTrials],
        guidelines: [...guidelines, ...extraGuidelines],
        audit: [...audit, ...extraAudit],
        sessions: {}
    };
}
