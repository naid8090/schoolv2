/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SchoolSettings, HomepageModule, MediaItem, Notice, SupabaseConfig, MediaBucket, NoticeCategory, NoticePriority, NoticeStatus, Faculty, AcademicClass, Routine, RoutineEntry, PeriodMaster, ExamSchedule, ExamEntry, CalendarEventType, CalendarEvent, SchoolEvent, SchoolEventImage, TimetableGroup } from '../types';
import { supabase } from './supabase';
import { supabaseDbService } from './supabaseDb';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ensureValidUUID(id: string): string {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  if (isUuid) return id;

  const mapping: Record<string, string> = {
    'm1': '11111111-1111-1111-1111-111111111111',
    'm2': '22222222-2222-2222-2222-222222222222',
    'm3': '33333333-3333-3333-3333-333333333333',
    'm4': '44444444-4444-4444-4444-444444444444',
    'm5': '55555555-5555-5555-5555-555555555555',
    'm6': '66666666-6666-6666-6666-666666666666',
    'm7': '77777777-7777-7777-7777-777777777777',
  };

  if (mapping[id]) return mapping[id];

  const cleanId = id.replace(/[^a-f0-9]/gi, '').toLowerCase();
  const padded = (cleanId + 'abcdef01234567891234567890abcdef').substring(0, 32);
  return `${padded.substring(0, 8)}-${padded.substring(8, 12)}-4${padded.substring(13, 16)}-a${padded.substring(17, 20)}-${padded.substring(20, 32)}`;
}

function sanitizeDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // If it's a 4-digit year, e.g. "2025", convert to "2025-01-01"
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}-01-01`;
  }

  // Check if it's already a valid ISO date section (YYYY-MM-DD)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0]; // Returns 'YYYY-MM-DD'
  }

  // Try parsing with Javascript Date
  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }

  return null;
}

// Default seed data for Rajendra Prasad Government Senior Secondary School, Patna
const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  id: 'site-config',
  school_name: 'Rajendra Prasad Government Senior Secondary School',
  school_motto: 'तमसो मा ज्योतिर्गमय (Lead us from darkness to light)',
  address: 'Boring Road, Opposite S.K. Puri Park, Chhajubagh, Patna, Bihar - 800001',
  phone: '+91 612 254 0984',
  email: 'rp-gsss-patna@bihar.gov.in',
  // High-contrast beautiful abstract SVG assets to serve as logo & hero fallbacks
  logo_url: 'school_logo_default',
  hero_image_url: 'school_hero_default',
  footer_subtitle: 'STATE INFRASTRUCTURE • SECTOR 3',
  school_affiliation: 'Ministry of Education, State of Bihar Government Affiliate No: 10230501',
  footer_description: 'Co-educational intermediate/senior secondary institution under the laws and registers of the Bihar School Examination Board.',
  
  // Custom hero overlay texts
  hero_title: 'Empowering Secondary Scholars across Bihar State',
  hero_subtitle: 'Official Digital Corridor & Student Academic Registrar',
  hero_description: 'A premier educational institute offering secondary coaching, moral guidance, and holistic academic development for boys and girls.',
  hero_badge_text: 'Government Senior Secondary Institution, Bihar',
  hero_estd_text: 'ESTD. 1947',
  hero_dise_text: 'DISE: 10230501XXX'
};

// Neutral runtime fallback branding to prevent displaying another school's identity during startup
const RUNTIME_FALLBACK_SCHOOL_SETTINGS: SchoolSettings = {
  id: 'site-config',
  school_name: 'Government Secondary School',
  school_motto: 'Official School Portal',
  address: 'State of Bihar, India',
  phone: '',
  email: '',
  logo_url: 'school_logo_default',
  hero_image_url: 'school_hero_default',
  footer_subtitle: 'STATE EDUCATION PORTAL',
  school_affiliation: 'Department of Education, Government of Bihar',
  footer_description: 'Co-educational intermediate/senior secondary school portal under the directives of the Bihar School Examination Board.',
  
  // Custom hero overlay texts (neutral values)
  hero_title: 'Government Secondary School Portal',
  hero_subtitle: 'Official Digital Corridor & Student Academic Registrar',
  hero_description: 'Access official circulars, academic routines, notices, and faculty directories online.',
  hero_badge_text: 'Government School Portal, Bihar',
  hero_estd_text: '',
  hero_dise_text: ''
};

export const DEFAULT_HOMEPAGE_MODULES: HomepageModule[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    module_type: 'Hero Section',
    title: 'Empowering Secondary Scholars across Bihar State',
    subtitle: 'Official Digital Corridor & Student Academic Registrar',
    description: 'A premier educational institute offering secondary coaching, moral guidance, and holistic academic development for boys and girls.',
    image_url: 'school_hero_default',
    button_text: 'Contact Admissions',
    button_url: 'admissions',
    display_order: 1,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    module_type: 'Notice Feed',
    title: 'BSEB Directives & Circulars',
    subtitle: 'Latest Notice Board Bulletin',
    description: 'Review official board datesheets, public notifications, and scholarship announcements issued dynamically.',
    image_url: '',
    button_text: 'View Notice Board',
    button_url: 'notices',
    display_order: 2,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    module_type: 'Events Preview',
    title: 'Latest School Events & Bulletins',
    subtitle: 'School Life & Chronicles',
    description: 'Stay up to date with Bihar board workshops, science exhibitions, celebrations, and special academic forums.',
    image_url: '',
    button_text: 'Explore Events Calendar',
    button_url: 'events',
    display_order: 3,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    module_type: 'About School',
    title: 'About Rajendra Prasad Government Senior Secondary School',
    subtitle: 'Accredited BSEB Campus',
    description: 'Offering structured streams in Science, Commerce, and Arts with high-class state board coaching models. Rooted in disciplined moral character alignment.',
    image_url: '',
    button_text: 'Learn More',
    button_url: 'about',
    display_order: 4,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    module_type: 'Quick Links',
    title: 'Academic Pathways',
    subtitle: 'Choose Your Specialization Stream',
    description: 'Access direct seat counts, syllabus specifications, and stream criteria for Science, Arts, and Commerce lanes.',
    image_url: '',
    button_text: 'View Enrollment Criteria',
    button_url: 'admissions',
    display_order: 5,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    module_type: 'Contact Information',
    title: 'Physical & Digital Desk Queries',
    subtitle: 'Connect With Us Today',
    description: 'Have inquiries? Submit direct transcripts verification letters, check admission criteria, or call physical administrative offices.',
    image_url: '',
    button_text: 'Access Contact Desk',
    button_url: 'contact',
    display_order: 7,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    module_type: 'Academic Quick Links',
    title: 'Student Portals & Academic Records',
    subtitle: 'Academics Desk',
    description: 'Access live class timetables, download examinations sheets, and review the state holidays calendar.',
    image_url: '',
    button_text: '',
    button_url: '',
    display_order: 6, // Order placement below About School/Notice board
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    module_type: 'Featured Faculty',
    title: 'Featured Faculty & Lecturers',
    subtitle: 'Staff and Advisory Council',
    description: 'Meet our distinguished educators leading key branches of science, mathematics, literature, and arts.',
    image_url: '',
    button_text: 'Show All Faculty Directory',
    button_url: 'faculty',
    display_order: 8,
    is_visible: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  }
];

const DEFAULT_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'media_logo',
    file_name: 'bseb_emblem_shashi.png',
    bucket: 'logos',
    file_url: 'school_logo_default',
    file_type: 'image',
    uploaded_at: '2026-06-01T10:00:00Z',
    size_kb: 45
  },
  {
    id: 'media_hero',
    file_name: 'patna_campus_vintage.jpg',
    bucket: 'hero-images',
    file_url: 'school_hero_default',
    file_type: 'image',
    uploaded_at: '2026-06-01T10:05:00Z',
    size_kb: 420
  },
  {
    id: 'media_pdf1',
    file_name: 'BSEB_Class12_Datesheet_Extension_Official.pdf',
    bucket: 'notices',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQKJScAAQ==_sample_notice_pdf',
    file_type: 'pdf',
    uploaded_at: '2026-06-10T14:30:00Z',
    size_kb: 1120
  },
  {
    id: 'media_pdf2',
    file_name: 'Bihar_PostMatric_Scholarship_2026_Guidelines.pdf',
    bucket: 'downloads',
    file_url: 'data:application/pdf;base64,JVBERi0xLjQKJScAAQ==_sample_scholarship_guideline',
    file_type: 'pdf',
    uploaded_at: '2026-06-08T09:12:00Z',
    size_kb: 950
  }
];

const DEFAULT_NOTICES: Notice[] = [
  {
    id: 'notice_1',
    title: 'BSEB Class 12 Registration Form Submission Deadline Extended',
    summary: 'The Bihar School Examination Board (BSEB) has officially extended the deadline for online submission of registrations for the 2027 Intermediate exams.',
    content: `All Science, Arts, and Commerce students of Class 11 and 12 are hereby notified that the Bihar School Examination Board (BSEB) has extended the deadline for submitting registration forms.\n\nThe revised schedules and critical instructions are as follows:\n\n1. **Extended Deadline:** Students can now submit their registrations with normal fees until June 25, 2026. Late submissions after this date will incur a penalty.\n2. **Verification Check:** Students must double-check spelling, gender, category, and subject titles matching their official matriculation certificates directly with their homeroom registrar before applying.\n3. **Required Documents:**\n   - Original Matriculation (Class 10) Marks Card and SLC.\n   - Passport size identity photos (clear background with name stamp).\n   - Digitally verified Caste Certificate (SC/ST/EBC for fee waivers).\n   - Aadhaar enrollment receipt.\n\nPlease contact Room 104 between 10:00 AM and 2:00 PM for registration confirmation and receipt collection. Do not wait for the final day to avoid portal traffic.`,
    category: 'Admission Notice',
    priority: 'Critical',
    status: 'Published',
    featured_image: '',
    pdf_url: 'media_pdf1', // references media ID or external URL
    is_pinned: true,
    show_on_homepage: true,
    publish_date: '2026-06-10',
    created_at: '2026-06-10T14:30:00Z',
    updated_at: '2026-06-10T14:30:00Z'
  },
  {
    id: 'notice_2',
    title: 'Bihar Post-Matric Scholarship Scheme 2026: Online Applications Opening',
    summary: 'The SC/ST/OBC and Minority welfare department of Bihar announces online enrollment for the Post-Matric Scholarship (PMS) portal for Classes 11 and 12.',
    content: `The Department of Social Welfare and Backward Classes, Government of Bihar, is opening the online portal for the Post-Matric Scholarship (PMS) Scheme for the academic year 2026-2027.\n\nCandidates belonging to eligible communities (SC, ST, EBC, BC) enrolled in Classes 11 and 12 at our institution are instructed to assemble documents for application.\n\n### Eligibility Criteria:\n- Applicant must be a permanent resident of Bihar state.\n- Candidate should belong to SC, ST, EBC, or BC categories.\n- Combined family annual income must not exceed ₹2,500,000.\n\n### Documents Required:\n- Aadhaar Card (Must be paired and active with the student's mobile number).\n- Caste Certificate issued by competent circle officer.\n- Income Certificate (Issued on or after April 1, 2026).\n- Residential/Domicile Certificate.\n- Institution Fee Receipt and Bonafide Certificate (obtainable from the office clerk desk, Counter No. 3).\n\nDetails are provided in the official scholarship circular attached below.`,
    category: 'Scholarship Notice',
    priority: 'High',
    status: 'Published',
    featured_image: '',
    pdf_url: 'media_pdf2',
    is_pinned: false,
    show_on_homepage: true,
    publish_date: '2026-06-08',
    created_at: '2026-06-08T09:12:00Z',
    updated_at: '2026-06-08T09:12:00Z'
  },
  {
    id: 'notice_3',
    title: 'Bihar Board Merit Student Awards: Cash Incentives & Free Tablets',
    summary: 'The Education Department, Govt. of Bihar, has announced cash awards of ₹1 Lakh, laptops, and tablets for students securing State Ranks in board exams.',
    content: `We proudly announce that the Government of Bihar, under the meritorious student support scheme, has authorized academic rewards for state and district school board rankers.\n\n### Award Categories:\n- **State Rank 1 to 5:** Cash incentive of ₹1,00,000, one modern study laptop, e-book reader, and official citation plaque.\n- **State Rank 6 to 10:** Cash incentive of ₹75,000, laptop, e-reader, and citation.\n- **School/District Toppers:** Tablets and study kits.\n\nA ceremonial facilitation event will be held on June 28, 2026, at the Patna Bapu Sabhagar Auditorium. Awardee forms must be collected and signed by parents-guardians by June 18 at Room 10B.`,
    category: 'Important Announcement',
    priority: 'High',
    status: 'Published',
    featured_image: '',
    pdf_url: '',
    is_pinned: true,
    show_on_homepage: true,
    publish_date: '2026-06-05',
    created_at: '2026-06-05T11:00:00Z',
    updated_at: '2026-06-05T11:00:00Z'
  },
  {
    id: 'notice_4',
    title: 'Quarterly Examination Schedule Released: Classes 9 to 12',
    summary: 'The schedule and syllabus details for the First Quarterly Descriptive Tests for the Academic Year 2026-2027 are now active.',
    content: `First terminal descriptive assessments and quarterly evaluation boards for Classes 9, 10, 11, and 12 will take place across June 22 to June 27, 2026.\n\nTests are designed following Bihar State Textbook Publishing Corporation guidelines and NCERT curriculum outlines.\n\n### Daily Exam Timings:\n- **Morning Sitting (Senior 11 & 12):** 09:30 AM to 12:45 PM\n- **Noon Sitting (Junior 09 & 10):** 01:30 PM to 04:45 PM\n\nAdmit cards and classroom seating index cards will be distributed by class teachers on June 18. Clearing pending fee collections and school council dues is required to retrieve board vouchers. Full datesheet details can be searched in the downloads archive.`,
    category: 'Exam Notice',
    priority: 'Normal',
    status: 'Published',
    featured_image: '',
    pdf_url: '',
    is_pinned: false,
    show_on_homepage: true,
    publish_date: '2026-06-04',
    created_at: '2026-06-04T08:00:00Z',
    updated_at: '2026-06-04T08:00:00Z'
  },
  {
    id: 'notice_5',
    title: 'School Campus Closed for Kabir Jayanti Gazette Holiday',
    summary: 'The school premises will remain closed on June 15, 2026, in observance of Kabir Jayanti state holiday. Classes resume on June 16.',
    content: `As per the official gazetted holidays order by the Bihar Government Cabinet Secretariats, all administrative offices, secondary blocks, laboratories, and physical education domains of Rajendra Prasad Government Senior Secondary School will remain closed on:\n\n**Monday, June 15, 2026 (Kabir Jayanti)**\n\nAll weekly board exams scheduled for Monday stand postponed to Saturday, June 20, 2026. General administrative counters, academic corridors, and admission services will resume on normal school timings from June 16, 2026 (07:30 AM to 01:30 PM summer schedule).`,
    category: 'Holiday Notice',
    priority: 'Normal',
    status: 'Published',
    featured_image: '',
    pdf_url: '',
    is_pinned: false,
    show_on_homepage: true,
    publish_date: '2026-06-02',
    created_at: '2026-06-02T09:00:00Z',
    updated_at: '2026-06-02T09:00:00Z'
  },
  {
    id: 'notice_6',
    title: 'Draft Notice: Summer Coaching Camp Registrations',
    summary: 'Science & Math Remedial Camp for Class 10 and 12 Aspirants (Draft).',
    content: `This notice is a draft copy for upcoming special coaching guidelines. Internal reviews are pending approval. Do not release yet.`,
    category: 'General Notice',
    priority: 'Normal',
    status: 'Draft',
    featured_image: '',
    pdf_url: '',
    is_pinned: false,
    show_on_homepage: false,
    publish_date: '2026-06-11',
    created_at: '2026-06-11T08:00:00Z',
    updated_at: '2026-06-11T08:00:00Z'
  }
];

