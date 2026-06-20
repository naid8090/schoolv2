/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SchoolSettings {
  id: string;
  school_name: string;
  school_motto: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
  hero_image_url: string;
  footer_subtitle?: string;
  footer_description?: string;
  school_affiliation?: string;
  
  // Custom hero overlay texts
  hero_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  hero_badge_text?: string;
  hero_estd_text?: string;
  hero_dise_text?: string;
}

export type ModuleType =
  | 'Hero Section'
  | 'About School'
  | 'Principal Message'
  | 'Quick Links'
  | 'School Statistics'
  | 'Notice Feed'
  | 'Important Links'
  | 'Facilities'
  | 'Achievements Preview'
  | 'Events Preview'
  | 'Gallery Preview'
  | 'Academic Quick Links'
  | 'Contact Information'
  | 'Featured Faculty';

export interface HomepageModule {
  id: string;
  module_type: ModuleType;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  button_text: string;
  button_url: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  items_json?: string;
}

export type MediaBucket =
  | 'logos'
  | 'hero-images'
  | 'notices'
  | 'gallery'
  | 'faculty'
  | 'events'
  | 'achievements'
  | 'downloads';

export interface MediaItem {
  id: string;
  file_name: string;
  bucket: MediaBucket;
  file_url: string;
  file_type: 'image' | 'pdf';
  uploaded_at: string;
  size_kb: number;
}

export type NoticeCategory =
  | 'General Notice'
  | 'Admission Notice'
  | 'Exam Notice'
  | 'Holiday Notice'
  | 'Scholarship Notice'
  | 'Government Circular'
  | 'Important Announcement';

export type NoticePriority = 'Critical' | 'High' | 'Normal';

export type NoticeStatus = 'Draft' | 'Published' | 'Archived';

export interface Notice {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  priority: NoticePriority;
  status: NoticeStatus;
  featured_image: string; // URL or base64 representation
  pdf_url: string; // URL or base64 representation
  is_pinned: boolean;
  show_on_homepage: boolean;
  publish_date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface SupabaseConfig {
  supabase_url: string;
  supabase_anon_key: string;
  is_active: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  photo_url: string;
  designation: string; // Category, e.g. 'Principal', 'Teacher'
  department: string; // e.g. 'Science', 'Commerce', 'Arts', 'General'
  subject: string;
  qualification: string;
  experience: string;
  bio: string;
  email?: string;
  phone?: string;
  joined_date?: string;
  room_number?: string;
  display_order: number;
  is_active: boolean;
  featured_homepage: boolean;
  created_at: string;
  updated_at: string;
}

export type AcademicClass = 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12';

export interface Routine {
  id: string;
  class_name: AcademicClass;
  display_mode: 'online' | 'pdf';
  pdf_url?: string;
  override_active: boolean;
  override_title?: string;
  override_pdf_url?: string;
  override_start?: string;
  override_end?: string;
  created_at: string;
  updated_at: string;
}

export interface RoutineEntry {
  id: string;
  routine_id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: string; // Period number or indicator, e.g., "1", "2"
  subject: string;
  teacher?: string;
  time_range?: string; // Timing of the period, e.g., "09:00 AM - 09:45 AM"
}

export interface PeriodMaster {
  id: string;
  name: string;
  time_range: string;
}

export interface ExamSchedule {
  id: string;
  title: string;
  display_mode: 'online' | 'pdf';
  pdf_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamEntry {
  id: string;
  schedule_id: string;
  exam_date: string; // YYYY-MM-DD
  subject: string;
  time: string; // e.g., "10:00 AM - 01:00 PM"
  notes?: string;
}

export type CalendarEventType = 'Holiday' | 'Examination' | 'Parent Meeting' | 'Admission Date' | 'School Event';

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: CalendarEventType;
  event_date: string; // YYYY-MM-DD
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  category: string;
  event_date: string; // YYYY-MM-DD
  short_description: string;
  full_description: string;
  featured_image: string;
  venue: string;
  organizer: string;
  status: 'Draft' | 'Published' | 'Archived';
  featured_homepage: boolean;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolEventImage {
  id: string;
  event_id: string;
  image_url: string;
  display_order: number;
}


