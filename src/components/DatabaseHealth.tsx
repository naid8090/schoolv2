/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Layers, 
  Calendar, 
  GraduationCap, 
  Clock, 
  ShieldCheck, 
  HelpCircle, 
  Activity,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  FileText
} from 'lucide-react';
import { dbService } from '../services/db';
import { supabaseDbService } from '../services/supabaseDb';
import { databaseSeeder } from '../services/databaseSeeder';
import { referenceService, IntegrityDiagnostics } from '../services/referenceService';
import { supabase, traceAuth, normalizeRoutines } from '../services/supabase';

interface ModuleHealthData {
  id: string;
  name: string;
  description: string;
  localCount: number;
  remoteCount: number | null;
  status: 'Healthy' | 'Needs Seeding' | 'Local Only' | 'Out of Sync' | 'Error';
  loading: boolean;
  errorMsg?: string;
  isDefault: boolean;
  icon: React.ReactNode;
  seedable?: boolean;
}

function isDeeplyInSync(local: any[], remote: any[]): boolean {
  if (local.length !== remote.length) return false;
  
  const remoteMap = new Map<string, any>();
  remote.forEach(item => {
    if (item && item.id) {
      remoteMap.set(item.id, item);
    }
  });

  for (const localItem of local) {
    if (!localItem) continue;
    
    // For arrays without id field (e.g. single config objects or custom arrays)
    if (!localItem.id) {
      // Direct comparison with corresponding index or keys
      const remoteItem = remote.find(r => r && !r.id);
      if (!remoteItem) return false;
      const lKeys = Object.keys(localItem).sort();
      for (const k of lKeys) {
        if (k === 'updated_at' || k === 'created_at') continue;
        if (JSON.stringify(localItem[k]) !== JSON.stringify(remoteItem[k])) {
          return false;
        }
      }
      continue;
    }

    const remoteItem = remoteMap.get(localItem.id);
    if (!remoteItem) return false;

    if (localItem.updated_at && remoteItem.updated_at) {
      if (localItem.updated_at !== remoteItem.updated_at) {
        return false;
      }
    } else {
      const lKeys = Object.keys(localItem).sort();
      for (const k of lKeys) {
        if (k === 'updated_at' || k === 'created_at') continue;
        if (JSON.stringify(localItem[k]) !== JSON.stringify(remoteItem[k])) {
          return false;
        }
      }
    }
  }

  return true;
}