const DEFAULT_FACULTY: Faculty[] = [
  {
    id: 'fac_1',
    name: 'Dr. Satyendra Prasad Narain',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    designation: 'Principal',
    department: 'Administration',
    subject: 'Modern History & Governance',
    qualification: 'Ph.D. in History (Patna University), M.A. B.Ed',
    experience: '32 Years of Academic Administration',
    bio: 'Dedicated to empowering secondary scholars and aligning the historical curriculum with modern ethical codes.',
    email: 'principal@rp-gsss-patna.org',
    phone: '+91 94310 12345',
    display_order: 1,
    is_active: true,
    featured_homepage: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'fac_2',
    name: 'Mrs. Shashi Prabha Dev',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    designation: 'Vice Principal',
    department: 'Science',
    subject: 'Chemistry & Salt Analysis',
    qualification: 'M.Sc in Applied Chemistry, B.Ed.',
    experience: '24 Years of Teaching',
    bio: 'Commitment to high practical labs precision, board standard answer sheets drafting, and students wellness guidelines.',
    email: 'shashi.prabha@rp-gsss-patna.org',
    phone: '+91 94412 34567',
    display_order: 2,
    is_active: true,
    featured_homepage: true,
    created_at: '2026-06-01T10:05:00Z',
    updated_at: '2026-06-01T10:05:00Z'
  },
  {
    id: 'fac_3',
    name: 'Shri Manoj Kumar Sinha',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    designation: 'Teacher',
    department: 'Science',
    subject: 'Mathematics & Calculus',
    qualification: 'M.Sc. in Mathematics (IIT Kharagpur), B.Ed.',
    experience: '18 Years of Board Coaching',
    bio: 'Experienced educator focused on algebra, integration proofs, and competitive math layouts for matriculation streams.',
    email: 'manoj.kumar@rp-gsss-patna.org',
    phone: '+91 94711 55667',
    display_order: 3,
    is_active: true,
    featured_homepage: false,
    created_at: '2026-06-01T10:10:00Z',
    updated_at: '2026-06-01T10:10:00Z'
  },
  {
    id: 'fac_4',
    name: 'Dr. Rashmi Kumari Verma',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    designation: 'Teacher',
    department: 'Science',
    subject: 'Physics & Electrostatics',
    qualification: 'Ph.D. in Physics, M.Sc. (Patna Science College)',
    experience: '15 Years of Academic Tenure',
    bio: 'Specialist in semiconductor structures, electromagnetic induction, with intensive laboratory project mentoring.',
    email: 'rashmi.kumar@rp-gsss-patna.org',
    phone: '+91 94812 77889',
    display_order: 4,
    is_active: true,
    featured_homepage: true,
    created_at: '2026-06-01T10:12:00Z',
    updated_at: '2026-06-01T10:12:00Z'
  },
  {
    id: 'fac_5',
    name: 'Shri Rakesh Ranjan Mishra',
    photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    designation: 'Teacher',
    department: 'Commerce',
    subject: 'Accountancy & Audit',
    qualification: 'M.Com, UGC-NET Qualified',
    experience: '12 Years',
    bio: 'Directing the double-entry bookkeeping ledgers and balance sheet alignment strategies for our Commerce students.',
    email: 'rakesh.ranjan@rp-gsss-patna.org',
    phone: '+91 95412 11223',
    display_order: 5,
    is_active: true,
    featured_homepage: true,
    created_at: '2026-06-01T10:15:00Z',
    updated_at: '2026-06-01T10:15:00Z'
  },
  {
    id: 'fac_6',
    name: 'Mrs. Ananya Sen Roy',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    designation: 'Teacher',
    department: 'Arts',
    subject: 'Political Science & Civil Rights',
    qualification: 'M.A. in Political Science, B.Ed.',
    experience: '10 Years',
    bio: 'Promoting democratic literacy, constitutional framework reading, and public assembly debate skills.',
    email: 'ananya.sen@rp-gsss-patna.org',
    phone: '+91 96123 99887',
    display_order: 6,
    is_active: true,
    featured_homepage: true,
    created_at: '2026-06-01T10:20:00Z',
    updated_at: '2026-06-01T10:20:00Z'
  }
];

const DEFAULT_TIMETABLE_GROUPS: TimetableGroup[] = [
  {
    id: '99999999-9999-9999-9999-999900000009',
    name: 'Class 9',
    is_active: true,
    display_order: 1,
    parent_grade: '9'
  },
  {
    id: '99999999-9999-9999-9999-999900000010',
    name: 'Class 10',
    is_active: true,
    display_order: 2,
    parent_grade: '10'
  },
  {
    id: '99999999-9999-9999-9999-999900000011',
    name: 'Class 11',
    is_active: true,
    display_order: 3,
    parent_grade: '11'
  },
  {
    id: '99999999-9999-9999-9999-999900000012',
    name: 'Class 12',
    is_active: true,
    display_order: 4,
    parent_grade: '12'
  }
];

