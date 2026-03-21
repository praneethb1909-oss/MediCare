import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dummyHospitals = [
  {
    id: 'hosp-1',
    name: 'MediCare Rajam',
    address: 'Main Road, Rajam',
    city: 'Rajam',
    phone: '+91 94401 23456',
    email: 'contact@rajam.medicare.in',
    description: 'Premier multi-specialty hospital in Rajam.',
    image_url: 'https://images.unsplash.com/photo-1587350859728-117622bb45ff?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-2',
    name: 'MediCare Vizag',
    address: 'Health City, Arilova',
    city: 'Visakhapatnam',
    phone: '+91 94402 34567',
    email: 'info@vizag.medicare.in',
    description: 'Advanced tertiary care center in Vizag.',
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-3',
    name: 'Medicover Hospitals - Srikakulam',
    address: 'Srikakulam',
    city: 'Srikakulam',
    phone: '+91 00000 00000',
    email: 'info@medicover-srikakulam.in',
    description: 'Medicover multi-specialty hospital serving Rajam / Srikakulam region.',
    image_url: 'https://images.unsplash.com/photo-1586773860383-dab5f3bc1f4b?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-4',
    name: 'Queens NRI Hospital',
    address: 'Srikakulam',
    city: 'Srikakulam',
    phone: '+91 00000 00001',
    email: 'info@queensnri.in',
    description: 'NRI hospital providing advanced healthcare services in Srikakulam.',
    image_url: 'https://images.unsplash.com/photo-1512678080530-56978a1d78a4?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-5',
    name: 'Apollo Hospitals Vizag',
    address: 'Visakhapatnam',
    city: 'Visakhapatnam',
    phone: '+91 00000 00002',
    email: 'info@apollo-vizag.in',
    description: 'Apollo multi-specialty tertiary care hospital in Visakhapatnam.',
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-6',
    name: 'Medicover Hospital Venkojipalem & MVP',
    address: 'Venkojipalem, Vizag',
    city: 'Vizag',
    phone: '+91 00000 00003',
    email: 'info@medicover-vizag.in',
    description: 'Medicover hospital at Venkojipalem & MVP, Vizag.',
    image_url: 'https://images.unsplash.com/photo-1587351021759-3e56e9c27729?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-7',
    name: 'Medicover Woman & Child Hospital',
    address: 'Vizag',
    city: 'Vizag',
    phone: '+91 00000 00004',
    email: 'info@medicover-womenchild.in',
    description: 'Women and child specialty hospital in Vizag.',
    image_url: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  },
  {
    id: 'hosp-8',
    name: 'Apollo Clinic Dwaraka Nagar',
    address: 'Dwaraka Nagar, Vizag',
    city: 'Vizag',
    phone: '+91 00000 00005',
    email: 'info@apollo-dwarakanagar.in',
    description: 'Apollo clinic at Dwaraka Nagar, Vizag.',
    image_url: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&q=80&w=400',
    created_at: new Date().toISOString()
  }
];

const dummyDepartments = [
  { id: 'dept-1', name: 'Cardiology', description: 'Heart and vascular care' },
  { id: 'dept-2', name: 'Neurology', description: 'Brain and nervous system care' },
  { id: 'dept-3', name: 'Pediatrics', description: 'Child healthcare' },
  { id: 'dept-4', name: 'Orthopedics', description: 'Bone and joint care' },
  { id: 'dept-5', name: 'General Medicine', description: 'General physician and internal medicine' },
  { id: 'dept-6', name: 'General Surgery', description: 'General and laparoscopic surgery' },
  { id: 'dept-7', name: 'Urology', description: 'Urinary tract and male reproductive health' },
  { id: 'dept-8', name: 'Gastroenterology', description: 'Digestive system and liver care' },
  { id: 'dept-9', name: 'Nephrology', description: 'Kidney and renal care' },
  { id: 'dept-10', name: 'Cardiac Surgery', description: 'Heart and thoracic surgical care' },
  { id: 'dept-11', name: 'Oncology', description: 'Cancer diagnosis and treatment' },
  { id: 'dept-12', name: 'Interventional Radiology', description: 'Image-guided minimally invasive procedures' },
  { id: 'dept-13', name: 'Pulmonology', description: 'Lung and respiratory care' },
  { id: 'dept-14', name: 'Gynecology', description: 'Women\'s health and reproductive care' }
];

