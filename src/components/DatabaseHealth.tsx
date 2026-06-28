/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon
} from 'lucide-react';
import { dbService } from '../services/db';
import { supabaseDbService } from '../services/supabaseDb';
import { databaseSeeder } from '../services/databaseSeeder';

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
      name: 'Homepage Modules',
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
      id: 'calendar_events',
      name: 'Calendar Events',
      description: 'Academic calendar slots, holidays, exam dates, and student schedules.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <Calendar className="w-4 h-4 text-emerald-600" />
    },
    {
      id: 'routines',
      name: 'Routines',
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
      id: 'media_library',
      name: 'Media Library',
      description: 'Ingested file assets, documents, pdf downloads, and image gallery files.',
      localCount: 0,
      remoteCount: null,
      status: 'Healthy',
      loading: true,
      isDefault: false,
      icon: <ImageIcon className="w-4 h-4 text-amber-600" />
    }
  ]);

  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [seedingId, setSeedingId] = useState<string | null>(null);
  const [operationResult, setOperationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);



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
    setIsLoadingAll(true);
    
    // Mark all as loading initially
    setHealthModules(prev => prev.map(m => ({ ...m, loading: true, errorMsg: undefined })));

    const updatedModules = await Promise.all(
      healthModules.map(async (m) => {
        let localCount = 0;
        let remoteCount: number | null = null;
        let status: 'Healthy' | 'Needs Seeding' | 'Local Only' | 'Out of Sync' | 'Error' = 'Healthy';
        let errorMsg: string | undefined = undefined;

        // Retrieve local count
        try {
          switch (m.id) {
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
          console.error(`Local read error for ${m.id}:`, err);
          localCount = 0;
        }

        // Retrieve remote count
        try {
          switch (m.id) {
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
          console.error(`Remote read error for ${m.id}:`, err);
          remoteCount = null;
          errorMsg = err.message || 'Supabase Connection Error';
        }

        // Compute Status
        if (remoteCount === null) {
          status = 'Error';
        } else if (remoteCount === 0 && localCount > 0) {
          status = m.isDefault ? 'Needs Seeding' : 'Local Only';
        } else if (remoteCount !== localCount) {
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
    setIsLoadingAll(false);
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
        return <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
      case 'Needs Seeding':
        return <HelpCircle className="w-3.5 h-3.5 mr-1" />;
      case 'Local Only':
        return <Activity className="w-3.5 h-3.5 mr-1" />;
      case 'Out of Sync':
        return <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin-slow" />;
      case 'Error':
        return <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="database-health-console">
      {/* Header Panel */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-orange-50/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-mono font-bold text-orange-600 tracking-widest block mb-1">
            Database schema & replication audit
          </span>
          <h2 className="text-slate-900 text-xl sm:text-2xl font-extrabold tracking-tight">
            Database Health Console
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-sans max-w-2xl font-medium">
            Review live record counts, health statuses, and replication synchronization status between client-side Local Cache and Supabase Cloud Tables.
          </p>
        </div>
      </div>



      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="health-dashboard-kpis">
        {/* Total Modules */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Monitored Tables</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-slate-800">{totalModules}</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total active entities</span>
          </div>
        </div>

        {/* Healthy & Synced */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Synced & Healthy</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-emerald-600">{healthyCount}</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Replication intact</span>
          </div>
        </div>

        {/* Needs Seeding */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Needs Seeding</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-amber-600">{needsSeedingCount}</span>
            <span className="text-[10px] text-amber-500 mt-0.5 block font-medium">Ready to seed defaults</span>
          </div>
        </div>

        {/* Local Only / Out of Sync */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Unreplicated / Out of Sync</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-indigo-600">{localOnlyCount + outOfSyncCount}</span>
            <span className="text-[10px] text-indigo-500 mt-0.5 block font-medium">Local-only data found</span>
          </div>
        </div>

        {/* Faulty / Errors */}
        <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between hover:shadow-xs transition">
          <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">Faulty & Error</span>
          <div className="mt-2">
            <span className="block text-2xl font-black text-rose-600">{errorCount}</span>
            <span className="text-[10px] text-rose-500 mt-0.5 block font-medium">API queries failing</span>
          </div>
        </div>
      </div>

      {/* Main Health Table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-slate-900 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-orange-500 rounded-sm" />
            Integrity Check Registry
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="px-5 py-3">Database Module</th>
                <th className="px-5 py-3 text-center">Local Cache</th>
                <th className="px-5 py-3 text-center">Cloud Supabase</th>
                <th className="px-5 py-3 text-center">Health Status</th>
                <th className="px-5 py-3">Operations Desk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {healthModules.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Module Name & Details */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-150 shrink-0 mt-0.5">
                        {m.icon}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{m.name}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed max-w-sm">
                          {m.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Local Cached Record Count */}
                  <td className="px-5 py-4 text-center">
                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full font-mono text-slate-700 font-bold">
                      {m.localCount}
                    </span>
                  </td>

                  {/* Remote Supabase Record Count */}
                  <td className="px-5 py-4 text-center">
                    {m.loading ? (
                      <div className="flex items-center justify-center">
                        <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin shrink-0" />
                      </div>
                    ) : m.remoteCount === null ? (
                      <span className="text-rose-600 font-mono font-bold">FAIL</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full font-mono text-orange-700 font-bold">
                        {m.remoteCount}
                      </span>
                    )}
                  </td>

                  {/* Health Status Badge */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(m.status)}`}>
                        {getStatusIcon(m.status)}
                        {m.status}
                      </span>
                    </div>
                  </td>

                  {/* Future Operations Desk */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-mono font-bold tracking-wider max-w-xs">
                      {(() => {
                        const btnProps = getSeedButtonProps(m);
                        return (
                          <button
                            onClick={() => handleSeed(m.id)}
                            disabled={btnProps.disabled}
                            className={btnProps.className}
                          >
                            {btnProps.label}
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => refreshModule(m.id)}
                        disabled={m.loading || seedingId !== null}
                        className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 select-none cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                      >
                        {m.loading ? '...' : 'REFRESH'}
                      </button>

                      <button
                        disabled
                        className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50"
                      >
                        REPAIR
                      </button>

                      <button
                        disabled
                        className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed select-none opacity-50"
                      >
                        VALIDATE
                      </button>
                    </div>
                    {m.errorMsg && (
                      <div className="text-rose-500 text-[10px] mt-1.5 font-mono max-w-xs break-words">
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