const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'routine_9',
    class_name: 'Class 9',
    display_mode: 'online',
    pdf_url: '',
    override_active: false,
    override_title: 'Emergency Examination Schedule',
    override_pdf_url: '',
    override_start: '2026-06-15',
    override_end: '2026-06-20',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'routine_10',
    class_name: 'Class 10',
    display_mode: 'online',
    pdf_url: '',
    override_active: false,
    override_title: 'Weekly Test Drive Override',
    override_pdf_url: '',
    override_start: '2026-06-18',
    override_end: '2026-06-21',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'routine_11',
    class_name: 'Class 11',
    display_mode: 'online',
    pdf_url: '',
    override_active: false,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'routine_12',
    class_name: 'Class 12',
    display_mode: 'online',
    pdf_url: '',
    override_active: false,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  }
];

const DEFAULT_ROUTINE_ENTRIES: RoutineEntry[] = [
  // Class 9 Class timetable
  { id: 're_9_m1', routine_id: 'routine_9', day: 'Monday', period: 'Period 1', subject: 'Hindi', teacher: 'Mrs. S. Pathak', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_9_m2', routine_id: 'routine_9', day: 'Monday', period: 'Period 2', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_9_m3', routine_id: 'routine_9', day: 'Monday', period: 'Period 3', subject: 'Science', teacher: 'Dr. V. Anand', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_9_m4', routine_id: 'routine_9', day: 'Monday', period: 'Period 4', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_9_m5', routine_id: 'routine_9', day: 'Monday', period: 'Period 5', subject: 'English', teacher: 'Mrs. J. Mishra', time_range: '12:45 PM - 01:30 PM' },
  { id: 're_9_m6', routine_id: 'routine_9', day: 'Monday', period: 'Period 6', subject: 'Sanskrit', teacher: 'Acharya S. Dev', time_range: '01:30 PM - 02:15 PM' },

  { id: 're_9_t1', routine_id: 'routine_9', day: 'Tuesday', period: 'Period 1', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_9_t2', routine_id: 'routine_9', day: 'Tuesday', period: 'Period 2', subject: 'Science', teacher: 'Dr. V. Anand', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_9_t3', routine_id: 'routine_9', day: 'Tuesday', period: 'Period 3', subject: 'English', teacher: 'Mrs. J. Mishra', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_9_t4', routine_id: 'routine_9', day: 'Tuesday', period: 'Period 4', subject: 'Hindi', teacher: 'Mrs. S. Pathak', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_9_t5', routine_id: 'routine_9', day: 'Tuesday', period: 'Period 5', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '12:45 PM - 01:30 PM' },
  { id: 're_9_t6', routine_id: 'routine_9', day: 'Tuesday', period: 'Period 6', subject: 'Physical Education', teacher: 'Mr. D. Singh', time_range: '01:30 PM - 02:15 PM' },

  { id: 're_9_w1', routine_id: 'routine_9', day: 'Wednesday', period: 'Period 1', subject: 'Science', teacher: 'Dr. V. Anand', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_9_w2', routine_id: 'routine_9', day: 'Wednesday', period: 'Period 2', subject: 'English', teacher: 'Mrs. J. Mishra', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_9_w3', routine_id: 'routine_9', day: 'Wednesday', period: 'Period 3', subject: 'Hindi', teacher: 'Mrs. S. Pathak', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_9_w4', routine_id: 'routine_9', day: 'Wednesday', period: 'Period 4', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_9_w5', routine_id: 'routine_9', day: 'Wednesday', period: 'Period 5', subject: 'Sanskrit', teacher: 'Acharya S. Dev', time_range: '12:45 PM - 01:30 PM' },
  { id: 're_9_w6', routine_id: 'routine_9', day: 'Wednesday', period: 'Period 6', subject: 'Computer Practice', teacher: 'Miss R. Verma', time_range: '01:30 PM - 02:15 PM' },

  { id: 're_9_th1', routine_id: 'routine_9', day: 'Thursday', period: 'Period 1', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_9_th2', routine_id: 'routine_9', day: 'Thursday', period: 'Period 2', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_9_th3', routine_id: 'routine_9', day: 'Thursday', period: 'Period 3', subject: 'Science', teacher: 'Dr. V. Anand', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_9_th4', routine_id: 'routine_9', day: 'Thursday', period: 'Period 4', subject: 'English', teacher: 'Mrs. J. Mishra', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_9_th5', routine_id: 'routine_9', day: 'Thursday', period: 'Period 5', subject: 'Hindi', teacher: 'Mrs. S. Pathak', time_range: '12:45 PM - 01:30 PM' },
  { id: 're_9_th6', routine_id: 'routine_9', day: 'Thursday', period: 'Period 6', subject: 'Arts & Drawing', teacher: 'Mr. K. K. Jha', time_range: '01:30 PM - 02:15 PM' },

  { id: 're_9_f1', routine_id: 'routine_9', day: 'Friday', period: 'Period 1', subject: 'Hindi', teacher: 'Mrs. S. Pathak', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_9_f2', routine_id: 'routine_9', day: 'Friday', period: 'Period 2', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_9_f3', routine_id: 'routine_9', day: 'Friday', period: 'Period 3', subject: 'Science Lab', teacher: 'Dr. V. Anand', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_9_f4', routine_id: 'routine_9', day: 'Friday', period: 'Period 4', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_9_f5', routine_id: 'routine_9', day: 'Friday', period: 'Period 5', subject: 'English Guidance', teacher: 'Mrs. J. Mishra', time_range: '12:45 PM - 01:30 PM' },
  { id: 're_9_f6', routine_id: 'routine_9', day: 'Friday', period: 'Period 6', subject: 'Library Hour', teacher: 'Mr. P. Kumar', time_range: '01:30 PM - 02:15 PM' },

  { id: 're_9_s1', routine_id: 'routine_9', day: 'Saturday', period: 'Period 1', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_9_s2', routine_id: 'routine_9', day: 'Saturday', period: 'Period 2', subject: 'Mathematics Quiz', teacher: 'Mr. R. K. Sinha', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_9_s3', routine_id: 'routine_9', day: 'Saturday', period: 'Period 3', subject: 'Science Seminar', teacher: 'Dr. V. Anand', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_9_s4', routine_id: 'routine_9', day: 'Saturday', period: 'Period 4', subject: 'Moral Education', teacher: 'Principal', time_range: '11:15 AM - 12:00 PM' },

  // Class 10 Timetable
  { id: 're_10_m1', routine_id: 'routine_10', day: 'Monday', period: 'Period 1', subject: 'English', teacher: 'Mrs. J. Mishra', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_10_m2', routine_id: 'routine_10', day: 'Monday', period: 'Period 2', subject: 'Science', teacher: 'Dr. V. Anand', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_10_m3', routine_id: 'routine_10', day: 'Monday', period: 'Period 3', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_10_m4', routine_id: 'routine_10', day: 'Monday', period: 'Period 4', subject: 'Sanskrit', teacher: 'Acharya S. Dev', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_10_m5', routine_id: 'routine_10', day: 'Monday', period: 'Period 5', subject: 'Hindi', teacher: 'Mrs. S. Pathak', time_range: '12:45 PM - 01:30 PM' },
  { id: 're_10_m6', routine_id: 'routine_10', day: 'Monday', period: 'Period 6', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '01:30 PM - 02:15 PM' },

  { id: 're_10_t1', routine_id: 'routine_10', day: 'Tuesday', period: 'Period 1', subject: 'Science', teacher: 'Dr. V. Anand', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_10_t2', routine_id: 'routine_10', day: 'Tuesday', period: 'Period 2', subject: 'Mathematics', teacher: 'Mr. R. K. Sinha', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_10_t3', routine_id: 'routine_10', day: 'Tuesday', period: 'Period 3', subject: 'English', teacher: 'Mrs. J. Mishra', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_10_t4', routine_id: 'routine_10', day: 'Tuesday', period: 'Period 4', subject: 'Social Science', teacher: 'Mr. A. K. Choudhary', time_range: '11:15 AM - 12:00 PM' },

  // Class 12 Timetable
  { id: 're_12_m1', routine_id: 'routine_12', day: 'Monday', period: 'Period 1', subject: 'Physics (Sci) / Accounts (Com)', teacher: 'Dr. R. Singh / Mr. M. Lal', time_range: '09:00 AM - 09:45 AM' },
  { id: 're_12_m2', routine_id: 'routine_12', day: 'Monday', period: 'Period 2', subject: 'Chemistry (Sci) / Bis. Studies (Com)', teacher: 'Mrs. V. Sastry / Mr. S. Jha', time_range: '09:45 AM - 10:30 AM' },
  { id: 're_12_m3', routine_id: 'routine_12', day: 'Monday', period: 'Period 3', subject: 'Mathematics (Sci) / Economics (Arts/Com)', teacher: 'Mr. R. K. Sinha / Mrs. S. Roy', time_range: '10:30 AM - 11:15 AM' },
  { id: 're_12_m4', routine_id: 'routine_12', day: 'Monday', period: 'Period 4', subject: 'Biology (Sci) / History (Arts)', teacher: 'Miss K. Sen / Mr. G. Sharma', time_range: '11:15 AM - 12:00 PM' },
  { id: 're_12_m5', routine_id: 'routine_12', day: 'Monday', period: 'Period 5', subject: 'English General', teacher: 'Mrs. J. Mishra', time_range: '12:45 PM - 01:30 PM' }
];

const DEFAULT_EXAM_SCHEDULES: ExamSchedule[] = [
  {
    id: 'exam_sch_1',
    title: 'Class 10 & 12 Board Sent-Up Pre-Test Examination - 2026',
    display_mode: 'online',
    pdf_url: '',
    is_active: true,
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'exam_sch_2',
    title: 'Class 9 & 11 Quarterly Unit Assessment - June / July 2026',
    display_mode: 'online',
    pdf_url: '',
    is_active: true,
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-05T10:00:00Z'
  }
];

const DEFAULT_EXAM_ENTRIES: ExamEntry[] = [
  {
    id: 'exam_ent_1_1',
    schedule_id: 'exam_sch_1',
    exam_date: '2026-06-22',
    subject: 'Physics (Class 12) / Science (Class 10)',
    time: '10:00 AM - 01:00 PM',
    notes: 'Theory paper, carry original admit slips.'
  },
  {
    id: 'exam_ent_1_2',
    schedule_id: 'exam_sch_1',
    exam_date: '2026-06-23',
    subject: 'Chemistry (Class 12) / Mathematics (Class 10)',
    time: '10:00 AM - 01:00 PM',
    notes: 'Bring geometry materials. Extra 15 minutes boarding time.'
  },
  {
    id: 'exam_ent_1_3',
    schedule_id: 'exam_sch_1',
    exam_date: '2026-06-24',
    subject: 'English (Class 10 & 12)',
    time: '10:00 AM - 01:00 PM',
    notes: 'General Core Paper.'
  },
  {
    id: 'exam_ent_2_1',
    schedule_id: 'exam_sch_2',
    exam_date: '2026-06-29',
    subject: 'Mathematics (Class 9) / Physics (Class 11)',
    time: '11:00 AM - 12:30 PM',
    notes: 'Classroom tests, objective pattern.'
  },
  {
    id: 'exam_ent_2_2',
    schedule_id: 'exam_sch_2',
    exam_date: '2026-06-30',
    subject: 'Sanskrit (Class 9) / Chemistry (Class 11)',
    time: '11:00 AM - 12:30 PM',
    notes: 'Regular test sessions.'
  }
];

const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal_ev_1',
    title: 'BSEB Board Sent-Up Exams Commences',
    event_type: 'Examination',
    event_date: '2026-06-22',
    description: 'Sent-up assessments for Class 10 and 12 matric aspirants.',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'cal_ev_2',
    title: 'Kabir Jayanti State holiday',
    event_type: 'Holiday',
    event_date: '2026-06-18',
    description: 'Bihar Government official holiday. Administrative sections remains closed.',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'cal_ev_3',
    title: 'Parent-Teacher Council Meet',
    event_type: 'Parent Meeting',
    event_date: '2026-06-27',
    description: 'Discussion regarding BSEB results, registration profiles check, and scholarship disbursements.',
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-05T10:00:00Z'
  },
  {
    id: 'cal_ev_4',
    title: 'Intermediate Admission Form Submission Starts',
    event_type: 'Admission Date',
    event_date: '2026-07-01',
    description: 'Enrollment process launches online via OFSS portal of BSEB Bihar.',
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-05T10:00:00Z'
  },
  {
    id: 'cal_ev_5',
    title: 'Dr. Rajendra Prasad Birth Commemoration Debate',
    event_type: 'School Event',
    event_date: '2026-07-05',
    description: 'State level inter-school debate competition at principal auditorium hall.',
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-05T10:00:00Z'
  }
];

