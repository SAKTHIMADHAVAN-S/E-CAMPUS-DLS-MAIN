// =========================================================================
// STUDENT MASTER DATA & ALL STUDENTS DOCUMENTS MODULE (DLS-SWCE eCampus)
// =========================================================================

const MASTER_DOCS_LIST = [
    { key: 'aadharFront', label: 'Aadhar Card (Front)', icon: '🪪', req: true, desc: 'Government UIDAI Aadhar Front' },
    { key: 'aadharBack', label: 'Aadhar Card (Back)', icon: '🪪', req: true, desc: 'Government UIDAI Aadhar Back' },
    { key: 'tenthMarksheet', label: '10th (SSLC) Mark Sheet', icon: '📜', req: true, desc: 'Secondary School Leaving Certificate' },
    { key: 'twelfthMarksheet', label: '12th (HSC) / Diploma Marksheet', icon: '📜', req: true, desc: 'Higher Secondary Certificate' },
    { key: 'tc', label: 'Transfer Certificate (TC)', icon: '📑', req: true, desc: 'Original Institution Transfer Certificate' },
    { key: 'community', label: 'Community Certificate', icon: '🏛️', req: true, desc: 'Tahsildar / Revenue Dept Certificate' },
    { key: 'income', label: 'Income Certificate', icon: '💰', req: true, desc: 'Annual Family Income Certificate' },
    { key: 'nativity', label: 'Nativity Certificate', icon: '📍', req: false, desc: 'Tamil Nadu Nativity Certificate' },
    { key: 'firstGraduate', label: 'First Graduate Certificate', icon: '🎓', req: false, desc: 'First Graduate (FG) Certificate' },
    { key: 'studentPhoto', label: 'Student Passport Photo', icon: '📷', req: true, desc: 'Formal Passport Photograph' },
    { key: 'studentSignature', label: 'Student Digital Signature', icon: '✍️', req: true, desc: 'Digital Signature on plain white background' },
    { key: 'medical', label: 'Medical Fitness Certificate', icon: '🏥', req: true, desc: 'Registered Medical Practitioner Certificate' },
    { key: 'antiRagging', label: 'Anti-Ragging Undertaking', icon: '🛡️', req: true, desc: 'Signed Student & Parent Undertaking' },
    { key: 'allotmentOrder', label: 'DOTE Allotment Order', icon: '🏛️', req: false, desc: 'TNEA Government Allotment Letter' },
    { key: 'feesReceipt', label: 'College Fees Receipts', icon: '🧾', req: true, desc: 'Official Term Tuition Receipt' },
    { key: 'bankPassbook', label: 'Bank Passbook Front Page', icon: '🏦', req: true, desc: 'Passbook with Account No and IFSC' },
    { key: 'achievement', label: 'Achievements / Extracurricular', icon: '🏆', req: false, desc: 'Technical Symposium or NPTEL' }
];

let currentActiveMasterTab = 'personal';
let currentModalActiveStudentEmail = null;
let selectedAllStudentCheckboxes = new Set();

function logDataAccess(studentEmail, action) {
    try {
        let logs = JSON.parse(localStorage.getItem('swce_data_access_logs') || '[]');
        const viewer = window.currentUser || { email: 'faculty@study-world.edu.in' };
        logs.unshift({
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            viewerEmail: viewer.email || 'faculty@study-world.edu.in',
            viewerRole: window.currentUserRole || 'Faculty',
            studentEmail: studentEmail || 'All Students Registry',
            action: action
        });
        if (logs.length > 200) logs = logs.slice(0, 200);
        localStorage.setItem('swce_data_access_logs', JSON.stringify(logs));
    } catch (e) {
        console.warn('Logging error:', e);
    }
}

function maskSensitiveField(val, type, role) {
    if (!val) return '—';
    const activeRole = (role || window.currentUserRole || 'student').toLowerCase();
    if (activeRole === 'principal') return String(val);
    if (type === 'aadhar') {
        const clean = String(val).replace(/\s+/g, '');
        return clean.length >= 4 ? '**** **** ' + clean.slice(-4) : '**** **** ****';
    }
    if (type === 'bank') {
        const clean = String(val).trim();
        return clean.length >= 4 ? '****' + clean.slice(-4) : '************';
    }
    return String(val);
}

function switchMasterTab(tabName) {
    currentActiveMasterTab = tabName;
    document.querySelectorAll('.master-tab-pane').forEach(el => el.classList.add('hidden'));
    const targetPane = document.getElementById('tabContent_' + tabName);
    if (targetPane) targetPane.classList.remove('hidden');

    document.querySelectorAll('.master-tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#0A2D6A]', 'text-white', 'font-bold');
        btn.classList.add('text-slate-600', 'hover:bg-slate-100', 'font-medium');
    });
    const activeBtn = document.getElementById('tabBtn_' + tabName);
    if (activeBtn) {
        activeBtn.classList.add('bg-[#0A2D6A]', 'text-white', 'font-bold');
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-100', 'font-medium');
    }
}

function switchModalTab(tabName) {
    document.querySelectorAll('.modal-tab-pane').forEach(el => el.classList.add('hidden'));
    const targetPane = document.getElementById('modalPane_' + tabName);
    if (targetPane) targetPane.classList.remove('hidden');

    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.remove('bg-[#0A2D6A]', 'text-white', 'font-bold');
        btn.classList.add('text-slate-600', 'hover:bg-slate-200', 'font-medium');
    });
    const activeBtn = document.getElementById('modalTabBtn_' + tabName);
    if (activeBtn) {
        activeBtn.classList.add('bg-[#0A2D6A]', 'text-white', 'font-bold');
        activeBtn.classList.remove('text-slate-600', 'hover:bg-slate-200', 'font-medium');
    }
}