const dummyMedicalTypes = [
  { id: 'type-1', name: 'General Consultation', icon: 'User' },
  { id: 'type-2', name: 'Specialist Visit', icon: 'Stethoscope' },
  { id: 'type-3', name: 'Diagnostic Test', icon: 'Activity' }
];

const dummyDoctors = [
  // Existing sample doctors
  {
    id: 'doc-1',
    name: 'Dr. Ramesh Babu',
    user_id: 'dev-doctor-1',
    hospital_id: 'hosp-1',
    department_id: 'dept-1',
    specialization: 'Senior Cardiologist',
    email: 'ramesh.babu@medicare.in',
    phone: '+91 94401 23456',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-2',
    name: 'Dr. Lakshmi Prasanna',
    user_id: 'dev-doctor-2',
    hospital_id: 'hosp-2',
    department_id: 'dept-2',
    specialization: 'Neurology Specialist',
    email: 'lakshmi.p@medicare.in',
    phone: '+91 94402 34567',
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  // Medicover Hospitals - Srikakulam
  {
    id: 'doc-3',
    name: 'Dr. Kuntilla Amulya',
    user_id: 'medicover-sklm-1',
    hospital_id: 'hosp-3',
    department_id: 'dept-5',
    specialization: 'General Physician',
    email: 'amulya.k@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-4',
    name: 'Dr. Ashok Kumar Annepu',
    user_id: 'medicover-sklm-2',
    hospital_id: 'hosp-3',
    department_id: 'dept-5',
    specialization: 'General Physician',
    email: 'ashok.a@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-5',
    name: 'Dr. Annepu Siva Prasad',
    user_id: 'medicover-sklm-3',
    hospital_id: 'hosp-3',
    department_id: 'dept-4',
    specialization: 'Orthopaedist',
    email: 'siva.p@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-6',
    name: 'Dr. Manoj Kumar Sistu',
    user_id: 'medicover-sklm-4',
    hospital_id: 'hosp-3',
    department_id: 'dept-6',
    specialization: 'General Surgeon',
    email: 'manoj.s@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '16:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-7',
    name: 'Dr. Hari Prasada Rao Dumpala',
    user_id: 'medicover-sklm-5',
    hospital_id: 'hosp-3',
    department_id: 'dept-7',
    specialization: 'Urologist',
    email: 'hari.d@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '11:00:00',
    available_hours_end: '19:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-8',
    name: 'Dr. Prasanth Raghupatruni',
    user_id: 'medicover-sklm-6',
    hospital_id: 'hosp-3',
    department_id: 'dept-8',
    specialization: 'Gastroenterologist',
    email: 'prasanth.r@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '15:00:00',
    created_at: new Date().toISOString()
  },
  // Queens NRI Hospital - Srikakulam
  {
    id: 'doc-9',
    name: 'Dr. N Abhinay',
    user_id: 'queens-sklm-1',
    hospital_id: 'hosp-4',
    department_id: 'dept-5',
    specialization: 'General Physician',
    email: 'abhinay.n@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-10',
    name: 'Dr. Rajan Siva Prasad',
    user_id: 'queens-sklm-2',
    hospital_id: 'hosp-4',
    department_id: 'dept-4',
    specialization: 'Orthopaedist',
    email: 'rajan.p@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-11',
    name: 'Dr. E Aravind',
    user_id: 'queens-sklm-3',
    hospital_id: 'hosp-4',
    department_id: 'dept-6',
    specialization: 'General Surgeon',
    email: 'aravind.e@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '15:00:00',
    created_at: new Date().toISOString()
  },
  // Apollo Hospitals Vizag
  {
    id: 'doc-12',
    name: 'Dr. Ravi Raju Tatapudi',
    user_id: 'apollo-vizag-1',
    hospital_id: 'hosp-5',
    department_id: 'dept-9',
    specialization: 'Nephrology',
    email: 'ravi.t@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-13',
    name: 'Dr. Indhukuri Satish Raju',
    user_id: 'apollo-vizag-2',
    hospital_id: 'hosp-5',
    department_id: 'dept-4',
    specialization: 'Orthopedics',
    email: 'satish.i@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-14',
    name: 'Dr. D.K. Baruah',
    user_id: 'apollo-vizag-3',
    hospital_id: 'hosp-5',
    department_id: 'dept-1',
    specialization: 'Cardiology',
    email: 'baruah.dk@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '15:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-15',
    name: 'Dr. N.K. Panigrahi',
    user_id: 'apollo-vizag-4',
    hospital_id: 'hosp-5',
    department_id: 'dept-1',
    specialization: 'Cardiology',
    email: 'panigrahi.nk@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '11:00:00',
    available_hours_end: '19:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-16',
    name: 'Dr. T Narayana Rao',
    user_id: 'apollo-vizag-5',
    hospital_id: 'hosp-5',
    department_id: 'dept-6',
    specialization: 'General Surgeon',
    email: 'narayana.t@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-17',
    name: 'Dr. Abdul D Khan',
    user_id: 'apollo-vizag-6',
    hospital_id: 'hosp-5',
    department_id: 'dept-4',
    specialization: 'Orthopedic Surgeon',
    email: 'abdul.k@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-18',
    name: 'Dr. Prasad G',
    user_id: 'apollo-vizag-7',
    hospital_id: 'hosp-5',
    department_id: 'dept-9',
    specialization: 'Nephrologist',
    email: 'prasad.g@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '16:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-19',
    name: 'Dr. A Suresh',
    user_id: 'apollo-vizag-8',
    hospital_id: 'hosp-5',
    department_id: 'dept-10',
    specialization: 'Cardiac Surgery',
    email: 'suresh.a@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '16:00:00',
    created_at: new Date().toISOString()
  },
  // Medicover Hospital Venkojipalem & MVP
  {
    id: 'doc-20',
    name: 'Dr. K Satya Rao',
    user_id: 'medicover-vizag-1',
    hospital_id: 'hosp-6',
    department_id: 'dept-2',
    specialization: 'Neurology',
    email: 'satya.k@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-21',
    name: 'Dr. Vallam Chandra',
    user_id: 'medicover-vizag-2',
    hospital_id: 'hosp-6',
    department_id: 'dept-11',
    specialization: 'Oncology',
    email: 'chandra.v@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-22',
    name: 'Dr. V. Chenna Rao',
    user_id: 'medicover-vizag-3',
    hospital_id: 'hosp-6',
    department_id: 'dept-12',
    specialization: 'Interventional Radiology',
    email: 'chenna.v@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '16:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-23',
    name: 'Dr. Pathakamsetty Swarna',
    user_id: 'medicover-vizag-4',
    hospital_id: 'hosp-6',
    department_id: 'dept-11',
    specialization: 'Onco-Surgery',
    email: 'swarna.p@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-24',
    name: 'Dr. Devara Anil',
    user_id: 'medicover-vizag-5',
    hospital_id: 'hosp-6',
    department_id: 'dept-12',
    specialization: 'Interventional Radiology',
    email: 'anil.d@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-25',
    name: 'Dr. Prem Kumar Allena',
    user_id: 'medicover-vizag-6',
    hospital_id: 'hosp-6',
    department_id: 'dept-13',
    specialization: 'Pulmonology',
    email: 'prem.k@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  // Medicover Woman & Child Hospital
  {
    id: 'doc-26',
    name: 'Dr. Garuda Rama',
    user_id: 'medicover-wc-1',
    hospital_id: 'hosp-7',
    department_id: 'dept-3',
    specialization: 'Pediatrics',
    email: 'rama.g@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-27',
    name: 'Dr. Anita Tripathy',
    user_id: 'medicover-wc-2',
    hospital_id: 'hosp-7',
    department_id: 'dept-3',
    specialization: 'Pediatrics',
    email: 'anita.t@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-28',
    name: 'Dr. M Radhika',
    user_id: 'medicover-wc-3',
    hospital_id: 'hosp-7',
    department_id: 'dept-14',
    specialization: 'Gynecologist',
    email: 'radhika.m@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-29',
    name: 'Dr. Sai Sunil Kishore M',
    user_id: 'medicover-wc-4',
    hospital_id: 'hosp-7',
    department_id: 'dept-3',
    specialization: 'Pediatrician',
    email: 'sunil.s@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '16:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-30',
    name: 'Dr. Reddi Geeta Vandana',
    user_id: 'medicover-wc-5',
    hospital_id: 'hosp-7',
    department_id: 'dept-14',
    specialization: 'Gynecologist',
    email: 'geeta.r@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '11:00:00',
    available_hours_end: '19:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-31',
    name: 'Dr. Shanthi P',
    user_id: 'medicover-wc-6',
    hospital_id: 'hosp-7',
    department_id: 'dept-14',
    specialization: 'Gynecologist',
    email: 'shanthi.p@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-32',
    name: 'Dr. Ravi Kumar GurugubeIli',
    user_id: 'medicover-wc-7',
    hospital_id: 'hosp-7',
    department_id: 'dept-1',
    specialization: 'Cardiologist',
    email: 'ravi.k@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '16:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-33',
    name: 'Dr. Pilla Rakesh',
    user_id: 'medicover-wc-8',
    hospital_id: 'hosp-7',
    department_id: 'dept-5',
    specialization: 'General Physician',
    email: 'rakesh.p@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  // Apollo Clinic Dwaraka Nagar
  {
    id: 'doc-34',
    name: 'Dr. Nathani Babu',
    user_id: 'apollo-dn-1',
    hospital_id: 'hosp-8',
    department_id: 'dept-4',
    specialization: 'Orthopaedic',
    email: 'nathani.b@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '09:00:00',
    available_hours_end: '17:00:00',
    created_at: new Date().toISOString()
  },
  {
    id: 'doc-35',
    name: 'Dr. Siva Lakshmi',
    user_id: 'apollo-dn-2',
    hospital_id: 'hosp-8',
    department_id: 'dept-14',
    specialization: 'Gynecologist',
    email: 'siva.l@medicare.in',
    phone: null,
    available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    available_hours_start: '10:00:00',
    available_hours_end: '18:00:00',
    created_at: new Date().toISOString()
  }
];

async function clearCollection(name: string) {
  const colRef = collection(db, name);
  const snapshot = await getDocs(colRef);
  const deletions: Promise<void>[] = [];
  snapshot.forEach((d) => {
    deletions.push(deleteDoc(d.ref));
  });
  await Promise.all(deletions);
  console.log(`Cleared collection: ${name}`);
}

async function seed() {
  console.log('Starting to REPLACE Firebase data with dummy data...');

  try {
    // Completely clear existing data for these collections
    await clearCollection('hospitals');
    await clearCollection('departments');
    await clearCollection('medical_types');
    await clearCollection('doctors');

    // Seed Hospitals
    for (const hosp of dummyHospitals) {
      await setDoc(doc(db, 'hospitals', hosp.id), hosp);
      console.log(`Seeded hospital: ${hosp.name}`);
    }

    // Seed Departments
    for (const dept of dummyDepartments) {
      await setDoc(doc(db, 'departments', dept.id), dept);
      console.log(`Seeded department: ${dept.name}`);
    }

    // Seed Medical Types
    for (const type of dummyMedicalTypes) {
      await setDoc(doc(db, 'medical_types', type.id), type);
      console.log(`Seeded medical type: ${type.name}`);
    }

    // Seed Doctors
    for (const docItem of dummyDoctors) {
      await setDoc(doc(db, 'doctors', docItem.id), docItem);
      console.log(`Seeded doctor: ${docItem.name}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