export const DatabaseHealth: React.FC = () => {
  const [healthModules, setHealthModules] = useState<ModuleHealthData[]>([
    {
      id: 'school_settings',
      name: 'School Settings',
      description: 'Global school profile name, motto, logo, and core contact parameters.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <Settings className="w-4 h-4 text-orange-500" />
    },
    {
      id: 'homepage_modules',
      name: 'Homepage',
      description: 'Configurable layouts, statistics grids, and dynamic frontpage banners.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <Layers className="w-4 h-4 text-emerald-500" />
    },
    {
      id: 'notices',
      name: 'Notices',
      description: 'Government compliance announcements, student circulars, and file attachments.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <Calendar className="w-4 h-4 text-pink-500" />
    },
    {
      id: 'faculty',
      name: 'Faculty',
      description: 'Teachers directory records, subject specializations, qualifications, and bios.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <GraduationCap className="w-4 h-4 text-purple-500" />
    },
    {
      id: 'events',
      name: 'Events',
      description: 'Primary campus events, descriptions, timing, and featured cover assets.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <Calendar className="w-4 h-4 text-orange-600" />
    },
    {
      id: 'event_images',
      name: 'Event Images',
      description: 'Photo gallery mappings belonging to specific compiled school events.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <ImageIcon className="w-4 h-4 text-teal-500" />
    },
    {
      id: 'media_library',
      name: 'Media Library',
      description: 'Ingested file assets, documents, pdf downloads, and image gallery files.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <ImageIcon className="w-4 h-4 text-amber-600" />
    },
    {
      id: 'timetable_groups',
      name: 'Timetable Group Registry',
      description: 'The registry defining all active timetable classes, streams, and sections.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <Layers className="w-4 h-4 text-purple-500" />,
      seedable: true
    },
    {
      id: 'routines',
      name: 'Class Routines',
      description: 'Parent class timetable grids mapping classes to weekly subject layouts.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      seedable: true
    },
    {
      id: 'routine_entries',
      name: 'Routine Entries',
      description: 'Specific individual subject slots mapped to days, periods, and teachers.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <Layers className="w-4 h-4 text-indigo-500" />,
      seedable: true
    },
    {
      id: 'period_masters',
      name: 'Period Masters',
      description: 'Administrative bell timings, periods schedule definitions, and constraints.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: true,
      icon: <Clock className="w-4 h-4 text-sky-500" />
    },
    {
      id: 'exam_schedules',
      name: 'Exam Schedules',
      description: 'Term exam schedules, titles, and publishing/active parameters.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <Layers className="w-4 h-4 text-sky-600" />
    },
    {
      id: 'exam_entries',
      name: 'Exam Entries',
      description: 'Exam slot entries mapping exam schedules to dates, times, and subjects.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <Calendar className="w-4 h-4 text-violet-500" />
    },
    {
      id: 'calendar_events',
      name: 'Academic Calendar',
      description: 'Academic calendar slots, holidays, exam dates, and student schedules.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <Calendar className="w-4 h-4 text-emerald-600" />
    }
  ]);

  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const isExecutingRef = useRef(false);
  const [seedingId, setSeedingId] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [integrityResults, setIntegrityResults] = useState<IntegrityDiagnostics | null>(null);



  const getSeedButtonProps = (m: ModuleHealthData) => {
    // 1. If currently seeding this specific module
    if (seedingId === m.id) {
      return {
        label: 'SEEDING...',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-amber-100 text-amber-700 border-amber-200 cursor-wait select-none'
      };
    }

    // 2. If any module is currently seeding, disable all other seed buttons
    if (seedingId !== null) {
      return {
        label: 'SEED',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50'
      };
    }

    // 3. If the module itself is currently loading diagnostics
    if (m.loading) {
      return {
        label: 'SEED',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50'
      };
    }

    const local = m.localCount;
    const cloud = m.remoteCount;
    const status = m.status;

    // 4. Error state
    if (status === 'Error' || cloud === null) {
      return {
        label: 'UNAVAILABLE',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50'
      };
    }

    // 5. Healthy & Synced: Local > 0 and Cloud == Local
    if (status === 'Healthy' && local > 0 && cloud === local) {
      return {
        label: 'ALREADY SEEDED',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed select-none'
      };
    }

    // 6. Empty: Cloud == 0 and Local == 0
    if (cloud === 0 && local === 0) {
      return {
        label: 'EMPTY',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none'
      };
    }

    // 7. Needs Seeding: Cloud == 0 and Local > 0
    if ((status === 'Needs Seeding' || status === 'Local Only') && cloud === 0 && local > 0) {
      const isSeedable = !!m.seedable;
      return {
        label: 'SEED',
        disabled: !isSeedable,
        className: isSeedable
          ? 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700 cursor-pointer shadow-xs active:scale-95 transition-all'
          : 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50'
      };
    }

    // 8. Out of Sync: Cloud > 0 and Cloud != Local
    if (status === 'Out of Sync') {
      return {
        label: 'OUT OF SYNC',
        disabled: true,
        className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed select-none'
      };
    }

    // Fallback/Default
    return {
      label: 'SEED',
      disabled: true,
      className: 'px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50'
    };
  };

  const runDatabaseDiagnostics = async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setIsLoadingAll(true);
    
    // Mark all as loading initially
    setHealthModules(prev => prev.map(m => ({ ...m, loading: true, errorMsg: undefined })));

    const updatedModules = await Promise.all(
      healthModules.map(async (m) => {
        let localCount = 0;
        let remoteCount: number | null = null;
        let status: 'Healthy' | 'Needs Seeding' | 'Local Only' | 'Out of Sync' | 'Error' = 'Healthy';
        let errorMsg: string | undefined = undefined;

        let localItems: any[] = [];
        let remoteItems: any[] = [];

        // Retrieve local count and items
        try {
          switch (m.id) {
            case 'school_settings': {
              const settings = dbService.getSchoolSettings();
              localItems = settings ? [settings] : [];
              break;
            }
            case 'homepage_modules':
              localItems = dbService.getHomepageModules();
              break;
            case 'notices':
              localItems = dbService.getNotices();
              break;
            case 'faculty':
              localItems = dbService.getFaculty();
              break;
            case 'events':
              localItems = dbService.getEvents() || [];
              break;
            case 'event_images':
              localItems = dbService.getEventImages() || [];
              break;
            case 'period_masters':
              localItems = dbService.getPeriodMasters();
              break;
            case 'calendar_events':
              localItems = dbService.getCalendarEvents();
              break;
            case 'timetable_groups':
              localItems = dbService.getTimetableGroups();
              break;
            case 'routines':
              localItems = dbService.getRoutines();
              break;
            case 'routine_entries':
              localItems = dbService.getRoutineEntries();
              break;
            case 'exam_schedules':
              localItems = dbService.getExamSchedules();
              break;
            case 'exam_entries':
              localItems = dbService.getExamEntries();
              break;
            case 'media_library':
              localItems = dbService.getMediaItems();
              break;
          }
          localCount = localItems.length;
        } catch (err: any) {
          console.error(`Local read error for ${m.id}:`, err);
          localCount = 0;
          localItems = [];
        }

        // Retrieve remote count and items
        try {
          switch (m.id) {
            case 'school_settings': {
              const res = await supabaseDbService.getSchoolSettings();
              remoteItems = res ? [res] : [];
              break;
            }
            case 'homepage_modules': {
              const res = await supabaseDbService.getHomepageModules();
              remoteItems = res || [];
              break;
            }
            case 'notices': {
              const res = await supabaseDbService.getNotices();
              remoteItems = res || [];
              break;
            }
            case 'faculty': {
              const res = await supabaseDbService.getFaculty();
              remoteItems = res || [];
              break;
            }
            case 'events': {
              const res = await supabaseDbService.getEvents();
              remoteItems = res || [];
              break;
            }
            case 'event_images': {
              const res = await supabaseDbService.getEventImages();
              remoteItems = res || [];
              break;
            }
            case 'period_masters': {
              const res = await supabaseDbService.getPeriodMasters();
              remoteItems = res || [];
              break;
            }
            case 'calendar_events': {
              const res = await supabaseDbService.getCalendarEvents();
              remoteItems = res || [];
              break;
            }
            case 'timetable_groups': {
              const res = await supabaseDbService.getTimetableGroups();
              remoteItems = res || [];
              break;
            }
            case 'routines': {
              const res = await supabaseDbService.getRoutines();
              remoteItems = res || [];
              break;
            }
            case 'routine_entries': {
              const res = await supabaseDbService.getRoutineEntries();
              remoteItems = res || [];
              break;
            }
            case 'exam_schedules': {
              const res = await supabaseDbService.getExamSchedules();
              remoteItems = res || [];
              break;
            }
            case 'exam_entries': {
              const res = await supabaseDbService.getExamEntries();
              remoteItems = res || [];
              break;
            }
            case 'media_library': {
              const res = await supabaseDbService.getMediaItems();
              remoteItems = res || [];
              break;
            }
          }
          remoteCount = remoteItems.length;
        } catch (err: any) {
          console.error(`Remote read error for ${m.id}:`, err);
          remoteCount = null;
          remoteItems = [];
          errorMsg = err.message || 'Supabase Connection Error';
        }

        // Compute Status using deep comparison
        if (remoteCount === null) {
          status = 'Error';
        } else if (remoteCount === 0 && localCount > 0) {
          status = m.isDefault ? 'Needs Seeding' : 'Local Only';
        } else if (!isDeeplyInSync(localItems, remoteItems)) {
          status = 'Out of Sync';
        } else {
          status = 'Healthy';
        }

        if (m.id === 'exam_schedules') {
          console.log(`[DB HEALTH EXAM SCHEDULE] Local Count: ${localCount} Remote Count: ${remoteCount} Status: ${status}`);
        } else if (m.id === 'exam_entries') {
          console.log(`[DB HEALTH EXAM ENTRY] Local Count: ${localCount} Remote Count: ${remoteCount} Status: ${status}`);
        }

        return {
          ...m,
          localCount,
          remoteCount,
          status,
          loading: false,
          errorMsg
        };
      })
    );

    setHealthModules(updatedModules);
    
    try {
      const integrity = referenceService.runIntegrityDiagnostics();
      setIntegrityResults(integrity);
    } catch (e) {
      console.error('[DB HEALTH] Media integrity diagnostics run failed:', e);
    } finally {
      setIsLoadingAll(false);
      isExecutingRef.current = false;
    }
  };

  const refreshModule = async (moduleId: string) => {
    // Find metadata config
    const targetModule = healthModules.find(m => m.id === moduleId);
    if (!targetModule) return;

    // Set specific module row to loading state
    setHealthModules(prev => prev.map(m => m.id === moduleId ? { ...m, loading: true, errorMsg: undefined } : m));

    try {
      let localCount = 0;
      let remoteCount: number | null = null;
      let status: 'Healthy' | 'Needs Seeding' | 'Local Only' | 'Out of Sync' | 'Error' = 'Healthy';
      let errorMsg: string | undefined = undefined;

      // 1. Local count read
      try {
        switch (moduleId) {
          case 'school_settings':
            localCount = dbService.getSchoolSettings() ? 1 : 0;
            break;
          case 'homepage_modules':
            localCount = dbService.getHomepageModules().length;
            break;
          case 'notices':
            localCount = dbService.getNotices().length;
            break;
          case 'faculty':
            localCount = dbService.getFaculty().length;
            break;
          case 'events':
            localCount = (dbService.getEvents() || []).length;
            break;
          case 'event_images':
            localCount = (dbService.getEventImages() || []).length;
            break;
          case 'period_masters':
            localCount = dbService.getPeriodMasters().length;
            break;
          case 'calendar_events':
            localCount = dbService.getCalendarEvents().length;
            break;
          case 'timetable_groups':
            localCount = dbService.getTimetableGroups().length;
            break;
          case 'routines':
            localCount = dbService.getRoutines().length;
            break;
          case 'routine_entries':
            localCount = dbService.getRoutineEntries().length;
            break;
          case 'exam_schedules':
            localCount = dbService.getExamSchedules().length;
            break;
          case 'exam_entries':
            localCount = dbService.getExamEntries().length;
            break;
          case 'media_library':
            localCount = dbService.getMediaItems().length;
            break;
        }
      } catch (err: any) {
        localCount = 0;
      }

      // 2. Remote count read
      try {
        switch (moduleId) {
          case 'school_settings': {
            const res = await supabaseDbService.getSchoolSettings();
            remoteCount = res ? 1 : 0;
            break;
          }
          case 'homepage_modules': {
            const res = await supabaseDbService.getHomepageModules();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'notices': {
            const res = await supabaseDbService.getNotices();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'faculty': {
            const res = await supabaseDbService.getFaculty();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'events': {
            const res = await supabaseDbService.getEvents();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'event_images': {
            const res = await supabaseDbService.getEventImages();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'period_masters': {
            const res = await supabaseDbService.getPeriodMasters();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'calendar_events': {
            const res = await supabaseDbService.getCalendarEvents();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'timetable_groups': {
            const res = await supabaseDbService.getTimetableGroups();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'routines': {
            const res = await supabaseDbService.getRoutines();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'routine_entries': {
            const res = await supabaseDbService.getRoutineEntries();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'exam_schedules': {
            const res = await supabaseDbService.getExamSchedules();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'exam_entries': {
            const res = await supabaseDbService.getExamEntries();
            remoteCount = res ? res.length : 0;
            break;
          }
          case 'media_library': {
            const res = await supabaseDbService.getMediaItems();
            remoteCount = res ? res.length : 0;
            break;
          }
        }
      } catch (err: any) {
        remoteCount = null;
        errorMsg = err.message || 'Supabase Connection Error';
      }

      // 3. Compute status
      if (remoteCount === null) {
        status = 'Error';
      } else if (remoteCount === 0 && localCount > 0) {
        status = targetModule.isDefault ? 'Needs Seeding' : 'Local Only';
      } else if (remoteCount !== localCount) {
        status = 'Out of Sync';
      } else {
        status = 'Healthy';
      }

      if (moduleId === 'exam_schedules') {
        console.log(`[DB HEALTH EXAM SCHEDULE] Local Count: ${localCount} Remote Count: ${remoteCount} Status: ${status}`);
      } else if (moduleId === 'exam_entries') {
        console.log(`[DB HEALTH EXAM ENTRY] Local Count: ${localCount} Remote Count: ${remoteCount} Status: ${status}`);
      }

      setHealthModules(prev => prev.map(m => m.id === moduleId ? {
        ...m,
        localCount,
        remoteCount,
        status,
        loading: false,
        errorMsg
      } : m));

    } catch (err: any) {
      console.error(`Error refreshing health state for ${moduleId}:`, err);
    }
  };

  const handleSeed = async (moduleId: string) => {
    const targetModule = healthModules.find(m => m.id === moduleId);
    if (!targetModule || !targetModule.seedable) return;

    // Prevent duplicate seeding: check if remote already contains records
    if (targetModule.remoteCount && targetModule.remoteCount > 0) {
      setOperationResult({
        success: false,
        message: `Already Seeded: Remote table already contains ${targetModule.remoteCount} record(s). No new rows inserted.`
      });
      return;
    }

    setSeedingId(moduleId);
    setOperationResult(null);

    try {
      const result = moduleId === 'routines'
        ? await databaseSeeder.seedRoutines()
        : await databaseSeeder.seedRoutineEntries();
      setOperationResult({
        success: result.success,
        message: result.message
      });
      // Refresh database diagnostics immediately after success to update all badges, buttons, and counts
      await runDatabaseDiagnostics();
      
      if (result.success) {
        window.dispatchEvent(new CustomEvent('gsss-data-synced'));
      }
    } catch (err: any) {
      setOperationResult({
        success: false,
        message: err.message || 'An unexpected error occurred during seeding.'
      });
    } finally {
      setSeedingId(null);
    }
  };

  const handleRepair = async (moduleId: string) => {
    // Set specific module row to loading state
    setHealthModules(prev => prev.map(m => m.id === moduleId ? { ...m, loading: true, errorMsg: undefined } : m));
    setOperationResult(null);

    const performNonDestructiveMerge = async (
      localItems: any[],
      remoteItems: any[],
      saveLocalFn: (items: any[], localOnly: boolean) => Promise<void> | void,
      tableName: string
    ) => {
      const mergedMap = new Map<string, any>();

      // Add remote first
      remoteItems.forEach(item => {
        if (item && item.id) {
          mergedMap.set(item.id, item);
        }
      });

      // Merge local
      localItems.forEach(localItem => {
        if (!localItem || !localItem.id) return;
        const remoteItem = mergedMap.get(localItem.id);
        if (!remoteItem) {
          mergedMap.set(localItem.id, localItem);
        } else {
          const localTime = localItem.updated_at ? new Date(localItem.updated_at).getTime() : 0;
          const remoteTime = remoteItem.updated_at ? new Date(remoteItem.updated_at).getTime() : 0;

          if (localTime > remoteTime) {
            mergedMap.set(localItem.id, localItem);
          } else {
            const mergedItem = { ...remoteItem };
            // Preserve shared_lecture_id if local has it and remote doesn't
            if (localItem.shared_lecture_id && !remoteItem.shared_lecture_id) {
              mergedItem.shared_lecture_id = localItem.shared_lecture_id;
            }
            mergedMap.set(localItem.id, mergedItem);
          }
        }
      });

      const mergedList = Array.from(mergedMap.values());

      // 1. Save to local cache
      await saveLocalFn(mergedList, true);

      // 2. Save to cloud database
      await traceAuth(tableName);
      const payload = tableName === 'routines' ? normalizeRoutines(mergedList) : mergedList;
      const { error } = await supabase
        .from(tableName)
        .upsert(payload);

      if (error) {
        console.error(`[Non-Destructive Repair Error] Failed to upsert to ${tableName}:`, error.message);
        throw error;
      }
    };

    try {
      let repairSuccess = false;
      let msg = '';

      switch (moduleId) {
        case 'school_settings': {
          const remote = await supabaseDbService.getSchoolSettings();
          const local = dbService.getSchoolSettings();
          if (remote && local) {
            const remoteTime = (remote as any).updated_at ? new Date((remote as any).updated_at).getTime() : 0;
            const localTime = (local as any).updated_at ? new Date((local as any).updated_at).getTime() : 0;
            const merged = localTime > remoteTime ? local : remote;
            await dbService.saveSchoolSettings(merged, true);
            await traceAuth('school_settings');
            const { error } = await supabase
              .from('school_settings')
              .upsert(merged);
            if (error) throw error;
            repairSuccess = true;
            msg = 'School settings non-destructively merged and synchronized successfully.';
          } else {
            const finalSettings = remote || local;
            if (finalSettings) {
              await dbService.saveSchoolSettings(finalSettings, true);
              await traceAuth('school_settings');
              const { error } = await supabase
                .from('school_settings')
                .upsert(finalSettings);
              if (error) throw error;
              repairSuccess = true;
              msg = 'School settings synchronized successfully.';
            }
          }
          break;
        }
        case 'homepage_modules': {
          const remote = await supabaseDbService.getHomepageModules() || [];
          const local = dbService.getHomepageModules();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveHomepageModules(items, true), 'homepage_modules');
          repairSuccess = true;
          msg = 'Homepage configurations successfully merged and synchronized.';
          break;
        }
        case 'notices': {
          const remote = await supabaseDbService.getNotices() || [];
          const local = dbService.getNotices();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveNotices(items, true), 'notices');
          repairSuccess = true;
          msg = 'Notices archive successfully merged and synchronized.';
          break;
        }
        case 'faculty': {
          const remote = await supabaseDbService.getFaculty() || [];
          const local = dbService.getFaculty();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveFaculty(items, true), 'faculty');
          repairSuccess = true;
          msg = 'Faculty roster successfully merged and synchronized.';
          break;
        }
        case 'events': {
          const remote = await supabaseDbService.getEvents() || [];
          const local = dbService.getEvents() || [];
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveEvents(items, true), 'events');
          repairSuccess = true;
          msg = 'Events Board successfully merged and synchronized.';
          break;
        }
        case 'event_images': {
          const remote = await supabaseDbService.getEventImages() || [];
          const local = dbService.getEventImages() || [];
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveEventImages(items, true), 'event_images');
          repairSuccess = true;
          msg = 'Event photo gallery mapping successfully merged and synchronized.';
          break;
        }
        case 'period_masters': {
          const remote = await supabaseDbService.getPeriodMasters() || [];
          const local = dbService.getPeriodMasters();
          await performNonDestructiveMerge(local, remote, (items) => dbService.savePeriodMasters(items, true), 'period_masters');
          repairSuccess = true;
          msg = 'Period Masters bell timings successfully merged and synchronized.';
          break;
        }
        case 'calendar_events': {
          const remote = await supabaseDbService.getCalendarEvents() || [];
          const local = dbService.getCalendarEvents();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveCalendarEvents(items, true), 'calendar_events');
          repairSuccess = true;
          msg = 'Academic Calendar slots successfully merged and synchronized.';
          break;
        }
        case 'timetable_groups': {
          const remote = await supabaseDbService.getTimetableGroups() || [];
          const local = dbService.getTimetableGroups();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveTimetableGroups(items, true), 'timetable_groups');
          repairSuccess = true;
          msg = 'Timetable Group Registry successfully merged and synchronized.';
          break;
        }
        case 'routines': {
          const remote = await supabaseDbService.getRoutines() || [];
          const local = dbService.getRoutines();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveRoutines(items, true), 'routines');
          repairSuccess = true;
          msg = 'Class Routines successfully merged and synchronized.';
          break;
        }
        case 'routine_entries': {
          const remote = await supabaseDbService.getRoutineEntries() || [];
          const local = dbService.getRoutineEntries();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveRoutineEntries(items, true), 'routine_entries');
          repairSuccess = true;
          msg = 'Timetable entries successfully merged and synchronized, preserving shared lectures.';
          break;
        }
        case 'exam_schedules': {
          const remote = await supabaseDbService.getExamSchedules() || [];
          const local = dbService.getExamSchedules();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveExamSchedules(items, true), 'exam_schedules');
          repairSuccess = true;
          msg = 'Exam schedules successfully merged and synchronized.';
          break;
        }
        case 'exam_entries': {
          const remote = await supabaseDbService.getExamEntries() || [];
          const local = dbService.getExamEntries();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveExamEntries(items, true), 'exam_entries');
          repairSuccess = true;
          msg = 'Exam slot entries successfully merged and synchronized.';
          break;
        }
        case 'media_library': {
          const remote = await supabaseDbService.getMediaItems() || [];
          const local = dbService.getMediaItems();
          await performNonDestructiveMerge(local, remote, (items) => dbService.saveMediaItems(items, true), 'media_library');
          repairSuccess = true;
          msg = 'Media library mapping successfully merged and synchronized.';
          break;
        }
      }

      if (repairSuccess) {
        setOperationResult({
          success: true,
          message: msg || `Operational register synchronized and aligned successfully.`
        });
        window.dispatchEvent(new CustomEvent('gsss-data-synced'));
      } else {
        setOperationResult({
          success: false,
          message: `No remote cloud records found to pull into local system cache.`
        });
      }

      // Re-run diagnostics
      await runDatabaseDiagnostics();

    } catch (err: any) {
      setOperationResult({
        success: false,
        message: `Alignment failed: ${err.message || err}`
      });
      // Re-run diagnostics to clear loading states
      await runDatabaseDiagnostics();
    }
  };

  useEffect(() => {
    runDatabaseDiagnostics();
  }, []);

  // Compute overall summary stats
  const totalModules = healthModules.length;
  const healthyCount = healthModules.filter(m => m.status === 'Healthy').length;
  const needsSeedingCount = healthModules.filter(m => m.status === 'Needs Seeding').length;
  const localOnlyCount = healthModules.filter(m => m.status === 'Local Only').length;
  const outOfSyncCount = healthModules.filter(m => m.status === 'Out of Sync').length;
  const errorCount = healthModules.filter(m => m.status === 'Error').length;

  const getStatusBadgeStyle = (status: ModuleHealthData['status']) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Needs Seeding':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Local Only':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Out of Sync':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Error':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status: ModuleHealthData['status']) => {
    switch (status) {
      case 'Healthy':
        return <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />;
      case 'Needs Seeding':
        return <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />;
      case 'Local Only':
        return <Activity className="w-3.5 h-3.5 mr-1 text-sky-500" />;
      case 'Out of Sync':
        return <RefreshCw className="w-3.5 h-3.5 mr-1 text-indigo-500 animate-spin-slow" />;
      case 'Error':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-500" />;
      default:
        return null;
    }
  };

  const getSystemStatusBanner = () => {
    if (isLoadingAll) {
      return {
        title: "Scanning System Caches...",
        description: "Executing lightweight diagnostics and integrity checks on all school database tables. Please wait...",
        type: "loading",
        styles: "bg-slate-50 border-slate-200 text-slate-700",
        icon: <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
      };
    }

    if (errorCount > 0) {
      return {
        title: "Connection Error Detected",
        description: "The system is unable to connect to one or more Supabase Cloud endpoints. Please verify your network connection and configuration parameters.",
        type: "error",
        styles: "bg-rose-50 border-rose-150 text-rose-800",
        icon: <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
      };
    }

    if (outOfSyncCount > 0 || localOnlyCount > 0) {
      return {
        title: "Database Sync Recommended",
        description: "Replication discrepancies detected between local cache and cloud database. Use the 'Sync Cache' actions in the Operations Registry below to align.",
        type: "warning",
        styles: "bg-indigo-50 border-indigo-150 text-indigo-900",
        icon: <RefreshCw className="w-5 h-5 text-indigo-600" />
      };
    }

    if (needsSeedingCount > 0) {
      return {
        title: "Standard Table Seeding Recommended",
        description: "Standard system registers are currently empty in your remote database. We recommend seeding default arrays to ensure maximum operational utility.",
        type: "info",
        styles: "bg-amber-50 border-amber-150 text-amber-900",
        icon: <HelpCircle className="w-5 h-5 text-amber-600" />
      };
    }

    return {
      title: "All Registers Healthy & Fully Synchronized",
      description: "Local system caches and remote cloud tables are in 100% alignment. No administrative intervention or manual synchronization is required.",
      type: "success",
      styles: "bg-emerald-50 border-emerald-150 text-emerald-900",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    };
  };

  return (
    <div className="space-y-6" id="database-health-console">
      {/* Header Panel */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-orange-50/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-mono font-bold text-orange-600 tracking-widest block mb-1">
            System Database & Cloud Sync Health
          </span>
          <h2 className="text-slate-900 text-xl sm:text-2xl font-extrabold tracking-tight">
            Database & Cloud Synchronization Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-sans max-w-2xl font-medium">
            Verify connection integrity, check synchronisation with Supabase Cloud storage, and run safety audits on school registers.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="health-dashboard-kpis">
        {/* Total Modules */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Active Registers</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-slate-800">{totalModules}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Monitored school record types</span>
          </div>
        </div>

        {/* Healthy & Synced */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Healthy & Synchronized</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-emerald-600">{healthyCount}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium font-sans">Cloud connected & matching</span>
          </div>
        </div>

        {/* Needs Seeding */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Pending Seeding</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-amber-600">{needsSeedingCount}</span>
            <span className="text-[10px] text-amber-500 mt-0.5 block font-medium font-sans">Requires standard initial records</span>
          </div>
        </div>

        {/* Local Only / Out of Sync */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Local Differences</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-indigo-600">{localOnlyCount + outOfSyncCount}</span>
            <span className="text-[10px] text-indigo-500 mt-0.5 block font-medium font-sans">Awaiting cloud synchronisation</span>
          </div>
        </div>

        {/* Faulty / Errors */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Connection Error</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-rose-600">{errorCount}</span>
            <span className="text-[10px] text-rose-500 mt-0.5 block font-medium font-sans">Failed cloud connection</span>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      {(() => {
        const banner = getSystemStatusBanner();
        return (
          <div className={`border rounded-xl p-4 sm:p-5 flex items-start gap-4 transition-all duration-300 ${banner.styles}`} id="health-system-status-banner">
            <div className="p-2.5 rounded-xl bg-white/60 border border-white/20 shrink-0 shadow-3xs">
              {banner.icon}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm leading-none flex items-center gap-2">
                {banner.title}
                {!isLoadingAll && (
                  <span className="text-[9px] font-mono bg-white/40 px-1.5 py-0.5 rounded uppercase tracking-wider border border-black/5">
                    Live
                  </span>
                )}
              </h3>
              <p className="text-[11.5px] leading-relaxed opacity-95 text-slate-650 font-medium font-sans max-w-3xl">
                {banner.description}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Main Health Table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-slate-900 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-orange-500 rounded-sm" />
            Active Registers & Sync Audit
          </h3>
          <button
            onClick={runDatabaseDiagnostics}
            disabled={isLoadingAll}
            className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider hover:bg-slate-50 transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingAll ? 'animate-spin text-orange-500' : ''}`} />
            {isLoadingAll ? 'Refreshing Diagnostics...' : 'Re-Run Diagnostics'}
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin" id="database-health-table-scroll">
          <table className="w-full text-left border-collapse min-w-[850px]" id="database-health-data-table">
            <thead>
              <tr className="border-b border-slate-150 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-5 py-3.5 w-[280px]">Database Module</th>
                <th className="px-4 py-3.5 text-center w-[110px]">Local Cache</th>
                <th className="px-4 py-3.5 text-center w-[140px]">Cloud Supabase</th>
                <th className="px-4 py-3.5 text-center w-[140px]">Health Status</th>
                <th className="px-5 py-3.5">Operations Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {healthModules.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/40 transition-colors group">
                  {/* Module Name & Details */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-150 shrink-0 mt-0.5 group-hover:bg-white group-hover:border-slate-200 transition-colors">
                        {m.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-slate-450 text-[11px] mt-0.5 leading-relaxed max-w-xs sm:max-w-sm font-sans font-medium">
                          {m.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Local Cached Record Count */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-block px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full font-mono text-slate-700 font-bold">
                      {m.localCount}
                    </span>
                  </td>

                  {/* Remote Supabase Record Count */}
                  <td className="px-4 py-4 text-center">
                    {m.loading ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />
                      </div>
                    ) : m.remoteCount === null ? (
                      <span className="text-rose-600 font-mono font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">FAIL</span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-orange-50 border border-orange-150 rounded-full font-mono text-orange-700 font-bold">
                        {m.remoteCount}
                      </span>
                    )}
                  </td>

                  {/* Health Status Badge */}
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-4xs ${getStatusBadgeStyle(m.status)}`}>
                        {getStatusIcon(m.status)}
                        {m.status}
                      </span>
                    </div>
                  </td>

                  {/* Future Operations Desk */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold tracking-tight max-w-md">
                      {/* 1. SEED DEFAULTS (Only shown if module supports seeding defaults) */}
                      {m.seedable && (() => {
                        const btnProps = getSeedButtonProps(m);
                        return (
                          <button
                            id={`seed-btn-${m.id}`}
                            onClick={() => handleSeed(m.id)}
                            disabled={btnProps.disabled}
                            className={`${btnProps.className} !px-3 !py-2 !text-[9.5px] rounded-lg cursor-pointer flex items-center justify-center min-h-[38px]`}
                          >
                            {btnProps.label === 'SEED' ? 'SEED DEFAULTS' : btnProps.label}
                          </button>
                        );
                      })()}

                      {/* 2. SYNC REPAIR (Only shown when replication discrepancy is detected) */}
                      {(m.status === 'Out of Sync' || m.status === 'Local Only') && (
                        <button
                          id={`repair-btn-${m.id}`}
                          onClick={() => handleRepair(m.id)}
                          disabled={m.loading || seedingId !== null}
                          className="px-3 py-2 text-[9.5px] font-mono font-bold uppercase tracking-tight rounded-lg border bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:border-indigo-700 select-none cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-4xs min-h-[38px] flex items-center justify-center"
                        >
                          SYNC REPAIR
                        </button>
                      )}

                      {/* 3. REFRESH (Always present, lightweight and precise) */}
                      <button
                        id={`refresh-btn-${m.id}`}
                        onClick={() => refreshModule(m.id)}
                        disabled={m.loading || seedingId !== null}
                        className="px-3 py-2 text-[9.5px] font-mono font-bold uppercase tracking-tight rounded-lg border bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 select-none cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 shadow-4xs min-h-[38px] flex items-center justify-center"
                      >
                        {m.loading ? '...' : 'REFRESH'}
                      </button>
                    </div>
                    {m.errorMsg && (
                      <div className="text-rose-500 text-[10px] mt-1.5 font-mono max-w-xs break-words bg-rose-50 border border-rose-100 p-2 rounded-md">
                        Error: {m.errorMsg}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Media Library Integrity & Reference Audit Card */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-slate-900 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-orange-500 rounded-sm" />
            Media Assets Integrity & Reference Audit
          </h3>
          <span className={`px-3 py-1 text-[10px] font-mono font-black rounded-full uppercase tracking-wider border ${
            integrityResults?.healthy 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
          }`}>
            {integrityResults?.healthy ? 'HEALTHY / ALL REFERENCES INTACT' : 'INTEGRITY ISSUES DETECTED'}
          </span>
        </div>

        <div className="p-5">
          {/* Sub-grid of key stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Broken References</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-black ${integrityResults?.brokenReferencesCount && integrityResults.brokenReferencesCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {integrityResults?.brokenReferencesCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 font-medium ml-2">Record links to non-existent cloud media</span>
              </div>
            </div>

            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Duplicate Files</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-black ${integrityResults?.duplicateFilesCount && integrityResults.duplicateFilesCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {integrityResults?.duplicateFilesCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 font-medium ml-2">Identical files uploaded multiple times</span>
              </div>
            </div>

            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50">
              <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Orphan Metadata Rows</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-xl font-black ${integrityResults?.orphanMetadataCount && integrityResults.orphanMetadataCount > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                  {integrityResults?.orphanMetadataCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 font-medium ml-2">Database records with empty or broken URLs</span>
              </div>
            </div>
          </div>

          {/* Details sections */}
          <div className="space-y-4">
            {/* 1. Broken References List */}
            <div>
              <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Broken Reference Discovery</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">Audit View</span>
              </h4>
              {!integrityResults?.details?.brokenReferences || integrityResults.details.brokenReferences.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-50/30 border border-slate-100 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No broken references detected. All document linkages point to existing cloud media.</span>
                </div>
              ) : (
                <div className="border border-rose-150 bg-rose-50/10 rounded-xl overflow-hidden divide-y divide-rose-100">
                  {integrityResults.details.brokenReferences.map((ref: any, idx: number) => (
                    <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 font-mono rounded text-[9px] font-bold uppercase">{ref.module}</span>
                          <span>Field: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{ref.fieldName}</span></span>
                        </div>
                        <div className="text-slate-500 mt-1 font-mono text-[10px] break-all">
                          Target URI: {ref.invalidUrl}
                        </div>
                      </div>
                      <div className="text-[10px] text-rose-600 font-mono font-bold flex items-center gap-1 uppercase shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                        Broken Reference
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Duplicates List */}
            <div>
              <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Duplicate Cloud Asset Registry</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">Deduplication Desk</span>
              </h4>
              {!integrityResults?.details?.duplicates || integrityResults.details.duplicates.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-50/30 border border-slate-100 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No duplicate asset uploads found. Optimal storage density.</span>
                </div>
              ) : (
                <div className="border border-amber-150 bg-amber-50/10 rounded-xl overflow-hidden divide-y divide-amber-100">
                  {integrityResults.details.duplicates.map((dup: any, idx: number) => (
                    <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-mono rounded text-[9px] font-bold uppercase">DUPLICATE x{dup.count}</span>
                          <span className="truncate max-w-sm font-semibold">{dup.name}</span>
                        </div>
                        <div className="text-slate-500 mt-1 font-mono text-[10px]">
                          File size: {dup.sizeKb} KB
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-600 font-mono font-semibold shrink-0">
                        Optimizable: Consolidate references
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Orphan Metadata List */}
            <div>
              <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>Orphan & Broken Metadata Rows</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px]">Database Hygiene</span>
              </h4>
              {!integrityResults?.details?.orphanMetadata || integrityResults.details.orphanMetadata.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-50/30 border border-slate-100 rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>No orphan or broken metadata records discovered. Schema fully normalized.</span>
                </div>
              ) : (
                <div className="border border-indigo-150 bg-indigo-50/10 rounded-xl overflow-hidden divide-y divide-indigo-100">
                  {integrityResults.details.orphanMetadata.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono rounded text-[9px] font-bold uppercase">INVALID URI</span>
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <div className="text-rose-500 mt-1 font-mono text-[10px] break-all">
                          Stored URL: {item.url || '(empty)'}
                        </div>
                      </div>
                      <div className="text-[10px] text-indigo-600 font-mono font-bold flex items-center gap-1 uppercase shrink-0">
                        Broken Metadata
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Sticky Toast Notification */}
      {operationResult && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-slate-200 rounded-2xl p-4 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-start gap-3" id="seeder-feedback-toast">
          <div className={`p-2 rounded-xl shrink-0 ${
            operationResult.success ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
          }`}>
            {operationResult.success ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black text-slate-900 font-mono tracking-tight uppercase">
              {operationResult.success ? 'Seeding Completed' : 'Seeding Aborted'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal font-sans font-semibold">
              {operationResult.message}
            </p>
          </div>
          <button 
            onClick={() => setOperationResult(null)}
            className="text-slate-400 hover:text-slate-600 font-mono text-[9px] font-bold tracking-wider cursor-pointer ml-1 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 transition-all active:scale-95 shrink-0"
          >
            CLOSE
          </button>
        </div>
      )}
    </div>
  );
};