function initStudentMasterDataStore() {
    let store = {};
    try {
        store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    } catch (e) {
        store = {};
    }

    const defaultStudents = {
        'student@study-world.edu.in': {
            email: 'student@study-world.edu.in',
            studentId: 'SWCE-2024-CSE-067',
            firstName: 'Sakthi',
            lastName: 'Madhavan',
            dob: '2004-06-18',
            gender: 'Male',
            bloodGroup: 'O+',
            aadhar: '723489123067',
            mobile: '9123456780',
            altMobile: '9876543210',
            photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
            community: 'BC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641105',
            addressPerm: '42, Kurinji Nagar, Madukkarai, Coimbatore - 641105',
            addressCurr: 'SWCE Campus Hostel, Room 204-B, Kurinji Block',

            dept: 'CSE',
            year: 'III',
            semester: '6',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-12',
            tenthSchool: 'Govt Higher Secondary School, Madukkarai',
            tenthPercent: '93.6%',
            tenthYear: '2022',
            tenthBoard: 'Tamil Nadu State Board',
            twelfthSchool: 'St. Joseph Higher Secondary School, Coimbatore',
            twelfthPercent: '91.2%',
            twelfthCutoff: 186.5,
            cgpa: 8.74,
            sgpa: 8.85,
            attendance: 94,

            fatherName: 'Madhavan R',
            fatherOcc: 'Agriculture & Business',
            fatherMobile: '9876543210',
            fatherIncome: '1,80,000',
            motherName: 'Lakshmi M',
            motherOcc: 'Homemaker',
            motherMobile: '9876543211',
            motherIncome: '0',
            guardianName: 'Sundaram R',
            guardianRel: 'Uncle',
            guardianMobile: '9876543212',
            emergencyContact: 'Madhavan R (Father)',
            emergencyMobile: '9876543210',
            familyIncome: '1,80,000',
            siblingsCount: 1,
            firstGraduate: 'No',

            feeTotal: 133500,
            feePaid: 90000,
            feeRemaining: 43500,
            scholarshipType: 'BC/MBC Welfare',
            scholarshipAmount: '12,500',
            scholarshipId: 'BCW-TN-2026-7812',
            feeRemarks: 'Tuition verified.',

            accommodation: 'Hosteller',
            hostelBlock: 'Kurinji Boys Block A',
            roomNo: '204-B',
            messType: 'Non-Veg',
            transportMode: 'Hostel Walk',
            busRoute: 'N/A',
            busStop: 'Campus',
            vehicleNo: 'N/A',

            bankName: 'State Bank of India (SBI)',
            accountHolder: 'Sakthi Madhavan',
            accountNo: '384910294821',
            ifsc: 'SBIN0001429',
            bankBranch: 'Madukkarai Branch, Coimbatore',
            micr: '641002014',

            admissionNo: 'SWCE/ADM/2024/067',
            rollNo: '721124243067',
            regNo: '721124243067',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. P. Senthil Kumar (HOD CSE)',
            mentorEmail: 'hod.cse@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '15-09-2026 11:30 AM',
            hodRemarks: 'All academic credentials and original certificates verified by HOD.',
            lastUpdated: Date.now(),
            documents: {
                aadharFront: { fileName: 'Aadhar_Sakthi_Front.pdf', size: '320 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                aadharBack: { fileName: 'Aadhar_Sakthi_Back.pdf', size: '290 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_SSLC_Marksheet.pdf', size: '480 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_HSC_Marksheet.pdf', size: '520 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                tc: { fileName: 'Transfer_Certificate_Original.pdf', size: '410 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                community: { fileName: 'Community_Certificate_BC.pdf', size: '360 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                income: { fileName: 'Income_Certificate_2026.pdf', size: '340 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                feesReceipt: { fileName: 'Fee_Receipt_Term1.pdf', size: '280 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                bankPassbook: { fileName: 'SBI_Passbook_Front.pdf', size: '440 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' }
            }
        },
        'ananya.s@study-world.edu.in': {
            email: 'ananya.s@study-world.edu.in',
            studentId: 'SWCE-2024-CSE-012',
            firstName: 'Ananya',
            lastName: 'Sridhar',
            dob: '2005-02-14',
            gender: 'Female',
            bloodGroup: 'B+',
            aadhar: '482910394812',
            mobile: '9840123456',
            altMobile: '9840123457',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            community: 'OC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641004',
            addressPerm: '18, Bharathi Colony, Peelamedu, Coimbatore - 641004',
            addressCurr: '18, Bharathi Colony, Peelamedu, Coimbatore - 641004',
            dept: 'CSE',
            year: 'III',
            semester: '6',
            batch: '2024-2028',
            admType: 'MQ',
            admDate: '2024-08-14',
            tenthSchool: 'Suguna PIP School, Coimbatore',
            tenthPercent: '96.2%',
            tenthYear: '2022',
            tenthBoard: 'CBSE',
            twelfthSchool: 'Suguna PIP School, Coimbatore',
            twelfthPercent: '94.8%',
            twelfthCutoff: 191.0,
            cgpa: 9.35,
            sgpa: 9.42,
            attendance: 98,
            fatherName: 'Sridhar N',
            fatherOcc: 'Senior Manager, IT',
            fatherMobile: '9840123450',
            fatherIncome: '7,50,000',
            motherName: 'Meenakshi S',
            motherOcc: 'Professor',
            motherMobile: '9840123451',
            motherIncome: '5,00,000',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Sridhar N (Father)',
            emergencyMobile: '9840123450',
            familyIncome: '12,50,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 133500,
            feePaid: 133500,
            feeRemaining: 0,
            scholarshipType: 'None',
            scholarshipAmount: '0',
            scholarshipId: '',
            feeRemarks: 'Full fees cleared.',
            accommodation: 'Day Scholar',
            hostelBlock: 'N/A',
            roomNo: 'N/A',
            messType: 'N/A',
            transportMode: 'College Bus',
            busRoute: 'Route 4 (Peelamedu - Gandhipuram - Campus)',
            busStop: 'PSG Tech Bus Stop',
            vehicleNo: 'TN-38-AX-9912',
            bankName: 'HDFC Bank',
            accountHolder: 'Ananya Sridhar',
            accountNo: '50100239481923',
            ifsc: 'HDFC0000219',
            bankBranch: 'Avinashi Road Branch',
            micr: '641240003',
            admissionNo: 'SWCE/ADM/2024/012',
            rollNo: '721124243012',
            regNo: '721124243012',
            quota: 'Management Quota',
            mentorName: 'Dr. P. Senthil Kumar (HOD CSE)',
            mentorEmail: 'hod.cse@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '10-09-2026 10:15 AM',
            hodRemarks: 'All verified. First class with distinction candidate.',
            lastUpdated: Date.now() - 10000000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Ananya.pdf', size: '280 KB', uploadedAt: '05-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_CBSE_Ananya.pdf', size: '540 KB', uploadedAt: '05-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_CBSE_Ananya.pdf', size: '590 KB', uploadedAt: '05-09-2026', verified: true, status: 'Verified' }
            }
        },
        'karthik.r@study-world.edu.in': {
            email: 'karthik.r@study-world.edu.in',
            studentId: 'SWCE-2024-CSE-045',
            firstName: 'Karthik',
            lastName: 'Ramasamy',
            dob: '2004-11-20',
            gender: 'Male',
            bloodGroup: 'A+',
            aadhar: '891029384712',
            mobile: '9789012345',
            altMobile: '9789012346',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
            community: 'MBC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Tiruppur',
            state: 'Tamil Nadu',
            pincode: '641602',
            addressPerm: '102, Cotton Mill Road, Tiruppur - 641602',
            addressCurr: 'SWCE Kurinji Hostel, Room 108',
            dept: 'CSE',
            year: 'III',
            semester: '6',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-10',
            tenthSchool: 'Govt Model Hr Sec School, Tiruppur',
            tenthPercent: '89.4%',
            tenthYear: '2022',
            tenthBoard: 'State Board',
            twelfthSchool: 'Govt Model Hr Sec School, Tiruppur',
            twelfthPercent: '88.2%',
            twelfthCutoff: 182.0,
            cgpa: 8.12,
            sgpa: 8.25,
            attendance: 91,
            fatherName: 'Ramasamy P',
            fatherOcc: 'Textile Supervisor',
            fatherMobile: '9789012340',
            fatherIncome: '1,40,000',
            motherName: 'Selvi R',
            motherOcc: 'Homemaker',
            motherMobile: '',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Ramasamy P (Father)',
            emergencyMobile: '9789012340',
            familyIncome: '1,40,000',
            siblingsCount: 2,
            firstGraduate: 'Yes',
            feeTotal: 133500,
            feePaid: 75000,
            feeRemaining: 58500,
            scholarshipType: 'First Graduate Scheme',
            scholarshipAmount: '25,000',
            scholarshipId: 'FG-TN-2026-0921',
            feeRemarks: 'Term 2 pending.',
            accommodation: 'Hosteller',
            hostelBlock: 'Kurinji Block',
            roomNo: '108',
            messType: 'Non-Veg',
            transportMode: 'Hostel Walk',
            busRoute: 'N/A',
            busStop: 'Campus',
            vehicleNo: 'N/A',
            bankName: 'Canara Bank',
            accountHolder: 'Karthik Ramasamy',
            accountNo: '124910283719',
            ifsc: 'CNRB0001829',
            bankBranch: 'Tiruppur Main Branch',
            micr: '641015003',
            admissionNo: 'SWCE/ADM/2024/045',
            rollNo: '721124243045',
            regNo: '721124243045',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. P. Senthil Kumar (HOD CSE)',
            mentorEmail: 'hod.cse@study-world.edu.in',
            verifiedByHOD: false,
            locked: false,
            verifiedDate: 'Pending Review',
            hodRemarks: 'FG certificate under verification with Revenue Dept.',
            lastUpdated: Date.now() - 5000000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Karthik.pdf', size: '305 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' },
                firstGraduate: { fileName: 'FG_Certificate.pdf', size: '420 KB', uploadedAt: '10-09-2026', verified: false, status: 'Pending' },
                income: { fileName: 'Income_Tahsildar.pdf', size: '380 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' }
            }
        },
        'priya.k@study-world.edu.in': {
            email: 'priya.k@study-world.edu.in',
            studentId: 'SWCE-2023-ECE-029',
            firstName: 'Priya',
            lastName: 'Kumaran',
            dob: '2003-09-08',
            gender: 'Female',
            bloodGroup: 'AB+',
            aadhar: '384910294819',
            mobile: '9842109876',
            altMobile: '',
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
            community: 'SC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Pollachi',
            state: 'Tamil Nadu',
            pincode: '642001',
            addressPerm: '5/12, New Gandhi Street, Mahalingapuram, Pollachi - 642001',
            addressCurr: 'SWCE Kurinji Girls Hostel, Room 302',
            dept: 'ECE',
            year: 'IV',
            semester: '8',
            batch: '2023-2027',
            admType: 'GQ',
            admDate: '2023-08-20',
            tenthSchool: 'Municipal Girls Hr Sec School, Pollachi',
            tenthPercent: '94.5%',
            tenthYear: '2021',
            tenthBoard: 'State Board',
            twelfthSchool: 'Municipal Girls Hr Sec School, Pollachi',
            twelfthPercent: '92.0%',
            twelfthCutoff: 188.0,
            cgpa: 8.92,
            sgpa: 9.10,
            attendance: 96,
            fatherName: 'Kumaran M',
            fatherOcc: 'Govt Employee',
            fatherMobile: '9842109870',
            fatherIncome: '2,20,000',
            motherName: 'Kavitha K',
            motherOcc: 'Teacher',
            motherMobile: '9842109871',
            motherIncome: '1,80,000',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Kumaran M (Father)',
            emergencyMobile: '9842109870',
            familyIncome: '4,00,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 125000,
            feePaid: 125000,
            feeRemaining: 0,
            scholarshipType: 'Post Matric Scholarship',
            scholarshipAmount: '35,000',
            scholarshipId: 'PMS-TN-2026-3391',
            feeRemarks: 'Fees settled via scholarship & self.',
            accommodation: 'Hosteller',
            hostelBlock: 'Girls Hostel B',
            roomNo: '302',
            messType: 'Veg',
            transportMode: 'Hostel Walk',
            busRoute: 'N/A',
            busStop: 'Campus',
            vehicleNo: 'N/A',
            bankName: 'Indian Overseas Bank (IOB)',
            accountHolder: 'Priya Kumaran',
            accountNo: '028101000049182',
            ifsc: 'IOBA0000281',
            bankBranch: 'Pollachi Main Branch',
            micr: '642020002',
            admissionNo: 'SWCE/ADM/2023/029',
            rollNo: '721123244029',
            regNo: '721123244029',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. S. Prakash (HOD ECE)',
            mentorEmail: 'hod.ece@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '02-09-2026 04:00 PM',
            hodRemarks: 'Verified all 8 categories.',
            lastUpdated: Date.now() - 15000000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Priya.pdf', size: '310 KB', uploadedAt: '01-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Priya.pdf', size: '490 KB', uploadedAt: '01-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Priya.pdf', size: '510 KB', uploadedAt: '01-09-2026', verified: true, status: 'Verified' }
            }
        },
        'kaviya.v@study-world.edu.in': {
            email: 'kaviya.v@study-world.edu.in',
            studentId: 'SWCE-2024-ECE-018',
            firstName: 'Kaviya',
            lastName: 'Venkatesh',
            dob: '2005-04-12',
            gender: 'Female',
            bloodGroup: 'B+',
            aadhar: '583920194821',
            mobile: '9786123456',
            altMobile: '9786123450',
            photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
            community: 'BC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641012',
            addressPerm: '24, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
            addressCurr: '24, Cross Cut Road, Gandhipuram, Coimbatore - 641012',
            dept: 'ECE',
            year: 'II',
            semester: '3',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-16',
            tenthSchool: 'Avila Convent, Coimbatore',
            tenthPercent: '91.8%',
            tenthYear: '2022',
            tenthBoard: 'Matriculation',
            twelfthSchool: 'Avila Convent, Coimbatore',
            twelfthPercent: '88.4%',
            twelfthCutoff: 182.0,
            cgpa: 8.40,
            sgpa: 8.50,
            attendance: 93,
            fatherName: 'Venkatesh S',
            fatherOcc: 'Retail Merchant',
            fatherMobile: '9786123450',
            fatherIncome: '3,00,000',
            motherName: 'Radha V',
            motherOcc: 'Homemaker',
            motherMobile: '9786123451',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Venkatesh S (Father)',
            emergencyMobile: '9786123450',
            familyIncome: '3,00,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 125000,
            feePaid: 70000,
            feeRemaining: 55000,
            scholarshipType: 'None',
            scholarshipAmount: '0',
            scholarshipId: '',
            feeRemarks: 'Term 2 fees pending.',
            accommodation: 'Day Scholar',
            hostelBlock: 'N/A',
            roomNo: 'N/A',
            messType: 'N/A',
            transportMode: 'College Bus',
            busRoute: 'Route 4B - Gandhipuram',
            busStop: 'Cross Cut Signal',
            vehicleNo: 'TN 38 AH 9981',
            bankName: 'Indian Bank',
            accountHolder: 'Kaviya Venkatesh',
            accountNo: '62910293847',
            ifsc: 'IDIB000G012',
            bankBranch: 'Gandhipuram Branch',
            micr: '641019005',
            admissionNo: 'SWCE/ADM/2024/018',
            rollNo: '721124244018',
            regNo: '721124244018',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. S. Prakash (HOD ECE)',
            mentorEmail: 'hod.ece@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '14-09-2026 10:00 AM',
            hodRemarks: 'Documents and fees structure verified.',
            lastUpdated: Date.now() - 4200000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Kaviya.pdf', size: '315 KB', uploadedAt: '11-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Kaviya.pdf', size: '475 KB', uploadedAt: '11-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Kaviya.pdf', size: '515 KB', uploadedAt: '11-09-2026', verified: true, status: 'Verified' }
            }
        },
        'suresh.k@study-world.edu.in': {
            email: 'suresh.k@study-world.edu.in',
            studentId: 'SWCE-2023-MECH-034',
            firstName: 'Suresh',
            lastName: 'Kumar',
            dob: '2004-03-25',
            gender: 'Male',
            bloodGroup: 'O+',
            aadhar: '928374619283',
            mobile: '9843210987',
            altMobile: '9843210980',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
            community: 'BC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Salem',
            state: 'Tamil Nadu',
            pincode: '636007',
            addressPerm: '88, Steel Plant Road, Salem - 636007',
            addressCurr: 'SWCE Marutham Boys Hostel, Room 112',
            dept: 'MECH',
            year: 'III',
            semester: '6',
            batch: '2023-2027',
            admType: 'GQ',
            admDate: '2023-08-18',
            tenthSchool: 'Govt Model Hr Sec School, Salem',
            tenthPercent: '87.2%',
            tenthYear: '2021',
            tenthBoard: 'State Board',
            twelfthSchool: 'Govt Model Hr Sec School, Salem',
            twelfthPercent: '84.6%',
            twelfthCutoff: 174.5,
            cgpa: 7.95,
            sgpa: 8.10,
            attendance: 90,
            fatherName: 'Krishnan P',
            fatherOcc: 'Steel Plant Technician',
            fatherMobile: '9843210980',
            fatherIncome: '2,40,000',
            motherName: 'Mallika K',
            motherOcc: 'Homemaker',
            motherMobile: '9843210981',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Krishnan P (Father)',
            emergencyMobile: '9843210980',
            familyIncome: '2,40,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 135000,
            feePaid: 120000,
            feeRemaining: 15000,
            scholarshipType: 'BC Welfare Scholarship',
            scholarshipAmount: '12,500',
            scholarshipId: 'BCW-TN-2025-4491',
            feeRemarks: 'Hostel mess fee installment remaining ₹15,000.',
            accommodation: 'Hosteller',
            hostelBlock: 'Marutham Boys Block B',
            roomNo: '112',
            messType: 'Non-Veg',
            transportMode: 'Hostel Walk',
            busRoute: 'N/A',
            busStop: 'Campus',
            vehicleNo: 'N/A',
            bankName: 'State Bank of India',
            accountHolder: 'Suresh Kumar',
            accountNo: '30928194829',
            ifsc: 'SBIN0000912',
            bankBranch: 'Salem Town Branch',
            micr: '636002008',
            admissionNo: 'SWCE/ADM/2023/034',
            rollNo: '721123245034',
            regNo: '721123245034',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. M. Muruganandam (HOD MECH)',
            mentorEmail: 'hod.mech@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '12-09-2026 03:30 PM',
            hodRemarks: 'Verified mechanical workshop credentials and records.',
            lastUpdated: Date.now() - 6000000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Suresh.pdf', size: '325 KB', uploadedAt: '09-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Suresh.pdf', size: '480 KB', uploadedAt: '09-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Suresh.pdf', size: '520 KB', uploadedAt: '09-09-2026', verified: true, status: 'Verified' }
            }
        },
        'vignesh.k@study-world.edu.in': {
            email: 'vignesh.k@study-world.edu.in',
            studentId: 'SWCE-2024-MECH-051',
            firstName: 'Vigneshwaran',
            lastName: 'K',
            dob: '2005-07-19',
            gender: 'Male',
            bloodGroup: 'A1B+',
            aadhar: '839201948273',
            mobile: '9894123456',
            altMobile: '9894123450',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
            community: 'MBC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641008',
            addressPerm: '10, Thondamuthur Road, Vadavalli, Coimbatore - 641008',
            addressCurr: '10, Thondamuthur Road, Vadavalli, Coimbatore - 641008',
            dept: 'MECH',
            year: 'II',
            semester: '4',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-22',
            tenthSchool: 'Chinmaya Vidyalaya, Vadavalli',
            tenthPercent: '89.0%',
            tenthYear: '2022',
            tenthBoard: 'CBSE',
            twelfthSchool: 'Chinmaya Vidyalaya, Vadavalli',
            twelfthPercent: '86.0%',
            twelfthCutoff: 177.0,
            cgpa: 8.22,
            sgpa: 8.35,
            attendance: 92,
            fatherName: 'Kandasamy M',
            fatherOcc: 'Workshop Owner',
            fatherMobile: '9894123450',
            fatherIncome: '3,20,000',
            motherName: 'Geetha K',
            motherOcc: 'Homemaker',
            motherMobile: '9894123451',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Kandasamy M (Father)',
            emergencyMobile: '9894123450',
            familyIncome: '3,20,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 135000,
            feePaid: 135000,
            feeRemaining: 0,
            scholarshipType: 'None',
            scholarshipAmount: '0',
            scholarshipId: '',
            feeRemarks: 'Full fee paid.',
            accommodation: 'Day Scholar',
            hostelBlock: 'N/A',
            roomNo: 'N/A',
            messType: 'N/A',
            transportMode: 'Two Wheeler',
            busRoute: 'N/A',
            busStop: 'Vadavalli',
            vehicleNo: 'TN 38 DD 7112',
            bankName: 'Karur Vysya Bank',
            accountHolder: 'Vigneshwaran K',
            accountNo: '1628101029384',
            ifsc: 'KVBL0001628',
            bankBranch: 'Vadavalli Branch',
            micr: '641053008',
            admissionNo: 'SWCE/ADM/2024/051',
            rollNo: '721124245051',
            regNo: '721124245051',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. M. Muruganandam (HOD MECH)',
            mentorEmail: 'hod.mech@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '16-09-2026 11:45 AM',
            hodRemarks: 'Verified.',
            lastUpdated: Date.now() - 7200000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Vignesh.pdf', size: '330 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Vignesh.pdf', size: '490 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Vignesh.pdf', size: '530 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' }
            }
        },
        'sneha.r@study-world.edu.in': {
            email: 'sneha.r@study-world.edu.in',
            studentId: 'SWCE-2024-AIDS-019',
            firstName: 'Sneha',
            lastName: 'Ramakrishnan',
            dob: '2005-08-30',
            gender: 'Female',
            bloodGroup: 'O-',
            aadhar: '629102938471',
            mobile: '9790123456',
            altMobile: '9790123450',
            photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
            community: 'BC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Pollachi',
            state: 'Tamil Nadu',
            pincode: '642002',
            addressPerm: '14, Palakkad Main Road, Pollachi - 642002',
            addressCurr: '14, Palakkad Main Road, Pollachi - 642002',
            dept: 'AIDS',
            year: 'II',
            semester: '4',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-11',
            tenthSchool: 'Sri Lathangi Vidya Mandir, Pollachi',
            tenthPercent: '97.4%',
            tenthYear: '2022',
            tenthBoard: 'Matriculation',
            twelfthSchool: 'Sri Lathangi Vidya Mandir, Pollachi',
            twelfthPercent: '96.2%',
            twelfthCutoff: 195.0,
            cgpa: 9.35,
            sgpa: 9.50,
            attendance: 98,
            fatherName: 'Ramakrishnan T',
            fatherOcc: 'Accountant',
            fatherMobile: '9790123450',
            fatherIncome: '2,80,000',
            motherName: 'Devi R',
            motherOcc: 'Homemaker',
            motherMobile: '9790123451',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Ramakrishnan T (Father)',
            emergencyMobile: '9790123450',
            familyIncome: '2,80,000',
            siblingsCount: 1,
            firstGraduate: 'Yes',
            feeTotal: 133500,
            feePaid: 133500,
            feeRemaining: 0,
            scholarshipType: 'First Graduate + DOTE AI Merit',
            scholarshipAmount: '35,000',
            scholarshipId: 'FG-TN-2024-99128',
            feeRemarks: 'Full fees cleared via scholarship & demand draft.',
            accommodation: 'Day Scholar',
            hostelBlock: 'N/A',
            roomNo: 'N/A',
            messType: 'N/A',
            transportMode: 'College Bus',
            busRoute: 'Route 12 - Pollachi Direct',
            busStop: 'Pollachi Old Bus Stand',
            vehicleNo: 'TN 38 CN 1928',
            bankName: 'City Union Bank (CUB)',
            accountHolder: 'Sneha Ramakrishnan',
            accountNo: '510909010029384',
            ifsc: 'CIUB0000510',
            bankBranch: 'Pollachi Branch',
            micr: '642054002',
            admissionNo: 'SWCE/ADM/2024/019',
            rollNo: '721124248019',
            regNo: '721124248019',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. K. Ramesh (HOD AI&DS)',
            mentorEmail: 'hod.aids@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '11-09-2026 09:30 AM',
            hodRemarks: 'Exemplary academic record. First Graduate verified.',
            lastUpdated: Date.now() - 3200000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Sneha.pdf', size: '310 KB', uploadedAt: '07-09-2026', verified: true, status: 'Verified' },
                firstGraduate: { fileName: 'FG_Sneha_Tahsildar.pdf', size: '440 KB', uploadedAt: '07-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Sneha.pdf', size: '460 KB', uploadedAt: '07-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Sneha.pdf', size: '505 KB', uploadedAt: '07-09-2026', verified: true, status: 'Verified' }
            }
        },
        'mohamed.arif@study-world.edu.in': {
            email: 'mohamed.arif@study-world.edu.in',
            studentId: 'SWCE-2024-AIDS-042',
            firstName: 'Mohamed',
            lastName: 'Arif',
            dob: '2004-12-05',
            gender: 'Male',
            bloodGroup: 'B+',
            aadhar: '739281948291',
            mobile: '9840912345',
            altMobile: '9840912340',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            community: 'BCM',
            religion: 'Muslim',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641001',
            addressPerm: '29, Ukkadam Big Bazaar, Coimbatore - 641001',
            addressCurr: 'SWCE Campus Hostel, Room 305-A, Kurinji Block',
            dept: 'AIDS',
            year: 'III',
            semester: '5',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-15',
            tenthSchool: 'Al-Ameen Hr Sec School, Coimbatore',
            tenthPercent: '90.5%',
            tenthYear: '2022',
            tenthBoard: 'State Board',
            twelfthSchool: 'Al-Ameen Hr Sec School, Coimbatore',
            twelfthPercent: '89.2%',
            twelfthCutoff: 184.5,
            cgpa: 8.65,
            sgpa: 8.80,
            attendance: 95,
            fatherName: 'Abdul Rahman M',
            fatherOcc: 'Automobile Spare Parts Merchant',
            fatherMobile: '9840912340',
            fatherIncome: '2,60,000',
            motherName: 'Fathima A',
            motherOcc: 'Homemaker',
            motherMobile: '9840912341',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Abdul Rahman M (Father)',
            emergencyMobile: '9840912340',
            familyIncome: '2,60,000',
            siblingsCount: 2,
            firstGraduate: 'No',
            feeTotal: 133500,
            feePaid: 103500,
            feeRemaining: 30000,
            scholarshipType: 'Minority Welfare Scholarship (MOMA)',
            scholarshipAmount: '20,000',
            scholarshipId: 'MOMA-TN-2025-0192',
            feeRemarks: 'MOMA portal verification approved.',
            accommodation: 'Hosteller',
            hostelBlock: 'Kurinji Boys Block A',
            roomNo: '305-A',
            messType: 'Non-Veg',
            transportMode: 'Hostel Walk',
            busRoute: 'N/A',
            busStop: 'Campus',
            vehicleNo: 'N/A',
            bankName: 'Axis Bank',
            accountHolder: 'Mohamed Arif',
            accountNo: '92101002938475',
            ifsc: 'UTIB0000342',
            bankBranch: 'Ukkadam Branch',
            micr: '641211003',
            admissionNo: 'SWCE/ADM/2024/042',
            rollNo: '721124248042',
            regNo: '721124248042',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. K. Ramesh (HOD AI&DS)',
            mentorEmail: 'hod.aids@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '15-09-2026 03:00 PM',
            hodRemarks: 'Minority welfare documents verified.',
            lastUpdated: Date.now() - 4800000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Arif.pdf', size: '315 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                community: { fileName: 'Community_BCM.pdf', size: '360 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Arif.pdf', size: '480 KB', uploadedAt: '12-09-2026', verified: true, status: 'Verified' }
            }
        },
        'dinesh.m@study-world.edu.in': {
            email: 'dinesh.m@study-world.edu.in',
            studentId: 'SWCE-2023-CIVIL-015',
            firstName: 'Dinesh',
            lastName: 'Murugan',
            dob: '2003-10-14',
            gender: 'Male',
            bloodGroup: 'B+',
            aadhar: '839281948291',
            mobile: '9842912345',
            altMobile: '9842912340',
            photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
            community: 'MBC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Erode',
            state: 'Tamil Nadu',
            pincode: '638001',
            addressPerm: '45, Perundurai Road, Erode - 638001',
            addressCurr: 'SWCE Marutham Boys Hostel, Room 210',
            dept: 'CIVIL',
            year: 'IV',
            semester: '7',
            batch: '2023-2027',
            admType: 'GQ',
            admDate: '2023-08-25',
            tenthSchool: 'Govt Model Hr Sec School, Erode',
            tenthPercent: '88.0%',
            tenthYear: '2021',
            tenthBoard: 'State Board',
            twelfthSchool: 'Govt Model Hr Sec School, Erode',
            twelfthPercent: '85.4%',
            twelfthCutoff: 176.0,
            cgpa: 8.10,
            sgpa: 8.25,
            attendance: 91,
            fatherName: 'Murugan S',
            fatherOcc: 'Civil Contractor',
            fatherMobile: '9842912340',
            fatherIncome: '2,50,000',
            motherName: 'Parvathi M',
            motherOcc: 'Homemaker',
            motherMobile: '9842912341',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Murugan S (Father)',
            emergencyMobile: '9842912340',
            familyIncome: '2,50,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 125000,
            feePaid: 125000,
            feeRemaining: 0,
            scholarshipType: 'None',
            scholarshipAmount: '0',
            scholarshipId: '',
            feeRemarks: 'Tuition and laboratory fee cleared.',
            accommodation: 'Hosteller',
            hostelBlock: 'Marutham Boys Block B',
            roomNo: '210',
            messType: 'Non-Veg',
            transportMode: 'Hostel Walk',
            busRoute: 'N/A',
            busStop: 'Campus',
            vehicleNo: 'N/A',
            bankName: 'Canara Bank',
            accountHolder: 'Dinesh Murugan',
            accountNo: '2819101029384',
            ifsc: 'CNRB0002819',
            bankBranch: 'Erode Main Branch',
            micr: '638015002',
            admissionNo: 'SWCE/ADM/2023/015',
            rollNo: '721123242015',
            regNo: '721123242015',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. C. Natarajan (HOD CIVIL)',
            mentorEmail: 'hod.civil@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '10-09-2026 05:00 PM',
            hodRemarks: 'Verified surveying and internship records.',
            lastUpdated: Date.now() - 8400000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Dinesh.pdf', size: '320 KB', uploadedAt: '08-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Dinesh.pdf', size: '475 KB', uploadedAt: '08-09-2026', verified: true, status: 'Verified' }
            }
        },
        'arvind.s@study-world.edu.in': {
            email: 'arvind.s@study-world.edu.in',
            studentId: 'SWCE-2024-EEE-022',
            firstName: 'Arvind',
            lastName: 'Swaminathan',
            dob: '2004-10-18',
            gender: 'Male',
            bloodGroup: 'O+',
            aadhar: '938201948291',
            mobile: '9843912345',
            altMobile: '9843912340',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
            community: 'OC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641004',
            addressPerm: '12, Bharathi Park 7th Cross, Saibaba Colony, Coimbatore - 641004',
            addressCurr: '12, Bharathi Park 7th Cross, Saibaba Colony, Coimbatore - 641004',
            dept: 'EEE',
            year: 'III',
            semester: '6',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-17',
            tenthSchool: 'Lisieux Matric Hr Sec School, Saibaba Colony',
            tenthPercent: '92.4%',
            tenthYear: '2022',
            tenthBoard: 'Matriculation',
            twelfthSchool: 'Lisieux Matric Hr Sec School, Saibaba Colony',
            twelfthPercent: '90.0%',
            twelfthCutoff: 185.0,
            cgpa: 8.52,
            sgpa: 8.70,
            attendance: 94,
            fatherName: 'Swaminathan K',
            fatherOcc: 'Electrical Engineer (TANGEDCO)',
            fatherMobile: '9843912340',
            fatherIncome: '5,00,000',
            motherName: 'Uma S',
            motherOcc: 'School Teacher',
            motherMobile: '9843912341',
            motherIncome: '3,00,000',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Swaminathan K (Father)',
            emergencyMobile: '9843912340',
            familyIncome: '8,00,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 133500,
            feePaid: 113500,
            feeRemaining: 20000,
            scholarshipType: 'None',
            scholarshipAmount: '0',
            scholarshipId: '',
            feeRemarks: 'Term 2 examination fee balance ₹20,000.',
            accommodation: 'Day Scholar',
            hostelBlock: 'N/A',
            roomNo: 'N/A',
            messType: 'N/A',
            transportMode: 'College Bus',
            busRoute: 'Route 3 - Saibaba Colony & Thudiyalur',
            busStop: 'Saibaba Colony NSR Road',
            vehicleNo: 'TN 38 BE 5541',
            bankName: 'State Bank of India',
            accountHolder: 'Arvind Swaminathan',
            accountNo: '39281019283',
            ifsc: 'SBIN0007238',
            bankBranch: 'Saibaba Colony Branch',
            micr: '641002028',
            admissionNo: 'SWCE/ADM/2024/022',
            rollNo: '721124246022',
            regNo: '721124246022',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. V. Karthikeyan (HOD EEE)',
            mentorEmail: 'hod.eee@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '14-09-2026 02:00 PM',
            hodRemarks: 'Circuits laboratory clearance verified.',
            lastUpdated: Date.now() - 5600000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Arvind.pdf', size: '310 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Arvind.pdf', size: '480 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Arvind.pdf', size: '520 KB', uploadedAt: '10-09-2026', verified: true, status: 'Verified' }
            }
        },
        'divya.r@study-world.edu.in': {
            email: 'divya.r@study-world.edu.in',
            studentId: 'SWCE-2024-IT-014',
            firstName: 'Divya',
            lastName: 'Ramesh',
            dob: '2005-01-20',
            gender: 'Female',
            bloodGroup: 'A+',
            aadhar: '482910394829',
            mobile: '9840212345',
            altMobile: '9840212340',
            photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
            community: 'BC',
            religion: 'Hindu',
            motherTongue: 'Tamil',
            nationality: 'Indian',
            district: 'Coimbatore',
            state: 'Tamil Nadu',
            pincode: '641006',
            addressPerm: '82, Sathy Main Road, Ganapathy, Coimbatore - 641006',
            addressCurr: '82, Sathy Main Road, Ganapathy, Coimbatore - 641006',
            dept: 'IT',
            year: 'II',
            semester: '3',
            batch: '2024-2028',
            admType: 'GQ',
            admDate: '2024-08-13',
            tenthSchool: 'CMS Matric Hr Sec School, Ganapathy',
            tenthPercent: '95.0%',
            tenthYear: '2022',
            tenthBoard: 'Matriculation',
            twelfthSchool: 'CMS Matric Hr Sec School, Ganapathy',
            twelfthPercent: '93.2%',
            twelfthCutoff: 190.0,
            cgpa: 8.88,
            sgpa: 9.05,
            attendance: 96,
            fatherName: 'Ramesh B',
            fatherOcc: 'Textile Machinery Spares',
            fatherMobile: '9840212340',
            fatherIncome: '3,80,000',
            motherName: 'Shanthi R',
            motherOcc: 'Homemaker',
            motherMobile: '9840212341',
            motherIncome: '0',
            guardianName: '',
            guardianRel: '',
            guardianMobile: '',
            emergencyContact: 'Ramesh B (Father)',
            emergencyMobile: '9840212340',
            familyIncome: '3,80,000',
            siblingsCount: 1,
            firstGraduate: 'No',
            feeTotal: 133500,
            feePaid: 133500,
            feeRemaining: 0,
            scholarshipType: 'None',
            scholarshipAmount: '0',
            scholarshipId: '',
            feeRemarks: 'Cleared full year.',
            accommodation: 'Day Scholar',
            hostelBlock: 'N/A',
            roomNo: 'N/A',
            messType: 'N/A',
            transportMode: 'College Bus',
            busRoute: 'Route 8 - Ganapathy & Sathy Road',
            busStop: 'Ganapathy Bus Stand',
            vehicleNo: 'TN 38 BK 2918',
            bankName: 'Punjab National Bank',
            accountHolder: 'Divya Ramesh',
            accountNo: '1829100293847',
            ifsc: 'PUNB0018291',
            bankBranch: 'Ganapathy Branch',
            micr: '641024003',
            admissionNo: 'SWCE/ADM/2024/014',
            rollNo: '721124247014',
            regNo: '721124247014',
            quota: 'Government Quota (TNEA)',
            mentorName: 'Dr. G. Anand (HOD IT)',
            mentorEmail: 'hod.it@study-world.edu.in',
            verifiedByHOD: true,
            locked: true,
            verifiedDate: '13-09-2026 04:30 PM',
            hodRemarks: 'Full profile and documents verified.',
            lastUpdated: Date.now() - 6400000,
            documents: {
                aadharFront: { fileName: 'Aadhar_Divya.pdf', size: '320 KB', uploadedAt: '09-09-2026', verified: true, status: 'Verified' },
                tenthMarksheet: { fileName: '10th_Divya.pdf', size: '480 KB', uploadedAt: '09-09-2026', verified: true, status: 'Verified' },
                twelfthMarksheet: { fileName: '12th_Divya.pdf', size: '510 KB', uploadedAt: '09-09-2026', verified: true, status: 'Verified' }
            }
        }
    };

    // Attach Sakthi Madhavan aliases
    const sakthiAliases = [
        'student_001@study-world.edu.in',
        'madhavan2006sakthi@gmail.com',
        'sakthi@study-world.edu.in',
        'student_001'
    ];
    sakthiAliases.forEach(alias => {
        defaultStudents[alias] = {
            ...defaultStudents['student@study-world.edu.in'],
            email: alias
        };
    });

    let modified = false;
    for (const email in defaultStudents) {
        if (!store[email]) {
            store[email] = defaultStudents[email];
            modified = true;
        }
    }

    if (modified || Object.keys(store).length === 0) {
        localStorage.setItem('swce_student_master_data', JSON.stringify(store));
    }

    // Sync master data to staff student profiles
    syncMasterDataToStaffProfiles(store);
}