const DEFAULT_EVENT_CATEGORIES: string[] = [
  'Academic Event',
  'Sports Event',
  'Cultural Event',
  'National Celebration',
  'Parent Meeting',
  'Competition',
  'Workshop',
  'Seminar'
];

const DEFAULT_EVENTS: SchoolEvent[] = [
  {
    id: 'ev_1',
    title: 'Annual Sports Championship 2026',
    category: 'Sports Event',
    event_date: '2026-06-25',
    short_description: 'The annual track, field, and indoor sports matches across classes 9 to 12.',
    full_description: 'Join us for the Annual Sports Day at our central Patna playground. Events include 100m, 200m track races, long jump, volleyball tournaments, and badminton finals. Awards will be facilitated by the Principal in the closing ceremony. This tournament is an integral assessment of physical fitness and discipline standard coefficients.',
    featured_image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop',
    venue: 'Main Sports Ground, RP GSSS Campus',
    organizer: 'Physical Education Dept',
    status: 'Published',
    featured_homepage: true,
    pdf_url: '',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z'
  },
  {
    id: 'ev_2',
    title: 'Inter-School Science Exhibition',
    category: 'Academic Event',
    event_date: '2026-07-02',
    short_description: 'A showcase of innovative projects, working models, and biological cell setups.',
    full_description: 'Students from high schools in Patna will gather to present scientific research models. This year\'s focus is on sustainable energy devices and agricultural water purification designs. Chief guest will address the science assembly at Room 10B. Over 300 scholars from BSEB schools are verified to attend.',
    featured_image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop',
    venue: 'Science Assembly Block (Auditorium)',
    organizer: 'Science & Technology Club',
    status: 'Published',
    featured_homepage: true,
    pdf_url: '',
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-05T10:00:00Z'
  },
  {
    id: 'ev_3',
    title: 'Independence Day Celebration',
    category: 'National Celebration',
    event_date: '2026-08-15',
    short_description: 'Flag hoisting ceremony, patriotic singing, and classical parade presentation.',
    full_description: 'Annual celebration of Independence Day with flag hoisting at 8:00 AM by the Cabinet representative and Principal. Patriotic choral hymns, parade presentations by the NCC cadets, and classical dances performed by Class 10 humanities cohorts. Sweets distribution to follow for all scholars and parents.',
    featured_image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
    venue: 'Main Tricolor Courtyard',
    organizer: 'NCC & Cultural Committee',
    status: 'Published',
    featured_homepage: true,
    pdf_url: '',
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z'
  },
  {
    id: 'ev_4',
    title: 'Quarterly Parent-Teacher Meeting',
    category: 'Parent Meeting',
    event_date: '2026-06-20',
    short_description: 'Discussion of unit test reports, term grades, and student behavior indexes.',
    full_description: 'Mandatory meeting for all parents. Discussion of board exam eligibility, quarterly test marksheets, and standard BSEB guidance protocols. Parents can meet individual subject lecturers in their dedicated classrooms to discuss child performance standards.',
    featured_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop',
    venue: 'Respective Classrooms (Science 10A-Arts 12B)',
    organizer: 'Academic Dean Council',
    status: 'Published',
    featured_homepage: false,
    pdf_url: '',
    created_at: '2026-06-12T10:00:00Z',
    updated_at: '2026-06-12T10:00:00Z'
  }
];

const DEFAULT_EVENT_IMAGES: SchoolEventImage[] = [
  {
    id: 'ev_img_1_1',
    event_id: 'ev_1',
    image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop',
    display_order: 1
  },
  {
    id: 'ev_img_1_2',
    event_id: 'ev_1',
    image_url: 'https://images.unsplash.com/photo-1502014822147-1aedfb0676e0?w=600&auto=format&fit=crop',
    display_order: 2
  },
  {
    id: 'ev_img_1_3',
    event_id: 'ev_1',
    image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&auto=format&fit=crop',
    display_order: 3
  },
  {
    id: 'ev_img_2_1',
    event_id: 'ev_2',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop',
    display_order: 1
  },
  {
    id: 'ev_img_2_2',
    event_id: 'ev_2',
    image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop',
    display_order: 2
  },
  {
    id: 'ev_img_3_1',
    event_id: 'ev_3',
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop',
    display_order: 1
  },
  {
    id: 'ev_img_4_1',
    event_id: 'ev_4',
    image_url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop',
    display_order: 1
  }
];

const DEFAULT_PERIODS: PeriodMaster[] = [
  { id: 'p_1', name: 'Period 1', time_range: '09:00 AM - 09:45 AM' },
  { id: 'p_2', name: 'Period 2', time_range: '09:45 AM - 10:30 AM' },
  { id: 'p_3', name: 'Period 3', time_range: '10:30 AM - 11:15 AM' },
  { id: 'p_4', name: 'Period 4', time_range: '11:15 AM - 12:00 PM' },
  { id: 'p_5', name: 'Period 5', time_range: '12:45 PM - 01:30 PM' },
  { id: 'p_6', name: 'Period 6', time_range: '01:30 PM - 02:15 PM' },
];

