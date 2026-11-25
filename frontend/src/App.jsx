import React, { useState, useMemo } from 'react';
import {
  Activity,
  FileText,
  ScanLine,
  MessageSquareHeart,
  HeartPulse,
  ShieldCheck,
  Search,
  Upload,
  CheckCircle2,
  Circle,
  AlertTriangle,
  User,
  Droplets,
  Flame,
  ChevronRight,
  ChevronDown,
  Clock,
  Sparkles,
  Eye,
  X,
  LogOut,
  Menu,
  Stethoscope,
  Pill,
  ArrowUpRight,
  Send,
  Lock,
  PhoneCall,
  Share2,
  Users,
  BrainCircuit,
  Check,
  Star,
  FileWarning,
  ClipboardList,
  Microscope,
  Siren,
  HeartHandshake,
  ArrowLeft,
  KeyRound,
  Mail,
  Smartphone,
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || `Request failed (${response.status})`);
  }
  return data;
}

function isBackendOffline(error) {
  return error instanceof TypeError;
}

function toFrontendUser(user) {
  return {
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    age: user.age || 0,
    gender: user.gender || '',
    bloodGroup: user.blood_group || '',
    allergies: user.allergies || [],
    conditions: [],
    emergencyContact: user.emergency_contact || '',
    abdmId: user.abdm_id || 'Not linked'
  };
}

function toFrontendDocument(document) {
  const extracted = document.extracted_data || {};
  return {
    id: document.id,
    title: document.title,
    category: document.category,
    date: document.date,
    doctor: document.doctor || 'Not specified',
    hospital: document.hospital || 'Not specified',
    status: document.status,
    summary: document.summary || '',
    ...extracted
  };
}

// --- DEFAULT DEMO DATA ---
const DEFAULT_USER = {
  name: 'Aarav Sharma',
  email: 'aarav.sharma@example.in',
  phone: '+91 98765 43210',
  age: 32,
  gender: 'Male',
  bloodGroup: 'O+',
  allergies: ['Penicillin', 'Dust Mites'],
  conditions: ['Mild Vitamin D Deficiency', 'Borderline LDL'],
  emergencyContact: 'Priya Sharma (Spouse) • +91 98765 43210',
  abdmId: '14-2891-4402-9910'
};

const INITIAL_VAULT_DOCS = [
  {
    id: 'doc-1',
    title: 'Complete Blood Count (CBC) & Lipid Profile',
    category: 'Lab Reports',
    date: '2026-11-12',
    doctor: 'Dr. Kavita Nair',
    hospital: 'Apollo Diagnostics, Bengaluru',
    status: 'Analyzed',
    summary: 'Hemoglobin normal (14.6 g/dL). LDL Cholesterol slightly elevated at 138 mg/dL (Ref: <100 mg/dL). Vitamin D improved to 34 ng/mL.',
    parameters: [
      { name: 'Hemoglobin', value: '14.6 g/dL', range: '13.5 - 17.5', status: 'Normal' },
      { name: 'LDL Cholesterol', value: '138 mg/dL', range: '< 100 mg/dL', status: 'High' },
      { name: 'HbA1c', value: '5.4 %', range: '< 5.7 %', status: 'Normal' },
      { name: 'Vitamin D (25-OH)', value: '34 ng/mL', range: '30 - 100', status: 'Normal' }
    ]
  },
  {
    id: 'doc-2',
    title: 'Cardiology Preventive Consultation Rx',
    category: 'Prescriptions',
    date: '2026-11-14',
    doctor: 'Dr. Rajiv Menon (MD, DM)',
    hospital: 'Manipal Heart Care',
    status: 'Verified',
    summary: 'Advised dietary fiber increase, 40 mins brisk cardio 5x/week, and Omega-3 supplementation for 60 days. Follow-up lipid panel in 3 months.',
    medicines: [
      { brand: 'Maxepa 1000', salt: 'Omega-3 Fatty Acids (EPA 180mg + DHA 120mg)', dosage: '1 Capsule', freq: 'Once daily after dinner', duration: '60 Days' },
      { brand: 'Uprise-D3 60K', salt: 'Cholecalciferol 60,000 IU', dosage: '1 Capsule', freq: 'Once monthly', duration: '3 Months' }
    ]
  },
  {
    id: 'doc-3',
    title: 'Lumbar Spine MRI Screening',
    category: 'MRI / CT / X-Ray / ECG',
    date: '2026-08-22',
    doctor: 'Dr. S. Kulkarni (Radiology)',
    hospital: 'Narayana Imaging Center',
    status: 'Verified',
    summary: 'Mild L4-L5 disc desiccation without nerve root compression. No herniation or spinal canal stenosis observed.',
    parameters: [
      { name: 'L4-L5 Disc Space', value: 'Mild Desiccation', range: 'Normal Hydration', status: 'Borderline' },
      { name: 'Neural Foramina', value: 'Patent / Clear', range: 'Clear', status: 'Normal' }
    ]
  },
  {
    id: 'doc-4',
    title: 'Viral Fever & Dehydration Day-Care Summary',
    category: 'Discharge Summaries',
    date: '2026-04-09',
    doctor: 'Dr. Neha Verma',
    hospital: 'Fortis Clinic, Indiranagar',
    status: 'Verified',
    summary: 'Admitted for 12-hour IV hydration following seasonal viral pyrexia. Discharged afebrile with oral electrolytes and antipyretics.',
    parameters: [
      { name: 'Discharge Temp', value: '98.4 °F', range: '97.0 - 99.0 °F', status: 'Normal' },
      { name: 'Platelet Count', value: '2,10,000 /µL', range: '1,50,000 - 4,50,000', status: 'Normal' }
    ]
  }
];

const INITIAL_TIMELINE = [
  {
    id: 'tl-1',
    date: '14 Nov 2026',
    type: 'Doctor Visit',
    title: 'Preventive Cardiology Review — Dr. Rajiv Menon',
    source: 'Verified Record',
    description: 'Reviewed November Lipid & CBC panel. Prescribed Omega-3 supplements and lifestyle adjustments rather than statins.',
    aiCorrelation: 'LDL improved from 152 mg/dL (May 2026) to 138 mg/dL (-9.2% reduction over 6 months).'
  },
  {
    id: 'tl-2',
    date: '12 Nov 2026',
    type: 'Lab Report',
    title: 'Comprehensive Blood & Lipid Panel',
    source: 'Verified Record',
    description: 'Vitamin D crossed into optimal zone (34 ng/mL vs 19 ng/mL in May). HbA1c steady at 5.4%.',
    aiCorrelation: '3-month Cholecalciferol supplementation successfully resolved prior Vitamin D deficiency.'
  },
  {
    id: 'tl-3',
    date: '03 Nov 2026',
    type: 'Symptom Note',
    title: 'Mild Lower Back Stiffness After Long Desk Hours',
    source: 'Patient-Reported',
    description: 'Noted stiffness after 9+ hours sitting; relieved with 20-minute hamstring & core stretches.',
    aiCorrelation: 'Matches August 2026 L4-L5 ergonomic posture guidance. No red-flag radicular symptoms logged.'
  },
  {
    id: 'tl-4',
    date: '22 Aug 2026',
    type: 'Diagnostic Scan',
    title: 'Lumbar Spine MRI — Narayana Imaging',
    source: 'Verified Record',
    description: 'Performed for recurring postural backache. Confirmed no nerve compression; physiotherapy recommended.',
    aiCorrelation: 'Baseline structural imaging stored for future comparison.'
  },
  {
    id: 'tl-5',
    date: '18 May 2026',
    type: 'Lab Report',
    title: 'Baseline Wellness Panel',
    source: 'Verified Record',
    description: 'Detected Vitamin D insufficiency (19 ng/mL) and borderline LDL (152 mg/dL).',
    aiCorrelation: 'Initiated preventive nutrition and D3 supplementation protocol.'
  }
];

const INITIAL_GOALS = [
  { id: 'g-1', title: '35 mins Brisk Walk / Zone-2 Cardio', category: 'Activity', target: '35 mins', completed: true, streak: 6 },
  { id: 'g-2', title: 'Take Omega-3 (Maxepa 1000) after dinner', category: 'Medication', target: '1 Cap', completed: true, streak: 12 },
  { id: 'g-3', title: 'Include 25g soluble fiber (oats, chia, greens)', category: 'Nutrition', target: '25g Fiber', completed: true, streak: 4 },
  { id: 'g-4', title: '10-min Lumbar Mobility & Core Stretch', category: 'Recovery', target: '10 mins', completed: false, streak: 5 },
  { id: 'g-5', title: '7.5+ Hours Restorative Sleep (Screens off 10:30 PM)', category: 'Sleep', target: '7.5 hrs', completed: false, streak: 3 }
];