// Function to synchronize master data with staff profiles view
function syncMasterDataToStaffProfiles(store) {
    try {
        let staffProfiles = JSON.parse(localStorage.getItem('swce_student_profiles') || '{}');
        const uniqueStudents = {};
        for (const email in store) {
            const s = store[email];
            const roll = s.rollNo || s.regNo;
            if (roll && !uniqueStudents[roll]) {
                uniqueStudents[roll] = s;
            }
        }
        for (const roll in uniqueStudents) {
            const s = uniqueStudents[roll];
            const studentEmail = s.email || 'student@study-world.edu.in';
            staffProfiles[studentEmail] = {
                studentName: s.firstName + ' ' + s.lastName,
                regNo: s.regNo || s.rollNo,
                rollNo: s.rollNo,
                dept: s.dept || 'CSE',
                year: s.year || 'III',
                semester: String(s.semester || '6'),
                attendancePercent: s.attendance !== undefined ? s.attendance : 94,
                leavePercent: s.attendance !== undefined ? Math.max(0, 100 - s.attendance) : 6,
                parentNumber: s.fatherMobile || s.motherMobile || '9876543210',
                guardianNumber: s.guardianMobile || s.emergencyMobile || '9876543212',
                studentNumber: s.mobile || '9123456780',
                userMailId: studentEmail,
                subscription: 'Yours obediently',
                studentSignature: s.firstName + ' ' + s.lastName,
                scholarshipType: s.scholarshipType || 'None',
                emisId: s.emisId || ('EMIS-' + (s.rollNo || s.regNo).slice(-6)),
                profilePic: s.photo || '',
                lastUpdated: s.lastUpdated || Date.now()
            };
        }
        localStorage.setItem('swce_student_profiles', JSON.stringify(staffProfiles));
    } catch (e) {
        console.warn('Profile sync error:', e);
    }
}

// Global master restore & sync function
window.restoreAndSyncAllMasterData = function() {
    localStorage.removeItem('swce_student_master_data');
    initStudentMasterDataStore();
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    syncMasterDataToStaffProfiles(store);
    if (typeof filterAllStudentsTable === 'function') filterAllStudentsTable();
    if (typeof renderAllStudentsStats === 'function') renderAllStudentsStats();
    if (typeof renderStaffStudentTable === 'function') renderStaffStudentTable();
    if (typeof loadStudentMasterDataPage === 'function' && !document.getElementById('page-student-master-data')?.classList.contains('hidden')) {
        loadStudentMasterDataPage();
    }
    if (typeof showToast === 'function') showToast('✓ All student master records and document registries fully restored and synchronized!');
};

let activeEditingStudentEmail = null;

function editStudentMasterData(studentEmail) {
    const role = (window.currentUserRole || '').toLowerCase();
    if (role === 'hod' || role === 'principal') {
        if (typeof showMasterToast === 'function') {
            showMasterToast('HOD and Principal have View-Only access. Data updates can only be performed by Faculty and Students.', 'info');
        }
        openFullProfileModal(studentEmail);
        return;
    }
    activeEditingStudentEmail = studentEmail.toLowerCase().trim();
    if (typeof showPage === 'function') {
        showPage('student-master-data');
    }
    if (typeof showMasterToast === 'function') {
        showMasterToast('Editing Master Data for ' + studentEmail, 'info');
    }
}

function loadStudentMasterDataPage() {
    initStudentMasterDataStore();
    const currentUserObj = window.currentUser || {};
    const rawEmail = (currentUserObj.email || 'student@study-world.edu.in').toLowerCase().trim();
    const username = (currentUserObj.username || '').toLowerCase().trim();
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');

    // Resolve profile
    let profile = null;
    if (activeEditingStudentEmail && store[activeEditingStudentEmail]) {
        profile = store[activeEditingStudentEmail];
    } else {
        profile = store[rawEmail];
    }
    if (!profile) {
        const isSakthi = rawEmail.includes('sakthi') || rawEmail.includes('madhavan') || rawEmail.includes('student_001') || rawEmail === 'student@study-world.edu.in' || username === 'student_001' || (currentUserObj.name && currentUserObj.name.toLowerCase().includes('sakthi'));
        if (isSakthi) {
            profile = store['student@study-world.edu.in'] || store['student_001@study-world.edu.in'] || store['madhavan2006sakthi@gmail.com'];
        }
    }

    // If still not found, check by username or rollNo
    if (!profile) {
        for (const k in store) {
            if (store[k].rollNo === username || store[k].studentId === username || store[k].email.toLowerCase() === rawEmail) {
                profile = store[k];
                break;
            }
        }
    }

    // If still not found, clone Sakthi's full profile so documents and verified state are fully intact
    if (!profile) {
        const base = store['student@study-world.edu.in'] || Object.values(store)[0];
        profile = JSON.parse(JSON.stringify(base));
        profile.email = rawEmail;
        store[rawEmail] = profile;
        localStorage.setItem('swce_student_master_data', JSON.stringify(store));
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined ? val : '';
    };
    const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt !== undefined ? txt : '';
    };

    setVal('smd_firstName', profile.firstName);
    setVal('smd_lastName', profile.lastName);
    setVal('smd_dob', profile.dob);
    setVal('smd_gender', profile.gender || 'Male');
    setVal('smd_bloodGroup', profile.bloodGroup || 'O+');
    setVal('smd_aadhar', profile.aadhar);
    setVal('smd_mobile', profile.mobile);
    setVal('smd_altMobile', profile.altMobile);
    setVal('smd_email', profile.email);
    setVal('smd_community', profile.community || 'BC');
    setVal('smd_religion', profile.religion || 'Hindu');
    setVal('smd_motherTongue', profile.motherTongue || 'Tamil');
    setVal('smd_nationality', profile.nationality || 'Indian');
    setVal('smd_district', profile.district || 'Coimbatore');
    setVal('smd_state', profile.state || 'Tamil Nadu');
    setVal('smd_pincode', profile.pincode);
    setVal('smd_addressPerm', profile.addressPerm);
    setVal('smd_addressCurr', profile.addressCurr);

    setText('smd_displayStudentId', profile.studentId || 'SWCE-2024-CSE-067');
    setText('smd_displayRollNo', profile.rollNo || '721124243067');
    setText('smd_displayRegNo', profile.regNo || '721124243067');
    setText('smd_displayBlood', (profile.bloodGroup || 'O+') + 've');

    const photoEl = document.getElementById('smd_photoPreview');
    if (photoEl) {
        photoEl.src = profile.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80';
    }

    // Academic
    setVal('smd_dept', profile.dept || 'CSE');
    setVal('smd_year', profile.year || 'III');
    setVal('smd_sem', profile.semester || '6');
    setVal('smd_batch', profile.batch || '2024 - 2028');
    setVal('smd_admType', profile.admType || 'GQ');
    setVal('smd_admDate', profile.admDate || '2024-08-12');
    setVal('smd_cgpa', profile.cgpa || 8.74);
    setVal('smd_attendance', profile.attendance || 94);
    setVal('smd_tenthSchool', profile.tenthSchool);
    setVal('smd_tenthPercent', profile.tenthPercent);
    setVal('smd_tenthBoard', profile.tenthBoard || 'Tamil Nadu State Board');
    setVal('smd_twelfthSchool', profile.twelfthSchool);
    setVal('smd_twelfthPercent', profile.twelfthPercent);
    setVal('smd_twelfthCutoff', profile.twelfthCutoff || 186.5);

    // Family
    setVal('smd_fatherName', profile.fatherName);
    setVal('smd_fatherOcc', profile.fatherOcc);
    setVal('smd_fatherMobile', profile.fatherMobile);
    setVal('smd_fatherIncome', profile.fatherIncome);
    setVal('smd_motherName', profile.motherName);
    setVal('smd_motherOcc', profile.motherOcc);
    setVal('smd_motherMobile', profile.motherMobile);
    setVal('smd_motherIncome', profile.motherIncome);
    setVal('smd_guardianName', profile.guardianName);
    setVal('smd_guardianRel', profile.guardianRel);
    setVal('smd_guardianMobile', profile.guardianMobile);
    setVal('smd_emergencyMobile', profile.emergencyMobile || profile.fatherMobile);
    setVal('smd_familyIncome', profile.familyIncome);
    setVal('smd_siblingsCount', profile.siblingsCount !== undefined ? profile.siblingsCount : 1);
    setVal('smd_firstGraduateFlag', profile.firstGraduate || 'No');

    // Fees
    setText('smd_feeTotalDisplay', '₹' + (profile.feeTotal ? profile.feeTotal.toLocaleString('en-IN') : '1,33,500'));
    setText('smd_feePaidDisplay', '₹' + (profile.feePaid ? profile.feePaid.toLocaleString('en-IN') : '90,000'));
    setText('smd_feeRemainingDisplay', '₹' + (profile.feeRemaining ? profile.feeRemaining.toLocaleString('en-IN') : '43,500'));
    setVal('smd_scholarshipType', profile.scholarshipType || 'BC/MBC Welfare');
    setVal('smd_scholarshipAmount', profile.scholarshipAmount || '12,500');
    setVal('smd_scholarshipId', profile.scholarshipId || 'BCW-TN-2026-7812');

    // Hostel & Transport
    setVal('smd_accommodation', profile.accommodation || 'Hosteller');
    setVal('smd_hostelBlock', profile.hostelBlock || 'Kurinji Boys Block A');
    setVal('smd_roomNo', profile.roomNo || '204-B');
    setVal('smd_messType', profile.messType || 'Non-Veg');
    setVal('smd_transportMode', profile.transportMode || 'Hostel Walk');
    setVal('smd_busRoute', profile.busRoute || 'N/A');
    setVal('smd_busStop', profile.busStop || 'Campus');

    // Bank
    setVal('smd_bankName', profile.bankName);
    setVal('smd_accountHolder', profile.accountHolder || (profile.firstName + ' ' + profile.lastName));
    setVal('smd_accountNo', profile.accountNo);
    setVal('smd_ifsc', profile.ifsc);
    setVal('smd_bankBranch', profile.bankBranch);
    setVal('smd_micr', profile.micr);

    // Official
    setVal('smd_officialStudentId', profile.studentId || 'SWCE-2024-CSE-067');
    setVal('smd_admissionNo', profile.admissionNo || 'SWCE/ADM/2024/067');
    setVal('smd_officialRegNo', profile.regNo || '721124243067');
    setVal('smd_mentorName', profile.mentorName || 'Dr. P. Senthil Kumar (HOD CSE)');

    const lockBadge = document.getElementById('smd_lockStatusBadge');
    const verBadge = document.getElementById('smd_verificationBadge');
    const submitBtn = document.getElementById('btnSubmitMasterHOD');
    const saveDraftBtn = document.getElementById('btnSaveMasterDraft');

    const activeRole = (window.currentUserRole || 'student').toLowerCase();
    const isHodOrPrincipal = (activeRole === 'hod' || activeRole === 'principal');
    const isFaculty = (activeRole === 'faculty');

    const isLocked = profile.locked || profile.verifiedByHOD;
    if (isLocked) {
        if (lockBadge) {
            lockBadge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1';
            lockBadge.innerHTML = '<span>🔒</span> <span>Profile Locked by HOD</span>';
        }
        if (verBadge) {
            verBadge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300';
            verBadge.textContent = '✓ Verified by HOD';
        }
        setText('smd_officialVerificationStatus', '✓ Verified by HOD');
        setText('smd_officialVerifiedDate', profile.verifiedDate || '15-09-2026 11:30 AM');
        setText('smd_officialLockStatus', '🔒 Locked (Official Record)');
        setText('smd_officialHodRemarks', profile.hodRemarks || 'Approved by HOD.');

        if (activeRole === 'student') {
            document.querySelectorAll('.smd-input').forEach(input => input.disabled = true);
            if (submitBtn) submitBtn.disabled = true;
            if (saveDraftBtn) saveDraftBtn.disabled = true;
        }
    } else {
        if (lockBadge) {
            lockBadge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1';
            lockBadge.innerHTML = '<span>🔓</span> <span>Editable by Student</span>';
        }
        if (verBadge) {
            verBadge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200';
            verBadge.textContent = 'Pending HOD Review';
        }
        setText('smd_officialVerificationStatus', 'Pending HOD Review');
        setText('smd_officialVerifiedDate', 'Awaiting Verification');
        setText('smd_officialLockStatus', '🔓 Unlocked');
        setText('smd_officialHodRemarks', profile.hodRemarks || 'No remarks entered yet.');
        document.querySelectorAll('.smd-input').forEach(input => input.disabled = false);
        if (submitBtn) submitBtn.disabled = false;
        if (saveDraftBtn) saveDraftBtn.disabled = false;
    }

    // Role-specific View-Only vs Editing Enforcement:
    // Faculty and Student can only updates and changes. HOD and Principal can view only.
    if (isHodOrPrincipal) {
        document.querySelectorAll('.smd-input').forEach(input => input.disabled = true);
        if (submitBtn) submitBtn.style.display = 'none';
        if (saveDraftBtn) saveDraftBtn.style.display = 'none';
        if (lockBadge) {
            lockBadge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0A2D6A] border border-blue-200 flex items-center gap-1';
            lockBadge.innerHTML = '<span>👁️</span> <span>' + (activeRole === 'principal' ? 'Principal' : 'HOD') + ' View-Only Mode</span>';
        }
        const notice = document.getElementById('masterDataMandatoryNotice');
        if (notice) {
            notice.className = 'mt-4 p-3 bg-blue-50/90 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-[#0A2D6A]';
            notice.innerHTML = '<span class="text-base flex-shrink-0">👁️</span><div class="flex-1"><span class="font-bold">Administrative View-Only Privilege:</span> Head of Department and Principal have view-only inspection and reporting rights. Only Faculty and Students can update or edit student master records.</div>';
        }
    } else if (isFaculty) {
        document.querySelectorAll('.smd-input').forEach(input => input.disabled = false);
        if (submitBtn) {
            submitBtn.style.display = 'inline-flex';
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>💾</span> <span>Save Student Changes</span>';
        }
        if (saveDraftBtn) {
            saveDraftBtn.style.display = 'inline-flex';
            saveDraftBtn.disabled = false;
        }
        if (lockBadge) {
            lockBadge.className = 'text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1';
            lockBadge.innerHTML = '<span>✏️</span> <span>Faculty Editor Mode</span>';
        }
        const notice = document.getElementById('masterDataMandatoryNotice');
        if (notice) {
            notice.className = 'mt-4 p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900';
            notice.innerHTML = '<span class="text-base flex-shrink-0">✏️</span><div class="flex-1"><span class="font-bold">Faculty Master Data Editor:</span> You have authorization to update and modify academic, personal, marks, and fees records for student <strong>' + (profile.firstName + ' ' + profile.lastName) + '</strong> (' + profile.email + ').</div>';
        }
    }

    renderMasterDocsGrid(profile);
    switchMasterTab(currentActiveMasterTab || 'personal');
}

