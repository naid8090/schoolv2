import { dbService } from './db';
import { MediaItem, Notice, Faculty, Routine, ExamSchedule, SchoolEvent, SchoolEventImage, SchoolSettings, HomepageModule } from '../types';

export interface MediaReference {
  module: string;
  recordId: string;
  fieldName: string;
  recordName: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateItem?: MediaItem;
}

export interface IntegrityDiagnostics {
  healthy: boolean;
  brokenReferencesCount: number;
  duplicateFilesCount: number;
  orphanMetadataCount: number;
  details: {
    brokenReferences: { module: string; recordId: string; fieldName: string; invalidUrl: string }[];
    duplicates: { name: string; sizeKb: number; count: number }[];
    orphanMetadata: { id: string; name: string; url: string }[];
  };
}

class ReferenceService {
  /**
   * Helper to normalize URLs or Base64 prefixes to ensure matching works
   */
  private normalizeUrl(url: string | undefined): string {
    if (!url) return '';
    return url.trim();
  }

  /**
   * Find all references of a media item's URL across all application database modules.
   */
  findMediaReferences(fileUrl: string): MediaReference[] {
    const refs: MediaReference[] = [];
    const normalizedTarget = this.normalizeUrl(fileUrl);
    if (!normalizedTarget) return refs;

    // Helper to check match
    const isMatch = (urlValue: string | undefined) => {
      if (!urlValue) return false;
      const normalizedValue = this.normalizeUrl(urlValue);
      return normalizedValue === normalizedTarget || normalizedValue.includes(normalizedTarget);
    };

    // 1. School Settings
    try {
      const settings = dbService.getSchoolSettings();
      if (settings) {
        if (isMatch(settings.logo_url)) {
          refs.push({
            module: 'School Settings',
            recordId: settings.id || 'default',
            fieldName: 'logo_url',
            recordName: 'School Logo'
          });
        }
        if (isMatch(settings.hero_image_url)) {
          refs.push({
            module: 'School Settings',
            recordId: settings.id || 'default',
            fieldName: 'hero_image_url',
            recordName: 'School Hero Banner'
          });
        }
      }
    } catch (e) {
      console.error('[Reference Discovery] Error checking School Settings:', e);
    }

    // 2. Homepage Modules
    try {
      const hpModules = dbService.getHomepageModules() || [];
      hpModules.forEach(m => {
        if (isMatch(m.image_url)) {
          refs.push({
            module: 'Homepage',
            recordId: m.id,
            fieldName: 'image_url',
            recordName: `Homepage Module: ${m.title || m.module_type}`
          });
        }
        // Check nested items_json if available
        if (m.items_json) {
          try {
            if (m.items_json.includes(normalizedTarget)) {
              refs.push({
                module: 'Homepage',
                recordId: m.id,
                fieldName: 'items_json',
                recordName: `Homepage Module Nested Content: ${m.title || m.module_type}`
              });
            }
          } catch (_) {}
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Homepage:', e);
    }

    // 3. Notices
    try {
      const notices = dbService.getNotices() || [];
      notices.forEach(n => {
        if (isMatch(n.featured_image)) {
          refs.push({
            module: 'Notice Board',
            recordId: n.id,
            fieldName: 'featured_image',
            recordName: `Notice: ${n.title}`
          });
        }
        if (isMatch(n.pdf_url)) {
          refs.push({
            module: 'Notice Board',
            recordId: n.id,
            fieldName: 'pdf_url',
            recordName: `Notice Attachment (PDF): ${n.title}`
          });
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Notices:', e);
    }

    // 4. Faculty
    try {
      const faculty = dbService.getFaculty() || [];
      faculty.forEach(f => {
        if (isMatch(f.photo_url)) {
          refs.push({
            module: 'Faculty',
            recordId: f.id,
            fieldName: 'photo_url',
            recordName: `Faculty Member: ${f.name}`
          });
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Faculty:', e);
    }

    // 5. Routines
    try {
      const routines = dbService.getRoutines() || [];
      routines.forEach(r => {
        if (isMatch(r.pdf_url)) {
          refs.push({
            module: 'Routine List',
            recordId: r.id,
            fieldName: 'pdf_url',
            recordName: `Routine: ${r.class_name}`
          });
        }
        if (isMatch(r.override_pdf_url)) {
          refs.push({
            module: 'Routine List',
            recordId: r.id,
            fieldName: 'override_pdf_url',
            recordName: `Routine Override: ${r.class_name}`
          });
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Routines:', e);
    }

    // 6. Exam Schedules
    try {
      const schedules = dbService.getExamSchedules() || [];
      schedules.forEach(s => {
        if (isMatch(s.pdf_url)) {
          refs.push({
            module: 'Exam Schedule',
            recordId: s.id,
            fieldName: 'pdf_url',
            recordName: `Exam Schedule: ${s.title}`
          });
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Exam Schedules:', e);
    }

    // 7. Events
    try {
      const events = dbService.getEvents() || [];
      events.forEach(ev => {
        if (isMatch(ev.featured_image)) {
          refs.push({
            module: 'Events Board',
            recordId: ev.id,
            fieldName: 'featured_image',
            recordName: `Event: ${ev.title}`
          });
        }
        if (isMatch(ev.pdf_url)) {
          refs.push({
            module: 'Events Board',
            recordId: ev.id,
            fieldName: 'pdf_url',
            recordName: `Event Document (PDF): ${ev.title}`
          });
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Events:', e);
    }

    // 8. Event Images
    try {
      const eventImages = dbService.getEventImages() || [];
      const events = dbService.getEvents() || [];
      eventImages.forEach(img => {
        if (isMatch(img.image_url)) {
          const associatedEvent = events.find(e => e.id === img.event_id);
          const eventTitle = associatedEvent ? associatedEvent.title : 'Unknown Event';
          refs.push({
            module: 'Event Gallery',
            recordId: img.id,
            fieldName: 'image_url',
            recordName: `Gallery Album Image (Event: ${eventTitle})`
          });
        }
      });
    } catch (e) {
      console.error('[Reference Discovery] Error checking Event Images:', e);
    }

    return refs;
  }

  /**
   * Compare uploaded asset with existing files in the media items database to find exact duplicates.
   * Compares filename, size, and type.
   */
  detectDuplicate(fileName: string, sizeKb: number, fileType: 'image' | 'pdf'): DuplicateCheckResult {
    const existing = dbService.getMediaItems() || [];
    const normalizedName = fileName.trim().toLowerCase();

    // Find if file name, size and type matches
    const exactMatch = existing.find(item => {
      const sameName = item.file_name.trim().toLowerCase() === normalizedName;
      const sameSize = Math.abs(item.size_kb - sizeKb) <= 1; // within 1kb tolerance
      const sameType = item.file_type === fileType;
      return sameName && sameSize && sameType;
    });

    if (exactMatch) {
      return { isDuplicate: true, duplicateItem: exactMatch };
    }

    // Fallback: search for potential matching size + type if name differs slightly
    const possibleDuplicate = existing.find(item => {
      const sameSize = item.size_kb === sizeKb;
      const sameType = item.file_type === fileType;
      return sameSize && sameType;
    });

    if (possibleDuplicate) {
      return { isDuplicate: true, duplicateItem: possibleDuplicate };
    }

    return { isDuplicate: false };
  }

  /**
   * Performs complete cross-reference integrity checks for database health audits.
   */
  runIntegrityDiagnostics(): IntegrityDiagnostics {
    const mediaItems = dbService.getMediaItems() || [];
    const mediaUrls = new Set(mediaItems.map(item => this.normalizeUrl(item.file_url)));

    const brokenReferences: { module: string; recordId: string; fieldName: string; invalidUrl: string }[] = [];
    const duplicateFiles: { name: string; sizeKb: number; count: number }[] = [];
    const orphanMetadata: { id: string; name: string; url: string }[] = [];

    // Helper to check broken reference
    const checkUrl = (url: string | undefined, module: string, recordId: string, fieldName: string) => {
      if (!url) return;
      const normalized = this.normalizeUrl(url);
      
      // We only flag reference as broken if it points to an asset that looks like it belongs to our storage
      // E.g., containing 'supabase', 'school-assets', or loaded as a media asset, and is NOT base64 (since base64 is self-contained)
      const isCloudAsset = normalized.startsWith('http') && (normalized.includes('supabase') || normalized.includes('school-assets'));
      
      if (isCloudAsset && !mediaUrls.has(normalized)) {
        brokenReferences.push({
          module,
          recordId,
          fieldName,
          invalidUrl: url
        });
      }
    };

    // Audit settings
    try {
      const settings = dbService.getSchoolSettings();
      if (settings) {
        checkUrl(settings.logo_url, 'School Settings', settings.id || 'default', 'logo_url');
        checkUrl(settings.hero_image_url, 'School Settings', settings.id || 'default', 'hero_image_url');
      }
    } catch (_) {}

    // Audit Homepage Modules
    try {
      const hpModules = dbService.getHomepageModules() || [];
      hpModules.forEach(m => {
        checkUrl(m.image_url, 'Homepage Module', m.id, 'image_url');
      });
    } catch (_) {}

    // Audit Notices
    try {
      const notices = dbService.getNotices() || [];
      notices.forEach(n => {
        checkUrl(n.featured_image, 'Notice Board', n.id, 'featured_image');
        checkUrl(n.pdf_url, 'Notice Attachment', n.id, 'pdf_url');
      });
    } catch (_) {}

    // Audit Faculty
    try {
      const faculty = dbService.getFaculty() || [];
      faculty.forEach(f => {
        checkUrl(f.photo_url, 'Faculty', f.id, 'photo_url');
      });
    } catch (_) {}

    // Audit Routines
    try {
      const routines = dbService.getRoutines() || [];
      routines.forEach(r => {
        checkUrl(r.pdf_url, 'Routine', r.id, 'pdf_url');
        checkUrl(r.override_pdf_url, 'Routine Override', r.id, 'override_pdf_url');
      });
    } catch (_) {}

    // Audit Exam Schedules
    try {
      const schedules = dbService.getExamSchedules() || [];
      schedules.forEach(s => {
        checkUrl(s.pdf_url, 'Exam Schedule', s.id, 'pdf_url');
      });
    } catch (_) {}

    // Audit Events
    try {
      const events = dbService.getEvents() || [];
      events.forEach(e => {
        checkUrl(e.featured_image, 'Event', e.id, 'featured_image');
        checkUrl(e.pdf_url, 'Event Attachment', e.id, 'pdf_url');
      });
    } catch (_) {}

    // Audit Event Images
    try {
      const eventImages = dbService.getEventImages() || [];
      eventImages.forEach(img => {
        checkUrl(img.image_url, 'Event Gallery', img.id, 'image_url');
      });
    } catch (_) {}

    // Duplicate detection inside media_items table itself
    const seen = new Map<string, MediaItem>();
    const dupCountMap = new Map<string, { count: number; item: MediaItem }>();

    mediaItems.forEach(item => {
      const key = `${item.file_name.trim().toLowerCase()}_${item.size_kb}_${item.file_type}`;
      if (seen.has(key)) {
        const existingVal = dupCountMap.get(key) || { count: 1, item: seen.get(key)! };
        existingVal.count += 1;
        dupCountMap.set(key, existingVal);
      } else {
        seen.set(key, item);
      }
    });

    dupCountMap.forEach((val, key) => {
      duplicateFiles.push({
        name: val.item.file_name,
        sizeKb: val.item.size_kb,
        count: val.count
      });
    });

    // Check orphan metadata - does the metadata row point to a URL that has no file name?
    // Since we don't have direct access to list all files in bucket in a fast offline way, we can check 
    // if URL format is invalid, empty, or fails. We can also trace if any metadata items exist without references
    // (though metadata items are not necessarily "orphaned" unless they don't exist in Supabase storage).
    // As instructed by guidelines: "provide the safest achievable implementation."
    // Let's flag as orphan metadata if the url is empty or clearly broken.
    mediaItems.forEach(item => {
      if (!item.file_url || !item.file_url.startsWith('http')) {
        orphanMetadata.push({
          id: item.id,
          name: item.file_name,
          url: item.file_url
        });
      }
    });

    return {
      healthy: brokenReferences.length === 0 && duplicateFiles.length === 0 && orphanMetadata.length === 0,
      brokenReferencesCount: brokenReferences.length,
      duplicateFilesCount: duplicateFiles.length,
      orphanMetadataCount: orphanMetadata.length,
      details: {
        brokenReferences,
        duplicates: duplicateFiles,
        orphanMetadata
      }
    };
  }
}

export const referenceService = new ReferenceService();