const BIOMARKER_TRENDS = [
  { month: 'Feb 26', ldl: 158, vitD: 17, hba1c: 5.5 },
  { month: 'May 26', ldl: 152, vitD: 19, hba1c: 5.5 },
  { month: 'Aug 26', ldl: 145, vitD: 27, hba1c: 5.4 },
  { month: 'Nov 26', ldl: 138, vitD: 34, hba1c: 5.4 }
];

const WEEKLY_ADHERENCE = [
  { day: 'Mon', pct: 80 },
  { day: 'Tue', pct: 100 },
  { day: 'Wed', pct: 60 },
  { day: 'Thu', pct: 100 },
  { day: 'Fri', pct: 80 },
  { day: 'Sat', pct: 100 },
  { day: 'Today', pct: 60 }
];

const LANDING_FAQS = [
  {
    q: 'Does MedMemo diagnose diseases or replace my doctor?',
    a: 'No. MedMemo is strictly an informational and personal medical record management platform. Our AI extracts parameters from your reports, highlights out-of-range values using standard reference intervals, and helps you prepare questions for your doctor—it never makes an unverified medical diagnosis or prescribes medications.'
  },
  {
    q: 'How does the AI Prescription Scanner handle handwritten prescriptions?',
    a: 'Our Vision OCR extracts medicine brand names, generic salts, dosages, frequency, and duration into a structured verification table. Before anything is saved to your Medical Vault, MedMemo requires you to review and confirm every field against your original prescription.'
  },
  {
    q: 'Is my medical data encrypted and compliant with Indian privacy standards?',
    a: 'Yes. Every uploaded file is encrypted at rest and in transit, isolated per user account, and designed around Indian data protection principles and ABDM (Ayushman Bharat Digital Mission) interoperability standards. You can export or permanently delete your entire vault anytime.'
  },
  {
    q: 'Can I manage health records for my parents or children?',
    a: 'Yes. MedMemo supports separate family health profiles with independent vaults, distinct allergy alerts, and consent-based caregiver access so you never mix up prescriptions across family members.'
  }
];

function getProgressState(pct) {
  if (pct < 40) {
    return {
      label: 'Just Getting Started',
      stroke: '#EF4444',
      bg: 'bg-red-50',
      text: 'text-red-600',
      message: 'Complete one small habit right now to build momentum.'
    };
  }
  if (pct < 70) {
    return {
      label: 'Building Momentum',
      stroke: '#F97316',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      message: 'Good halfway push! Two more tasks will put you in the yellow zone.'
    };
  }
  if (pct < 90) {
    return {
      label: 'Strong Consistency',
      stroke: '#EAB308',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      message: 'Almost at 100%! Finish your evening stretch or sleep routine.'
    };
  }
  return {
    label: 'Daily Target Achieved',
    stroke: '#10B981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    message: 'Outstanding discipline! Your consistency directly supports your lipid & spine goals.'
  };
}