function renderMasterDocsGrid(profile) {
    const container = document.getElementById('masterDocsGrid');
    if (!container) return;
    const docs = profile.documents || {};
    let uploadedCount = 0;

    let html = '';
    MASTER_DOCS_LIST.forEach(item => {
        const doc = docs[item.key];
        const isUploaded = !!doc;
        if (isUploaded) uploadedCount++;

        let statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Not Uploaded</span>';
        if (isUploaded) {
            if (doc.status === 'Verified') {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>';
            } else if (doc.status === 'Rejected') {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">✗ Rejected</span>';
            } else {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏳ Pending</span>';
            }
        }

        html += '<div class="p-3.5 rounded-2xl border ' + (isUploaded ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/60') + ' hover:shadow-sm transition space-y-2.5">';
        html += '  <div class="flex items-start justify-between gap-2">';
        html += '    <div class="flex items-center gap-2 min-w-0">';
        html += '      <span class="text-xl flex-shrink-0">' + item.icon + '</span>';
        html += '      <div class="min-w-0">';
        html += '        <h4 class="font-bold text-slate-800 text-xs truncate" title="' + item.label + '">' + item.label + '</h4>';
        html += '        <p class="text-[10px] text-slate-500 truncate">' + item.desc + '</p>';
        html += '      </div>';
        html += '    </div>';
        html += statusBadge;
        html += '  </div>';

        if (isUploaded) {
            html += '  <div class="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">';
            html += '    <div class="truncate font-mono font-medium text-slate-700 flex items-center gap-1.5">';
            html += '      <span class="text-xs">📄</span>';
            html += '      <span class="truncate" title="' + doc.fileName + '">' + doc.fileName + '</span>';
            html += '    </div>';
            html += '    <span class="text-[10px] text-slate-400 flex-shrink-0 ml-1">' + (doc.size || '300 KB') + '</span>';
            html += '  </div>';
            html += '  <div class="flex items-center gap-1.5 pt-1">';
            html += '    <button type="button" onclick="openDocPreview(\'' + item.key + '\', \'' + profile.email + '\')" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition text-center">👁️ Preview</button>';
            html += '    <button type="button" onclick="downloadSingleDoc(\'' + item.key + '\', \'' + profile.email + '\')" class="flex-1 py-1.5 bg-[#0A2D6A]/10 hover:bg-[#0A2D6A]/20 text-[#0A2D6A] rounded-lg text-[11px] font-bold transition text-center">⬇️ Download</button>';
            if (!(profile.locked || profile.verifiedByHOD)) {
                html += '    <label for="docUploadInput_' + item.key + '" class="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold cursor-pointer" title="Replace file">🔄</label>';
            }
            html += '  </div>';
        } else {
            html += '  <div class="pt-1">';
            if (!(profile.locked || profile.verifiedByHOD)) {
                html += '    <label for="docUploadInput_' + item.key + '" class="w-full py-2 bg-white border border-dashed border-slate-300 hover:border-[#0A2D6A] text-slate-700 hover:text-[#0A2D6A] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"><span>📁</span> <span>Upload Document (Max 2MB)</span></label>';
            } else {
                html += '    <div class="text-center py-2 text-[11px] text-slate-400 italic bg-slate-100 rounded-xl">Profile locked by HOD</div>';
            }
            html += '  </div>';
        }

        html += '  <input type="file" id="docUploadInput_' + item.key + '" accept=".pdf,.jpg,.jpeg,.png" class="hidden" onchange="handleMasterDocUpload(\'' + item.key + '\', this, \'' + profile.email + '\')">';
        html += '</div>';
    });

    container.innerHTML = html;
    const badge = document.getElementById('smd_docsUploadedBadge');
    if (badge) badge.textContent = uploadedCount + '/' + MASTER_DOCS_LIST.length;
}

function handleMasterPhotoUpload(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a smaller image.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const preview = document.getElementById('smd_photoPreview');
        if (preview) preview.src = dataUrl;

        const email = (window.currentUser && window.currentUser.email) ? window.currentUser.email : 'student@study-world.edu.in';
        const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
        if (store[email]) {
            store[email].photo = dataUrl;
            localStorage.setItem('swce_student_master_data', JSON.stringify(store));
        }
        if (typeof showToast === 'function') showToast('Student Photo updated successfully!');
    };
    reader.readAsDataURL(file);
}

function handleMasterDocUpload(docKey, input, targetEmail) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert('File exceeds 2MB limit. Please compress or select a smaller PDF/JPG.');
        return;
    }

    const email = targetEmail || ((window.currentUser && window.currentUser.email) ? window.currentUser.email : 'student@study-world.edu.in');
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
        if (!store[email]) initStudentMasterDataStore();
        const p = store[email];
        if (!p.documents) p.documents = {};

        p.documents[docKey] = {
            fileName: file.name,
            size: (file.size / 1024).toFixed(0) + ' KB',
            uploadedAt: new Date().toLocaleDateString('en-GB'),
            status: 'Pending',
            dataUrl: dataUrl
        };

        localStorage.setItem('swce_student_master_data', JSON.stringify(store));
        renderMasterDocsGrid(p);
        if (typeof showToast === 'function') showToast('Document uploaded: ' + file.name);
    };
    reader.readAsDataURL(file);
}

function openDocPreview(docKey, studentEmail) {
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const profile = store[studentEmail];
    if (!profile || !profile.documents || !profile.documents[docKey]) {
        alert('Document file not found.');
        return;
    }
    const doc = profile.documents[docKey];
    const meta = MASTER_DOCS_LIST.find(m => m.key === docKey) || { label: 'Document', desc: '' };

    const modal = document.getElementById('docPreviewModal');
    const title = document.getElementById('previewDocTitle');
    const subtitle = document.getElementById('previewDocSubtitle');
    const dlBtn = document.getElementById('previewDocDownloadBtn');
    const body = document.getElementById('previewDocBody');

    if (title) title.textContent = meta.label + ' — ' + (profile.firstName + ' ' + profile.lastName);
    if (subtitle) subtitle.textContent = doc.fileName + ' (' + (doc.size || 'Scanned') + ') • ' + (doc.status || 'Verified');

    if (dlBtn) {
        dlBtn.href = doc.dataUrl || '#';
        dlBtn.download = doc.fileName || 'document.pdf';
        dlBtn.onclick = function() {
            if (!doc.dataUrl) {
                downloadMockDoc(doc.fileName, meta.label, profile);
                return false;
            }
        };
    }

    if (body) {
        if (doc.dataUrl && (doc.dataUrl.startsWith('data:image') || doc.fileName.endsWith('.jpg') || doc.fileName.endsWith('.png'))) {
            body.innerHTML = '<img src="' + doc.dataUrl + '" alt="Document" class="max-h-[70vh] max-w-full rounded-lg shadow-md object-contain border border-slate-300">';
        } else if (doc.dataUrl && doc.dataUrl.startsWith('data:application/pdf')) {
            body.innerHTML = '<iframe src="' + doc.dataUrl + '" class="w-full h-[70vh] rounded-lg border border-slate-300"></iframe>';
        } else {
            body.innerHTML = '<div class="p-8 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-sm max-w-md">' +
                '<span class="text-5xl block">📑</span>' +
                '<h4 class="text-sm font-bold text-slate-800">' + doc.fileName + '</h4>' +
                '<p class="text-xs text-slate-500">Official verified digital institutional archive for Study World College of Engineering.</p>' +
                '<div class="p-3 bg-slate-50 rounded-xl text-[11px] font-mono text-left space-y-1">' +
                '  <div><span class="text-slate-400">Student:</span> ' + profile.firstName + ' ' + profile.lastName + ' (' + (profile.rollNo || profile.regNo) + ')</div>' +
                '  <div><span class="text-slate-400">Category:</span> ' + meta.label + '</div>' +
                '  <div><span class="text-slate-400">Status:</span> ' + (doc.status || 'Verified') + '</div>' +
                '</div>' +
                '<button type="button" onclick="downloadSingleDoc(\'' + docKey + '\', \'' + studentEmail + '\')" class="w-full py-2 bg-[#0A2D6A] text-white rounded-xl text-xs font-bold hover:bg-[#082252]">Download Archived File</button>' +
                '</div>';
        }
    }

    if (modal) modal.classList.remove('hidden');
    logDataAccess(studentEmail, 'Previewed Document: ' + meta.label);
}

function closeDocPreviewModal() {
    const modal = document.getElementById('docPreviewModal');
    if (modal) modal.classList.add('hidden');
}

function downloadSingleDoc(docKey, studentEmail) {
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const profile = store[studentEmail];
    if (!profile || !profile.documents || !profile.documents[docKey]) {
        alert('Document not found.');
        return;
    }
    const doc = profile.documents[docKey];
    const meta = MASTER_DOCS_LIST.find(m => m.key === docKey) || { label: 'Document' };

    if (doc.dataUrl) {
        const a = document.createElement('a');
        a.href = doc.dataUrl;
        a.download = doc.fileName || (docKey + '.pdf');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        downloadMockDoc(doc.fileName, meta.label, profile);
    }
    logDataAccess(studentEmail, 'Downloaded Document: ' + meta.label);
}