class DatabaseService {
  private cachedEvents: SchoolEvent[] | null = null;
  private cachedEventImages: SchoolEventImage[] | null = null;

  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Local storage reading failed for key: ${key}. Using fallbacks.`, e);
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e: any) {
      const isQuotaError = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || (e.message && e.message.includes('quota')));
      if (isQuotaError) {
        console.warn(`Local storage quota exceeded while writing key ${key}. Clearing transient media and event image caches, then retrying.`);
        try {
          // Clear non-critical caches to free up space
          localStorage.removeItem('gsss_media_items');
          localStorage.removeItem('gsss_event_images');
          // Try writing again
          localStorage.setItem(key, JSON.stringify(value));
          return;
        } catch (retryErr) {
          console.warn(`Retrying local storage save for key: ${key} failed even after clearing transient cache. Notifying backup system.`, retryErr);
        }
      } else {
        console.warn(`Local storage writing failed for key: ${key}.`, e);
      }
    }
  }

  // School Settings
  getSchoolSettings(useSeedFallback = false): SchoolSettings {
    const fallbackSettings = useSeedFallback ? DEFAULT_SCHOOL_SETTINGS : RUNTIME_FALLBACK_SCHOOL_SETTINGS;
    const loaded = this.getStorageItem<SchoolSettings>('gsss_school_settings', fallbackSettings);
    return { ...fallbackSettings, ...loaded };
  }

  saveSchoolSettings(settings: SchoolSettings, localOnly = false): void {
    this.setStorageItem('gsss_school_settings', settings);
    if (localOnly) return;

    // Persist to Supabase school_settings table
    const dbPayload = {
      school_name: settings.school_name,
      school_motto: settings.school_motto,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      logo_url: settings.logo_url || null,
      hero_image_url: settings.hero_image_url || null,
      footer_subtitle: settings.footer_subtitle || null,
      footer_description: settings.footer_description || null,
      school_affiliation: settings.school_affiliation || null,
      hero_title: settings.hero_title || null,
      hero_subtitle: settings.hero_subtitle || null,
      hero_description: settings.hero_description || null,
      hero_badge_text: settings.hero_badge_text || null,
      hero_estd_text: settings.hero_estd_text || null,
      hero_dise_text: settings.hero_dise_text || null,
    };

    supabase
      .from('school_settings')
      .upsert({ id: settings.id === 'site-config' ? undefined : settings.id, ...dbPayload })
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Settings Sync Error]:', error.message);
        }
      });
  }

  // Homepage Modules
  getHomepageModules(): HomepageModule[] {
    const rawModules = this.getStorageItem<any[]>('gsss_homepage_modules', DEFAULT_HOMEPAGE_MODULES);
    const pModules = rawModules.map(m => ({
      ...m,
      id: ensureValidUUID(m.id)
    }));

    // Check if migration is needed (if storage doesn't exist or doesn't have module_type)
    const needsMigration = pModules.length === 0 || pModules.some(m => !m.module_type);
    if (needsMigration) {
      this.saveHomepageModules(DEFAULT_HOMEPAGE_MODULES, true);
      return [...DEFAULT_HOMEPAGE_MODULES].map(m => ({ ...m, id: ensureValidUUID(m.id) })).sort((a, b) => a.display_order - b.display_order);
    }
    
    // Auto-inject missing default modules (including Featured Faculty) to preserve older setups
    const existingTypes = new Set(pModules.map(m => m.module_type));
    const missingDefaults = DEFAULT_HOMEPAGE_MODULES.filter(d => !existingTypes.has(d.module_type));
    if (missingDefaults.length > 0) {
      let merged = [...pModules];
      missingDefaults.forEach(def => {
        if (def.module_type === 'Events Preview') {
          // Find Notice Feed module order
          const noticeFeed = merged.find(m => m.module_type === 'Notice Feed');
          const noticeFeedOrder = noticeFeed ? noticeFeed.display_order : 2;
          
          // Increment display_order for all modules that come after Notice Feed by 1 to make a gap
          merged = merged.map(m => {
            if (m.display_order > noticeFeedOrder) {
              return { ...m, display_order: m.display_order + 1 };
            }
            return m;
          });
          
          merged.push({
            ...def,
            id: ensureValidUUID(def.id),
            display_order: noticeFeedOrder + 1,
            is_visible: true
          });
        } else {
          const maxOrder = merged.reduce((max, m) => Math.max(max, m.display_order || 0), 0);
          merged.push({
            ...def,
            id: ensureValidUUID(def.id),
            display_order: maxOrder + 1
          });
        }
      });
      this.saveHomepageModules(merged, true);
      return merged.sort((a, b) => a.display_order - b.display_order);
    }

    return pModules.sort((a, b) => a.display_order - b.display_order);
  }

  saveHomepageModules(modules: HomepageModule[], localOnly = false): void {
    const sanitizedModules = modules.map(m => ({
      ...m,
      id: ensureValidUUID(m.id)
    }));
    this.setStorageItem('gsss_homepage_modules', sanitizedModules);

    if (localOnly) return;

    // Persist to Supabase homepage_modules table
    const dbPayloads = sanitizedModules.map(m => ({
      id: m.id,
      module_type: m.module_type,
      title: m.title || '',
      subtitle: m.subtitle || '',
      description: m.description || '',
      image_url: m.image_url || '',
      button_text: m.button_text || '',
      button_url: m.button_url || '',
      display_order: m.display_order || 0,
      is_visible: m.is_visible !== false,
      items_json: m.items_json || null
    }));

    supabase
      .from('homepage_modules')
      .upsert(dbPayloads)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Modules Sync Error]:', error.message);
        }
      });
  }

  createHomepageModule(moduleData: Omit<HomepageModule, 'id' | 'created_at' | 'updated_at'>): HomepageModule {
    const modules = this.getHomepageModules();
    const now = new Date().toISOString();
    const newModule: HomepageModule = {
      ...moduleData,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    modules.push(newModule);
    this.saveHomepageModules(modules);
    return newModule;
  }

  updateHomepageModule(id: string, updatedFields: Partial<HomepageModule>): HomepageModule | null {
    const modules = this.getHomepageModules();
    const index = modules.findIndex(m => m.id === ensureValidUUID(id));
    if (index === -1) return null;

    const updated: HomepageModule = {
      ...modules[index],
      ...updatedFields,
      id: ensureValidUUID(modules[index].id),
      updated_at: new Date().toISOString()
    };
    modules[index] = updated;
    this.saveHomepageModules(modules);
    return updated;
  }

  deleteHomepageModule(id: string): void {
    const targetId = ensureValidUUID(id);
    const modules = this.getHomepageModules();
    const filtered = modules.filter(m => m.id !== targetId);
    // Reindex display orders to maintain clean continuous indexes
    const reindexed = filtered.map((mod, idx) => ({ ...mod, display_order: idx + 1 }));
    this.saveHomepageModules(reindexed);

    // Explicitly delete from Supabase so the deleted row is not resurrected on next fetch/sync
    supabase
      .from('homepage_modules')
      .delete()
      .eq('id', targetId)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Module Delete Error]:', error.message);
        }
      });
  }

  // Media Library
  getMediaItems(bucket?: MediaBucket, useDefaultFallback = false): MediaItem[] {
    const items = this.getStorageItem<MediaItem[]>('gsss_media_items', useDefaultFallback ? DEFAULT_MEDIA_ITEMS : []);
    if (bucket) {
      return items.filter(item => item.bucket === bucket);
    }
    return items;
  }

  saveMediaItems(items: MediaItem[], localOnly = false): void {
    this.setStorageItem('gsss_media_items', items);
  }

  saveMediaItemSingle(item: MediaItem): void {
    const items = this.getMediaItems();
    const index = items.findIndex(x => x.id === item.id);
    if (index !== -1) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    this.setStorageItem('gsss_media_items', items);
  }

  uploadMediaItem(fileName: string, bucket: MediaBucket, fileUrl: string, fileType: 'image' | 'pdf', sizeKb: number): MediaItem {
    const items = this.getMediaItems();
    const newItem: MediaItem = {
      id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file_name: fileName,
      bucket,
      file_url: fileUrl,
      file_type: fileType,
      uploaded_at: new Date().toISOString(),
      size_kb: sizeKb
    };
    items.unshift(newItem);
    this.setStorageItem('gsss_media_items', items);
    return newItem;
  }

  deleteMediaItem(id: string): void {
    const items = this.getMediaItems();
    const updated = items.filter(item => item.id !== id);
    this.setStorageItem('gsss_media_items', updated);

    // Clean up notices referencing this media ID
    const notices = this.getNotices();
    let noticedChanged = false;
    const cleanNotices = notices.map(notice => {
      let changed = false;
      let img = notice.featured_image;
      let pdf = notice.pdf_url;
      if (notice.featured_image === id) {
        img = '';
        changed = true;
      }
      if (notice.pdf_url === id) {
        pdf = '';
        changed = true;
      }
      if (changed) noticedChanged = true;
      return { ...notice, featured_image: img, pdf_url: pdf };
    });
    if (noticedChanged) {
      this.saveNotices(cleanNotices);
    }
  }

  replaceMediaItem(id: string, fileUrl: string, sizeKb: number): MediaItem | null {
    const items = this.getMediaItems();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      file_url: fileUrl,
      size_kb: sizeKb,
      uploaded_at: new Date().toISOString()
    };
    this.setStorageItem('gsss_media_items', items);
    return items[index];
  }

  // Notices CRM
  getNotices(useDefaultFallback = false): Notice[] {
    const rawNotices = this.getStorageItem<Notice[]>('gsss_notices', useDefaultFallback ? DEFAULT_NOTICES : []);
    return rawNotices.map(n => ({
      ...n,
      id: ensureValidUUID(n.id)
    }));
  }

  saveNotices(notices: Notice[], localOnly = false): void {
    const sanitized = notices.map(n => ({
      ...n,
      id: ensureValidUUID(n.id)
    }));
    this.setStorageItem('gsss_notices', sanitized);

    if (localOnly) return;

    // Save/Upsert to Supabase
    supabase
      .from('notices')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Notices Sync Error]:', error.message);
        }
      });
  }

  createNotice(noticeData: Omit<Notice, 'id' | 'created_at' | 'updated_at'>): Notice {
    const notices = this.getNotices();
    const now = new Date().toISOString();
    const newNotice: Notice = {
      ...noticeData,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    notices.unshift(newNotice);
    this.saveNotices(notices);
    return newNotice;
  }

  updateNotice(id: string, updatedFields: Partial<Notice>): Notice | null {
    const notices = this.getNotices();
    const targetId = ensureValidUUID(id);
    const index = notices.findIndex(notice => notice.id === targetId);
    if (index === -1) return null;

    const updated: Notice = {
      ...notices[index],
      ...updatedFields,
      id: targetId,
      updated_at: new Date().toISOString()
    };
    notices[index] = updated;
    this.saveNotices(notices);
    return updated;
  }

  deleteNotice(id: string): void {
    const targetId = ensureValidUUID(id);
    const notices = this.getNotices();
    const filtered = notices.filter(n => n.id !== targetId);
    this.saveNotices(filtered);

    // Delete from Supabase
    supabase
      .from('notices')
      .delete()
      .eq('id', targetId)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Notice Delete Error]:', error.message);
        }
      });
  }

  // Faculty Management
  getFaculty(useDefaultFallback = false): Faculty[] {
    const rawFaculty = this.getStorageItem<Faculty[]>('gsss_faculty_members', useDefaultFallback ? DEFAULT_FACULTY : []);
    return rawFaculty.map(f => ({
      ...f,
      id: ensureValidUUID(f.id)
    }));
  }

  saveFaculty(faculty: Faculty[], localOnly = false): void {
    const sanitized = faculty.map(f => ({
      ...f,
      id: ensureValidUUID(f.id),
      joined_date: sanitizeDate(f.joined_date) || undefined
    }));
    this.setStorageItem('gsss_faculty_members', sanitized);

    if (localOnly) return;

    // Save/Upsert to Supabase
    supabase
      .from('faculty')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Faculty Sync Error]:', error.message);
        }
      });
  }

  createFaculty(facultyData: Omit<Faculty, 'id' | 'created_at' | 'updated_at'>): Faculty {
    const list = this.getFaculty();
    const now = new Date().toISOString();
    
    // Sort and compact existing list first to guarantee no gaps
    const sorted = [...list].sort((a, b) => a.display_order - b.display_order);
    sorted.forEach((fac, idx) => {
      fac.display_order = idx + 1;
    });
    
    const nextOrder = sorted.length + 1;
    
    const newFac: Faculty = {
      ...facultyData,
      id: generateUUID(),
      display_order: nextOrder,
      created_at: now,
      updated_at: now
    };
    sorted.push(newFac);
    this.saveFaculty(sorted);
    return newFac;
  }

  updateFaculty(id: string, updatedFields: Partial<Faculty>): Faculty | null {
    const list = this.getFaculty();
    const targetId = ensureValidUUID(id);
    const index = list.findIndex(f => f.id === targetId);
    if (index === -1) return null;

    const updated: Faculty = {
      ...list[index],
      ...updatedFields,
      id: targetId,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    this.saveFaculty(list);
    return updated;
  }

  deleteFaculty(id: string): void {
    const targetId = ensureValidUUID(id);
    const list = this.getFaculty();
    const filtered = list.filter(f => f.id !== targetId);
    
    // Sort and compact remaining list to close any gaps and keep sequence 1..N
    const sorted = [...filtered].sort((a, b) => a.display_order - b.display_order);
    sorted.forEach((fac, idx) => {
      fac.display_order = idx + 1;
    });
    
    this.saveFaculty(sorted);

    // Delete from Supabase
    supabase
      .from('faculty')
      .delete()
      .eq('id', targetId)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Faculty Delete Error]:', error.message);
        }
      });
  }

  // ==========================================
  // ACADEMIC MANAGEMENT METHODS
  // ==========================================

  getTimetableGroups(): TimetableGroup[] {
    const raw = this.getStorageItem<TimetableGroup[]>('gsss_timetable_groups', DEFAULT_TIMETABLE_GROUPS);
    return raw.map(g => ({
      ...g,
      id: ensureValidUUID(g.id)
    })).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  }

  saveTimetableGroups(groups: TimetableGroup[], localOnly = false): void {
    const sanitized = groups.map(g => ({
      ...g,
      id: ensureValidUUID(g.id)
    }));
    this.setStorageItem('gsss_timetable_groups', sanitized);
    this.updateTimetableTimestamp();

    window.dispatchEvent(new CustomEvent('gsss-data-synced'));

    if (localOnly) return;

    // Persist to Supabase if timetable_groups table is available
    // Otherwise, handle gracefully so we don't crash
    supabase
      .from('timetable_groups')
      .upsert(sanitized)
      .then(
        ({ error }) => {
          if (error) {
            console.warn('[Supabase Timetable Groups Save Info]: table may not exist yet, using Local Storage as source of truth. Error:', error.message);
          }
        },
        err => {
          console.warn('[Supabase Timetable Groups Save Error Caught]:', err);
        }
      );
  }

  deleteTimetableGroup(id: string): void {
    const targetId = ensureValidUUID(id);
    const groups = this.getTimetableGroups();
    const filtered = groups.filter(g => g.id !== targetId);
    
    // re-calculate order
    filtered.forEach((g, idx) => {
      g.display_order = idx + 1;
    });

    this.saveTimetableGroups(filtered);

    // Try deleting from Supabase
    supabase
      .from('timetable_groups')
      .delete()
      .eq('id', targetId)
      .then(
        ({ error }) => {
          if (error) {
            console.warn('[Supabase Timetable Groups Delete Info]: table may not exist yet.', error.message);
          }
        },
        err => {
          console.warn('[Supabase Timetable Groups Delete Error Caught]:', err);
        }
      );
  }

  getTimetableLastUpdated(): string {
    return this.getStorageItem<string>('gsss_timetable_last_updated', '2026-06-19T11:47:00.000Z');
  }

  updateTimetableTimestamp(): string {
    const now = new Date().toISOString();
    this.setStorageItem('gsss_timetable_last_updated', now);
    return now;
  }

  getRoutines(useDefaultFallback = false): Routine[] {
    const raw = this.getStorageItem<Routine[]>('gsss_routines', useDefaultFallback ? DEFAULT_ROUTINES : []);
    let routines = raw.map(r => ({
      ...r,
      id: ensureValidUUID(r.id)
    }));

    if (!useDefaultFallback) {
      const activeGroups = this.getTimetableGroups().filter(g => g.is_active);
      const activeGroupNames = new Set(activeGroups.map(g => g.name));

      let changed = false;

      // Filter out routines that do not correspond to any active timetable group name
      const initialLength = routines.length;
      routines = routines.filter(r => activeGroupNames.has(r.class_name));
      if (routines.length !== initialLength) {
        changed = true;
      }

      // Ensure every active timetable group has exactly one corresponding routine
      activeGroups.forEach(g => {
        const exists = routines.some(r => r.class_name === g.name);
        if (!exists) {
          routines.push({
            id: generateUUID(),
            class_name: g.name as any,
            display_mode: 'online',
            pdf_url: '',
            override_active: false,
            override_title: '',
            override_pdf_url: '',
            override_start: '',
            override_end: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          changed = true;
        }
      });

      if (changed) {
        this.setStorageItem('gsss_routines', routines);
        this.updateTimetableTimestamp();

        // Also sync to Supabase if table exists
        supabase
          .from('routines')
          .upsert(routines)
          .then(({ error }) => {
            if (error) {
              console.warn('[Supabase Routines Sync Error Caught]:', error.message);
            }
          });
      }
    }

    return routines;
  }

  saveRoutines(routines: Routine[], localOnly = false): void {
    const sanitized = routines.map(r => ({
      ...r,
      id: ensureValidUUID(r.id)
    }));
    this.setStorageItem('gsss_routines', sanitized);
    this.updateTimetableTimestamp();

    console.log('[ROUTINES SAVE] localOnly =', localOnly);
    console.log('[ROUTINES LOCAL COUNT]', sanitized.length);

    if (localOnly) return;

    // Persist to Supabase
    supabase
      .from('routines')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Routines Save Error]:', error.message);
        }
      });
  }

  updateRoutine(id: string, updatedFields: Partial<Routine>): Routine | null {
    const routines = this.getRoutines();
    const index = routines.findIndex(r => r.id === ensureValidUUID(id));
    if (index === -1) return null;

    const updated: Routine = {
      ...routines[index],
      ...updatedFields,
      updated_at: new Date().toISOString()
    };
    routines[index] = updated;
    this.saveRoutines(routines);
    return updated;
  }

  getRoutineEntries(useDefaultFallback = false): RoutineEntry[] {
    const entries = this.getStorageItem<RoutineEntry[]>('gsss_routine_entries', useDefaultFallback ? DEFAULT_ROUTINE_ENTRIES : []);
    const masters = this.getStorageItem<PeriodMaster[]>('gsss_period_masters', useDefaultFallback ? DEFAULT_PERIODS : []);
    
    // Obtain active routines to ensure we only return entries for active timetable groups
    const routines = this.getRoutines(useDefaultFallback);
    const activeRoutineIds = new Set(routines.map(r => r.id));

    // Filter to only entries belonging to active routines
    const filteredEntries = entries.filter(ent => activeRoutineIds.has(ensureValidUUID(ent.routine_id)));
    
    let changed = entries.length !== filteredEntries.length;
    const mapped = filteredEntries.map(ent => {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ent.id);
      let entId = ent.id;
      if (!isUuid) {
        entId = generateUUID();
        changed = true;
      }
      const routine_id = ensureValidUUID(ent.routine_id);
      if (routine_id !== ent.routine_id) {
        changed = true;
      }
      
      const pm = masters.find(m => m.name === ent.period);
      if (pm) {
        return {
          ...ent,
          id: entId,
          routine_id,
          time_range: pm.time_range
        };
      }
      return {
        ...ent,
        id: entId,
        routine_id
      };
    });

    if (changed) {
      // Save mapped/filtered entries back to local storage
      const localDataToSave = mapped.map(ent => ({
        id: ent.id,
        routine_id: ent.routine_id,
        day: ent.day,
        period: ent.period,
        subject: ent.subject,
        teacher: ent.teacher || null,
        teacher_id: ent.teacher_id || null,
        time_range: ent.time_range || null,
        shared_lecture_id: ent.shared_lecture_id || null
      }));
      this.setStorageItem('gsss_routine_entries', localDataToSave);

      // Also sync back to Supabase
      supabase
        .from('routine_entries')
        .upsert(localDataToSave)
        .then(({ error }) => {
          if (error) {
            console.warn('[Supabase Routine Entries Sync Error Caught]:', error.message);
          }
        });
    }

    return mapped;
  }

  saveRoutineEntries(entries: RoutineEntry[], localOnly = false): void {
    const sanitized = entries.map(ent => {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ent.id);
      return {
        ...ent,
        id: isUuid ? ent.id : generateUUID(),
        routine_id: ensureValidUUID(ent.routine_id)
      };
    });
    this.setStorageItem('gsss_routine_entries', sanitized);
    this.updateTimetableTimestamp();

    console.log('[ROUTINE ENTRIES SAVE] localOnly =', localOnly);
    console.log('[ROUTINE ENTRIES LOCAL COUNT]', sanitized.length);

    if (localOnly) return;

    // Persist to Supabase
    supabase
      .from('routine_entries')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Routine Entries Save Error]:', error.message);
        }
      });
  }

  getRoutineEntriesByRoutine(routineId: string): RoutineEntry[] {
    const targetRoutineId = ensureValidUUID(routineId);
    return this.getRoutineEntries().filter(e => e.routine_id === targetRoutineId);
  }

  createRoutineEntry(entryData: Omit<RoutineEntry, 'id'>): RoutineEntry {
    const entries = this.getRoutineEntries();
    const id = generateUUID();
    const routine_id = ensureValidUUID(entryData.routine_id);
    const newEntry: RoutineEntry = {
      ...entryData,
      id,
      routine_id
    };
    entries.push(newEntry);
    this.saveRoutineEntries(entries);
    return newEntry;
  }

  updateRoutineEntry(id: string, updatedFields: Partial<RoutineEntry>): RoutineEntry | null {
    const entries = this.getRoutineEntries();
    const targetId = id;
    const index = entries.findIndex(e => e.id === targetId);
    if (index === -1) return null;

    const updated: RoutineEntry = {
      ...entries[index],
      ...updatedFields,
      id: targetId
    };
    if (updatedFields.routine_id) {
      updated.routine_id = ensureValidUUID(updatedFields.routine_id);
    }
    entries[index] = updated;
    this.saveRoutineEntries(entries);
    return updated;
  }

  async deleteRoutineEntry(id: string): Promise<void> {
    const targetId = id;
    console.log('[ROUTINE ENTRY DELETE] Direct delete requested for ID:', targetId);
    
    const entries = this.getRoutineEntries();
    const initialCount = entries.length;
    const filtered = entries.filter(e => e.id !== targetId);
    const removedCount = initialCount - filtered.length;

    try {
      const { error } = await supabase
        .from('routine_entries')
        .delete()
        .eq('id', targetId);

      if (error) {
        console.error('[Supabase Routine Entries Delete Error]:', error.message);
        throw error;
      }
      console.log('[REMOTE DELETE COUNT] Routine entries deleted from Supabase:', removedCount);
    } catch (err: any) {
      console.error('[ROUTINE ENTRY DELETE] Failed to delete from Supabase:', err.message || err);
    }

    this.saveRoutineEntries(filtered, true); // save locally only
    console.log('[LOCAL DELETE COUNT] Local routine entries deleted:', removedCount);
    window.dispatchEvent(new CustomEvent('gsss-data-synced'));
  }

  async deleteRoutineEntries(ids: string[]): Promise<void> {
    console.log('[CASCADE DELETE] Bulk delete requested for IDs:', ids);
    
    const entries = this.getRoutineEntries();
    const initialCount = entries.length;
    const filtered = entries.filter(e => !ids.includes(e.id));
    const removedCount = initialCount - filtered.length;

    try {
      const { error } = await supabase
        .from('routine_entries')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('[Supabase Routine Entries Bulk Delete Error]:', error.message);
        throw error;
      }
      console.log('[REMOTE DELETE COUNT] Bulk routine entries deleted from Supabase:', removedCount);
    } catch (err: any) {
      console.error('[CASCADE DELETE] Failed to delete from Supabase:', err.message || err);
    }

    this.saveRoutineEntries(filtered, true); // save locally only
    console.log('[LOCAL DELETE COUNT] Local bulk routine entries deleted:', removedCount);
    window.dispatchEvent(new CustomEvent('gsss-data-synced'));
  }

  // Exam Schedules CRM
  getExamSchedules(useDefaultFallback = false): ExamSchedule[] {
    const raw = this.getStorageItem<ExamSchedule[]>('gsss_exam_schedules', useDefaultFallback ? DEFAULT_EXAM_SCHEDULES : []);
    return raw.map(s => ({
      ...s,
      id: ensureValidUUID(s.id)
    }));
  }

  saveExamSchedules(schedules: ExamSchedule[], localOnly = false): void {
    const sanitized = schedules.map(s => ({
      ...s,
      id: ensureValidUUID(s.id)
    }));
    this.setStorageItem('gsss_exam_schedules', sanitized);

    if (localOnly) {
      window.dispatchEvent(new CustomEvent('gsss-data-synced'));
      return;
    }

    // Save/Upsert to Supabase
    supabase
      .from('exam_schedules')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Exam Schedules Sync Error]:', error.message);
        } else {
          window.dispatchEvent(new CustomEvent('gsss-data-synced'));
        }
      });
  }

  createExamSchedule(scheduleData: Omit<ExamSchedule, 'id' | 'created_at' | 'updated_at'>): ExamSchedule {
    console.log('[EXAM CREATE CALLED] createExamSchedule', scheduleData);
    const schedules = this.getExamSchedules();
    const now = new Date().toISOString();
    const newSchedule: ExamSchedule = {
      ...scheduleData,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    schedules.push(newSchedule);
    this.saveExamSchedules(schedules);
    return newSchedule;
  }

  updateExamSchedule(id: string, updatedFields: Partial<ExamSchedule>): ExamSchedule | null {
    console.log('[EXAM UPDATE CALLED] updateExamSchedule', id, updatedFields);
    const targetId = ensureValidUUID(id);
    const schedules = this.getExamSchedules();
    const index = schedules.findIndex(s => s.id === targetId);
    if (index === -1) return null;

    const updated: ExamSchedule = {
      ...schedules[index],
      ...updatedFields,
      id: targetId,
      updated_at: new Date().toISOString()
    };
    schedules[index] = updated;
    this.saveExamSchedules(schedules);
    return updated;
  }

  async deleteExamSchedule(id: string): Promise<void> {
    console.log('[EXAM DELETE CALLED] deleteExamSchedule', id);
    console.log('[EXAM SCHEDULE DELETE START] id:', id);
    const targetId = ensureValidUUID(id);
    const schedules = this.getExamSchedules();
    const initialCount = schedules.length;
    const filtered = schedules.filter(s => s.id !== targetId);
    const removedCount = initialCount - filtered.length;

    this.saveExamSchedules(filtered, true); // save locally only
    console.log('[LOCAL DELETE COUNT] Local exam schedules deleted:', removedCount);

    // Also remove respective exam entries for sanity
    const entries = this.getExamEntries();
    const cleaned = entries.filter(e => e.schedule_id !== targetId);
    this.saveExamEntries(cleaned, true); // save locally only

    try {
      const { error: entryError } = await supabase
        .from('exam_entries')
        .delete()
        .eq('schedule_id', targetId);

      if (entryError) {
        console.error('[Supabase Exam Entries Delete Cascade Error]:', entryError.message);
      }

      const { error: scheduleError } = await supabase
        .from('exam_schedules')
        .delete()
        .eq('id', targetId);

      if (scheduleError) {
        console.error('[Supabase Exam Schedule Delete Error]:', scheduleError.message);
        throw scheduleError;
      }

      console.log('[REMOTE DELETE SUCCESS] Remote exam schedule and cascade entries deleted successfully from Supabase');
    } catch (err: any) {
      console.error('[Supabase Exam Schedule Delete Error]:', err.message || err);
    }

    window.dispatchEvent(new CustomEvent('gsss-data-synced'));
    console.log('[SYNC EVENT DISPATCHED] Custom event gsss-data-synced dispatched from deleteExamSchedule');
  }

  getExamEntries(useDefaultFallback = false): ExamEntry[] {
    const raw = this.getStorageItem<ExamEntry[]>('gsss_exam_entries', useDefaultFallback ? DEFAULT_EXAM_ENTRIES : []);
    return raw.map(e => ({
      ...e,
      id: ensureValidUUID(e.id),
      schedule_id: ensureValidUUID(e.schedule_id)
    }));
  }

  saveExamEntries(entries: ExamEntry[], localOnly = false): void {
    const sanitized = entries.map(e => ({
      ...e,
      id: ensureValidUUID(e.id),
      schedule_id: ensureValidUUID(e.schedule_id)
    }));
    this.setStorageItem('gsss_exam_entries', sanitized);

    if (localOnly) {
      window.dispatchEvent(new CustomEvent('gsss-data-synced'));
      return;
    }

    // Save/Upsert to Supabase
    supabase
      .from('exam_entries')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Exam Entries Sync Error]:', error.message);
        } else {
          window.dispatchEvent(new CustomEvent('gsss-data-synced'));
        }
      });
  }

  getExamEntriesBySchedule(scheduleId: string): ExamEntry[] {
    const targetScheduleId = ensureValidUUID(scheduleId);
    return this.getExamEntries().filter(e => e.schedule_id === targetScheduleId);
  }

  createExamEntry(entryData: Omit<ExamEntry, 'id'>): ExamEntry {
    console.log('[EXAM CREATE CALLED] createExamEntry', entryData);
    const entries = this.getExamEntries();
    const id = generateUUID();
    const newEntry: ExamEntry = {
      ...entryData,
      id,
      schedule_id: ensureValidUUID(entryData.schedule_id)
    };
    entries.push(newEntry);
    this.saveExamEntries(entries);
    return newEntry;
  }

  updateExamEntry(id: string, updatedFields: Partial<ExamEntry>): ExamEntry | null {
    console.log('[EXAM ENTRY UPDATE CALLED] updateExamEntry', id, updatedFields);
    console.log('[EXAM UPDATE CALLED] updateExamEntry', id, updatedFields);
    const targetId = ensureValidUUID(id);
    const entries = this.getExamEntries();
    const index = entries.findIndex(e => e.id === targetId);
    if (index === -1) return null;

    const updated: ExamEntry = {
      ...entries[index],
      ...updatedFields,
      id: targetId
    };
    if (updatedFields.schedule_id) {
      updated.schedule_id = ensureValidUUID(updatedFields.schedule_id);
    }
    entries[index] = updated;
    this.saveExamEntries(entries);
    return updated;
  }

  async deleteExamEntry(id: string): Promise<void> {
    console.log('[EXAM DELETE CALLED] deleteExamEntry', id);
    console.log('[EXAM ENTRY DELETE START] id:', id);
    const targetId = ensureValidUUID(id);
    const entries = this.getExamEntries();
    const initialCount = entries.length;
    const filtered = entries.filter(e => e.id !== targetId);
    const removedCount = initialCount - filtered.length;

    this.saveExamEntries(filtered, true); // save locally only
    console.log('[LOCAL DELETE COUNT] Local exam entries deleted:', removedCount);

    try {
      const { error } = await supabase
        .from('exam_entries')
        .delete()
        .eq('id', targetId);

      if (error) {
        console.error('[Supabase Exam Entry Delete Error]:', error.message);
        throw error;
      }
      console.log('[REMOTE DELETE SUCCESS] Remote exam entry deleted successfully from Supabase');
    } catch (err: any) {
      console.error('[Supabase Exam Entry Delete Error]:', err.message || err);
    }

    window.dispatchEvent(new CustomEvent('gsss-data-synced'));
    console.log('[SYNC EVENT DISPATCHED] Custom event gsss-data-synced dispatched from deleteExamEntry');
  }

  // Academic Calendar Events CRM
  getCalendarEvents(useDefaultFallback = false): CalendarEvent[] {
    const raw = this.getStorageItem<CalendarEvent[]>('gsss_calendar_events', useDefaultFallback ? DEFAULT_CALENDAR_EVENTS : []);
    return raw.map(e => ({
      ...e,
      id: ensureValidUUID(e.id)
    }));
  }

  saveCalendarEvents(events: CalendarEvent[], localOnly = false): void {
    const sanitized = events.map(e => ({
      ...e,
      id: ensureValidUUID(e.id)
    }));
    this.setStorageItem('gsss_calendar_events', sanitized);
    console.log('[CALENDAR SAVE]', sanitized.length, 'events saved. localOnly =', localOnly);

    if (localOnly) return;

    // Persist to Supabase
    supabase
      .from('calendar_events')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Calendar Events Save Error]:', error.message);
        }
      });
  }

  createCalendarEvent(eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): CalendarEvent {
    console.log('[CALENDAR CREATE CALLED] createCalendarEvent', eventData);
    const events = this.getCalendarEvents();
    const now = new Date().toISOString();
    const tempId = `cal_ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sanitizedId = ensureValidUUID(tempId);
    const newEvent: CalendarEvent = {
      ...eventData,
      id: sanitizedId,
      created_at: now,
      updated_at: now
    };
    events.push(newEvent);
    this.saveCalendarEvents(events);
    return newEvent;
  }

  updateCalendarEvent(id: string, updatedFields: Partial<CalendarEvent>): CalendarEvent | null {
    console.log('[CALENDAR UPDATE CALLED] updateCalendarEvent', id, updatedFields);
    const targetId = ensureValidUUID(id);
    const events = this.getCalendarEvents();
    const index = events.findIndex(e => e.id === targetId);
    if (index === -1) return null;

    const updated: CalendarEvent = {
      ...events[index],
      ...updatedFields,
      id: targetId,
      updated_at: new Date().toISOString()
    };
    events[index] = updated;
    this.saveCalendarEvents(events);
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    console.log('[CALENDAR DELETE CALLED] deleteCalendarEvent', id);
    console.log('[CALENDAR DELETE START] id:', id);
    const targetId = ensureValidUUID(id);
    const events = this.getCalendarEvents();
    const initialCount = events.length;
    const filtered = events.filter(e => e.id !== targetId);
    const removedCount = initialCount - filtered.length;

    this.saveCalendarEvents(filtered, true); // save locally only
    console.log('[LOCAL DELETE COUNT] Local calendar events deleted:', removedCount);

    try {
      await supabaseDbService.deleteCalendarEvent(targetId);
      console.log('[REMOTE DELETE SUCCESS] Remote calendar event deleted successfully from Supabase');
    } catch (err: any) {
      console.error('[Supabase Calendar Event Delete Error]:', err.message || err);
    }

    window.dispatchEvent(new CustomEvent('gsss-data-synced'));
    console.log('[SYNC EVENT DISPATCHED] Custom event gsss-data-synced dispatched');
  }

  // Supabase dynamic configurations in case they connect their real Supabase database
  getSupabaseConfig(): SupabaseConfig {
    return this.getStorageItem<SupabaseConfig>('gsss_supabase_config', {
      supabase_url: '',
      supabase_anon_key: '',
      is_active: false
    });
  }

  saveSupabaseConfig(config: SupabaseConfig): void {
    this.setStorageItem('gsss_supabase_config', config);
  }

  // ==========================================
  // EVENTS MANAGEMENT METHODS
  // ==========================================

  getEvents(useDefaultFallback = false): SchoolEvent[] {
    let loadedEvents: SchoolEvent[] = [];
    if (this.cachedEvents && !useDefaultFallback) {
      loadedEvents = this.cachedEvents.map(e => ({
        ...e,
        id: ensureValidUUID(e.id)
      }));
    } else {
      const rawEvents = this.getStorageItem<SchoolEvent[]>('gsss_events', useDefaultFallback ? DEFAULT_EVENTS : []);
      loadedEvents = rawEvents.map(e => ({
        ...e,
        id: ensureValidUUID(e.id)
      }));
      if (!useDefaultFallback) {
        this.cachedEvents = loadedEvents;
      }
    }

    return loadedEvents.sort((a, b) => {
      const dateA = a.event_date || '';
      const dateB = b.event_date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      const createdAtA = a.created_at || '';
      const createdAtB = b.created_at || '';
      return createdAtB.localeCompare(createdAtA);
    });
  }

  saveEvents(events: SchoolEvent[], localOnly = false): void {
    const sanitized = events.map(e => ({
      ...e,
      id: ensureValidUUID(e.id),
      event_date: sanitizeDate(e.event_date) || new Date().toISOString().split('T')[0]
    }));
    
    // Set in-memory cache as primary source of truth
    this.cachedEvents = sanitized;
    
    // Save to local storage as an optional/best-effort persistent fallback
    this.setStorageItem('gsss_events', sanitized);
    console.log(
      '[DEBUG] localStorage gsss_events count:',
      sanitized.length
    );

    if (localOnly) return;

    // Save/Upsert to Supabase
    supabase
      .from('school_events')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Events Sync Error]:', error.message);
        }
      });
  }

  createEvent(eventData: Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>): SchoolEvent {
    const events = this.getEvents();
    const now = new Date().toISOString();
    const newEvent: SchoolEvent = {
      ...eventData,
      id: generateUUID(),
      created_at: now,
      updated_at: now
    };
    events.push(newEvent);
    this.saveEvents(events); // Syncs the full updated list of events to Supabase under the hood

    return newEvent;
  }

  updateEvent(id: string, updatedFields: Partial<SchoolEvent>): SchoolEvent | null {
    const events = this.getEvents();
    const targetId = ensureValidUUID(id);
    const index = events.findIndex(e => e.id === targetId);
    if (index === -1) return null;

    const updated: SchoolEvent = {
      ...events[index],
      ...updatedFields,
      id: targetId,
      updated_at: new Date().toISOString()
    };
    events[index] = updated;
    this.saveEvents(events); // Syncs the full updated list of events to Supabase

    return updated;
  }

  deleteEvent(id: string): void {
    const targetId = ensureValidUUID(id);
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== targetId);
    this.saveEvents(filtered); // Syncs remaining elements to Supabase

    // Explicitly delete from Supabase to handle the removed item
    supabase
      .from('school_events')
      .delete()
      .eq('id', targetId)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Event Delete Error]:', error.message);
        }
      });

    // Clean up any event gallery images as well
    const images = this.getEventImages();
    const filteredImgs = images.filter(img => img.event_id !== targetId);
    this.saveEventImages(filteredImgs);
  }

  // Event Categories
  getEventCategories(): string[] {
    return this.getStorageItem<string[]>('gsss_event_categories', DEFAULT_EVENT_CATEGORIES);
  }

  saveEventCategories(categories: string[]): void {
    this.setStorageItem('gsss_event_categories', categories);
  }

  createEventCategory(category: string): string[] {
    const categories = this.getEventCategories();
    const cleanCat = category.trim();
    if (cleanCat && !categories.some(c => c.toLowerCase() === cleanCat.toLowerCase())) {
      categories.push(cleanCat);
      this.saveEventCategories(categories);
    }
    return categories;
  }

  // Event Album / Gallery Images
  getEventImages(useDefaultFallback = false): SchoolEventImage[] {
    if (this.cachedEventImages && !useDefaultFallback) {
      return this.cachedEventImages.map(img => ({
        ...img,
        id: ensureValidUUID(img.id),
        event_id: ensureValidUUID(img.event_id)
      }));
    }
    const rawImages = this.getStorageItem<SchoolEventImage[]>('gsss_event_images', useDefaultFallback ? DEFAULT_EVENT_IMAGES : []);
    const loadedImages = rawImages.map(img => ({
      ...img,
      id: ensureValidUUID(img.id),
      event_id: ensureValidUUID(img.event_id)
    }));
    if (!useDefaultFallback) {
      this.cachedEventImages = loadedImages;
    }
    return loadedImages;
  }

  saveEventImages(images: SchoolEventImage[], localOnly = false): void {
    const sanitized = images.map(img => ({
      ...img,
      id: ensureValidUUID(img.id),
      event_id: ensureValidUUID(img.event_id)
    }));
    
    // Set in-memory cache as primary source of truth
    this.cachedEventImages = sanitized;
    
    // Save to local storage as best effort fallback
    this.setStorageItem('gsss_event_images', sanitized);

    if (localOnly) return;

    // Save/Upsert to Supabase
    supabase
      .from('school_event_images')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Event Images Sync Error]:', error.message);
        }
      });
  }

  getEventImagesByEvent(eventId: string): SchoolEventImage[] {
    const targetEventId = ensureValidUUID(eventId);
    return this.getEventImages()
      .filter(img => img.event_id === targetEventId)
      .sort((a, b) => a.display_order - b.display_order);
  }

  addEventImage(eventId: string, imageUrl: string): SchoolEventImage {
    const targetEventId = ensureValidUUID(eventId);
    const images = this.getEventImages();
    const eventImgs = images.filter(img => img.event_id === targetEventId);
    const nextOrder = eventImgs.length > 0 ? Math.max(...eventImgs.map(img => img.display_order)) + 1 : 1;

    const newImg: SchoolEventImage = {
      id: generateUUID(),
      event_id: targetEventId,
      image_url: imageUrl,
      display_order: nextOrder
    };
    images.push(newImg);
    this.saveEventImages(images); // Syncs the full list of event images to Supabase

    return newImg;
  }

  deleteEventImage(imageId: string): void {
    const targetImageId = ensureValidUUID(imageId);
    const images = this.getEventImages();
    const target = images.find(img => img.id === targetImageId);
    if (!target) return;
    
    const filtered = images.filter(img => img.id !== targetImageId);
    
    // Reorder remaining images for the event
    const eventImgs = filtered.filter(img => img.event_id === target.event_id)
      .sort((a, b) => a.display_order - b.display_order);
    eventImgs.forEach((img, idx) => {
      img.display_order = idx + 1;
    });

    this.saveEventImages(filtered); // Syncs remaining and reordered images to Supabase

    // Explicitly delete deleted image from Supabase
    supabase
      .from('school_event_images')
      .delete()
      .eq('id', targetImageId)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Event Image Delete Error]:', error.message);
        }
      });
  }

  updateEventImagesOrder(eventId: string, imageIdsInOrder: string[]): void {
    const targetEventId = ensureValidUUID(eventId);
    const sanitizedIds = imageIdsInOrder.map(id => ensureValidUUID(id));
    const images = this.getEventImages();
    const otherImgs = images.filter(img => img.event_id !== targetEventId);
    const eventImgs = images.filter(img => img.event_id === targetEventId);

    sanitizedIds.forEach((id, idx) => {
      const img = eventImgs.find(i => i.id === id);
      if (img) {
        img.display_order = idx + 1;
      }
    });

    const updatedImgs = [...otherImgs, ...eventImgs];
    this.saveEventImages(updatedImgs); // Syncs full re-ordered images to Supabase
  }

  getPeriodMasters(useDefaultFallback = false): PeriodMaster[] {
    const raw = this.getStorageItem<PeriodMaster[]>('gsss_period_masters', useDefaultFallback ? DEFAULT_PERIODS : []);
    return raw.map(p => ({
      ...p,
      id: ensureValidUUID(p.id)
    }));
  }

  savePeriodMasters(periods: PeriodMaster[], localOnly = false): void {
    const sanitized = periods.map(p => ({
      ...p,
      id: ensureValidUUID(p.id)
    }));
    this.setStorageItem('gsss_period_masters', sanitized);
    this.updateTimetableTimestamp();

    if (localOnly) return;

    // Persist to Supabase
    supabase
      .from('period_masters')
      .upsert(sanitized)
      .then(({ error }) => {
        if (error) {
          console.error('[Supabase Period Masters Save Error]:', error.message);
        }
      });
  }

  deletePeriodMaster(id: string): void {
    const targetId = ensureValidUUID(id);
    console.log('[DB_SERVICE DELETE] targetId:', targetId);
    const periods = this.getPeriodMasters();
    const filtered = periods.filter(p => p.id !== targetId);
    
    // Save filtered list locally without uploading to Supabase as an upsert
    this.savePeriodMasters(filtered, true);

    // Call supabaseDbService delete method
    supabaseDbService.deletePeriodMaster(targetId).catch(error => {
      console.error('[Supabase Period Masters Delete Error]:', error.message);
    });
  }
}

export const dbService = new DatabaseService();