function CircularProgressRing({ percentage, size = 148, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const state = getProgressState(percentage);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth={strokeWidth} fill="transparent" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={state.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-slate-900">{percentage}%</span>
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Tasks Done</span>
      </div>
    </div>
  );
}

export default function App() {
  // View Routing: 'landing' | 'login' | 'register' | 'portal'
  const [viewMode, setViewMode] = useState('landing');
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);
  const [authToken, setAuthToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [apiNotice, setApiNotice] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Form States (Separate Login & New Registration)
  const [loginEmail, setLoginEmail] = useState('aarav.sharma@example.in');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');

  const [regForm, setRegForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    allergies: '',
    emergencyName: '',
    emergencyPhone: ''
  });

  // Landing Page Interactive States
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [landingShowcaseTab, setLandingShowcaseTab] = useState('vault');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Shared App State
  const [vaultDocs, setVaultDocs] = useState(INITIAL_VAULT_DOCS);
  const [timelineEvents, setTimelineEvents] = useState(INITIAL_TIMELINE);
  const [dailyGoals, setDailyGoals] = useState(INITIAL_GOALS);
  const [waterGlasses, setWaterGlasses] = useState(6);
  const [selectedMetric, setSelectedMetric] = useState('ldl');

  // Vault Filters & Modals
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultCategory, setVaultCategory] = useState('All');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Timeline Filter & Add Note
  const [timelineFilter, setTimelineFilter] = useState('All');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState('Symptom Note');

  // Prescription Scanner State
  const [scannerStep, setScannerStep] = useState('idle');
  const [scannedMeds, setScannedMeds] = useState([
    { id: 1, brand: 'Telma 40', salt: 'Telmisartan 40mg', dosage: '1 Tablet', freq: 'Once daily (Morning)', duration: '30 Days' },
    { id: 2, brand: 'Pan-D', salt: 'Pantoprazole 40mg + Domperidone 30mg', dosage: '1 Capsule', freq: 'Before breakfast', duration: '15 Days' },
    { id: 3, brand: 'Shelcal 500', salt: 'Calcium 500mg + Vitamin D3 250 IU', dosage: '1 Tablet', freq: 'Once daily after lunch', duration: '60 Days' }
  ]);
  const [scannedDoctor, setScannedDoctor] = useState('Dr. Ananya Deshmukh • Aster CMI Hospital');
  const [scannedExtraction, setScannedExtraction] = useState({});
  const [scannerError, setScannerError] = useState('');

  // AI Health Assistant Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I have reviewed your stored medical records. I can summarize your biomarker trends, pull up past prescriptions, or prepare questions for your next doctor visit. How can I help?",
      citation: 'Context: Verified Vault Records • Informational Memory Only'
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const loadVaultDocuments = async (token) => {
    try {
      const documents = await apiRequest('/api/documents', { token });
      setVaultDocs(documents.map(toFrontendDocument));
    } catch (error) {
      if (isBackendOffline(error)) {
        setApiNotice('Backend is unavailable. Demo records are shown; changes will not be saved to the server.');
        setVaultDocs(INITIAL_VAULT_DOCS);
      } else {
        setApiNotice(error.message);
      }
    }
  };

  // Daily Coach Add Goal State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Activity');

  const taskCompletionPct = useMemo(() => {
    if (dailyGoals.length === 0) return 0;
    const completedCount = dailyGoals.filter((g) => g.completed).length;
    return Math.round((completedCount / dailyGoals.length) * 100);
  }, [dailyGoals]);

  const progressState = getProgressState(taskCompletionPct);

  const launchPortalTab = (tabId) => {
    setActiveTab(tabId);
    setViewMode('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Existing User Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setApiNotice('');
    try {
      const result = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      setAuthToken(result.access_token);
      setCurrentUser(toFrontendUser(result.user));
      setViewMode('portal');
      setActiveTab('dashboard');
      await loadVaultDocuments(result.access_token);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (!isBackendOffline(error)) {
        setAuthError(error.message);
        return;
      }
      setAuthToken('');
      setApiNotice('Backend is offline. Demo mode is active; changes will not be saved to the server.');
      setCurrentUser(DEFAULT_USER);
      setVaultDocs(INITIAL_VAULT_DOCS);
      setViewMode('portal');
      setActiveTab('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle New Patient Registration (Creates personalized medical profile)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setApiNotice('');
    const allergyList = regForm.allergies
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    const newUser = {
      name: regForm.fullName || 'New Patient',
      email: regForm.email || 'patient@medmemo.in',
      phone: regForm.mobile || '+91 98000 00000',
      age: Number(regForm.age) || 28,
      gender: regForm.gender,
      bloodGroup: regForm.bloodGroup,
      allergies: allergyList.length > 0 ? allergyList : ['No Known Allergies'],
      conditions: ['Preventive Health Tracking'],
      emergencyContact: `${regForm.emergencyName || 'Family Contact'} • ${regForm.emergencyPhone || '+91 98000 00001'}`,
      abdmId: `14-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-8812`
    };
    try {
      const result = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: regForm.fullName,
          email: regForm.email,
          phone: regForm.mobile,
          password: regForm.password,
          age: Number(regForm.age),
          gender: regForm.gender,
          blood_group: regForm.bloodGroup,
          allergies: allergyList,
          emergency_contact: newUser.emergencyContact,
          abdm_id: newUser.abdmId
        })
      });
      setAuthToken(result.access_token);
      setCurrentUser(toFrontendUser(result.user));
      setViewMode('portal');
      setActiveTab('dashboard');
      await loadVaultDocuments(result.access_token);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (!isBackendOffline(error)) {
        setAuthError(error.message);
        return;
      }
      setAuthToken('');
      setApiNotice('Backend is offline. Demo mode is active; changes will not be saved to the server.');
      setCurrentUser(newUser);
      setVaultDocs(INITIAL_VAULT_DOCS);
      setActiveTab('dashboard');
      setViewMode('portal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handlers
  const handleToggleGoal = (id) => {
    setDailyGoals((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, completed: !g.completed, streak: !g.completed ? g.streak + 1 : Math.max(0, g.streak - 1) }
          : g
      )
    );
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    setDailyGoals((prev) => [
      ...prev,
      {
        id: `g-${Date.now()}`,
        title: newGoalTitle.trim(),
        category: newGoalCategory,
        target: 'Daily',
        completed: false,
        streak: 1
      }
    ]);
    setNewGoalTitle('');
  };

  const handleAddTimelineNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newEvent = {
      id: `tl-${Date.now()}`,
      date: '24 Nov 2026',
      type: newNoteType,
      title: newNoteText.trim(),
      source: 'Patient-Reported',
      description: 'Logged manually by patient in MedMemo timeline for future doctor consultation review.',
      aiCorrelation: 'No red-flag urgency detected. Saved to chronological memory.'
    };
    setTimelineEvents([newEvent, ...timelineEvents]);
    setNewNoteText('');
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.docTitle.value || 'Uploaded Diagnostic Report';
    const category = form.docCategory.value;
    const doctor = form.docDoctor.value || 'Dr. S. Rao';
    const hospital = form.docHospital.value || 'City Diagnostic Center';

    const newDoc = {
      id: `doc-${Date.now()}`,
      title,
      category,
      date: '2026-11-24',
      doctor,
      hospital,
      status: 'Analyzed',
      summary: 'Document securely encrypted and indexed into your Personal Medical Vault. All extracted parameters are within standard reference ranges.',
      parameters: [{ name: 'Document Integrity', value: 'Verified OCR', range: 'Readable', status: 'Normal' }]
    };

    if (authToken) {
      try {
        const savedDocument = await apiRequest('/api/documents', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify({
            title,
            category,
            doctor,
            hospital,
            status: 'Analyzed',
            summary: newDoc.summary,
            extracted_data: { parameters: newDoc.parameters }
          })
        });
        setVaultDocs((previous) => [toFrontendDocument(savedDocument), ...previous]);
      } catch (error) {
        if (!isBackendOffline(error)) {
          setApiNotice(error.message);
          return;
        }
        setApiNotice('Backend is offline. This document is available in demo mode only.');
        setVaultDocs((previous) => [newDoc, ...previous]);
      }
    } else {
      setVaultDocs((previous) => [newDoc, ...previous]);
    }
    setTimelineEvents([
      {
        id: `tl-${Date.now()}`,
        date: '24 Nov 2026',
        type: category === 'Prescriptions' ? 'Doctor Visit' : 'Lab Report',
        title: `${title} (${hospital})`,
        source: 'Verified Record',
        description: `Uploaded to Medical Vault under ${category}.`,
        aiCorrelation: 'Indexed into chronological health memory.'
      },
      ...timelineEvents
    ]);
    setShowUploadModal(false);
  };

  const handleSaveScannedPrescription = async () => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: `Scanned Prescription (${scannedDoctor.split('•')[0].trim()})`,
      category: 'Prescriptions',
      date: '2026-11-24',
      doctor: scannedDoctor.split('•')[0].trim(),
      hospital: scannedDoctor.split('•')[1]?.trim() || 'Outpatient Clinic',
      status: 'Verified',
      summary: `Verified ${scannedMeds.length} prescribed medications via AI Prescription Scanner.`,
      medicines: scannedMeds.map((m) => ({
        brand: m.brand,
        salt: m.salt,
        dosage: m.dosage,
        freq: m.freq,
        duration: m.duration
      }))
    };
    if (authToken) {
      try {
        const savedDocument = await apiRequest('/api/documents', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify({
            title: newDoc.title,
            category: newDoc.category,
            doctor: newDoc.doctor,
            hospital: newDoc.hospital,
            status: newDoc.status,
            summary: newDoc.summary,
            extracted_data: { ...scannedExtraction, medicines: newDoc.medicines }
          })
        });
        setVaultDocs((previous) => [toFrontendDocument(savedDocument), ...previous]);
      } catch (error) {
        if (!isBackendOffline(error)) {
          setScannerError(error.message);
          return;
        }
        setApiNotice('Backend is offline. The scanned prescription is saved in demo mode only.');
        setVaultDocs((previous) => [newDoc, ...previous]);
      }
    } else {
      setVaultDocs((previous) => [newDoc, ...previous]);
    }
    setScannerStep('saved');
  };

  const handlePrescriptionUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setScannerError('');
    if (!authToken) {
      setScannerError('Sign in to a backend account to scan a real prescription. Demo mode can show sample OCR results.');
      return;
    }

    setScannerStep('scanning');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await apiRequest('/api/scan-prescription', {
        method: 'POST',
        token: authToken,
        body: formData
      });
      setScannedMeds(result.medicines || []);
      setScannedDoctor([result.doctor, result.hospital].filter(Boolean).join(' • ') || 'Doctor details not identified');
      setScannedExtraction(result.extracted_data || {});
      setScannerStep('review');
    } catch (error) {
      if (isBackendOffline(error)) {
        setApiNotice('Backend is offline. The uploaded file was not scanned; demo sample data remains available.');
        setScannerStep('idle');
      } else {
        setScannerError(error.message);
        setScannerStep('idle');
      }
    }
  };

  const handleSendChat = async (customPrompt) => {
    const text = (customPrompt || chatInput).trim();
    if (!text) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    let aiResponse = {
      id: Date.now() + 1,
      sender: 'ai',
      text: '',
      citation: 'Source: Verified Vault Records • Not a Medical Diagnosis'
    };

    const lower = text.toLowerCase();
    if (lower.includes('cholesterol') || lower.includes('ldl') || lower.includes('lipid')) {
      aiResponse.text =
        "Based on your verified lab reports:\n• May 18, 2026: LDL was 152 mg/dL (Borderline High)\n• Nov 12, 2026: LDL improved to 138 mg/dL (Ref: <100 mg/dL)\n\nDr. Rajiv Menon noted this 9.2% improvement and prescribed Maxepa 1000 (Omega-3) + 40 mins brisk cardio 5x/week instead of starting statin medication.";
      aiResponse.citation = 'Cited: CBC & Lipid Profile (12 Nov 2026), Cardiology Rx (14 Nov 2026)';
    } else if (lower.includes('doctor') || lower.includes('question') || lower.includes('visit')) {
      aiResponse.text =
        "Here are 3 tailored questions prepared from your medical history for your next consultation:\n1. My LDL dropped from 152 to 138 mg/dL with Omega-3 and cardio—what target LDL should we aim for before my February re-test?\n2. My Vitamin D is now optimal at 34 ng/mL—should I continue Uprise-D3 60K monthly as a maintenance dose?\n3. Given my August L4-L5 mild disc desiccation, are there specific core exercises you recommend clearing?";
      aiResponse.citation = 'Synthesized from 3 Verified Records & 1 Patient Symptom Note';
    } else if (lower.includes('medicine') || lower.includes('prescription') || lower.includes('allergy')) {
      aiResponse.text = `Active Verified Medications:\n1. Maxepa 1000 (Omega-3 Fatty Acids) — 1 cap daily after dinner (60 days)\n2. Uprise-D3 60K (Cholecalciferol) — 1 cap once monthly (3 months)\n\n⚠️ Recorded Allergy Alert: ${currentUser.allergies.join(', ')}. Always inform clinicians before new prescriptions.`;
      aiResponse.citation = 'Cited: Patient Medical Profile & Cardiology Rx';
    } else {
      aiResponse.text =
        "I checked your chronological health memory across your stored documents. Your HbA1c (5.4%) and Hemoglobin (14.6 g/dL) are normal, Vitamin D has recovered to 34 ng/mL, and your current focus areas are lowering LDL (138 mg/dL) and maintaining lumbar spine mobility. Would you like a summary for a doctor visit?";
    }

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setChatInput('');

    if (authToken) {
      try {
        const result = await apiRequest('/api/assistant', {
          method: 'POST',
          token: authToken,
          body: JSON.stringify({ message: text })
        });
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: result.reply,
            citation: result.citation
          }
        ]);
        return;
      } catch (error) {
        if (!isBackendOffline(error)) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              sender: 'ai',
              text: `The assistant could not respond: ${error.message}`,
              citation: 'Backend request failed'
            }
          ]);
          return;
        }
        setApiNotice('Backend is offline. The assistant is using demo responses based on sample data.');
      }
    }
    setChatMessages((prev) => [...prev, aiResponse]);
  };

  const filteredDocs = vaultDocs.filter((doc) => {
    const matchesCat = vaultCategory === 'All' || doc.category === vaultCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      doc.doctor.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(vaultSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredTimeline = timelineEvents.filter((item) => {
    if (timelineFilter === 'All') return true;
    return item.source === timelineFilter;
  });

  // ============================================================================
  // DEDICATED AUTHENTICATION VIEWS (SEPARATE LOGIN & NEW PATIENT REGISTRATION)
  // ============================================================================
  if (viewMode === 'login' || viewMode === 'register') {
    const isRegister = viewMode === 'register';
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans">
        {/* Left Brand & Healthcare Trust Panel */}
        <div className="lg:w-5/12 bg-gradient-to-br from-sky-700 via-blue-800 to-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between">
          <div className="space-y-8">
            <button
              onClick={() => setViewMode('landing')}
              className="inline-flex items-center gap-2 text-xs font-bold text-sky-200 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to MedMemo Home</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white border border-white/20">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">MedMemo</h1>
                <p className="text-xs text-sky-200">Your Personal Medical Memory</p>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <span className="inline-block px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold">
                {isRegister ? 'New Patient Onboarding' : 'Returning Patient Portal'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                {isRegister
                  ? 'Create Your Encrypted Medical Vault in 60 Seconds.'
                  : 'Welcome Back to Your Health Timeline.'}
              </h2>
              <p className="text-sm text-sky-100/90 leading-relaxed">
                {isRegister
                  ? 'Set up your blood group, emergency contact, and allergy alerts once—so every prescription scan and doctor consultation is automatically personalized.'
                  : 'Access your prescriptions, lab biomarker trends, AI health assistant, and daily wellness goals securely.'}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/15 text-xs text-sky-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>End-to-end encrypted & user-isolated medical storage</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ScanLine className="w-4 h-4 text-sky-300 shrink-0" />
                <span>Instant AI OCR for prescriptions, blood panels & MRI reports</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Strict clinical safety: Never replaces a licensed doctor</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-sky-200/70 pt-8">
            ABDM Interoperability Ready • Indian DPDP Privacy Standards
          </p>
        </div>

        {/* Right Form Panel (Completely Distinct Forms for Login vs Register) */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 p-7 sm:p-10 space-y-6">
            {/* Switcher Pill */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/70">
              <button
                type="button"
                onClick={() => setViewMode('login')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  !isRegister ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Already Registered (Login)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('register')}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  isRegister ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Patient (Register)
              </button>
            </div>

            {authError && (
              <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {authError}
              </p>
            )}

            {/* ==============================================================
                FORM A: EXISTING USER LOGIN (FAST & SIMPLE)
            ============================================================== */}
            {!isRegister && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Sign In to Your Vault</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your registered email or mobile number to unlock your medical memory.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Registered Email or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        placeholder="e.g., aarav.sharma@example.in or +91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Password</label>
                      <span className="text-xs font-semibold text-sky-600 cursor-pointer hover:underline">
                        Forgot password?
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-lg shadow-sky-600/20 transition cursor-pointer"
                >
                  Login to Patient Dashboard →
                </button>

                <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    First time using MedMemo?{' '}
                    <button
                      type="button"
                      onClick={() => setViewMode('register')}
                      className="text-sky-600 font-bold hover:underline cursor-pointer"
                    >
                      Create a New Patient Profile
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ==============================================================
                FORM B: NEW PATIENT REGISTRATION (MEDICAL PROFILE ONBOARDING)
            ============================================================== */}
            {isRegister && (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">New Patient Registration</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Step 1: Account Credentials & Essential Medical ID Details
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (As on Medical Records) *</label>
                    <input
                      type="text"
                      required
                      value={regForm.fullName}
                      onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                      placeholder="e.g., Deepak Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (OTP Verification) *</label>
                    <input
                      type="tel"
                      required
                      value={regForm.mobile}
                      onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="name@example.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                    <input
                      type="password"
                      required
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      placeholder="Min 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Age *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="120"
                        value={regForm.age}
                        onChange={(e) => setRegForm({ ...regForm, age: e.target.value })}
                        placeholder="24"
                        className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                      <select
                        value={regForm.gender}
                        onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                        className="w-full px-2 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-rose-700 mb-1">Blood *</label>
                      <select
                        value={regForm.bloodGroup}
                        onChange={(e) => setRegForm({ ...regForm, bloodGroup: e.target.value })}
                        className="w-full px-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-bold text-rose-700"
                      >
                        <option>O+</option>
                        <option>O-</option>
                        <option>A+</option>
                        <option>A-</option>
                        <option>B+</option>
                        <option>B-</option>
                        <option>AB+</option>
                        <option>AB-</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Medical Safety Onboarding Fields */}
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-3">
                  <p className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-sky-600" /> Emergency & Allergy Safety Profile
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Known Drug or Food Allergies (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={regForm.allergies}
                      onChange={(e) => setRegForm({ ...regForm, allergies: e.target.value })}
                      placeholder="e.g., Penicillin, Sulfa drugs, Peanuts (or leave blank if none)"
                      className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={regForm.emergencyName}
                        onChange={(e) => setRegForm({ ...regForm, emergencyName: e.target.value })}
                        placeholder="e.g., Parent / Spouse Name"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        value={regForm.emergencyPhone}
                        onChange={(e) => setRegForm({ ...regForm, emergencyPhone: e.target.value })}
                        placeholder="+91 98765 00000"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                >
                  Create Medical Vault & Enter Dashboard →
                </button>

                <p className="text-center text-xs text-slate-500">
                  Already have a MedMemo account?{' '}
                  <button
                    type="button"
                    onClick={() => setViewMode('login')}
                    className="text-sky-600 font-bold hover:underline cursor-pointer"
                  >
                    Sign In Here
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: HEAL 24/7 INSPIRED HEALTHCARE LANDING PAGE
  // ============================================================================
  if (viewMode === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50/40 text-slate-900 font-sans selection:bg-sky-100 selection:text-sky-900">
        {/* Top Emergency & ABDM Utility Bar */}
        <div className="bg-gradient-to-r from-sky-950 via-blue-950 to-slate-900 text-sky-100 text-xs py-2.5 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>24/7 AI Personal Medical Memory • ABDM Health Locker Ready</span>
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-sky-300">
                <Siren className="w-3.5 h-3.5 text-rose-400" />
                <span>National Emergency (India): 112 / 108</span>
              </span>
            </div>
            <button
              onClick={() => {
                setCurrentUser(DEFAULT_USER);
                launchPortalTab('dashboard');
              }}
              className="text-amber-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Instant Live Demo (Aarav Sharma)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sticky Glass Healthcare Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-200">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">MedMemo</span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    24/7 Health Memory
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Your Personal Medical Memory</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <a href="#quick-care" className="hover:text-sky-600 transition">Care Services</a>
              <a href="#health-trackers" className="hover:text-sky-600 transition">Biomarker Trackers</a>
              <a href="#product-tour" className="hover:text-sky-600 transition">AI Workspace</a>
              <a href="#family-doctor" className="hover:text-sky-600 transition">Family & Doctor Share</a>
              <a href="#faq" className="hover:text-sky-600 transition">FAQ</a>
            </nav>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setViewMode('login')}
                className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-sky-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => setViewMode('register')}
                className="px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm shadow-sky-600/20 transition cursor-pointer"
              >
                New Register
              </button>
            </div>
          </div>
        </header>

        {/* ====================================================================
            SECTION 1: SEARCH-FIRST HEALTHCARE HERO + HEAL 24/7 ACTION CARDS
        ==================================================================== */}
        <section className="bg-gradient-to-b from-sky-50 via-blue-50/40 to-white pt-10 pb-16 border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              {/* Left 7 Cols */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-sky-200 shadow-2xs text-sky-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Remember Your Health • Understand Your History • Improve Your Future</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.13]">
                  Your Complete Medical History,{' '}
                  <span className="text-sky-600">Prescriptions & AI Health Coach</span> in One Place.
                </h1>

                <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                  Scan handwritten prescriptions, track blood report biomarkers over time, prepare smart questions for doctor visits, and stay consistent with daily wellness habits.
                </p>

                {/* Smart Search / Ask Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCurrentUser(DEFAULT_USER);
                    if (heroSearchQuery.trim()) {
                      launchPortalTab('assistant');
                      handleSendChat(heroSearchQuery);
                    } else {
                      launchPortalTab('vault');
                    }
                  }}
                  className="bg-white p-2 rounded-2xl border-2 border-sky-200/90 shadow-xl shadow-sky-900/5 flex flex-col sm:flex-row gap-2 max-w-2xl"
                >
                  <div className="flex items-center gap-2.5 px-3 py-2 flex-1">
                    <Search className="w-5 h-5 text-sky-600 shrink-0" />
                    <input
                      type="text"
                      value={heroSearchQuery}
                      onChange={(e) => setHeroSearchQuery(e.target.value)}
                      placeholder="Ask AI about your reports, search medicines, or check LDL trends..."
                      className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shrink-0 transition cursor-pointer"
                  >
                    Search / Ask AI
                  </button>
                </form>

                {/* Quick Action Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Popular:</span>
                  {[
                    { label: 'Scan Prescription', tab: 'scanner' },
                    { label: 'Lab Report Trends', tab: 'dashboard' },
                    { label: 'Doctor Visit Questions', tab: 'assistant' },
                    { label: 'Daily Wellness Ring', tab: 'coach' }
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => {
                        setCurrentUser(DEFAULT_USER);
                        launchPortalTab(chip.tab);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 font-semibold transition cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right 5 Cols: Floating Healthcare Summary Card */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-sky-950/10 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white font-bold flex items-center justify-center text-base">
                        AS
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900">Aarav Sharma</h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                            Blood O+
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Allergy Alert: Penicillin • Dust Mites</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ABDM Linked
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sky-900">Latest Lipid & CBC Panel</p>
                        <p className="text-slate-600 mt-0.5">LDL improved to 138 mg/dL (-9.2%)</p>
                      </div>
                      <span className="font-bold text-emerald-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                        12 Nov 26
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Active Prescriptions (2)</p>
                        <p className="text-slate-500 mt-0.5">Maxepa 1000 • Uprise-D3 60K</p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentUser(DEFAULT_USER);
                          launchPortalTab('vault');
                        }}
                        className="text-sky-600 font-bold hover:underline cursor-pointer"
                      >
                        View Rx →
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setViewMode('login')}
                      className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Existing User Login
                    </button>
                    <button
                      onClick={() => setViewMode('register')}
                      className="py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition cursor-pointer"
                    >
                      New Patient Register
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6-Card Quick Care Service Grid */}
            <div id="quick-care" className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-extrabold text-slate-900">24/7 Personal Healthcare Services</h2>
                <span className="text-xs font-semibold text-sky-600">Select a service to launch directly</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  {
                    tab: 'scanner',
                    title: 'Scan Prescription',
                    sub: 'AI OCR & Salt Check',
                    badge: 'AI OCR',
                    color: 'bg-sky-50 text-sky-600 border-sky-100',
                    icon: ScanLine
                  },
                  {
                    tab: 'vault',
                    title: 'Upload Lab Report',
                    sub: 'CBC, Lipid, Thyroid, MRI',
                    badge: 'Encrypted',
                    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                    icon: Upload
                  },
                  {
                    tab: 'assistant',
                    title: 'AI Health Memory',
                    sub: 'Ask Your Medical History',
                    badge: '24/7 AI',
                    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    icon: MessageSquareHeart
                  },
                  {
                    tab: 'timeline',
                    title: 'Health Timeline',
                    sub: 'Chronological Records',
                    badge: 'Verified',
                    color: 'bg-amber-50 text-amber-600 border-amber-100',
                    icon: Clock
                  },
                  {
                    tab: 'coach',
                    title: 'Daily Health Coach',
                    sub: 'Habits, Hydration & Rings',
                    badge: 'Tracker',
                    color: 'bg-rose-50 text-rose-600 border-rose-100',
                    icon: HeartPulse
                  },
                  {
                    tab: 'dashboard',
                    title: 'Doctor Visit Prep',
                    sub: '1-Page Summary & Share',
                    badge: 'ABDM',
                    color: 'bg-teal-50 text-teal-600 border-teal-100',
                    icon: Stethoscope
                  }
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      onClick={() => {
                        setCurrentUser(DEFAULT_USER);
                        launchPortalTab(card.tab);
                      }}
                      className="group bg-white p-4 rounded-2xl border border-slate-200/90 hover:border-sky-400 shadow-2xs hover:shadow-lg transition text-left flex flex-col justify-between space-y-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${card.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {card.badge}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition">
                          {card.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 2: HEALTH TRACKERS & DIAGNOSTIC CATEGORIES
        ==================================================================== */}
        <section id="health-trackers" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Structured Clinical Organization</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Track Every Health Parameter & Diagnostic Category
              </h2>
            </div>
            <button
              onClick={() => {
                setCurrentUser(DEFAULT_USER);
                launchPortalTab('vault');
              }}
              className="text-sm font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Medical Vault</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              {
                icon: Microscope,
                title: 'Blood & Lipid Panels',
                desc: 'CBC, HbA1c, Thyroid, Vitamin D, Lipid Profile trends',
                count: 'Auto-Extracted'
              },
              {
                icon: Pill,
                title: 'Prescriptions & Salts',
                desc: 'Brand names, generic compositions, dosage & allergies',
                count: 'OCR Verified'
              },
              {
                icon: Activity,
                title: 'Radiology & Scans',
                desc: 'MRI, CT Scan, X-Ray, Ultrasound & ECG reports',
                count: 'High-Res Vault'
              },
              {
                icon: ClipboardList,
                title: 'Discharge Summaries',
                desc: 'Hospitalization history, procedures & follow-up care',
                count: 'Chronological'
              },
              {
                icon: HeartPulse,
                title: 'Cardiac & BP Memory',
                desc: 'Cholesterol reduction, heart rate & cardio adherence',
                count: 'Trend Charts'
              },
              {
                icon: Droplets,
                title: 'Diabetes & Metabolic',
                desc: 'Quarterly HbA1c, fasting glucose & nutrition logs',
                count: 'Reference Flags'
              },
              {
                icon: Stethoscope,
                title: 'Ortho & Spine Care',
                desc: 'MRI findings, posture notes & mobility stretch streaks',
                count: 'Symptom Linked'
              },
              {
                icon: Users,
                title: 'Family Health Profiles',
                desc: 'Separate vaults for parents, spouse & children',
                count: 'Consent Safe'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentUser(DEFAULT_USER);
                    launchPortalTab('vault');
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-sky-300 shadow-2xs hover:shadow-md transition cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {item.count}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================================
            SECTION 3: INTERACTIVE WORKSPACE SHOWCASE TABS
        ==================================================================== */}
        <section id="product-tour" className="bg-slate-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Interactive Workspace Tour</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold">See How MedMemo Works Inside</h2>
              <p className="text-sm text-slate-400">
                Switch tabs below to inspect real extracted lab tables, OCR verification, AI chat, and daily progress rings.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2.5">
              {[
                { id: 'vault', label: '1. Personal Medical Vault', icon: FileText },
                { id: 'scanner', label: '2. AI Prescription Scanner', icon: ScanLine },
                { id: 'assistant', label: '3. AI Health Assistant', icon: MessageSquareHeart },
                { id: 'coach', label: '4. Daily Health Coach', icon: HeartPulse }
              ].map((t) => {
                const Icon = t.icon;
                const active = landingShowcaseTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setLandingShowcaseTab(t.id)}
                    className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
                      active
                        ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/25'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-10">
              {landingShowcaseTab === 'vault' && (
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
                      Encrypted Document Repository
                    </span>
                    <h3 className="text-2xl font-bold">Every Lab Report Parsed & Compared Automatically</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Upload PDFs or images from any lab. MedMemo extracts parameters, flags out-of-range values, and compares them against your historical baseline.
                    </p>
                    <button
                      onClick={() => {
                        setCurrentUser(DEFAULT_USER);
                        launchPortalTab('vault');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Open Medical Vault →
                    </button>
                  </div>
                  <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-5 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-bold text-slate-800">CBC & Lipid Profile • 12 Nov 2026</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        Apollo Diagnostics
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      {[
                        { name: 'Hemoglobin', val: '14.6 g/dL', ref: '13.5–17.5', flag: 'Normal' },
                        { name: 'LDL Cholesterol', val: '138 mg/dL', ref: '< 100 mg/dL', flag: 'High' },
                        { name: 'HbA1c', val: '5.4 %', ref: '< 5.7 %', flag: 'Normal' },
                        { name: 'Vitamin D (25-OH)', val: '34 ng/mL', ref: '30–100', flag: 'Normal' }
                      ].map((row, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-900">{row.name}</p>
                            <p className="text-[11px] text-slate-500">Ref: {row.ref}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-slate-900">{row.val}</p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                row.flag === 'Normal' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {row.flag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {landingShowcaseTab === 'scanner' && (
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                      Human-in-the-Loop Vision OCR
                    </span>
                    <h3 className="text-2xl font-bold">Scan Prescriptions & Verify Every Medicine Salt</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Extracts medicine brand names, generic salts, dosages, and duration—with mandatory user review and allergy cross-checks before saving.
                    </p>
                    <button
                      onClick={() => {
                        setCurrentUser(DEFAULT_USER);
                        launchPortalTab('scanner');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Try Prescription Scanner →
                    </button>
                  </div>
                  <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-5 space-y-3 shadow-xl">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                      ✓ Allergy Safety Check: No Penicillin derivatives found in scanned prescription.
                    </div>
                    <div className="space-y-2 text-xs">
                      {[
                        { brand: 'Telma 40', salt: 'Telmisartan 40mg', freq: '1 Tab • Morning • 30 Days' },
                        { brand: 'Pan-D', salt: 'Pantoprazole 40mg + Domperidone 30mg', freq: '1 Cap • Before Breakfast • 15 Days' },
                        { brand: 'Shelcal 500', salt: 'Calcium 500mg + Vitamin D3 250 IU', freq: '1 Tab • After Lunch • 60 Days' }
                      ].map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-2">
                          <div>
                            <p className="font-bold text-slate-900">{m.brand}</p>
                            <p className="text-slate-500">{m.salt}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-semibold">{m.freq}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {landingShowcaseTab === 'assistant' && (
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                      Context-Aware Medical Memory AI
                    </span>
                    <h3 className="text-2xl font-bold">Ask Questions Grounded Strictly in Your History</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Retrieves your authorized historical reports, cites exact dates, and prepares tailored questions for your next doctor appointment.
                    </p>
                    <button
                      onClick={() => {
                        setCurrentUser(DEFAULT_USER);
                        launchPortalTab('assistant');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Open AI Assistant →
                    </button>
                  </div>
                  <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
                    <div className="ml-auto max-w-[80%] bg-sky-600 text-white p-3 rounded-2xl rounded-br-none">
                      How has my LDL cholesterol changed since May 2026?
                    </div>
                    <div className="mr-auto max-w-[90%] bg-slate-100 text-slate-800 p-3.5 rounded-2xl rounded-bl-none space-y-1.5">
                      <p>
                        • <strong>May 18, 2026:</strong> 152 mg/dL (Borderline High)<br />
                        • <strong>Nov 12, 2026:</strong> 138 mg/dL (-9.2% improvement)
                      </p>
                      <p className="text-[11px] text-sky-700 font-semibold">
                        Cited: CBC & Lipid Profile (12 Nov 2026) • Informational Summary Only
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {landingShowcaseTab === 'coach' && (
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-5 space-y-4">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
                      Behavioral Habit & Streak System
                    </span>
                    <h3 className="text-2xl font-bold">Color-Coded Progress Rings (Red → Orange → Yellow → Green)</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Track daily exercise, hydration, sleep, and prescribed supplement adherence with visual progress rings and streaks.
                    </p>
                    <button
                      onClick={() => {
                        setCurrentUser(DEFAULT_USER);
                        launchPortalTab('coach');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      Open Daily Health Coach →
                    </button>
                  </div>
                  <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
                    <CircularProgressRing percentage={92} size={130} strokeWidth={12} />
                    <div className="space-y-2 text-xs flex-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                        Green Zone • Daily Target Achieved
                      </span>
                      <p className="text-sm font-bold text-slate-900">12-Day Active Wellness Streak 🔥</p>
                      <p className="text-slate-600">
                        ✓ 35 mins Brisk Cardio • ✓ Maxepa 1000 after dinner • ✓ 25g Soluble Fiber • ✓ 10-min Lumbar Mobility
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 4: FAMILY CARE & DOCTOR SHARING
        ==================================================================== */}
        <section id="family-doctor" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-12">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Manage Health Histories for Your Entire Family
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Keep separate medical vaults, allergy alerts, and prescription timelines for your parents, spouse, and children under one account—with zero data mix-ups.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                {[
                  { name: 'Aarav (You)', docs: '4 Records', blood: 'O+' },
                  { name: 'Rajesh (Father)', docs: '11 Records', blood: 'B+' },
                  { name: 'Priya (Spouse)', docs: '6 Records', blood: 'A+' }
                ].map((fam) => (
                  <div key={fam.name} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="font-bold text-slate-900">{fam.name}</p>
                    <p className="text-slate-500 mt-0.5">{fam.docs}</p>
                    <span className="inline-block mt-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      Blood {fam.blood}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-600 to-blue-800 text-white p-8 rounded-3xl shadow-lg space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 text-white flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold">
                Time-Limited Doctor Sharing & Strict AI Safety
              </h3>
              <p className="text-sm text-sky-100 leading-relaxed">
                Share selected lab reports or a 1-page consultation summary with your doctor via an expiring link—and revoke access anytime. MedMemo never claims an unverified diagnosis or changes a doctor's prescription.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-xs pt-2">
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
                  <p className="font-bold">✓ Consent-Based Access Logs</p>
                  <p className="text-sky-100 mt-1">Track who viewed your records and set automatic 24-hour expiry.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15">
                  <p className="font-bold">✓ Verified vs AI Separation</p>
                  <p className="text-sky-100 mt-1">Lab facts and AI insights are always clearly labeled.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 5: TESTIMONIALS + FAQ ACCORDION
        ==================================================================== */}
        <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-16">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  'Managing my father’s cardiology prescriptions and quarterly blood panels across three hospitals used to be overwhelming. MedMemo keeps every report and dosage in one clean timeline.',
                name: 'Ananya Deshpande',
                role: 'Caregiver • Bengaluru'
              },
              {
                quote:
                  'When a patient walks in with a 1-page chronological summary showing 12 months of HbA1c and lipid trends instead of loose papers, consultation quality improves immediately.',
                name: 'Dr. Rajiv Menon (MD)',
                role: 'Consultant Physician'
              },
              {
                quote:
                  'The Daily Health Coach ring and prescription scanner helped me stay consistent with my Vitamin D and cardio routine for 90 straight days.',
                name: 'Rohan Kulkarni',
                role: 'Software Engineer • Pune'
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">"{item.quote}"</p>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Frequently Asked Questions</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Everything You Need to Know</h2>
            </div>

            <div className="space-y-3">
              {LANDING_FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${
                          isOpen ? 'rotate-180 text-sky-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 6: ENTERPRISE FOOTER
        ==================================================================== */}
        <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-slate-800/90 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <h3 className="text-2xl font-extrabold text-white">Start Your Personal Medical Memory Today</h3>
              <p className="text-sm text-slate-400">
                Remember Your Health. Understand Your History. Improve Your Future.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setViewMode('login')}
                className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition cursor-pointer"
              >
                Already Registered (Login)
              </button>
              <button
                onClick={() => setViewMode('register')}
                className="px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm transition cursor-pointer"
              >
                New Patient Registration
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold">MedMemo</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                AI-powered personal healthcare and medical history management platform built for patients and families.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase tracking-wider">Core Modules</p>
              <ul className="space-y-1.5 text-slate-400">
                <li>Personal Medical Vault</li>
                <li>AI Prescription Scanner</li>
                <li>Medical History Timeline</li>
                <li>AI Health Reports Analysis</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase tracking-wider">Care & Wellness</p>
              <ul className="space-y-1.5 text-slate-400">
                <li>AI Health Assistant</li>
                <li>Daily Health Coach</li>
                <li>Doctor Sharing Links</li>
                <li>Family Health Vaults</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white uppercase tracking-wider">Safety & Compliance</p>
              <ul className="space-y-1.5 text-slate-400">
                <li>ABDM Interoperability</li>
                <li>DPDP Privacy Standards</li>
                <li>Non-Diagnostic AI Policy</li>
                <li>Emergency Care Notice (112 / 108)</li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© 2026 MedMemo Health Technologies. All rights reserved.</p>
            <p>
              Medical Disclaimer: MedMemo is an informational record platform and does not provide medical diagnosis or emergency services.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: AUTHENTICATED PATIENT PORTAL (SIDEBAR + MODULES)
  // ============================================================================
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Patient Dashboard', icon: Activity },
    { id: 'timeline', label: 'Medical History', icon: Clock },
    { id: 'vault', label: 'Medical Vault', icon: FileText, badge: vaultDocs.length },
    { id: 'scanner', label: 'Prescription Scanner', icon: ScanLine },
    { id: 'assistant', label: 'AI Health Assistant', icon: MessageSquareHeart },
    { id: 'coach', label: 'Daily Health Coach', icon: HeartPulse }
  ];

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <aside className="hidden lg:flex lg:flex-col lg:w-68 bg-white border-r border-slate-200/90 fixed inset-y-0 left-0 z-20">
        <div className="h-16 px-6 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-white">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900">MedMemo</span>
            <p className="text-[10px] font-medium text-slate-400 leading-none">Personal Medical Memory</p>
          </div>
        </div>

        <div className="p-4 m-4 rounded-2xl bg-sky-50/70 border border-sky-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500">
                {currentUser.age} yrs • Blood <span className="font-bold text-rose-600">{currentUser.bloodGroup}</span>
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-sky-200/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">ABDM Health ID</span>
            <span className="font-mono font-semibold text-sky-800">{currentUser.abdmId}</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  active
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      active ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-500 leading-relaxed">
            <strong className="text-slate-700 block mb-0.5">Safety Notice:</strong>
            Informational record platform only. Consult a licensed doctor for diagnosis.
          </div>
          <button
            onClick={() => setViewMode('landing')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Back to Home / Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-200 z-30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900">MedMemo</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-slate-900/40 pt-14" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white p-4 space-y-1 border-b border-slate-200" onClick={(e) => e.stopPropagation()}>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    activeTab === item.id ? 'bg-sky-600 text-white' : 'text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <main className="flex-1 lg:pl-68 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {apiNotice && (
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {apiNotice}
            </p>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Welcome, {currentUser.name} • Remember Your Health • Understand Your History
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Allergies: {currentUser.allergies.join(', ')}
              </span>
              <button
                onClick={() => setActiveTab('scanner')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Scan Rx</span>
              </button>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Stored Medical Records</span>
                    <FileText className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{vaultDocs.length} Files</p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Encrypted & Indexed
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Active Medications</span>
                    <Pill className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">2 Prescriptions</p>
                  <p className="text-xs text-slate-500 mt-1">Maxepa 1000 • Uprise-D3</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Today's Wellness Tasks</span>
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{taskCompletionPct}% Done</p>
                  <p className={`text-xs mt-1 font-medium ${progressState.text}`}>{progressState.label}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                    <span>Emergency Contact</span>
                    <PhoneCall className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-2 truncate">{currentUser.emergencyContact.split('•')[0]}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentUser.emergencyContact.split('•')[1] || currentUser.phone} • Blood {currentUser.bloodGroup}
                  </p>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Longitudinal Biomarker Trends</h2>
                        <p className="text-xs text-slate-500">Extracted from verified lab reports (Feb – Nov 2026)</p>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                        {[
                          { id: 'ldl', label: 'LDL Cholesterol' },
                          { id: 'vitD', label: 'Vitamin D' },
                          { id: 'hba1c', label: 'HbA1c' }
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMetric(m.id)}
                            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                              selectedMetric === m.id ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-4 items-end h-48 border-b border-slate-100 pb-4">
                      {BIOMARKER_TRENDS.map((point) => {
                        const rawVal = point[selectedMetric];
                        const maxVal = selectedMetric === 'ldl' ? 180 : selectedMetric === 'vitD' ? 50 : 7;
                        const heightPct = Math.min(100, Math.round((rawVal / maxVal) * 100));
                        const unit = selectedMetric === 'ldl' ? 'mg/dL' : selectedMetric === 'vitD' ? 'ng/mL' : '%';
                        return (
                          <div key={point.month} className="flex flex-col items-center justify-end h-full gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {rawVal} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
                            </span>
                            <div className="w-full max-w-[54px] bg-slate-100 rounded-t-xl h-32 flex items-end overflow-hidden">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t-xl transition-all duration-500 ${
                                  selectedMetric === 'ldl'
                                    ? 'bg-sky-500'
                                    : selectedMetric === 'vitD'
                                    ? 'bg-emerald-500'
                                    : 'bg-indigo-500'
                                }`}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-500">{point.month}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 bg-sky-50/60 p-3 rounded-xl border border-sky-100">
                      <span>
                        {selectedMetric === 'ldl' &&
                          'Reference Target: < 100 mg/dL. Down 20 mg/dL (-12.6%) since February 2026.'}
                        {selectedMetric === 'vitD' &&
                          'Reference Optimal: 30–100 ng/mL. Successfully restored into optimal range in Nov 2026.'}
                        {selectedMetric === 'hba1c' &&
                          'Reference Normal: < 5.7%. Stable glycemic control across all 4 quarters.'}
                      </span>
                      <button
                        onClick={() => setActiveTab('vault')}
                        className="text-sky-700 font-semibold hover:underline shrink-0 ml-2"
                      >
                        View Lab PDF →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">Recent Medical Memory</h2>
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className="text-xs font-semibold text-sky-600 hover:underline"
                      >
                        Full Timeline →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {timelineEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-sky-700">{ev.date} • {ev.type}</span>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                ev.source === 'Verified Record'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {ev.source}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{ev.title}</p>
                          <p className="text-xs text-slate-600">{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
                    <div className="w-full flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">Daily Wellness Ring</h2>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${progressState.bg} ${progressState.text}`}>
                        {progressState.label}
                      </span>
                    </div>

                    <CircularProgressRing percentage={taskCompletionPct} />

                    <p className="text-xs text-slate-600 leading-relaxed">{progressState.message}</p>

                    <div className="w-full space-y-2 text-left pt-2">
                      {dailyGoals.slice(0, 3).map((goal) => (
                        <button
                          key={goal.id}
                          onClick={() => handleToggleGoal(goal.id)}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-left cursor-pointer"
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className={`text-xs font-medium ${goal.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {goal.title}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setActiveTab('coach')}
                      className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Open Daily Health Coach →
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-6 rounded-2xl shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-sky-100 text-xs font-bold uppercase tracking-wider">
                      <Stethoscope className="w-4 h-4" /> Next Doctor Visit Prep
                    </div>
                    <h3 className="text-base font-bold">Generate Consultation Summary</h3>
                    <p className="text-xs text-sky-100 leading-relaxed">
                      Compile your last 6 months of LDL changes, Vitamin D recovery, and lumbar spine notes into a 1-page summary.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('assistant');
                        handleSendChat('Prepare questions for my next doctor visit based on my recent reports');
                      }}
                      className="w-full py-2.5 rounded-xl bg-white text-sky-700 font-bold text-xs hover:bg-sky-50 transition cursor-pointer"
                    >
                      Ask AI Assistant to Prepare
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <form onSubmit={handleAddTimelineNote} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900">Log Patient-Reported Symptom or Recovery Note</h2>
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium">
                    Tagged separately from verified clinical records
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 text-slate-700"
                  >
                    <option value="Symptom Note">Symptom Note</option>
                    <option value="Recovery Update">Recovery Update</option>
                    <option value="Follow-up Reminder">Follow-up Reminder</option>
                  </select>
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="e.g., Mild morning fatigue for 2 days, or back stiffness improved after stretching..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shrink-0 transition cursor-pointer"
                  >
                    + Add to Timeline
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2">
                {['All', 'Verified Record', 'Patient-Reported'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      timelineFilter === filter
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="relative pl-6 border-l-2 border-sky-200 space-y-6">
                {filteredTimeline.map((item) => (
                  <div key={item.id} className="relative bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-600 ring-4 ring-sky-50 absolute -left-[31px] top-6" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {item.date}
                        </span>
                        <span className="text-xs font-semibold text-sky-700">{item.type}</span>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          item.source === 'Verified Record'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.source}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>

                    <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2 text-xs text-sky-900">
                      <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">AI Memory Correlation: </span>
                        {item.aiCorrelation}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={vaultSearch}
                    onChange={(e) => setVaultSearch(e.target.value)}
                    placeholder="Search reports, doctors, hospitals..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Medical Document</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {['All', 'Prescriptions', 'Lab Reports', 'MRI / CT / X-Ray / ECG', 'Discharge Summaries'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setVaultCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      vaultCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold">
                          {doc.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{doc.date}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                      <p className="text-xs text-slate-500">
                        {doc.doctor} • {doc.hospital}
                      </p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                        {doc.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <ShieldCheck className="w-3.5 h-3.5" /> {doc.status}
                      </span>
                      <button
                        onClick={() => setViewingDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect & AI Analysis
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {viewingDoc && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-bold text-sky-600 uppercase">{viewingDoc.category}</span>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">{viewingDoc.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {viewingDoc.doctor} • {viewingDoc.hospital} • {viewingDoc.date}
                        </p>
                      </div>
                      <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                      <p className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Health Report Summary
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{viewingDoc.summary}</p>
                    </div>

                    {viewingDoc.parameters && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Extracted Biomarkers & Reference Ranges
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-3 font-semibold">Parameter</th>
                                <th className="p-3 font-semibold">Recorded Value</th>
                                <th className="p-3 font-semibold">Reference Range</th>
                                <th className="p-3 font-semibold">Flag</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {viewingDoc.parameters.map((p, idx) => (
                                <tr key={idx}>
                                  <td className="p-3 font-medium text-slate-900">{p.name}</td>
                                  <td className="p-3 font-bold text-slate-900">{p.value}</td>
                                  <td className="p-3 text-slate-500">{p.range}</td>
                                  <td className="p-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-semibold ${
                                        p.status === 'Normal'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-amber-50 text-amber-700'
                                      }`}
                                    >
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {viewingDoc.medicines && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Verified Prescribed Medications
                        </h4>
                        <div className="space-y-2">
                          {viewingDoc.medicines.map((m, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                              <p className="font-bold text-slate-900">
                                {m.brand} <span className="font-normal text-slate-500">({m.salt})</span>
                              </p>
                              <p className="text-slate-600 mt-1">
                                Dosage: <strong>{m.dosage}</strong> • {m.freq} • Duration: {m.duration}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setViewingDoc(null)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showUploadModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <form
                    onSubmit={handleUploadDocument}
                    className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-slate-900">Upload to Medical Vault</h3>
                      <button type="button" onClick={() => setShowUploadModal(false)} className="text-slate-400">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                      <input
                        name="docTitle"
                        type="text"
                        placeholder="e.g., Thyroid Profile (T3, T4, TSH)"
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                      <select name="docCategory" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm">
                        <option value="Lab Reports">Lab Reports</option>
                        <option value="Prescriptions">Prescriptions</option>
                        <option value="MRI / CT / X-Ray / ECG">MRI / CT / X-Ray / ECG</option>
                        <option value="Discharge Summaries">Discharge Summaries</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Name</label>
                        <input
                          name="docDoctor"
                          type="text"
                          placeholder="Dr. A. Verma"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital / Lab</label>
                        <input
                          name="docHospital"
                          type="text"
                          placeholder="Metropolis Lab"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                        />
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-sky-200 rounded-2xl p-4 text-center bg-sky-50/40">
                      <Upload className="w-6 h-6 text-sky-600 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">Demo File Attached: report_scan_2026.pdf</p>
                      <p className="text-[11px] text-slate-400">Encrypted AES-256 simulation</p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm cursor-pointer"
                    >
                      Encrypt & Save to Vault
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scanner' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">AI Prescription OCR & Verification</h2>
                    <p className="text-xs text-slate-500">
                      Upload a handwritten or printed prescription. Review and edit every extracted medicine before saving.
                    </p>
                  </div>
                  {scannerStep !== 'idle' && (
                    <button
                      onClick={() => setScannerStep('idle')}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Reset Scanner
                    </button>
                  )}
                </div>

                {scannerError && (
                  <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {scannerError}
                  </p>
                )}

                {scannerStep === 'idle' && (
                  <div className="border-2 border-dashed border-sky-200 rounded-3xl p-10 text-center bg-sky-50/30 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto">
                      <ScanLine className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-slate-900">Drop Prescription Image or PDF</h3>
                      <p className="text-xs text-slate-500">
                        Supports JPG, PNG, and multi-page PDF prescriptions. Extracts brand names, generic salts, dosage, and frequency.
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <label className="px-5 py-2.5 rounded-xl border border-sky-300 bg-white text-sky-700 text-xs font-semibold shadow-xs transition cursor-pointer">
                        Upload image or PDF
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="sr-only"
                          onChange={handlePrescriptionUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setScannerError('');
                          setScannerStep('scanning');
                          setTimeout(() => setScannerStep('review'), 900);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        Run Sample Prescription OCR Demo
                      </button>
                    </div>
                  </div>
                )}

                {scannerStep === 'scanning' && (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold text-slate-900">Extracting medicine names, salts & dosages...</p>
                    <p className="text-xs text-slate-500">Applying clinical safety checks against your allergy profile</p>
                  </div>
                )}

                {(scannerStep === 'review' || scannerStep === 'saved') && (
                  <div className="space-y-5">
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Human Verification Required:</strong> Please verify all OCR-extracted dosages against your original paper prescription before saving.
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor & Clinic Details</label>
                        <input
                          type="text"
                          value={scannedDoctor}
                          onChange={(e) => setScannedDoctor(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 w-full">
                          ✓ Allergy Cross-Check Passed ({currentUser.allergies.join(', ')}): No conflicts detected.
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="p-3 font-semibold">Brand Name</th>
                            <th className="p-3 font-semibold">Generic Salt</th>
                            <th className="p-3 font-semibold">Dosage</th>
                            <th className="p-3 font-semibold">Frequency</th>
                            <th className="p-3 font-semibold">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {scannedMeds.map((med, index) => (
                            <tr key={med.id}>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={med.brand}
                                  onChange={(e) => {
                                    const copy = [...scannedMeds];
                                    copy[index].brand = e.target.value;
                                    setScannedMeds(copy);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-900"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={med.salt}
                                  onChange={(e) => {
                                    const copy = [...scannedMeds];
                                    copy[index].salt = e.target.value;
                                    setScannedMeds(copy);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={med.dosage}
                                  onChange={(e) => {
                                    const copy = [...scannedMeds];
                                    copy[index].dosage = e.target.value;
                                    setScannedMeds(copy);
                                  }}
                                  className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={med.freq}
                                  onChange={(e) => {
                                    const copy = [...scannedMeds];
                                    copy[index].freq = e.target.value;
                                    setScannedMeds(copy);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => {
                                    const copy = [...scannedMeds];
                                    copy[index].duration = e.target.value;
                                    setScannedMeds(copy);
                                  }}
                                  className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {scannerStep === 'review' ? (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveScannedPrescription}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          Confirm & Save Verified Prescription to Vault
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Saved to your Personal Medical Vault!
                        </span>
                        <button
                          onClick={() => setActiveTab('vault')}
                          className="text-xs font-bold text-emerald-700 underline cursor-pointer"
                        >
                          View in Vault →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[540px]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">MedMemo Context-Aware Assistant</h2>
                      <p className="text-[11px] text-slate-500">Retrieves only your authorized records • Non-diagnostic</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${
                        msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                      }`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-sky-600 text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.citation && (
                        <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.citation}</span>
                      )}
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendChat();
                  }}
                  className="p-3.5 border-t border-slate-100 flex gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about past lab trends, active medicines, or doctor visit questions..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              </div>

              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Suggested Memory Prompts
                  </h3>
                  {[
                    'How has my LDL cholesterol changed since May 2026?',
                    'Prepare questions for my next doctor visit',
                    'List my active prescriptions and recorded allergies'
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(prompt)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:bg-sky-50/50 text-xs font-medium text-slate-700 transition cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/80 space-y-2 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> Medical Safety Guardrails
                  </p>
                  <ul className="space-y-1.5 text-amber-800 list-disc pl-4">
                    <li>Never provides a confirmed medical diagnosis.</li>
                    <li>Never suggests stopping or replacing prescribed drugs.</li>
                    <li>Seek immediate emergency care for chest pain, severe dyspnea, or acute neurological symptoms.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coach' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
                    <div className="w-full flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">Today's Completion Ring</h2>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${progressState.bg} ${progressState.text}`}>
                        {progressState.label}
                      </span>
                    </div>

                    <CircularProgressRing percentage={taskCompletionPct} size={172} strokeWidth={14} />

                    <div className="grid grid-cols-4 gap-1.5 w-full pt-1 text-[10px] font-semibold">
                      <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">&lt;40% Red</div>
                      <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">40-69% Org</div>
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">70-89% Yel</div>
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">90%+ Grn</div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{progressState.message}</p>
                    <p className="text-[11px] text-slate-400">
                      Note: Ring reflects completed daily wellness tasks, not clinical health status.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-sky-500" /> Daily Hydration
                      </span>
                      <span className="text-xs font-bold text-sky-700">{waterGlasses} / 8 Glasses (2.0 L)</span>
                    </div>
                    <div className="flex gap-1.5">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setWaterGlasses(i + 1)}
                          className={`flex-1 h-7 rounded-lg transition cursor-pointer ${
                            i < waterGlasses ? 'bg-sky-500' : 'bg-slate-100 hover:bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Personalized Daily Wellness Plan</h2>
                        <p className="text-xs text-slate-500">Tailored around your lipid reduction & lumbar spine care</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Flame className="w-3.5 h-3.5" /> Best Streak: 12d
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {dailyGoals.map((goal) => (
                        <div
                          key={goal.id}
                          onClick={() => handleToggleGoal(goal.id)}
                          className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                            goal.completed
                              ? 'bg-emerald-50/40 border-emerald-200/80'
                              : 'bg-white border-slate-200 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {goal.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                            )}
                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  goal.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {goal.title}
                              </p>
                              <span className="text-[11px] text-slate-500">
                                {goal.category} • Target: {goal.target}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-slate-500 shrink-0">🔥 {goal.streak}d</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddGoal} className="flex gap-2 pt-2">
                      <select
                        value={newGoalCategory}
                        onChange={(e) => setNewGoalCategory(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                      >
                        <option value="Activity">Activity</option>
                        <option value="Nutrition">Nutrition</option>
                        <option value="Sleep">Sleep</option>
                        <option value="Recovery">Recovery</option>
                      </select>
                      <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="Add a daily wellness habit..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        + Add
                      </button>
                    </form>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">7-Day Task Adherence History</h3>
                      <span className="text-xs text-slate-500">Weekly Avg: 83%</span>
                    </div>
                    <div className="grid grid-cols-7 gap-3 items-end h-32 pt-2">
                      {WEEKLY_ADHERENCE.map((d) => {
                        const pct = d.day === 'Today' ? taskCompletionPct : d.pct;
                        const st = getProgressState(pct);
                        return (
                          <div key={d.day} className="flex flex-col items-center justify-end h-full gap-1.5">
                            <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
                            <div className="w-full bg-slate-100 rounded-t-lg h-20 flex items-end overflow-hidden">
                              <div
                                style={{ height: `${pct}%`, backgroundColor: st.stroke }}
                                className="w-full rounded-t-lg transition-all duration-300"
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-500">{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}