function downloadMockDoc(fileName, docLabel, profile) {
    const content = 'STUDY WORLD COLLEGE OF ENGINEERING\n' +
        'DIGITAL LEAVE & STUDENT MASTER ARCHIVE\n' +
        '------------------------------------------------------------\n' +
        'Document: ' + docLabel + '\n' +
        'Filename: ' + fileName + '\n' +
        'Student Name: ' + profile.firstName + ' ' + profile.lastName + '\n' +
        'Roll Number: ' + (profile.rollNo || profile.regNo) + '\n' +
        'Register Number: ' + profile.regNo + '\n' +
        'Department: ' + profile.dept + ' - ' + profile.year + ' Year\n' +
        'College Code: 7211 | Anna University Affiliated\n' +
        'Verified By: Head of Department (HOD)\n' +
        'Security Stamp: SWCE-VERIFIED-DIGITAL-' + Date.now() + '\n' +
        '------------------------------------------------------------\n' +
        'This is an authentic verified digital record preserved on DLS-SWCE eCampus.\n';
    const blob = new Blob([content], { type: 'text/plain' });
    if (window.saveAs) {
        window.saveAs(blob, fileName || 'swce_document.txt');
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'swce_document.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

function saveStudentMasterData(isSubmitToHOD) {
    const activeRole = (window.currentUserRole || 'student').toLowerCase();
    if (activeRole === 'hod' || activeRole === 'principal') {
        if (typeof showMasterToast === 'function') {
            showMasterToast('View-Only Mode: HOD and Principal cannot modify student records. Data updates are restricted to Faculty and Students.', 'warning');
        } else if (typeof showToast === 'function') {
            showToast('View-Only Mode: HOD and Principal cannot modify student records.');
        }
        return;
    }

    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    let targetEmail = activeEditingStudentEmail;
    if (!targetEmail || !store[targetEmail]) {
        targetEmail = (window.currentUser && window.currentUser.email) ? window.currentUser.email.toLowerCase().trim() : 'student@study-world.edu.in';
    }
    let profile = store[targetEmail] || {};

    const getVal = id => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    profile.email = targetEmail;
    profile.firstName = getVal('smd_firstName') || profile.firstName || 'Sakthi';
    profile.lastName = getVal('smd_lastName') || profile.lastName || 'Madhavan';
    profile.dob = getVal('smd_dob') || profile.dob;
    profile.gender = getVal('smd_gender') || profile.gender;
    profile.bloodGroup = getVal('smd_bloodGroup') || profile.bloodGroup;
    profile.aadhar = getVal('smd_aadhar') || profile.aadhar;
    profile.mobile = getVal('smd_mobile') || profile.mobile;
    profile.altMobile = getVal('smd_altMobile') || profile.altMobile;
    profile.community = getVal('smd_community') || profile.community;
    profile.religion = getVal('smd_religion') || profile.religion;
    profile.motherTongue = getVal('smd_motherTongue') || profile.motherTongue;
    profile.nationality = getVal('smd_nationality') || profile.nationality;
    profile.district = getVal('smd_district') || profile.district;
    profile.state = getVal('smd_state') || profile.state;
    profile.pincode = getVal('smd_pincode') || profile.pincode;
    profile.addressPerm = getVal('smd_addressPerm') || profile.addressPerm;
    profile.addressCurr = getVal('smd_addressCurr') || profile.addressCurr;

    profile.dept = getVal('smd_dept') || profile.dept;
    profile.year = getVal('smd_year') || profile.year;
    profile.semester = getVal('smd_sem') || profile.semester;
    profile.batch = getVal('smd_batch') || profile.batch;
    profile.admType = getVal('smd_admType') || profile.admType;
    profile.admDate = getVal('smd_admDate') || profile.admDate;
    profile.cgpa = parseFloat(getVal('smd_cgpa')) || profile.cgpa;
    profile.attendance = parseInt(getVal('smd_attendance')) || profile.attendance;
    profile.tenthSchool = getVal('smd_tenthSchool') || profile.tenthSchool;
    profile.tenthPercent = getVal('smd_tenthPercent') || profile.tenthPercent;
    profile.tenthBoard = getVal('smd_tenthBoard') || profile.tenthBoard;
    profile.twelfthSchool = getVal('smd_twelfthSchool') || profile.twelfthSchool;
    profile.twelfthPercent = getVal('smd_twelfthPercent') || profile.twelfthPercent;
    profile.twelfthCutoff = parseFloat(getVal('smd_twelfthCutoff')) || profile.twelfthCutoff;

    profile.fatherName = getVal('smd_fatherName') || profile.fatherName;
    profile.fatherOcc = getVal('smd_fatherOcc') || profile.fatherOcc;
    profile.fatherMobile = getVal('smd_fatherMobile') || profile.fatherMobile;
    profile.fatherIncome = getVal('smd_fatherIncome') || profile.fatherIncome;
    profile.motherName = getVal('smd_motherName') || profile.motherName;
    profile.motherOcc = getVal('smd_motherOcc') || profile.motherOcc;
    profile.motherMobile = getVal('smd_motherMobile') || profile.motherMobile;
    profile.motherIncome = getVal('smd_motherIncome') || profile.motherIncome;
    profile.guardianName = getVal('smd_guardianName') || profile.guardianName;
    profile.guardianRel = getVal('smd_guardianRel') || profile.guardianRel;
    profile.guardianMobile = getVal('smd_guardianMobile') || profile.guardianMobile;
    profile.emergencyMobile = getVal('smd_emergencyMobile') || profile.emergencyMobile;
    profile.familyIncome = getVal('smd_familyIncome') || profile.familyIncome;
    profile.siblingsCount = parseInt(getVal('smd_siblingsCount')) || profile.siblingsCount;
    profile.firstGraduate = getVal('smd_firstGraduateFlag') || profile.firstGraduate;

    profile.scholarshipType = getVal('smd_scholarshipType') || profile.scholarshipType;
    profile.scholarshipAmount = getVal('smd_scholarshipAmount') || profile.scholarshipAmount;
    profile.scholarshipId = getVal('smd_scholarshipId') || profile.scholarshipId;

    profile.accommodation = getVal('smd_accommodation') || profile.accommodation;
    profile.hostelBlock = getVal('smd_hostelBlock') || profile.hostelBlock;
    profile.roomNo = getVal('smd_roomNo') || profile.roomNo;
    profile.messType = getVal('smd_messType') || profile.messType;
    profile.transportMode = getVal('smd_transportMode') || profile.transportMode;
    profile.busRoute = getVal('smd_busRoute') || profile.busRoute;
    profile.busStop = getVal('smd_busStop') || profile.busStop;

    profile.bankName = getVal('smd_bankName') || profile.bankName;
    profile.accountHolder = getVal('smd_accountHolder') || profile.accountHolder;
    profile.accountNo = getVal('smd_accountNo') || profile.accountNo;
    profile.ifsc = getVal('smd_ifsc') || profile.ifsc;
    profile.bankBranch = getVal('smd_bankBranch') || profile.bankBranch;
    profile.micr = getVal('smd_micr') || profile.micr;

    profile.lastUpdated = Date.now();

    if (isSubmitToHOD) {
        profile.verifiedByHOD = false;
        profile.locked = false;
        if (typeof showToast === 'function') showToast('Master Data profile submitted to HOD for verification!');
    } else {
        if (typeof showToast === 'function') showToast('Master Data draft saved successfully.');
    }

    store[targetEmail] = profile;
    localStorage.setItem('swce_student_master_data', JSON.stringify(store));

    // Sync to server backend
    try {
        fetch('/api/student-master-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile: profile })
        }).catch(err => console.warn('Sync to server error:', err));
    } catch(e) {}

    // Update derived staff/student profiles cache
    try {
        const pStore = JSON.parse(localStorage.getItem('swce_student_profiles') || '{}');
        pStore[targetEmail] = {
            id: profile.studentId || 'SWCE-2024-001',
            rollNo: profile.rollNo || profile.regNo,
            regNo: profile.regNo,
            fullName: `${profile.firstName} ${profile.lastName}`.trim(),
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            dept: profile.dept,
            year: profile.year,
            semester: profile.semester,
            mobile: profile.mobile,
            email: targetEmail,
            cgpa: profile.cgpa,
            attendance: profile.attendance,
            feeTotal: profile.feeTotal,
            feePaid: profile.feePaid,
            feeRemaining: profile.feeRemaining,
            verified: profile.verifiedByHOD
        };
        localStorage.setItem('swce_student_profiles', JSON.stringify(pStore));
    } catch(e) {}

    loadStudentMasterDataPage();
}

function printStudentMasterData(targetEmail) {
    const email = targetEmail || (window.currentUser && window.currentUser.email) || 'student@study-world.edu.in';
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p) {
        alert('No profile found to print.');
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        window.print();
        return;
    }

    const aadharMasked = maskSensitiveField(p.aadhar, 'aadhar', window.currentUserRole);
    const bankMasked = maskSensitiveField(p.accountNo, 'bank', window.currentUserRole);

    printWindow.document.write('<html><head><title>Student Master Data Record - ' + p.firstName + ' ' + p.lastName + '</title>' +
        '<style>' +
        'body { font-family: sans-serif; padding: 25px; color: #1e293b; }' +
        'h1 { color: #0A2D6A; font-size: 20px; margin-bottom: 4px; text-transform: uppercase; }' +
        'h2 { font-size: 14px; color: #475569; border-bottom: 2px solid #0A2D6A; padding-bottom: 6px; margin-top: 20px; text-transform: uppercase; }' +
        '.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #0A2D6A; padding-bottom: 12px; }' +
        '.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; font-size: 12px; }' +
        '.item { padding: 4px 0; }' +
        '.label { font-weight: bold; color: #64748b; font-size: 11px; }' +
        '.val { font-weight: 600; color: #0f172a; margin-top: 2px; }' +
        '.footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }' +
        '</style></head><body>' +
        '<div class="header"><div><h1>Study World College of Engineering</h1><p style="font-size: 12px; margin: 0; color: #64748b;">Approved by AICTE, Affiliated to Anna University Chennai | eCampus Digital Registry</p><p style="font-size: 13px; font-weight: bold; color: #0A2D6A; margin: 4px 0 0 0;">STUDENT MASTER RECORD & VERIFIED CREDENTIALS</p></div><div><img src="' + (p.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200') + '" style="width: 80px; height: 95px; border-radius: 6px; border: 1px solid #cbd5e1; object-fit: cover;"></div></div>' +
        '<h2>1. Personal Particulars</h2><div class="grid">' +
        '<div class="item"><div class="label">Full Name:</div><div class="val">' + p.firstName + ' ' + p.lastName + '</div></div>' +
        '<div class="item"><div class="label">Roll / Reg No:</div><div class="val">' + (p.rollNo || p.regNo) + '</div></div>' +
        '<div class="item"><div class="label">Date of Birth:</div><div class="val">' + p.dob + '</div></div>' +
        '<div class="item"><div class="label">Gender:</div><div class="val">' + p.gender + '</div></div>' +
        '<div class="item"><div class="label">Blood Group:</div><div class="val">' + p.bloodGroup + '</div></div>' +
        '<div class="item"><div class="label">Aadhar No:</div><div class="val">' + aadharMasked + '</div></div>' +
        '<div class="item"><div class="label">Mobile:</div><div class="val">' + p.mobile + '</div></div>' +
        '<div class="item"><div class="label">Email:</div><div class="val">' + p.email + '</div></div>' +
        '<div class="item"><div class="label">Community / Religion:</div><div class="val">' + p.community + ' / ' + p.religion + '</div></div>' +
        '<div class="item" style="grid-column: span 3;"><div class="label">Permanent Address:</div><div class="val">' + p.addressPerm + '</div></div>' +
        '</div>' +
        '<h2>2. Academic Credentials</h2><div class="grid">' +
        '<div class="item"><div class="label">Department:</div><div class="val">' + p.dept + '</div></div>' +
        '<div class="item"><div class="label">Year & Semester:</div><div class="val">' + p.year + ' Year / Sem ' + p.semester + '</div></div>' +
        '<div class="item"><div class="label">Academic Batch:</div><div class="val">' + p.batch + '</div></div>' +
        '<div class="item"><div class="label">Admission Quota:</div><div class="val">' + p.admType + '</div></div>' +
        '<div class="item"><div class="label">CGPA:</div><div class="val">' + p.cgpa + '</div></div>' +
        '<div class="item"><div class="label">Attendance:</div><div class="val">' + p.attendance + '%</div></div>' +
        '</div>' +
        '<h2>3. Family & Fees</h2><div class="grid">' +
        '<div class="item"><div class="label">Father Name & Mobile:</div><div class="val">' + p.fatherName + ' (' + p.fatherMobile + ')</div></div>' +
        '<div class="item"><div class="label">Mother Name & Mobile:</div><div class="val">' + p.motherName + ' (' + (p.motherMobile || 'N/A') + ')</div></div>' +
        '<div class="item"><div class="label">Total Fee:</div><div class="val">₹' + (p.feeTotal || 0).toLocaleString('en-IN') + '</div></div>' +
        '<div class="item"><div class="label">Paid Amount:</div><div class="val">₹' + (p.feePaid || 0).toLocaleString('en-IN') + '</div></div>' +
        '<div class="item"><div class="label">Remaining Due:</div><div class="val">₹' + (p.feeRemaining || 0).toLocaleString('en-IN') + '</div></div>' +
        '<div class="item"><div class="label">Bank A/C:</div><div class="val">' + bankMasked + ' (' + p.bankName + ')</div></div>' +
        '</div>' +
        '<div class="footer"><div>Generated on: ' + new Date().toLocaleString() + '</div><div>Digital Signature of Head of Department</div><div>Principal / Head of Institution</div></div>' +
        '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
    logDataAccess(email, 'Exported/Printed Master Record');
}

// =========================================================================
// ALL STUDENTS DATA & DOCUMENTS MODULE (HOD / PRINCIPAL / FACULTY MASTER)
// =========================================================================

function loadAllStudentsDataPage() {
    initStudentMasterDataStore();
    selectedAllStudentCheckboxes.clear();
    renderAllStudentsStats();
    filterAllStudentsTable();
    logDataAccess('All Registry', 'Loaded All Students Master Directory');
}

function getUniqueMasterStudents() {
    initStudentMasterDataStore();
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const uniqueMap = new Map();
    for (const email in store) {
        const s = store[email];
        const key = (s.rollNo || s.regNo || s.studentId || s.email || '').toLowerCase().trim();
        if (key && !uniqueMap.has(key)) {
            uniqueMap.set(key, s);
        }
    }
    return Array.from(uniqueMap.values());
}

function renderAllStudentsStats() {
    const students = getUniqueMasterStudents();

    const totalEl = document.getElementById('cardTotalStudents');
    if (totalEl) totalEl.textContent = students.length;

    const deptCounts = {};
    let feesPendingCount = 0;
    let totalDues = 0;
    let docsPendingCount = 0;

    students.forEach(s => {
        const d = s.dept || 'CSE';
        deptCounts[d] = (deptCounts[d] || 0) + 1;

        if ((s.feeRemaining || 0) > 0) {
            feesPendingCount++;
            totalDues += (s.feeRemaining || 0);
        }

        if (!s.verifiedByHOD) {
            docsPendingCount++;
        }
    });

    const deptStatsContainer = document.getElementById('cardDeptStats');
    if (deptStatsContainer) {
        let html = '';
        const colors = ['bg-blue-50 text-[#0A2D6A]', 'bg-amber-50 text-amber-800', 'bg-purple-50 text-purple-800', 'bg-emerald-50 text-emerald-800', 'bg-rose-50 text-rose-800'];
        let idx = 0;
        for (const dept in deptCounts) {
            html += '<span class="px-2 py-0.5 ' + colors[idx % colors.length] + ' rounded-md text-[10px] font-bold font-mono">' + dept + ': ' + deptCounts[dept] + '</span>';
            idx++;
        }
        deptStatsContainer.innerHTML = html;
    }

    const duesCountEl = document.getElementById('cardFeesPendingCount');
    const duesAmtEl = document.getElementById('cardFeesPendingAmount');
    if (duesCountEl) duesCountEl.textContent = feesPendingCount;
    if (duesAmtEl) duesAmtEl.textContent = '(₹' + totalDues.toLocaleString('en-IN') + ')';

    const docsPendingEl = document.getElementById('cardDocsPending');
    if (docsPendingEl) docsPendingEl.textContent = docsPendingCount;
}

function filterAllStudentsTable() {
    const students = getUniqueMasterStudents();

    const search = (document.getElementById('searchAllStudents')?.value || '').toLowerCase().trim();
    const filterDept = document.getElementById('filterDept')?.value || 'All';
    const filterYear = document.getElementById('filterYear')?.value || 'All';
    const filterSem = document.getElementById('filterSem')?.value || 'All';
    const filterBatch = document.getElementById('filterBatch')?.value || 'All';
    const filterGender = document.getElementById('filterGender')?.value || 'All';
    const filterCommunity = document.getElementById('filterCommunity')?.value || 'All';
    const filterHostel = document.getElementById('filterHostel')?.value || 'All';
    const filterFeesStatus = document.getElementById('filterFeesStatus')?.value || 'All';

    const filtered = students.filter(s => {
        if (filterDept !== 'All' && s.dept !== filterDept) return false;
        if (filterYear !== 'All' && s.year !== filterYear) return false;
        if (filterSem !== 'All' && String(s.semester) !== filterSem) return false;
        if (filterBatch !== 'All' && !String(s.batch).includes(filterBatch)) return false;
        if (filterGender !== 'All' && s.gender !== filterGender) return false;
        if (filterCommunity !== 'All' && s.community !== filterCommunity) return false;
        if (filterHostel !== 'All' && s.accommodation !== filterHostel) return false;
        if (filterFeesStatus === 'Cleared' && (s.feeRemaining || 0) > 0) return false;
        if (filterFeesStatus === 'Pending' && (s.feeRemaining || 0) <= 0) return false;

        if (search) {
            const haystack = [
                s.firstName,
                s.lastName,
                s.rollNo,
                s.regNo,
                s.studentId,
                s.email,
                s.mobile,
                s.aadhar,
                s.dept
            ].join(' ').toLowerCase();
            if (!haystack.includes(search)) return false;
        }
        return true;
    });

    renderAllStudentsTable(filtered);
}

function resetAllStudentsFilters() {
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    setVal('searchAllStudents', '');
    setVal('filterDept', 'All');
    setVal('filterYear', 'All');
    setVal('filterSem', 'All');
    setVal('filterBatch', 'All');
    setVal('filterGender', 'All');
    setVal('filterCommunity', 'All');
    setVal('filterHostel', 'All');
    setVal('filterFeesStatus', 'All');
    filterAllStudentsTable();
}

function renderAllStudentsTable(students) {
    const tbody = document.getElementById('allStudentsTableBody');
    const empty = document.getElementById('allStudentsEmptyState');
    if (!tbody) return;

    if (students.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');

    let html = '';
    students.forEach(s => {
        const isSelected = selectedAllStudentCheckboxes.has(s.email);
        const docsCount = s.documents ? Object.keys(s.documents).length : 0;
        const isLocked = s.locked || s.verifiedByHOD;
        const feeTotal = Number(s.feeTotal || 133500);
        const feePaid = Number(s.feePaid || 0);
        const feeRemaining = Number(s.feeRemaining !== undefined ? s.feeRemaining : (feeTotal - feePaid));
        const userRole = (window.currentUserRole || '').toLowerCase();
        const canEdit = userRole === 'faculty';

        html += '<tr class="hover:bg-slate-50/90 transition ' + (isSelected ? 'bg-blue-50/50' : '') + ' border-b border-slate-100">';
        // 1. Checkbox
        html += '  <td class="p-3 text-center">';
        html += '    <input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleStudentRowSelect(this, \'' + s.email + '\')" class="rounded border-slate-300 text-[#0A2D6A] focus:ring-0">';
        html += '  </td>';
        // 2. Photo
        html += '  <td class="p-3">';
        html += '    <img src="' + (s.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200') + '" alt="Photo" class="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs bg-slate-100 flex-shrink-0">';
        html += '  </td>';
        // 3. Reg / Roll No
        html += '  <td class="p-3">';
        html += '    <div class="font-mono font-bold text-slate-800 text-xs">' + (s.regNo || '721124243067') + '</div>';
        if (s.rollNo && s.rollNo !== s.regNo) {
            html += '    <div class="font-mono text-[10px] text-slate-400">Roll: ' + s.rollNo + '</div>';
        }
        html += '  </td>';
        // 4. Name
        html += '  <td class="p-3">';
        html += '    <button type="button" onclick="openFullProfileModal(\'' + s.email + '\')" class="font-bold text-[#0A2D6A] hover:underline text-left text-xs whitespace-nowrap block">' + s.firstName + ' ' + s.lastName + '</button>';
        html += '    <span class="text-[10px] text-slate-400 block">' + s.gender + ' • ' + (s.accommodation || 'Day Scholar') + '</span>';
        html += '  </td>';
        // 5. Dept
        html += '  <td class="p-3">';
        html += '    <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-[#0A2D6A] border border-blue-100">' + s.dept + '</span>';
        html += '  </td>';
        // 6. Year
        html += '  <td class="p-3 whitespace-nowrap text-xs text-slate-700 font-medium">';
        html += '    ' + s.year + ' Year <span class="text-slate-400 text-[11px]">(Sem ' + (s.semester || '6') + ')</span>';
        html += '  </td>';
        // 7. Mobile
        html += '  <td class="p-3 font-mono text-xs text-slate-700 font-medium whitespace-nowrap">' + s.mobile + '</td>';
        // 8. Email
        html += '  <td class="p-3 text-[11px] text-slate-500 max-w-[150px] truncate" title="' + s.email + '">' + s.email + '</td>';
        // 9. Total Fees
        html += '  <td class="p-3 font-mono font-bold text-slate-800 text-xs whitespace-nowrap">₹' + feeTotal.toLocaleString('en-IN') + '</td>';
        // 10. Paid
        html += '  <td class="p-3 font-mono font-bold text-emerald-700 text-xs whitespace-nowrap">₹' + feePaid.toLocaleString('en-IN') + '</td>';
        // 11. Remaining
        html += '  <td class="p-3 font-mono font-bold text-xs whitespace-nowrap ' + (feeRemaining > 0 ? 'text-rose-600' : 'text-slate-400') + '">₹' + feeRemaining.toLocaleString('en-IN') + '</td>';
        // 12. Docs Count
        html += '  <td class="p-3 whitespace-nowrap">';
        html += '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ' + (docsCount >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200') + '">📁 ' + docsCount + ' Docs</span>';
        html += '  </td>';
        // 13. Status
        html += '  <td class="p-3 whitespace-nowrap">';
        if (isLocked) {
            html += '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">🔒 Verified</span>';
        } else {
            html += '    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">⏳ Pending</span>';
        }
        html += '  </td>';
        // 14. Actions
        html += '  <td class="p-3 text-center whitespace-nowrap">';
        html += '    <div class="flex items-center justify-center gap-1.5">';
        html += '      <button type="button" onclick="openStudentIdCardModal(\'' + s.email + '\')" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition" title="View Student ID Card & Documents Vault">🪪 ID</button>';
        html += '      <button type="button" onclick="openFullProfileModal(\'' + s.email + '\')" class="px-2.5 py-1 bg-[#0A2D6A] text-white rounded-lg text-[11px] font-bold hover:bg-[#082252] shadow-xs transition">View</button>';
        html += '      <button type="button" onclick="printStudentMasterData(\'' + s.email + '\')" class="px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-[11px] font-bold shadow-xs transition" title="Print Student Official Dossier Report">Report</button>';
        html += '      <button type="button" onclick="downloadSingleStudentZip(\'' + s.email + '\')" class="p-1 text-slate-600 hover:text-[#0A2D6A] hover:bg-slate-100 rounded-lg transition" title="Download All Documents ZIP">📦</button>';
        if (canEdit) {
            html += '      <button type="button" onclick="editStudentMasterData(\'' + s.email + '\')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition" title="Edit Student Master Data">✏️</button>';
            html += '      <button type="button" onclick="openFacultyFeesForStudent(\'' + s.email + '\')" class="p-1 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit Student Fees">💰</button>';
        }
        html += '    </div>';
        html += '  </td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
}

function toggleSelectAllStudents(checkbox) {
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const students = Object.values(store);

    if (checkbox.checked) {
        students.forEach(s => selectedAllStudentCheckboxes.add(s.email));
    } else {
        selectedAllStudentCheckboxes.clear();
    }
    updateBulkActionBar();
    filterAllStudentsTable();
}

function toggleStudentRowSelect(checkbox, email) {
    if (checkbox.checked) {
        selectedAllStudentCheckboxes.add(email);
    } else {
        selectedAllStudentCheckboxes.delete(email);
    }
    updateBulkActionBar();
}

function updateBulkActionBar() {
    const bar = document.getElementById('allStudentsBulkBar');
    const countEl = document.getElementById('allStudentsSelectedCount');
    const count = selectedAllStudentCheckboxes.size;

    if (count > 0) {
        if (bar) bar.classList.remove('hidden');
        if (countEl) countEl.textContent = count + ' Student' + (count > 1 ? 's' : '') + ' Selected';
    } else {
        if (bar) bar.classList.add('hidden');
    }
}

function openFullProfileModal(email) {
    currentModalActiveStudentEmail = email;
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p) {
        alert('Student record not found.');
        return;
    }

    const modal = document.getElementById('fullProfileModal');
    const nameEl = document.getElementById('modalStudentName');
    const rollEl = document.getElementById('modalStudentRollNo');
    const deptEl = document.getElementById('modalStudentDeptYear');
    const emailEl = document.getElementById('modalStudentEmail');
    const photoEl = document.getElementById('modalStudentPhoto');
    const lockBadge = document.getElementById('modalLockBadge');
    const secNotice = document.getElementById('modalSecurityNotice');
    const hodComment = document.getElementById('modalHODCommentInput');
    const lockBtnText = document.getElementById('btnModalHodLockText');

    if (nameEl) nameEl.textContent = p.firstName + ' ' + p.lastName;
    if (rollEl) rollEl.textContent = p.rollNo || p.regNo || '721124243067';
    if (deptEl) deptEl.textContent = p.dept + ' • ' + p.year + ' Year (Sem ' + (p.semester || '6') + ')';
    if (emailEl) emailEl.textContent = p.email;
    if (photoEl) photoEl.src = p.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200';
    if (hodComment) hodComment.value = p.hodRemarks || '';

    const isLocked = p.locked || p.verifiedByHOD;
    if (lockBadge) {
        lockBadge.className = isLocked ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40';
        lockBadge.textContent = isLocked ? '🔒 Verified & Locked' : '⏳ Pending HOD Review';
    }
    if (lockBtnText) {
        lockBtnText.textContent = isLocked ? 'Unlock Profile' : 'Verify & Lock';
    }

    if (window.currentUserRole === 'principal') {
        if (secNotice) secNotice.classList.remove('hidden');
    } else {
        if (secNotice) secNotice.classList.add('hidden');
    }

    renderModalTabContent(p);

    if (modal) modal.classList.remove('hidden');
    switchModalTab('personal');
    logDataAccess(email, 'Opened Full Profile Modal');
}

function closeFullProfileModal() {
    const modal = document.getElementById('fullProfileModal');
    if (modal) modal.classList.add('hidden');
    currentModalActiveStudentEmail = null;
}

function renderModalTabContent(p) {
    const container = document.getElementById('modalTabContentContainer');
    if (!container) return;

    const aadharFormatted = maskSensitiveField(p.aadhar, 'aadhar', window.currentUserRole);
    const bankFormatted = maskSensitiveField(p.accountNo, 'bank', window.currentUserRole);

    const docsCount = p.documents ? Object.keys(p.documents).length : 0;
    const modalDocsCountBadge = document.getElementById('modalDocsCountBadge');
    if (modalDocsCountBadge) modalDocsCountBadge.textContent = docsCount;

    let html = '<div id="modalPane_personal" class="modal-tab-pane space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">First Name</span> <span class="font-bold text-slate-800">' + p.firstName + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Last Name</span> <span class="font-bold text-slate-800">' + p.lastName + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Date of Birth</span> <span class="font-mono font-semibold">' + p.dob + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Gender</span> <span class="font-semibold">' + p.gender + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Blood Group</span> <span class="font-bold text-rose-600">' + p.bloodGroup + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase flex items-center gap-1"><span>Aadhar No</span> ' + (window.currentUserRole === 'principal' ? '<span class="text-emerald-600">(Full)</span>' : '<span class="text-slate-400">(Masked)</span>') + '</span> <span class="font-mono font-bold text-slate-800">' + aadharFormatted + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Mobile</span> <span class="font-mono font-bold text-[#0A2D6A]">' + p.mobile + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Alt Mobile</span> <span class="font-mono">' + (p.altMobile || 'N/A') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Community</span> <span class="font-bold text-amber-800">' + p.community + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Religion</span> <span class="font-semibold">' + p.religion + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Mother Tongue</span> <span class="font-semibold">' + p.motherTongue + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">District & State</span> <span class="font-semibold">' + p.district + ', ' + p.state + '</span></div>' +
        '<div class="sm:col-span-2 md:col-span-3"><span class="text-slate-400 text-[10px] block font-bold uppercase">Permanent Address</span> <span class="font-medium text-slate-700">' + p.addressPerm + '</span></div>' +
        '<div class="sm:col-span-2 md:col-span-3"><span class="text-slate-400 text-[10px] block font-bold uppercase">Communication Address</span> <span class="font-medium text-slate-700">' + p.addressCurr + '</span></div>' +
        '</div></div>';

    html += '<div id="modalPane_academic" class="modal-tab-pane hidden space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Department</span> <span class="font-bold text-[#0A2D6A]">' + p.dept + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Current Year / Sem</span> <span class="font-bold">' + p.year + ' Year (Sem ' + p.semester + ')</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Batch</span> <span class="font-mono font-bold">' + p.batch + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Admission Quota</span> <span class="font-bold text-emerald-700">' + p.admType + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Cumulative CGPA</span> <span class="font-mono font-black text-slate-800 text-sm">' + p.cgpa + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Attendance</span> <span class="font-mono font-black text-emerald-700 text-sm">' + p.attendance + '%</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">10th Marks %</span> <span class="font-mono font-bold">' + p.tenthPercent + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">12th Marks %</span> <span class="font-mono font-bold">' + p.twelfthPercent + '</span></div>' +
        '<div class="sm:col-span-2"><span class="text-slate-400 text-[10px] block font-bold uppercase">10th School Name</span> <span class="font-medium">' + p.tenthSchool + '</span></div>' +
        '<div class="sm:col-span-2"><span class="text-slate-400 text-[10px] block font-bold uppercase">12th School Name</span> <span class="font-medium">' + p.twelfthSchool + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">TNEA Cutoff</span> <span class="font-mono font-bold text-[#0A2D6A]">' + p.twelfthCutoff + '</span></div>' +
        '</div></div>';

    html += '<div id="modalPane_family" class="modal-tab-pane hidden space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Father Name</span> <span class="font-bold">' + p.fatherName + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Father Occupation</span> <span class="font-medium">' + (p.fatherOcc || 'N/A') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Father Mobile</span> <span class="font-mono font-bold text-[#0A2D6A]">' + p.fatherMobile + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Mother Name</span> <span class="font-bold">' + p.motherName + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Mother Occupation</span> <span class="font-medium">' + (p.motherOcc || 'Homemaker') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Mother Mobile</span> <span class="font-mono font-bold text-[#0A2D6A]">' + (p.motherMobile || 'N/A') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Emergency Mobile</span> <span class="font-mono font-bold text-rose-600">' + p.emergencyMobile + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Annual Family Income</span> <span class="font-mono font-bold text-emerald-700">₹' + p.familyIncome + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">First Graduate in Family</span> <span class="font-bold text-blue-700">' + (p.firstGraduate || 'No') + '</span></div>' +
        '</div></div>';

    html += '<div id="modalPane_fees" class="modal-tab-pane hidden space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' +
        '<div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200"><span class="text-slate-400 text-[10px] block font-bold uppercase">Total Prescribed Fee</span><span class="text-lg font-black font-mono text-[#0A2D6A]">₹' + (p.feeTotal || 0).toLocaleString('en-IN') + '</span></div>' +
        '<div class="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200"><span class="text-emerald-700 text-[10px] block font-bold uppercase">Total Paid Amount</span><span class="text-lg font-black font-mono text-emerald-700">₹' + (p.feePaid || 0).toLocaleString('en-IN') + '</span></div>' +
        '<div class="p-3.5 bg-rose-50 rounded-xl border border-rose-200"><span class="text-rose-700 text-[10px] block font-bold uppercase">Remaining Balance</span><span class="text-lg font-black font-mono text-rose-700">₹' + (p.feeRemaining || 0).toLocaleString('en-IN') + '</span></div>' +
        '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Scholarship Type</span> <span class="font-bold text-[#0A2D6A]">' + (p.scholarshipType || 'None') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Scholarship Amount</span> <span class="font-mono font-bold text-emerald-700">₹' + (p.scholarshipAmount || '0') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Scholarship ID</span> <span class="font-mono">' + (p.scholarshipId || 'N/A') + '</span></div>' +
        '</div></div>';

    html += '<div id="modalPane_documents" class="modal-tab-pane hidden space-y-4">' +
        '<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">' +
        '<div class="flex items-center gap-2"><span>📁</span><span class="font-bold">Document Verification Vault:</span><span>Review certificates and change verification status.</span></div>' +
        '<button type="button" onclick="downloadSingleStudentZip(\'' + p.email + '\')" class="px-3 py-1 bg-[#0A2D6A] text-white rounded-lg text-xs font-bold hover:bg-[#082252]">Download ZIP (All Docs)</button>' +
        '</div>' +
        '<div class="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">';

    MASTER_DOCS_LIST.forEach(item => {
        const doc = p.documents ? p.documents[item.key] : null;
        const isUploaded = !!doc;
        const docStatus = doc ? (doc.status || 'Verified') : 'Not Uploaded';

        let statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Not Uploaded</span>';
        if (isUploaded) {
            if (docStatus === 'Verified') {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>';
            } else if (docStatus === 'Rejected') {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">✗ Rejected</span>';
            } else {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏳ Pending</span>';
            }
        }

        html += '<div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">';
        html += '  <div class="flex items-center gap-3 min-w-0">';
        html += '    <span class="text-2xl flex-shrink-0">' + item.icon + '</span>';
        html += '    <div class="min-w-0">';
        html += '      <div class="flex items-center gap-2">';
        html += '        <h4 class="font-bold text-slate-800 text-xs truncate">' + item.label + '</h4>';
        html += statusBadge;
        html += '      </div>';
        html += '      <p class="text-[10px] text-slate-400 font-mono mt-0.5">' + (isUploaded ? (doc.fileName + ' (' + (doc.size || '300 KB') + ') • ' + (doc.uploadedAt || '12-09-2026')) : 'Certificate not yet uploaded') + '</p>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">';
        if (isUploaded) {
            html += '    <button type="button" onclick="openDocPreview(\'' + item.key + '\', \'' + p.email + '\')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition">👁️ Preview</button>';
            html += '    <button type="button" onclick="downloadSingleDoc(\'' + item.key + '\', \'' + p.email + '\')" class="px-2.5 py-1 bg-[#0A2D6A]/10 hover:bg-[#0A2D6A]/20 text-[#0A2D6A] rounded-lg text-xs font-bold transition">⬇️ Download</button>';
            html += '    <select onchange="updateModalDocStatus(\'' + item.key + '\', this.value)" class="text-xs py-1 px-2 border border-slate-200 rounded-lg font-semibold bg-white">';
            html += '      <option value="Verified" ' + (docStatus === 'Verified' ? 'selected' : '') + '>Verify</option>';
            html += '      <option value="Pending" ' + (docStatus === 'Pending' ? 'selected' : '') + '>Pending</option>';
            html += '      <option value="Rejected" ' + (docStatus === 'Rejected' ? 'selected' : '') + '>Reject</option>';
            html += '    </select>';
        } else {
            html += '    <span class="text-[11px] text-slate-400 italic">Awaiting upload</span>';
        }
        html += '  </div>';
        html += '</div>';
    });

    html += '</div></div>';

    html += '<div id="modalPane_hostel" class="modal-tab-pane hidden space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Accommodation</span> <span class="font-bold text-[#0A2D6A]">' + (p.accommodation || 'Day Scholar') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Hostel Block</span> <span class="font-medium">' + (p.hostelBlock || 'N/A') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Room No</span> <span class="font-mono font-bold">' + (p.roomNo || 'N/A') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Transport Mode</span> <span class="font-bold">' + (p.transportMode || 'Hostel Walk') + '</span></div>' +
        '</div></div>';

    html += '<div id="modalPane_bank" class="modal-tab-pane hidden space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Bank Name</span> <span class="font-bold text-slate-800">' + p.bankName + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Account Holder</span> <span class="font-bold">' + p.accountHolder + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Account Number</span> <span class="font-mono font-bold text-slate-800">' + bankFormatted + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">IFSC Code</span> <span class="font-mono font-bold text-[#0A2D6A]">' + p.ifsc + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Branch</span> <span class="font-medium">' + p.bankBranch + '</span></div>' +
        '</div></div>';

    html += '<div id="modalPane_official" class="modal-tab-pane hidden space-y-4">' +
        '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Student ID</span> <span class="font-mono font-bold text-[#0A2D6A]">' + (p.studentId || 'SWCE-2024-CSE-067') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Admission No</span> <span class="font-mono font-bold">' + (p.admissionNo || 'SWCE/ADM/2024/067') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Reg No</span> <span class="font-mono font-bold">' + (p.regNo || '721124243067') + '</span></div>' +
        '<div><span class="text-slate-400 text-[10px] block font-bold uppercase">Mentor</span> <span class="font-bold text-slate-800">' + (p.mentorName || 'Dr. P. Senthil Kumar') + '</span></div>' +
        '</div></div>';

    container.innerHTML = html;
}

function toggleModalHodLock() {
    if (!currentModalActiveStudentEmail) return;
    const email = currentModalActiveStudentEmail;
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p) return;

    const isCurrentlyLocked = p.locked || p.verifiedByHOD;
    p.locked = !isCurrentlyLocked;
    p.verifiedByHOD = !isCurrentlyLocked;
    if (p.verifiedByHOD) {
        p.verifiedDate = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (typeof showToast === 'function') showToast('Profile verified and locked for ' + p.firstName + ' ' + p.lastName);
        logDataAccess(email, 'Verified and Locked Student Profile');
    } else {
        p.verifiedDate = 'Awaiting Re-verification';
        if (typeof showToast === 'function') showToast('Profile unlocked for student editing.');
        logDataAccess(email, 'Unlocked Student Profile for Editing');
    }

    store[email] = p;
    localStorage.setItem('swce_student_master_data', JSON.stringify(store));
    openFullProfileModal(email);
    filterAllStudentsTable();
    renderAllStudentsStats();
}

function saveModalHODComment() {
    if (!currentModalActiveStudentEmail) return;
    const email = currentModalActiveStudentEmail;
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p) return;

    const input = document.getElementById('modalHODCommentInput');
    p.hodRemarks = input ? input.value.trim() : '';
    store[email] = p;
    localStorage.setItem('swce_student_master_data', JSON.stringify(store));
    if (typeof showToast === 'function') showToast('HOD remarks saved successfully.');
    logDataAccess(email, 'Updated HOD Remarks');
}

function updateModalDocStatus(docKey, status) {
    if (!currentModalActiveStudentEmail) return;
    const email = currentModalActiveStudentEmail;
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p || !p.documents || !p.documents[docKey]) return;

    p.documents[docKey].status = status;
    store[email] = p;
    localStorage.setItem('swce_student_master_data', JSON.stringify(store));
    if (typeof showToast === 'function') showToast('Document status updated to ' + status);
    logDataAccess(email, 'Updated Document Status (' + docKey + ' -> ' + status + ')');
}

function printModalStudentData() {
    if (currentModalActiveStudentEmail) {
        printStudentMasterData(currentModalActiveStudentEmail);
    }
}

function downloadModalStudentZip() {
    if (currentModalActiveStudentEmail) {
        downloadSingleStudentZip(currentModalActiveStudentEmail);
    }
}

function exportAllStudentsExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Excel library (XLSX) is initializing. Please try again.');
        return;
    }

    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const students = Object.values(store);

    const data = students.map((s, idx) => {
        const aadharVal = maskSensitiveField(s.aadhar, 'aadhar', window.currentUserRole);
        const bankVal = maskSensitiveField(s.accountNo, 'bank', window.currentUserRole);

        return {
            'S.No': idx + 1,
            'Student ID': s.studentId || 'SWCE-2024-001',
            'Roll Number': s.rollNo || s.regNo,
            'Register Number': s.regNo,
            'Student Name': s.firstName + ' ' + s.lastName,
            'DOB': s.dob,
            'Gender': s.gender,
            'Blood Group': s.bloodGroup,
            'Aadhar Number': aadharVal,
            'Student Mobile': s.mobile,
            'Alternate Mobile': s.altMobile || '',
            'Email ID': s.email,
            'Department': s.dept,
            'Year': s.year,
            'Semester': s.semester,
            'Batch': s.batch,
            'Admission Type': s.admType,
            'CGPA': s.cgpa,
            'Attendance %': s.attendance,
            'Community': s.community,
            'Father Name': s.fatherName,
            'Father Mobile': s.fatherMobile,
            'Mother Name': s.motherName,
            'Emergency Mobile': s.emergencyMobile,
            'Annual Family Income': s.familyIncome,
            'First Graduate': s.firstGraduate || 'No',
            'Accommodation': s.accommodation,
            'Total Fee (₹)': s.feeTotal || 0,
            'Paid Fee (₹)': s.feePaid || 0,
            'Remaining Fee (₹)': s.feeRemaining || 0,
            'Scholarship Type': s.scholarshipType || 'None',
            'Scholarship Amount (₹)': s.scholarshipAmount || 0,
            'Bank Name': s.bankName,
            'Account Number': bankVal,
            'IFSC Code': s.ifsc,
            'Docs Uploaded Count': s.documents ? Object.keys(s.documents).length : 0,
            'HOD Verification Status': s.verifiedByHOD ? 'Verified' : 'Pending',
            'Profile Lock Status': s.locked ? 'Locked' : 'Unlocked',
            'HOD Remarks': s.hodRemarks || ''
        };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SWCE_Students_Master');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, 'DLS_SWCE_All_Students_Master_' + dateStr + '.xlsx');
    if (typeof showToast === 'function') showToast('Exported ' + students.length + ' student records to Excel!');
    logDataAccess('All Registry', 'Exported All Students Master to Excel');
}

function printBulkStudentsReport() {
    initStudentMasterDataStore();
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const allStudents = Object.values(store);

    let targetStudents = [];
    if (selectedAllStudentCheckboxes && selectedAllStudentCheckboxes.size > 0) {
        targetStudents = allStudents.filter(s => selectedAllStudentCheckboxes.has(s.email));
    } else {
        const searchInput = (document.getElementById('allStudentsSearchInput')?.value || '').toLowerCase().trim();
        const deptFilter = document.getElementById('filterStudentDept')?.value || 'ALL';
        const yearFilter = document.getElementById('filterStudentYear')?.value || 'ALL';
        const semFilter = document.getElementById('filterStudentSem')?.value || 'ALL';
        const batchFilter = document.getElementById('filterStudentBatch')?.value || 'ALL';
        const genderFilter = document.getElementById('filterStudentGender')?.value || 'ALL';
        const commFilter = document.getElementById('filterStudentCommunity')?.value || 'ALL';
        const hostelFilter = document.getElementById('filterStudentHostel')?.value || 'ALL';
        const feesFilter = document.getElementById('filterStudentFees')?.value || 'ALL';

        targetStudents = allStudents.filter(s => {
            if (deptFilter !== 'ALL' && s.dept !== deptFilter) return false;
            if (yearFilter !== 'ALL' && s.year !== yearFilter) return false;
            if (semFilter !== 'ALL' && String(s.semester) !== semFilter) return false;
            if (batchFilter !== 'ALL' && s.batch !== batchFilter) return false;
            if (genderFilter !== 'ALL' && s.gender !== genderFilter) return false;
            if (commFilter !== 'ALL' && s.community !== commFilter) return false;
            if (hostelFilter !== 'ALL' && s.accommodation !== hostelFilter) return false;
            if (feesFilter === 'PAID' && (s.feeRemaining || 0) > 0) return false;
            if (feesFilter === 'PENDING' && (s.feeRemaining || 0) === 0) return false;
            if (searchInput) {
                const name = ((s.firstName || '') + ' ' + (s.lastName || '')).toLowerCase();
                const roll = (s.rollNo || '').toLowerCase();
                const reg = (s.regNo || '').toLowerCase();
                const email = (s.email || '').toLowerCase();
                if (!name.includes(searchInput) && !roll.includes(searchInput) && !reg.includes(searchInput) && !email.includes(searchInput)) {
                    return false;
                }
            }
            return true;
        });
    }

    if (targetStudents.length === 0) {
        if (typeof showMasterToast === 'function') {
            showMasterToast('No student records found to generate report.', 'warning');
        } else {
            alert('No student records found to generate report.');
        }
        return;
    }

    logDataAccess('BULK_REPORT', 'Generated Official Bulk Dossier Report for ' + targetStudents.length + ' students');

    const printWin = window.open('', '_blank');
    if (!printWin) {
        window.print();
        return;
    }

    let totalFees = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let rowsHtml = '';

    targetStudents.forEach((s, idx) => {
        totalFees += Number(s.feeTotal || 0);
        totalPaid += Number(s.feePaid || 0);
        totalDue += Number(s.feeRemaining || 0);
        const aadharMasked = maskSensitiveField(s.aadhar, 'aadhar', window.currentUserRole);

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px; text-align: center;">${idx + 1}</td>
                <td style="padding: 6px 8px; font-weight: bold; color: #0A2D6A;">
                    ${s.firstName} ${s.lastName}
                    <div style="font-size: 9px; color: #64748b;">${s.email}</div>
                </td>
                <td style="padding: 6px 8px; font-family: monospace;">${s.rollNo || s.regNo}</td>
                <td style="padding: 6px 8px;">${s.dept} (${s.year} Yr/S${s.semester || '6'})</td>
                <td style="padding: 6px 8px; text-align: center;">${s.cgpa || '8.5'}</td>
                <td style="padding: 6px 8px; text-align: center;">${s.attendance || '92'}%</td>
                <td style="padding: 6px 8px;">${s.admType || 'Govt Quota'}</td>
                <td style="padding: 6px 8px;">₹${Number(s.feeTotal || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px; color: #047857; font-weight: bold;">₹${Number(s.feePaid || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px; color: ${s.feeRemaining > 0 ? '#b91c1c' : '#64748b'}; font-weight: bold;">₹${Number(s.feeRemaining || 0).toLocaleString('en-IN')}</td>
                <td style="padding: 6px 8px; font-family: monospace; font-size: 10px;">${aadharMasked}</td>
                <td style="padding: 6px 8px; text-align: center;">
                    <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${s.verifiedByHOD ? '#dcfce7; color: #166534;' : '#fef3c7; color: #92400e;'}">
                        ${s.verifiedByHOD ? 'VERIFIED' : 'PENDING'}
                    </span>
                </td>
            </tr>
        `;
    });

    const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>SWCE eCampus - Consolidated Student Master Registry Report</title>
            <style>
                @media print {
                    @page { size: landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 11px; }
                .header { border-bottom: 2px solid #0A2D6A; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
                h1 { margin: 0; font-size: 18px; color: #0A2D6A; text-transform: uppercase; font-weight: 800; }
                .sub { margin: 2px 0 0 0; font-size: 10px; color: #64748b; }
                .report-meta { text-align: right; font-size: 10px; color: #475569; }
                .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
                .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; }
                .summary-val { font-size: 15px; font-weight: 800; color: #0A2D6A; }
                .summary-lbl { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-top: 2px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                th { background: #0A2D6A; color: white; padding: 7px; text-align: left; font-size: 10px; text-transform: uppercase; }
                .signatures { margin-top: 30px; display: flex; justify-content: space-between; padding-top: 10px; }
                .sign-box { width: 220px; text-align: center; border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 10px; font-weight: bold; color: #334155; }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <h1>Study World College of Engineering</h1>
                    <p class="sub">Approved by AICTE, Affiliated to Anna University, Chennai | Madukkarai, Coimbatore - 641105</p>
                    <p class="sub" style="font-weight: bold; color: #0A2D6A; margin-top: 3px;">CONSOLIDATED STUDENT MASTER REGISTRY & INSTITUTIONAL DOSSIER</p>
                </div>
                <div class="report-meta">
                    <div><strong>Report:</strong> Institutional Master Registry</div>
                    <div><strong>Generated By:</strong> ${(window.currentUserRole || 'ADMIN').toUpperCase()}</div>
                    <div><strong>Date & Time:</strong> ${new Date().toLocaleString('en-IN')}</div>
                    <div><strong>Clearance:</strong> ${window.currentUserRole === 'principal' ? 'Full Disclosure (Level 1)' : 'Masked Biometric (Level 2)'}</div>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-val">${targetStudents.length}</div>
                    <div class="summary-lbl">Total Students Reported</div>
                </div>
                <div class="summary-card">
                    <div class="summary-val">${targetStudents.filter(s => s.verifiedByHOD).length} / ${targetStudents.length}</div>
                    <div class="summary-lbl">HOD Verified & Locked</div>
                </div>
                <div class="summary-card">
                    <div class="summary-val">₹${totalPaid.toLocaleString('en-IN')}</div>
                    <div class="summary-lbl">Total Fees Collected</div>
                </div>
                <div class="summary-card">
                    <div class="summary-val" style="color: ${totalDue > 0 ? '#b91c1c' : '#047857'};">₹${totalDue.toLocaleString('en-IN')}</div>
                    <div class="summary-lbl">Total Fees Outstanding</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="text-align: center; width: 25px;">#</th>
                        <th>Student Name & Email</th>
                        <th>Roll / Reg No</th>
                        <th>Dept & Sem</th>
                        <th style="text-align: center;">CGPA</th>
                        <th style="text-align: center;">Att %</th>
                        <th>Quota</th>
                        <th>Total Fee</th>
                        <th>Paid Fee</th>
                        <th>Due Fee</th>
                        <th>Aadhar No</th>
                        <th style="text-align: center;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="signatures">
                <div class="sign-box">Faculty Advisor / Class In-Charge<br><span style="font-size: 8px; font-weight: normal; color: #64748b;">Verification Officer</span></div>
                <div class="sign-box">Head of Department (HOD)<br><span style="font-size: 8px; font-weight: normal; color: #64748b;">Verified & Recommended</span></div>
                <div class="sign-box">Principal & Academic Head<br><span style="font-size: 8px; font-weight: normal; color: #64748b;">SWCE Institutional Approval</span></div>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `;

    printWin.document.open();
    printWin.document.write(reportHtml);
    printWin.document.close();
}

function downloadSingleStudentZip(email) {
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p) {
        alert('Student profile not found.');
        return;
    }

    if (typeof JSZip === 'undefined') {
        alert('Zip library is loading. Please retry.');
        return;
    }

    const zip = new JSZip();
    const folderName = (p.rollNo || p.regNo || 'Student') + '_' + (p.firstName + '_' + p.lastName).replace(/\s+/g, '_');
    const studentFolder = zip.folder(folderName);

    const summaryText = 'STUDY WORLD COLLEGE OF ENGINEERING\n' +
        'OFFICIAL STUDENT MASTER DATA & DOCUMENT ARCHIVE\n' +
        '============================================================\n' +
        'Student Name: ' + p.firstName + ' ' + p.lastName + '\n' +
        'Roll Number: ' + (p.rollNo || p.regNo) + '\n' +
        'Register Number: ' + p.regNo + '\n' +
        'Department: ' + p.dept + ' (' + p.year + ' Year / Sem ' + p.semester + ')\n' +
        'Email: ' + p.email + ' | Mobile: ' + p.mobile + '\n' +
        'Permanent Address: ' + p.addressPerm + '\n' +
        'Admission Type: ' + p.admType + ' | Batch: ' + p.batch + '\n' +
        'Fees: Total ₹' + p.feeTotal + ' | Paid ₹' + p.feePaid + ' | Rem ₹' + p.feeRemaining + '\n' +
        'Bank: ' + p.bankName + ' | A/C: ' + maskSensitiveField(p.accountNo, 'bank', window.currentUserRole) + ' | IFSC: ' + p.ifsc + '\n' +
        'Verification: ' + (p.verifiedByHOD ? 'VERIFIED & LOCKED BY HOD' : 'PENDING REVIEW') + '\n' +
        'HOD Remarks: ' + (p.hodRemarks || 'Approved') + '\n' +
        'Date Archived: ' + new Date().toLocaleString() + '\n' +
        '============================================================\n';
    studentFolder.file('00_Student_Master_Summary.txt', summaryText);

    const docs = p.documents || {};
    const docFolder = studentFolder.folder('Official_Certificates');

    for (const key in docs) {
        const doc = docs[key];
        const meta = MASTER_DOCS_LIST.find(m => m.key === key) || { label: key };
        if (doc.dataUrl && doc.dataUrl.includes('base64,')) {
            const base64Data = doc.dataUrl.split('base64,')[1];
            docFolder.file(doc.fileName || (key + '.pdf'), base64Data, { base64: true });
        } else {
            const docText = 'SWCE INSTITUTIONAL ARCHIVE\nDocument: ' + meta.label + '\nFilename: ' + doc.fileName + '\nStatus: ' + (doc.status || 'Verified') + '\nStudent: ' + p.firstName + ' ' + p.lastName + ' (' + (p.rollNo || p.regNo) + ')\nUpload Date: ' + (doc.uploadedAt || 'Official') + '\nVerified by Head of Department\n';
            docFolder.file((meta.label.replace(/[^a-zA-Z0-9]/g, '_')) + '.txt', docText);
        }
    }

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        if (window.saveAs) {
            window.saveAs(content, folderName + '_SWCE_Archive.zip');
        } else {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = folderName + '_SWCE_Archive.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        if (typeof showToast === 'function') showToast('ZIP downloaded for ' + p.firstName + ' ' + p.lastName);
    });
    logDataAccess(email, 'Downloaded Student Docs Archive ZIP');
}

function downloadAllMyDocumentsZip() {
    const email = (window.currentUser && window.currentUser.email) ? window.currentUser.email : 'student@study-world.edu.in';
    downloadSingleStudentZip(email);
}

function bulkDownloadStudentDocsZip() {
    if (typeof JSZip === 'undefined') {
        alert('Zip library is loading. Please retry.');
        return;
    }

    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const students = Object.values(store);

    const zip = new JSZip();
    const masterFolder = zip.folder('DLS_SWCE_All_Students_Document_Vault');

    students.forEach(p => {
        const sName = (p.rollNo || p.regNo || 'Student') + '_' + (p.firstName + '_' + p.lastName).replace(/\s+/g, '_');
        const sFolder = masterFolder.folder(sName);

        const summaryText = 'STUDY WORLD COLLEGE OF ENGINEERING\nOFFICIAL MASTER RECORD\nStudent: ' + p.firstName + ' ' + p.lastName + ' | Roll: ' + (p.rollNo || p.regNo) + ' | Dept: ' + p.dept + ' ' + p.year + 'Yr\nMobile: ' + p.mobile + ' | Email: ' + p.email + '\nHOD Verification: ' + (p.verifiedByHOD ? 'VERIFIED' : 'PENDING') + '\n';
        sFolder.file('Student_Summary.txt', summaryText);

        const docs = p.documents || {};
        for (const key in docs) {
            const doc = docs[key];
            const meta = MASTER_DOCS_LIST.find(m => m.key === key) || { label: key };
            if (doc.dataUrl && doc.dataUrl.includes('base64,')) {
                sFolder.file(doc.fileName || (key + '.pdf'), doc.dataUrl.split('base64,')[1], { base64: true });
            } else {
                sFolder.file((meta.label.replace(/[^a-zA-Z0-9]/g, '_')) + '.txt', 'Verified Document: ' + meta.label + '\nFile: ' + doc.fileName);
            }
        }
    });

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const dateStr = new Date().toISOString().slice(0, 10);
        if (window.saveAs) {
            window.saveAs(content, 'SWCE_All_Students_Vault_' + dateStr + '.zip');
        } else {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SWCE_All_Students_Vault_' + dateStr + '.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        if (typeof showToast === 'function') showToast('Master Document Archive ZIP downloaded!');
    });
    logDataAccess('All Registry', 'Downloaded Bulk Document Vault ZIP for All Students');
}

function bulkDownloadSelectedZip() {
    if (selectedAllStudentCheckboxes.size === 0) {
        alert('Please select at least one student.');
        return;
    }

    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const zip = new JSZip();
    const masterFolder = zip.folder('SWCE_Selected_Students_Archive');

    selectedAllStudentCheckboxes.forEach(email => {
        const p = store[email];
        if (!p) return;
        const sName = (p.rollNo || p.regNo || 'Student') + '_' + (p.firstName + '_' + p.lastName).replace(/\s+/g, '_');
        const sFolder = masterFolder.folder(sName);

        sFolder.file('Summary.txt', 'Student: ' + p.firstName + ' ' + p.lastName + '\nRoll: ' + (p.rollNo || p.regNo) + '\nDept: ' + p.dept);
        const docs = p.documents || {};
        for (const key in docs) {
            const doc = docs[key];
            if (doc.dataUrl && doc.dataUrl.includes('base64,')) {
                sFolder.file(doc.fileName, doc.dataUrl.split('base64,')[1], { base64: true });
            } else {
                sFolder.file(doc.fileName + '.txt', 'Archived document for ' + p.firstName);
            }
        }
    });

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        if (window.saveAs) {
            window.saveAs(content, 'SWCE_Selected_Students.zip');
        } else {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'SWCE_Selected_Students.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        if (typeof showToast === 'function') showToast('Selected student archives downloaded in ZIP!');
    });
    logDataAccess('Selected Students', 'Downloaded Selected Students ZIP (' + selectedAllStudentCheckboxes.size + ' students)');
}

function bulkHODVerifySelected() {
    if (selectedAllStudentCheckboxes.size === 0) {
        alert('Please select at least one student.');
        return;
    }

    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    let count = 0;
    const nowStr = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    selectedAllStudentCheckboxes.forEach(email => {
        if (store[email]) {
            store[email].verifiedByHOD = true;
            store[email].locked = true;
            store[email].verifiedDate = nowStr;
            store[email].hodRemarks = 'Bulk verified and locked by Head of Department.';
            count++;
        }
    });

    localStorage.setItem('swce_student_master_data', JSON.stringify(store));
    if (typeof showToast === 'function') showToast(count + ' student profiles verified and locked successfully!');
    selectedAllStudentCheckboxes.clear();
    updateBulkActionBar();
    filterAllStudentsTable();
    renderAllStudentsStats();
    logDataAccess('Bulk Operation', 'HOD Bulk Verified & Locked ' + count + ' students');
}

function openDataAccessLogsModal() {
    const modal = document.getElementById('dataAccessLogsModal');
    const tbody = document.getElementById('dataAccessLogsTableBody');
    if (!modal || !tbody) return;

    const logs = JSON.parse(localStorage.getItem('swce_data_access_logs') || '[]');
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-slate-400 italic">No access logs recorded yet.</td></tr>';
    } else {
        tbody.innerHTML = logs.map(l => '<tr class="hover:bg-slate-50">' +
            '<td class="p-2.5 text-slate-500">' + l.timestamp + '</td>' +
            '<td class="p-2.5 font-bold text-slate-700">' + l.viewerEmail + '</td>' +
            '<td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A2D6A]/10 text-[#0A2D6A]">' + l.viewerRole + '</span></td>' +
            '<td class="p-2.5 text-slate-600">' + l.studentEmail + '</td>' +
            '<td class="p-2.5 font-semibold text-slate-800">' + l.action + '</td>' +
            '</tr>').join('');
    }

    modal.classList.remove('hidden');
}

function closeDataAccessLogsModal() {
    const modal = document.getElementById('dataAccessLogsModal');
    if (modal) modal.classList.add('hidden');
}

function clearDataAccessLogs() {
    if (confirm('Clear all data access audit logs? This action cannot be undone.')) {
        localStorage.removeItem('swce_data_access_logs');
        openDataAccessLogsModal();
        if (typeof showToast === 'function') showToast('Audit logs cleared.');
    }
}

function openFacultyFeesForStudent(email) {
    if (typeof openFacultyFeesModal === 'function') {
        openFacultyFeesModal();
        const sel = document.getElementById('ff_studentSelect');
        if (sel) {
            sel.value = email;
            if (typeof onFacultyFeesStudentChange === 'function') {
                onFacultyFeesStudentChange();
            }
        }
    } else if (typeof openFeesStructurePage === 'function') {
        openFeesStructurePage();
    }
}

// ==========================================
// STUDENT DIGITAL ID CARD & INTEGRATED DOCUMENTS VAULT
// ==========================================

let currentIdCardStudentEmail = null;
let realtimeBroadcastChannel = null;

try {
    if (typeof BroadcastChannel !== 'undefined') {
        realtimeBroadcastChannel = new BroadcastChannel('swce_realtime_student_channel');
        realtimeBroadcastChannel.onmessage = function(event) {
            const data = event.data;
            if (data && data.studentEmail) {
                onStudentRealtimeRemoteChange(data.studentEmail, data.action, data.payload);
            }
        };
    }
} catch (e) {
    console.warn('BroadcastChannel not supported or restricted:', e);
}

function broadcastStudentRealtimeUpdate(studentEmail, action, payload) {
    const detail = { studentEmail, action, payload, timestamp: Date.now() };
    try {
        if (realtimeBroadcastChannel) {
            realtimeBroadcastChannel.postMessage(detail);
        }
    } catch (e) {
        console.warn('Error broadcasting update:', e);
    }

    try {
        window.dispatchEvent(new CustomEvent('swce-student-updated', { detail }));
    } catch (e) {
        console.warn('Error dispatching custom event:', e);
    }
}

function onStudentRealtimeRemoteChange(studentEmail, action, payload) {
    // If ID Card modal is open for this student, re-render
    if (currentIdCardStudentEmail && currentIdCardStudentEmail.toLowerCase() === studentEmail.toLowerCase()) {
        renderStudentIdCardView(currentIdCardStudentEmail);
        renderStudentIdCardDocs(currentIdCardStudentEmail);
    }

    // If Full Profile Modal is open for this student, re-render
    if (typeof currentModalActiveStudentEmail !== 'undefined' && currentModalActiveStudentEmail && currentModalActiveStudentEmail.toLowerCase() === studentEmail.toLowerCase()) {
        const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
        if (store[studentEmail] && typeof renderModalTabContent === 'function') {
            renderModalTabContent(store[studentEmail]);
        }
    }

    // Refresh table and stats if on All Students Data
    if (typeof filterAllStudentsTable === 'function') {
        filterAllStudentsTable();
    }
    if (typeof renderAllStudentsStats === 'function') {
        renderAllStudentsStats();
    }
}

// Window event listener for local instant sync
if (typeof window !== 'undefined') {
    window.addEventListener('swce-student-updated', function(event) {
        if (event && event.detail) {
            const { studentEmail, action, payload } = event.detail;
            onStudentRealtimeRemoteChange(studentEmail, action, payload);
        }
    });

    window.addEventListener('storage', function(e) {
        if (e.key === 'swce_student_master_data') {
            if (currentIdCardStudentEmail) {
                renderStudentIdCardView(currentIdCardStudentEmail);
                renderStudentIdCardDocs(currentIdCardStudentEmail);
            }
            if (typeof filterAllStudentsTable === 'function') filterAllStudentsTable();
            if (typeof renderAllStudentsStats === 'function') renderAllStudentsStats();
        }
    });
}

function openStudentIdCardModal(email) {
    let targetEmail = email;
    if (!targetEmail) {
        if (window.currentUser && window.currentUser.email) {
            targetEmail = window.currentUser.email;
        } else {
            targetEmail = 'student@study-world.edu.in';
        }
    }
    targetEmail = targetEmail.trim();
    currentIdCardStudentEmail = targetEmail;

    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    if (!store[targetEmail]) {
        initStudentMasterDataStore();
    }
    const p = (JSON.parse(localStorage.getItem('swce_student_master_data') || '{}'))[targetEmail];
    if (!p) {
        alert('Student record not found in SWCE Master database.');
        return;
    }

    renderStudentIdCardView(targetEmail);
    renderStudentIdCardDocs(targetEmail);

    const modal = document.getElementById('studentIdCardModal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    logDataAccess(targetEmail, 'Opened Student Digital ID Card & Document Vault');
}

function closeStudentIdCardModal() {
    const modal = document.getElementById('studentIdCardModal');
    if (modal) modal.classList.add('hidden');
    currentIdCardStudentEmail = null;
}

function renderStudentIdCardView(email) {
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email] || {
        firstName: 'Sakthi',
        lastName: 'Madhavan',
        email: email,
        rollNo: '721124243067',
        regNo: '721124243067',
        dept: 'Computer Science and Engineering',
        year: 'III',
        semester: '6',
        batch: '2024-2028',
        quota: 'Govt Quota (GQ)',
        photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
        bloodGroup: 'O+ve',
        dob: '18-06-2004',
        gender: 'Male',
        mobile: '9123456780',
        parentName: 'Madhavan R',
        emergencyPhone: '9876543210',
        address: '42, Kurinji Nagar, Madukkarai, Coimbatore - 641105',
        accommodation: 'Hosteller (Kurinji 204-B)'
    };

    // Front Card Elements
    const photoEl = document.getElementById('idCardPhoto');
    const nameEl = document.getElementById('idCardFullName');
    const branchEl = document.getElementById('idCardBranch');
    const rollEl = document.getElementById('idCardRollNo');
    const regEl = document.getElementById('idCardRegNo');
    const studentIdEl = document.getElementById('idCardStudentId');
    const batchEl = document.getElementById('idCardBatch');
    const yearSemEl = document.getElementById('idCardYearSem');
    const quotaEl = document.getElementById('idCardAdmQuota');
    const validityEl = document.getElementById('idCardValidity');

    if (photoEl) photoEl.src = p.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200';
    if (nameEl) nameEl.textContent = ((p.firstName || '') + ' ' + (p.lastName || '')).toUpperCase();
    if (branchEl) {
        const deptName = p.dept || 'Computer Science and Engineering';
        branchEl.textContent = deptName.startsWith('B.E.') || deptName.startsWith('B.Tech') ? deptName : 'B.E. ' + deptName;
    }
    if (rollEl) rollEl.textContent = p.rollNo || p.regNo || '721124243067';
    if (regEl) regEl.textContent = p.regNo || p.rollNo || '721124243067';
    if (studentIdEl) studentIdEl.textContent = 'SWCE-' + (p.batch ? p.batch.substring(0, 4) : '2024') + '-' + (p.dept ? p.dept.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase() : 'CSE') + '-' + (p.rollNo ? p.rollNo.slice(-3) : '067');
    if (batchEl) batchEl.textContent = p.batch || '2024-2028';
    if (yearSemEl) yearSemEl.textContent = (p.year || 'III') + ' Yr (Sem ' + (p.semester || '6') + ')';
    if (quotaEl) quotaEl.textContent = p.quota || 'Govt Quota (GQ)';
    if (validityEl) validityEl.textContent = 'VALID: ' + (p.batch || '2024 - 2028');

    // Back Card Elements
    const bloodBadge = document.getElementById('idCardBloodBadge');
    const dobGenderEl = document.getElementById('idCardDobGender');
    const mobileEl = document.getElementById('idCardMobile');
    const parentNameEl = document.getElementById('idCardParentName');
    const emergencyEl = document.getElementById('idCardEmergencyPhone');
    const addressEl = document.getElementById('idCardAddress');
    const accomEl = document.getElementById('idCardAccom');
    const emailEl = document.getElementById('idCardEmail');

    if (bloodBadge) bloodBadge.textContent = 'Blood: ' + (p.bloodGroup || 'O+ve');
    if (dobGenderEl) dobGenderEl.textContent = (p.dob || '18-06-2004') + ' • ' + (p.gender || 'Male');
    if (mobileEl) mobileEl.textContent = p.mobile || '9123456780';
    if (parentNameEl) parentNameEl.textContent = p.fatherName || p.parentName || 'Madhavan R';
    if (emergencyEl) emergencyEl.textContent = p.emergencyContact || p.fatherPhone || '9876543210';
    if (addressEl) addressEl.textContent = (p.address || '42, Kurinji Nagar, Madukkarai') + ', ' + (p.city || 'Coimbatore') + ' - ' + (p.pincode || '641105');
    if (accomEl) accomEl.textContent = p.accommodation ? (p.accommodation + (p.hostelRoom ? ' (' + p.hostelRoom + ')' : '')) : 'Day Scholar';
    if (emailEl) emailEl.textContent = p.email || email;
}

function renderStudentIdCardDocs(email) {
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const profile = store[email] || {};
    const docs = profile.documents || {};

    const role = (window.currentUserRole || 'student').toLowerCase();
    const isStudentOrFaculty = (role === 'student' || role === 'faculty');
    const isHodOrPrincipal = (role === 'hod' || role === 'principal');

    // Update Role Banner & Notices
    const roleBanner = document.getElementById('idCardRoleBanner');
    const roleIcon = document.getElementById('idCardRoleIcon');
    const roleText = document.getElementById('idCardRoleText');
    const roleBadge = document.getElementById('idCardRoleBadge');
    const docsNoticeText = document.getElementById('idCardDocsNoticeText');
    const uploadAnyBtn = document.getElementById('idCardUploadAnyDocBtn');

    if (isHodOrPrincipal) {
        if (roleBanner) {
            roleBanner.className = 'px-5 py-2.5 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between text-xs text-amber-950 flex-shrink-0';
        }
        if (roleIcon) roleIcon.textContent = '🛡️';
        if (roleText) {
            roleText.innerHTML = '<strong>' + (role.toUpperCase()) + ' Privilege:</strong> View & Download Access Only. You can review verified certificates and download ZIP archives. Document edits and uploads are restricted to Student & Faculty.';
        }
        if (roleBadge) {
            roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900';
            roleBadge.textContent = 'View & Download Only';
        }
        if (docsNoticeText) {
            docsNoticeText.innerHTML = '<strong>' + (role.toUpperCase()) + ' View Facility:</strong> Document editing/uploading is reserved for Students & Faculty. Click 👁️ Preview to view or ⬇️ Download to retrieve high-resolution official copies.';
        }
        if (uploadAnyBtn) uploadAnyBtn.classList.add('hidden');
    } else {
        if (roleBanner) {
            roleBanner.className = 'px-5 py-2.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-950 flex-shrink-0';
        }
        if (roleIcon) roleIcon.textContent = '✏️';
        if (roleText) {
            roleText.innerHTML = '<strong>Student & Faculty Access:</strong> You have full authority to update details, upload new documents, replace existing certificates, and delete files in real-time.';
        }
        if (roleBadge) {
            roleBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-200/80 text-indigo-900';
            roleBadge.textContent = 'Full Editor';
        }
        if (docsNoticeText) {
            docsNoticeText.innerHTML = '<strong>Real-time Document Sync:</strong> Any document you upload, replace, or delete will automatically sync with SWCE servers and reflect across the HOD and Principal dashboards instantly.';
        }
        if (uploadAnyBtn) uploadAnyBtn.classList.remove('hidden');
    }

    const grid = document.getElementById('idCardDocsGrid');
    if (!grid) return;

    let uploadedCount = 0;
    let html = '';

    MASTER_DOCS_LIST.forEach((item, index) => {
        const doc = docs[item.key];
        const isUploaded = !!doc;
        if (isUploaded) uploadedCount++;

        let statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">○ Not Uploaded</span>';
        if (isUploaded) {
            if (doc.status === 'Verified') {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Verified</span>';
            } else if (doc.status === 'Rejected') {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">✗ Rejected</span>';
            } else {
                statusBadge = '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏳ Pending Review</span>';
            }
        }

        html += '<div class="p-3.5 rounded-2xl border ' + (isUploaded ? 'border-emerald-200 bg-white shadow-2xs' : 'border-slate-200 bg-slate-50/70') + ' hover:border-[#0A2D6A]/30 transition space-y-2.5">';
        html += '  <div class="flex items-start justify-between gap-2">';
        html += '    <div class="flex items-center gap-2.5 min-w-0">';
        html += '      <span class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">' + item.icon + '</span>';
        html += '      <div class="min-w-0">';
        html += '        <h5 class="font-bold text-slate-800 text-xs truncate" title="' + item.label + '">' + item.label + '</h5>';
        html += '        <p class="text-[10px] text-slate-500 truncate">' + item.desc + '</p>';
        html += '      </div>';
        html += '    </div>';
        html += statusBadge;
        html += '  </div>';

        if (isUploaded) {
            html += '  <div class="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">';
            html += '    <div class="truncate font-mono font-medium text-slate-700 flex items-center gap-1.5 min-w-0">';
            html += '      <span class="text-xs">📄</span>';
            html += '      <span class="truncate" title="' + doc.fileName + '">' + doc.fileName + '</span>';
            html += '    </div>';
            html += '    <div class="flex items-center gap-1 text-[10px] text-slate-400 flex-shrink-0 ml-1 font-mono">';
            html += '      <span>' + (doc.size || '300 KB') + '</span>';
            html += '      <span>•</span>';
            html += '      <span>' + (doc.uploadedAt || 'Today') + '</span>';
            html += '    </div>';
            html += '  </div>';

            html += '  <div class="flex items-center gap-1.5 pt-1">';
            html += '    <button type="button" onclick="openDocPreview(\'' + item.key + '\', \'' + email + '\')" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold transition text-center cursor-pointer shadow-2xs">👁️ Preview</button>';
            html += '    <button type="button" onclick="downloadSingleDoc(\'' + item.key + '\', \'' + email + '\')" class="flex-1 py-1.5 bg-[#0A2D6A]/10 hover:bg-[#0A2D6A]/20 text-[#0A2D6A] rounded-xl text-[11px] font-bold transition text-center cursor-pointer shadow-2xs">⬇️ Download</button>';
            
            // Only Student and Faculty can Replace or Delete
            if (isStudentOrFaculty) {
                html += '    <label for="idCardDocInput_' + item.key + '" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold cursor-pointer transition shadow-2xs" title="Replace / Update Document">🔄</label>';
                html += '    <button type="button" onclick="deleteIdCardDoc(\'' + item.key + '\', \'' + email + '\')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs" title="Delete Document">🗑️</button>';
            }
            html += '  </div>';
        } else {
            html += '  <div class="pt-1">';
            if (isStudentOrFaculty) {
                html += '    <label for="idCardDocInput_' + item.key + '" class="w-full py-2 bg-white border border-dashed border-indigo-300 hover:border-indigo-600 text-indigo-700 hover:bg-indigo-50/50 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs">';
                html += '      <span>📤</span> <span>Upload ' + item.label + ' (Max 2MB)</span>';
                html += '    </label>';
            } else {
                html += '    <div class="text-center py-2 text-[11px] text-slate-400 italic bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center gap-1">';
                html += '      <span>⏳</span> <span>Pending student / faculty upload</span>';
                html += '    </div>';
            }
            html += '  </div>';
        }

        // Hidden input for Student & Faculty Upload
        if (isStudentOrFaculty) {
            html += '  <input type="file" id="idCardDocInput_' + item.key + '" accept=".pdf,.jpg,.jpeg,.png" class="hidden" onchange="handleIdCardDocUpload(\'' + item.key + '\', this, \'' + email + '\')">';
        }
        html += '</div>';
    });

    grid.innerHTML = html;

    const countBadge = document.getElementById('idCardDocCountBadge');
    if (countBadge) {
        countBadge.textContent = uploadedCount + ' / ' + MASTER_DOCS_LIST.length + ' Uploaded';
        countBadge.className = uploadedCount === MASTER_DOCS_LIST.length ? 
            'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200' :
            'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200';
    }
}

function handleIdCardDocUpload(docKey, input, targetEmail) {
    const file = input.files && input.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert('File exceeds 2MB limit. Please compress or select a smaller PDF/JPG.');
        return;
    }

    const email = targetEmail || currentIdCardStudentEmail || (window.currentUser && window.currentUser.email) || 'student@study-world.edu.in';
    const reader = new FileReader();

    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
        if (!store[email]) initStudentMasterDataStore();
        const p = store[email];
        if (!p.documents) p.documents = {};

        p.documents[docKey] = {
            fileName: file.name,
            size: (file.size / 1024).toFixed(0) + ' KB',
            uploadedAt: new Date().toLocaleDateString('en-GB'),
            status: 'Pending',
            dataUrl: dataUrl
        };

        store[email] = p;
        localStorage.setItem('swce_student_master_data', JSON.stringify(store));

        // Realtime server sync
        try {
            fetch('/api/student-master-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(store)
            }).catch(err => console.warn('Server sync error:', err));
        } catch (e) {}

        // Broadcast realtime update
        broadcastStudentRealtimeUpdate(email, 'doc_uploaded', { docKey, fileName: file.name });

        // Update local views
        renderStudentIdCardDocs(email);
        if (typeof renderStudentMasterDocumentsGrid === 'function') {
            renderStudentMasterDocumentsGrid(p);
        }
        if (typeof filterAllStudentsTable === 'function') filterAllStudentsTable();
        if (typeof renderAllStudentsStats === 'function') renderAllStudentsStats();

        if (typeof showToast === 'function') {
            showToast('Document "' + file.name + '" uploaded & synced in real-time!');
        }
    };

    reader.readAsDataURL(file);
}

function deleteIdCardDoc(docKey, targetEmail) {
    const role = (window.currentUserRole || 'student').toLowerCase();
    if (role === 'hod' || role === 'principal') {
        alert('HOD and Principal have View & Download access only. Documents can only be deleted or updated by Students and Faculty.');
        return;
    }

    const email = targetEmail || currentIdCardStudentEmail || (window.currentUser && window.currentUser.email) || 'student@study-world.edu.in';
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email];
    if (!p || !p.documents || !p.documents[docKey]) return;

    const docName = p.documents[docKey].fileName || 'this document';
    if (!confirm('Are you sure you want to remove "' + docName + '" from this student\'s ID Card Vault?')) {
        return;
    }

    delete p.documents[docKey];
    store[email] = p;
    localStorage.setItem('swce_student_master_data', JSON.stringify(store));

    // Realtime server sync
    try {
        fetch('/api/student-master-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(store)
        }).catch(err => console.warn('Server sync error:', err));
    } catch (e) {}

    // Broadcast realtime update
    broadcastStudentRealtimeUpdate(email, 'doc_deleted', { docKey });

    // Refresh UI
    renderStudentIdCardDocs(email);
    if (typeof renderStudentMasterDocumentsGrid === 'function') {
        renderStudentMasterDocumentsGrid(p);
    }
    if (typeof filterAllStudentsTable === 'function') filterAllStudentsTable();
    if (typeof renderAllStudentsStats === 'function') renderAllStudentsStats();

    if (typeof showToast === 'function') {
        showToast('Document removed successfully in real-time.');
    }
}

