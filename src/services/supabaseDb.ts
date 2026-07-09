/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabase';
import { 
  SchoolSettings, 
  HomepageModule, 
  MediaItem, 
  MediaBucket,
  Notice, 
  Faculty, 
  Routine, 
  RoutineEntry, 
  PeriodMaster, 
  ExamSchedule, 
  ExamEntry, 
  CalendarEvent, 
  SchoolEvent, 
  SchoolEventImage,
  TimetableGroup
} from '../types';

/**
 * Supabase Database Service
 * Provides exact matching service functions to replicate the localStorage database layer.
 * This file prepares the schema-mapped communication layer with real-time error resilience.
 */
class SupabaseDbService {
  // ==========================================
  // AUTHENTICATION UTILITIES
  // ==========================================
  
  async getUserRole(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user role:', error.message);
      return null;
    }
    return data?.role || null;
  }

  // ==========================================
  // STORAGE BUCKET UTILITIES
  // ==========================================

  /**
   * Upload file to Supabase storage public bucket 'school-assets'
   * @param file The file representation
   * @param folder Target folder inside bucket (e.g. 'logos', 'faculty', 'notices', 'events', 'gallery')
   * @returns Public URL of uploaded asset
   */
  async uploadAsset(file: File, folder: 'logos' | 'faculty' | 'notices' | 'events' | 'gallery'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(3)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload to storage failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('school-assets')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Failed to retrieve public URL from storage bucket');
    }

    return data.publicUrl;
  }

  // ==========================================
  // SCHOOL SETTINGS
  // ==========================================
  
  async getSchoolSettings(): Promise<SchoolSettings | null> {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      console.warn('Error fetching settings or none exists:', error?.message);
      return null;
    }
    return data[0] as SchoolSettings;
  }

  async saveSchoolSettings(settings: Omit<SchoolSettings, 'id'> & { id?: string }): Promise<SchoolSettings> {
    const payload = { ...settings };
    if (!payload.id) {
      // Create new one if not supplied
      const { data, error } = await supabase
        .from('school_settings')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data as SchoolSettings;
    } else {
      // Upsert/Update the record matching the ID
      const { data, error } = await supabase
        .from('school_settings')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data as SchoolSettings;
    }
  }

  // ==========================================
  // HOMEPAGE MODULES
  // ==========================================

  async getHomepageModules(): Promise<HomepageModule[]> {
    const { data, error } = await supabase
      .from('homepage_modules')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching homepage modules:', error.message);
      return [];
    }
    return data as HomepageModule[];
  }

  async saveHomepageModules(modules: HomepageModule[]): Promise<void> {
    const { error } = await supabase
      .from('homepage_modules')
      .upsert(modules);

    if (error) throw error;
  }

  // ==========================================
  // MEDIA LIBRARY ITEMS
  // ==========================================

  async getMediaItems(): Promise<MediaItem[]> {
    const { data, error } = await supabase
      .from('media_items')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching media items:', error.message);
      return [];
    }
    return data as unknown as MediaItem[];
  }

  async createMediaItem(item: Omit<MediaItem, 'id' | 'uploaded_at'>): Promise<MediaItem> {
    const { data, error } = await supabase
      .from('media_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as MediaItem;
  }

  async deleteMediaItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('media_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async uploadMediaFile(file: File, bucket: MediaBucket): Promise<{ publicUrl: string, storagePath: string }> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(3)}.${fileExt}`;
    const filePath = `${bucket}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('school-assets')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload to storage failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('school-assets')
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error('Failed to retrieve public URL from storage bucket');
    }

    return {
      publicUrl: data.publicUrl,
      storagePath: filePath
    };
  }

  async updateMediaItem(id: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    const { data, error } = await supabase
      .from('media_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as MediaItem;
  }

  async deleteMediaFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('school-assets')
      .remove([filePath]);
    if (error) {
      console.error('[Supabase Storage Delete Error]:', error.message);
    }
  }

  getStoragePathFromUrl(url: string): string | null {
    if (!url) return null;
    const marker = '/school-assets/';
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      return url.substring(idx + marker.length);
    }
    return null;
  }

  // ==========================================
  // NOTICES
  // ==========================================

  async getNotices(): Promise<Notice[]> {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('publish_date', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error.message);
      return [];
    }
    return data as Notice[];
  }

  async createNotice(notice: Omit<Notice, 'id' | 'created_at' | 'updated_at'>): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .insert([notice])
      .select()
      .single();

    if (error) throw error;
    return data as Notice;
  }

  async updateNotice(id: string, notice: Partial<Notice>): Promise<Notice> {
    const { data, error } = await supabase
      .from('notices')
      .update({ ...notice, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Notice;
  }

  async deleteNotice(id: string): Promise<void> {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // FACULTY DIRECTORY
  // ==========================================

  async getFaculty(): Promise<Faculty[]> {
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching faculty:', error.message);
      return [];
    }
    return data as Faculty[];
  }

  async createFaculty(fac: Omit<Faculty, 'id' | 'created_at' | 'updated_at'>): Promise<Faculty> {
    const { data, error } = await supabase
      .from('faculty')
      .insert([fac])
      .select()
      .single();

    if (error) throw error;
    return data as Faculty;
  }

  async updateFaculty(id: string, fac: Partial<Faculty>): Promise<Faculty> {
    const { data, error } = await supabase
      .from('faculty')
      .update({ ...fac, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Faculty;
  }

  async deleteFaculty(id: string): Promise<void> {
    const { error } = await supabase
      .from('faculty')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // TIMETABLE MATRIX & ROUTINES
  // ==========================================

  async getRoutines(): Promise<Routine[]> {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('class_name', { ascending: true });

    if (error) {
      console.error('Error fetching routines:', error.message);
      return [];
    }
    return data as Routine[];
  }

  async saveRoutines(routines: Routine[]): Promise<void> {
    const { error } = await supabase
      .from('routines')
      .upsert(routines);

    if (error) throw error;
  }

  async updateRoutine(id: string, fields: Partial<Routine>): Promise<Routine> {
    const { data, error } = await supabase
      .from('routines')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Routine;
  }

  async getRoutineEntries(): Promise<RoutineEntry[]> {
    const { data, error } = await supabase
      .from('routine_entries')
      .select('*');

    if (error) {
      console.error('Error fetching routine entries:', error.message);
      return [];
    }
    return data as RoutineEntry[];
  }

  async saveRoutineEntries(entries: RoutineEntry[]): Promise<void> {
    // Replaces / upserts multiple routine entries
    const { error } = await supabase
      .from('routine_entries')
      .upsert(entries);

    if (error) throw error;
  }

  async createRoutineEntry(entry: Omit<RoutineEntry, 'id'>): Promise<RoutineEntry> {
    const { data, error } = await supabase
      .from('routine_entries')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data as RoutineEntry;
  }

  async updateRoutineEntry(id: string, fields: Partial<RoutineEntry>): Promise<RoutineEntry> {
    const { data, error } = await supabase
      .from('routine_entries')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RoutineEntry;
  }

  async deleteRoutineEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('routine_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getPeriodMasters(): Promise<PeriodMaster[]> {
    const { data, error } = await supabase
      .from('period_masters')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching period masters:', error.message);
      return [];
    }
    return data as PeriodMaster[];
  }

  async savePeriodMasters(periods: PeriodMaster[]): Promise<void> {
    const { error } = await supabase
      .from('period_masters')
      .upsert(periods);

    if (error) throw error;
  }

  async deletePeriodMaster(id: string): Promise<void> {
    console.log('[DELETE START] id:', id);
    const response = await supabase
      .from('period_masters')
      .delete()
      .eq('id', id);

    console.log('[DELETE RESULT] status:', response.status, 'statusText:', response.statusText, 'error:', response.error, 'data:', response.data);

    if (response.error) {
      console.error('[SUPABASE DELETE ERROR OBJECT]:', JSON.stringify(response.error, null, 2));
      throw response.error;
    } else {
      // Query period_masters immediately afterwards to get remaining row count
      const { count, error: countError } = await supabase
        .from('period_masters')
        .select('*', { count: 'exact', head: true });
      if (!countError) {
        console.log('[DELETE SUCCESS] remaining row count of period_masters:', count);
      } else {
        console.error('[QUERY ERROR AFTER DELETE]:', countError);
      }
    }
  }

  async getTimetableGroups(): Promise<TimetableGroup[]> {
    const { data, error } = await supabase
      .from('timetable_groups')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching timetable groups from Supabase:', error.message);
      return [];
    }
    return data as TimetableGroup[];
  }

  async saveTimetableGroups(groups: TimetableGroup[]): Promise<void> {
    const { error } = await supabase
      .from('timetable_groups')
      .upsert(groups);

    if (error) throw error;
  }

  async deleteTimetableGroup(id: string): Promise<void> {
    const { error } = await supabase
      .from('timetable_groups')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getTimetableLastUpdated(): Promise<string> {
    const { data, error } = await supabase
      .from('timetable_metadata')
      .select('last_updated')
      .eq('id', 'global_timestamp')
      .single();

    if (error || !data) {
      return new Date().toISOString();
    }
    return data.last_updated;
  }

  // ==========================================
  // EXAM SCHEDULES
  // ==========================================

  async getExamSchedules(): Promise<ExamSchedule[]> {
    const { data, error } = await supabase
      .from('exam_schedules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exam schedules:', error.message);
      return [];
    }
    return data as ExamSchedule[];
  }

  async createExamSchedule(sched: Omit<ExamSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<ExamSchedule> {
    const { data, error } = await supabase
      .from('exam_schedules')
      .insert([sched])
      .select()
      .single();

    if (error) throw error;
    return data as ExamSchedule;
  }

  async updateExamSchedule(id: string, sched: Partial<ExamSchedule>): Promise<ExamSchedule> {
    const { data, error } = await supabase
      .from('exam_schedules')
      .update({ ...sched, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ExamSchedule;
  }

  async deleteExamSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('exam_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getExamEntries(): Promise<ExamEntry[]> {
    const { data, error } = await supabase
      .from('exam_entries')
      .select('*')
      .order('exam_date', { ascending: true });

    if (error) {
      console.error('Error fetching exam entries:', error.message);
      return [];
    }
    return data as unknown as ExamEntry[];
  }

  async saveExamEntries(entries: ExamEntry[]): Promise<void> {
    const { error } = await supabase
      .from('exam_entries')
      .upsert(entries);

    if (error) throw error;
  }

  async createExamEntry(entry: Omit<ExamEntry, 'id'>): Promise<ExamEntry> {
    const { data, error } = await supabase
      .from('exam_entries')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ExamEntry;
  }

  async updateExamEntry(id: string, fields: Partial<ExamEntry>): Promise<ExamEntry> {
    const { data, error } = await supabase
      .from('exam_entries')
      .update(fields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as ExamEntry;
  }

  async deleteExamEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('exam_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==========================================
  // ACADEMIC CALENDAR & EVENTS
  // ==========================================

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error.message);
      return [];
    }
    return data as CalendarEvent[];
  }

  async saveCalendarEvents(events: CalendarEvent[]): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .upsert(events);

    if (error) throw error;
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as CalendarEvent;
  }

  async updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ ...event, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CalendarEvent;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // School Rich Events
  async getEvents(): Promise<SchoolEvent[] | null> {
    try {
      const { data, error } = await supabase
        .from('school_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) {
        console.error('Error fetching school events:', error.message);
        return null;
      }
      return data as SchoolEvent[];
    } catch (err) {
      console.error('Error fetching school events:', err);
      return null;
    }
  }

  async createEvent(event: Omit<SchoolEvent, 'id' | 'created_at' | 'updated_at'>): Promise<SchoolEvent> {
    const { data, error } = await supabase
      .from('school_events')
      .insert([event])
      .select()
      .single();

    if (error) throw error;
    return data as SchoolEvent;
  }

  async updateEvent(id: string, event: Partial<SchoolEvent>): Promise<SchoolEvent> {
    const { data, error } = await supabase
      .from('school_events')
      .update({ ...event, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SchoolEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('school_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Event Gallery Images
  async getEventImages(): Promise<SchoolEventImage[] | null> {
    try {
      const { data, error } = await supabase
        .from('school_event_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching event images:', error.message);
        return null;
      }
      return data as SchoolEventImage[];
    } catch (err) {
      console.error('Error fetching event images:', err);
      return null;
    }
  }

  async addEventImage(img: Omit<SchoolEventImage, 'id'>): Promise<SchoolEventImage> {
    const { data, error } = await supabase
      .from('school_event_images')
      .insert([img])
      .select()
      .single();

    if (error) throw error;
    return data as SchoolEventImage;
  }

  async deleteEventImage(id: string): Promise<void> {
    const { error } = await supabase
      .from('school_event_images')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const supabaseDbService = new SupabaseDbService();