function triggerIdCardQuickUpload() {
    const role = (window.currentUserRole || 'student').toLowerCase();
    if (role === 'hod' || role === 'principal') {
        alert('HOD and Principal have View-Only access. Documents can only be uploaded by Students and Faculty.');
        return;
    }

    const email = currentIdCardStudentEmail || (window.currentUser && window.currentUser.email) || 'student@study-world.edu.in';
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email] || {};
    const docs = p.documents || {};

    // Find first missing document slot
    const missing = MASTER_DOCS_LIST.find(d => !docs[d.key]);
    if (missing) {
        const input = document.getElementById('idCardDocInput_' + missing.key);
        if (input) {
            input.click();
            return;
        }
    }

    // Otherwise click the first document input
    const firstInput = document.getElementById('idCardDocInput_' + MASTER_DOCS_LIST[0].key);
    if (firstInput) firstInput.click();
}

function downloadIdCardZip() {
    const email = currentIdCardStudentEmail || (window.currentUser && window.currentUser.email) || 'student@study-world.edu.in';
    if (typeof downloadSingleStudentZip === 'function') {
        downloadSingleStudentZip(email);
    } else {
        alert('Initiating download of all student documents...');
    }
}

function printStudentIdCard() {
    const email = currentIdCardStudentEmail || (window.currentUser && window.currentUser.email) || 'student@study-world.edu.in';
    const store = JSON.parse(localStorage.getItem('swce_student_master_data') || '{}');
    const p = store[email] || {};

    const printWin = window.open('', '_blank', 'width=850,height=900');
    if (!printWin) {
        alert('Please allow popups to print the Student ID Card.');
        return;
    }

    const printableHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Student ID Card - ${p.firstName || 'Student'} ${p.lastName || ''}</title>
        <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
            .id-card-wrapper { display: flex; flex-direction: column; gap: 24px; max-width: 500px; margin: 0 auto; }
            .id-card { border: 2px solid #0A2D6A; border-radius: 16px; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); page-break-inside: avoid; }
            .header { background: #0A2D6A; color: white; padding: 14px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #f59e0b; }
            .header img { height: 44px; background: white; border-radius: 6px; padding: 2px; }
            .header h3 { margin: 0; font-size: 13px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
            .header p { margin: 2px 0 0; font-size: 9px; color: #bfdbfe; }
            .body { padding: 16px; display: flex; gap: 16px; align-items: center; }
            .photo-box { display: flex; flex-direction: column; align-items: center; gap: 6px; }
            .photo-box img { width: 95px; height: 110px; object-cover: cover; border-radius: 10px; border: 2px solid #0A2D6A; }
            .badge { background: #0A2D6A; color: white; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 4px; }
            .details { flex: 1; font-size: 11px; }
            .details h2 { margin: 0 0 2px; font-size: 15px; color: #0A2D6A; font-weight: 900; }
            .details .dept { font-size: 11px; font-weight: bold; color: #334155; margin-bottom: 8px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 6px; }
            .grid .lbl { color: #64748b; }
            .grid .val { font-weight: bold; color: #0f172a; }
            .footer { background: #f1f5f9; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; border-top: 1px solid #e2e8f0; }
            .back-header { background: #1e293b; color: white; padding: 8px 16px; display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; }
            .back-body { padding: 14px 16px; font-size: 10px; line-height: 1.5; }
            .back-footer { background: #f8fafc; padding: 8px 16px; font-size: 8.5px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center; }
            @media print {
                body { background: white; padding: 0; }
                .no-print { display: none; }
            }
        </style>
    </head>
    <body>
        <div class="no-print" style="text-align: center; margin-bottom: 20px;">
            <button onclick="window.print()" style="padding: 10px 24px; font-size: 14px; font-weight: bold; background: #0A2D6A; color: white; border: none; border-radius: 8px; cursor: pointer;">🖨️ Print ID Card Now</button>
        </div>
        <div class="id-card-wrapper">
            <!-- Front -->
            <div class="id-card">
                <div class="header">
                    <img src="/logo.png" alt="SWCE">
                    <div>
                        <h3>Study World College of Engineering</h3>
                        <p>Approved by AICTE New Delhi • Affiliated to Anna University</p>
                        <p style="color: #cbd5e1; font-size: 8px;">Madukkarai, Coimbatore - 641 105 • Code: 7211</p>
                    </div>
                </div>
                <div class="body">
                    <div class="photo-box">
                        <img src="${p.photo || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200'}" alt="Photo">
                        <span class="badge">STUDENT</span>
                    </div>
                    <div class="details">
                        <h2>${((p.firstName || '') + ' ' + (p.lastName || '')).toUpperCase()}</h2>
                        <div class="dept">B.E. ${p.dept || 'Computer Science & Engineering'}</div>
                        <div class="grid">
                            <div><span class="lbl">Roll No:</span> <span class="val">${p.rollNo || '721124243067'}</span></div>
                            <div><span class="lbl">Reg No:</span> <span class="val">${p.regNo || '721124243067'}</span></div>
                            <div><span class="lbl">Batch:</span> <span class="val">${p.batch || '2024 - 2028'}</span></div>
                            <div><span class="lbl">Year / Sem:</span> <span class="val">${p.year || 'III'} Yr (Sem ${p.semester || '6'})</span></div>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    <div><strong>VALIDITY:</strong> ${p.batch || '2024 - 2028'}</div>
                    <div style="text-align: right;">
                        <span style="font-family: serif; font-style: italic; font-weight: bold;">Dr. Principal</span><br>
                        <span style="font-size: 8px; color: #64748b;">Principal Signatory</span>
                    </div>
                </div>
            </div>

            <!-- Back -->
            <div class="id-card">
                <div class="back-header">
                    <span>EMERGENCY & RESIDENTIAL CREDENTIALS</span>
                    <span style="background: #e11d48; color: white; padding: 2px 6px; border-radius: 4px;">Blood: ${p.bloodGroup || 'O+ve'}</span>
                </div>
                <div class="back-body">
                    <p><strong>DOB & Gender:</strong> ${p.dob || '18-06-2004'} • ${p.gender || 'Male'}</p>
                    <p><strong>Parent/Guardian:</strong> ${p.fatherName || p.parentName || 'Madhavan R'} (${p.emergencyContact || '9876543210'})</p>
                    <p><strong>Permanent Address:</strong> ${p.address || '42, Kurinji Nagar, Madukkarai, Coimbatore - 641105'}</p>
                    <p><strong>Official Email:</strong> ${p.email || email}</p>
                </div>
                <div class="back-footer">
                    Property of Study World College of Engineering, Madukkarai, Coimbatore - 641105.<br>
                    Helpline: 0422-2622000 • Web: www.studyworld.edu.in
                </div>
            </div>
        </div>
        <script>
            setTimeout(() => { window.print(); }, 500);
        <\/script>
    </body>
    </html>
    `;

    printWin.document.open();
    printWin.document.write(printableHtml);
    printWin.document.close();
}

// Auto-initialize store on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        initStudentMasterDataStore();
    });
}
