/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Download, 
  Check, 
  X,
  User,
  ExternalLink,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { dbService, generateUUID } from '../services/db';
import { Routine, RoutineEntry, PeriodMaster, ExamSchedule, ExamEntry, CalendarEvent, CalendarEventType, AcademicClass, Faculty } from '../types';
import { MediaSelectorModal } from './MediaLibrary';
import { ConsolidatedRoutineMatrix } from './ConsolidatedRoutineMatrix';
import { ResponsiveEntityCard, SharedEmptyState } from './ResponsiveEntityCard';

// Reusable date formats
const formatShortDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Top-level Time & Overlap parse helper functions
const parseTimeToMinutes = (timeStr: string): number | null => {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

  if (ampm === 'PM' && hours < 12) {
    hours += 12;
  } else if (ampm === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

const parseTimeRange = (timeRangeStr: string): { start: number; end: number } | null => {
  if (!timeRangeStr) return null;
  const parts = timeRangeStr.split(/[-–—to]/i);
  if (parts.length !== 2) return null;
  const startMin = parseTimeToMinutes(parts[0].trim());
  const endMin = parseTimeToMinutes(parts[1].trim());
  if (startMin === null || endMin === null) return null;
  return { start: startMin, end: endMin };
};

export const AcademicAdmin: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'routine' | 'exam' | 'calendar'>('routine');

  // ==========================================
  // MEDIA SELECTOR INTERFACE
  // ==========================================
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('Select Document File');
  const [onMediaSelectedCallback, setOnMediaSelectedCallback] = useState<((url: string) => void) | null>(null);

  const triggerMediaFilePicker = (title: string, onSelect: (url: string) => void) => {
    setMediaTitle(title);
    setOnMediaSelectedCallback(() => onSelect);
    setIsMediaOpen(true);
  };

  return (
    <div className="space-y-6" id="academic-desk-central">
      {/* Navigation Headers */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-slate-900 text-base sm:text-lg font-bold uppercase tracking-wide">
            Academic Desk Manager Console
          </h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed font-sans font-medium">
            Maintain daily class timings schedules, assessment circular datesheets, and student holiday calendars with BSEB guidelines.
          </p>
        </div>

        {/* Sub tab buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-150/40 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('routine')}
            className={`flex-1 md:flex-none px-4 py-2 text-[11px] font-bold font-sans tracking-wider uppercase rounded-lg transition duration-150 cursor-pointer text-center ${
              activeSubTab === 'routine'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Class Routines
          </button>
          <button
            onClick={() => setActiveSubTab('exam')}
            className={`flex-1 md:flex-none px-4 py-2 text-[11px] font-bold font-sans tracking-wider uppercase rounded-lg transition duration-150 cursor-pointer text-center ${
              activeSubTab === 'exam'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exam Schedules
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`flex-1 md:flex-none px-4 py-2 text-[11px] font-bold font-sans tracking-wider uppercase rounded-lg transition duration-150 cursor-pointer text-center ${
              activeSubTab === 'calendar'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            School Calendar
          </button>
        </div>
      </div>

      {/* Main Admin Sub workspace views */}
      <div className="min-h-[450px]">
        {activeSubTab === 'routine' && (
          <RoutineAdminModule triggerMedia={triggerMediaFilePicker} />
        )}
        {activeSubTab === 'exam' && (
          <ExamAdminModule triggerMedia={triggerMediaFilePicker} />
        )}
        {activeSubTab === 'calendar' && (
          <CalendarAdminModule triggerMedia={triggerMediaFilePicker} />
        )}
      </div>

      {/* Reusable file media picker modal */}
      {isMediaOpen && onMediaSelectedCallback && (
        <MediaSelectorModal
          onClose={() => setIsMediaOpen(false)}
          onSelect={(item) => {
            onMediaSelectedCallback(item.file_url);
            setIsMediaOpen(false);
          }}
          allowedType="all"
          title={mediaTitle}
        />
      )}
    </div>
  );
};

const PeriodsMasterWorkspace: React.FC<{
  periodMasters: PeriodMaster[];
  setPeriodMasters: React.Dispatch<React.SetStateAction<PeriodMaster[]>>;
  fetchLocalData: () => void;
}> = ({ periodMasters, setPeriodMasters, fetchLocalData }) => {
  const [name, setName] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // Dynamic warning as the user types
  useEffect(() => {
    if (!timeRange.trim()) {
      setWarning(null);
      return;
    }
    const parsedRange = parseTimeRange(timeRange);
    if (!parsedRange) {
      setWarning(null);
      return;
    }
    const { start, end } = parsedRange;
    if (end > start) {
      const duration = end - start;
      if (duration < 20) {
        setWarning("This period is unusually short.");
      } else if (duration > 120) {
        setWarning("This period is unusually long. Please verify the timing.");
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }
  }, [timeRange]);

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!timeRange.trim()) return;

    // 1. Syntax check & Parse Time Range properly
    const parsedRange = parseTimeRange(timeRange);
    if (!parsedRange) {
      setError("Invalid time format. Please use: 09:00 AM - 09:45 AM");
      return;
    }

    const { start, end } = parsedRange;

    // 2. Chronological Validation with Specific Suggestions
    if (end <= start) {
      const parts = timeRange.split(/[-–—to]/i);
      const startStr = parts[0].trim();
      const endStr = parts[1].trim();
      let errorMsg = `End time (${endStr}) is earlier than the start time (${startStr}).`;
      if (/AM/i.test(endStr)) {
        errorMsg += ` Did you mean ${endStr.replace(/AM/i, 'PM')}?`;
      } else if (/PM/i.test(endStr)) {
        errorMsg += ` Did you mean ${endStr.replace(/PM/i, 'AM')}?`;
      } else {
        errorMsg += ` Please check the AM/PM selection.`;
      }
      setError(errorMsg);
      return;
    }

    // 3. Duplicate Period Name Check
    const isDuplicateName = periodMasters.some(pm => 
      pm.id !== editingId && 
      pm.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (isDuplicateName) {
      setError(`A standard period with name "${name.trim()}" already exists.`);
      return;
    }

    // 4. Time Overlap Validation (excluding the editing period)
    const otherPMs = periodMasters.filter(pm => pm.id !== editingId);
    for (const other of otherPMs) {
      const otherRange = parseTimeRange(other.time_range);
      if (otherRange) {
        const { start: oStart, end: oEnd } = otherRange;
        if (start < oEnd && end > oStart) {
          setError(`This time overlaps with ${other.name} (${other.time_range}).`);
          return;
        }
      }
    }

    // 5. Apply save or update
    if (editingId) {
      // Edit
      const updated = periodMasters.map(pm => pm.id === editingId ? { ...pm, name: name.trim(), time_range: timeRange.trim() } : pm);
      dbService.savePeriodMasters(updated);
      setPeriodMasters(updated);
      setEditingId(null);
    } else {
      // Create
      const newPm: PeriodMaster = {
        id: `pm_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        name: name.trim(),
        time_range: timeRange.trim()
      };
      const updated = [...periodMasters, newPm].sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, '')) || 99;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 99;
        return numA - numB;
      });
      dbService.savePeriodMasters(updated);
      setPeriodMasters(updated);
    }

    setName('');
    setTimeRange('');
    setError(null);
    setWarning(null);
    fetchLocalData();
  };

  const handleEdit = (pm: PeriodMaster) => {
    setEditingId(pm.id);
    setName(pm.name);
    setTimeRange(pm.time_range);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    console.log('[ACADEMIC_ADMIN DELETE] clicked id:', id);
    if (!window.confirm("Delete this period?\nThis will also remove timetable slots using this period.")) {
      return;
    }

    const deletedPm = periodMasters.find(pm => pm.id === id);
    
    // Call the dedicated dbService delete method
    dbService.deletePeriodMaster(id);
    
    // Cascading clean up of associated routine entries to prevent empty/orphaned placeholders
    if (deletedPm) {
      const allEntries = dbService.getRoutineEntries();
      const entriesToRemove = allEntries.filter(
        e => e.period.toLowerCase().trim() === deletedPm.name.toLowerCase().trim()
      );
      const idsToRemove = entriesToRemove.map(e => e.id);
      
      console.log('[CASCADE DELETE] Period Master cascade delete started for period:', deletedPm.name);
      console.log('[CASCADE DELETE] Found routine entries to remove:', idsToRemove);

      if (idsToRemove.length > 0) {
        // Delete those IDs remotely and update local cache
        try {
          await dbService.deleteRoutineEntries(idsToRemove);
          console.log('[CASCADE DELETE] Remote cascade delete successful.');
        } catch (err) {
          console.error('[CASCADE DELETE] Remote cascade delete failed:', err);
        }
      } else {
        console.log('[CASCADE DELETE] No routine entries found using this period. No remote deletes needed.');
      }
    }
    
    // Refresh local lists and dispatch sync event to update the UI
    fetchLocalData();
    window.dispatchEvent(new CustomEvent('gsss-data-synced'));
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset study periods to default Bihar summer timings?')) {
      const defaults: PeriodMaster[] = [
        { id: 'p_1', name: 'Period 1', time_range: '09:00 AM - 09:45 AM' },
        { id: 'p_2', name: 'Period 2', time_range: '09:45 AM - 10:30 AM' },
        { id: 'p_3', name: 'Period 3', time_range: '10:30 AM - 11:15 AM' },
        { id: 'p_4', name: 'Period 4', time_range: '11:15 AM - 12:00 PM' },
        { id: 'p_5', name: 'Period 5', time_range: '12:45 PM - 01:30 PM' },
        { id: 'p_6', name: 'Period 6', time_range: '01:30 PM - 02:15 PM' },
      ];
      dbService.savePeriodMasters(defaults);
      setPeriodMasters(defaults);
      fetchLocalData();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-6 animate-in fade-in duration-200" id="periods-master-setup">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <h3 className="text-slate-900 text-sm font-black uppercase tracking-wider">
              Central Study Periods Master
            </h3>
          </div>
          <p className="text-slate-500 text-[11px] font-sans mt-0.5">
            Configure system-wide academic timetable hour frames and lecture sequences below.
          </p>
        </div>
        <button
          onClick={handleResetDefaults}
          className="text-slate-550 hover:text-slate-900 border border-slate-200 hover:border-slate-350 bg-white px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-bold tracking-tight uppercase flex items-center gap-1 cursor-pointer transition shadow-4xs"
        >
          Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4 h-fit">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-450 tracking-wider block">
            {editingId ? 'Modify Timing Details' : 'Create Standard Period'}
          </span>

          <form onSubmit={handleAddOrUpdate} className="space-y-4 text-xs font-semibold text-slate-755 font-sans">
            <div className="space-y-1">
              <label className="text-[10.5px] uppercase font-mono font-semibold text-slate-550">Period Label Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Period 1"
                className="w-full p-2 border border-slate-205 bg-white rounded-lg focus:outline-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] uppercase font-mono font-semibold text-slate-550">Time Range Slot</label>
              <input
                type="text"
                required
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
                placeholder="e.g. 09:00 AM - 09:45 AM"
                className="w-full p-2 border border-slate-205 bg-white rounded-lg focus:outline-orange-500 font-mono text-[11px] font-bold"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-150 p-2.5 rounded-lg text-red-700 text-[10.5px] font-medium leading-relaxed">
                {error}
              </div>
            )}

            {warning && (
              <div className="bg-amber-50 border border-amber-150 p-2.5 rounded-lg text-amber-800 text-[10.5px] font-medium leading-relaxed flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                <span>{warning}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-200/50">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setTimeRange('');
                    setError(null);
                  }}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded-lg cursor-pointer text-center"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 font-bold text-white rounded-lg cursor-pointer tracking-wide shadow-3xs"
              >
                {editingId ? 'Update Slot' : 'Create Slot'}
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-2 space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-450 tracking-wider block">
            Saved Hours Matrix Registry ({periodMasters.length} defined)
          </span>

          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-3xs" id="period-master-table-container">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse text-left min-w-[550px]" id="period-master-data-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 font-mono text-[9.5px] uppercase tracking-wide text-slate-450">
                    <th className="py-3 px-4 w-12 text-center">No.</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Standard Hour Slot</th>
                    <th className="py-3 px-4 w-28 text-center">Duration</th>
                    <th className="py-3 px-4 text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-750 font-medium">
                  {periodMasters.map((pm, i) => {
                    const parsed = parseTimeRange(pm.time_range);
                    const durationVal = parsed ? (parsed.end - parsed.start) : null;
                    const durationStr = durationVal !== null && durationVal > 0 
                      ? (durationVal >= 60 
                          ? `${Math.floor(durationVal / 60)}h ${durationVal % 60 > 0 ? `${durationVal % 60}m` : ''}` 
                          : `${durationVal} mins`)
                      : '—';

                    return (
                      <tr key={pm.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-bold text-[10.5px]">
                          {i + 1}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                          {pm.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-orange-600 font-bold text-[11px] select-all">
                          <span className="bg-orange-50/30 px-2 py-1 rounded-md border border-orange-100/50">
                            {pm.time_range}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-150/60 text-slate-700 rounded-md font-mono font-bold text-[10px] tracking-tight">
                            {durationStr}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              id={`edit-period-btn-${pm.id}`}
                              onClick={() => handleEdit(pm)}
                              className="px-3 py-2 text-[11px] bg-white border border-slate-205 hover:bg-slate-50 font-bold rounded-lg cursor-pointer transition flex items-center justify-center text-slate-700 min-h-[40px] min-w-[50px] shadow-4xs hover:border-slate-300"
                            >
                              Edit
                            </button>
                            <button
                              id={`delete-period-btn-${pm.id}`}
                              onClick={() => handleDelete(pm.id)}
                              className="px-3 py-2 text-[11px] border border-red-200/60 bg-red-50/20 text-red-650 hover:bg-red-50 font-bold rounded-lg cursor-pointer transition flex items-center justify-center min-h-[40px] min-w-[50px] shadow-4xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {periodMasters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 italic font-medium">
                        No period master rows defined. Add some or click Reset Defaults above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// A. ROUTINES ADMINISTRATIVE MODULE
// ============================================================================
interface ModuleSubProps {
  triggerMedia: (title: string, onSelect: (url: string) => void) => void;
}

const RoutineAdminModule: React.FC<ModuleSubProps> = ({ triggerMedia }) => {
  const [selectedClass, setSelectedClass] = useState<AcademicClass | 'Combined' | 'PeriodsMaster' | 'FullMatrix'>('Class 9');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [periodMasters, setPeriodMasters] = useState<PeriodMaster[]>(dbService.getPeriodMasters());
  const [isManualPeriod, setIsManualPeriod] = useState(false);
  
  // Edit State variables
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Form states for adding/editing Entry
  const [entryForm, setEntryForm] = useState<Partial<RoutineEntry>>({
    day: 'Monday',
    period: 'Period 1',
    time_range: '09:00 AM - 09:45 AM',
    subject: '',
    teacher: ''
  });

  const [isManualTeacher, setIsManualTeacher] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // PDF global scope configuration
  const [pdfApplyTarget, setPdfApplyTarget] = useState<'current' | 'all'>('current');
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Strict Validation states
  const [formError, setFormError] = useState<string | null>(null);
  const [combinedError, setCombinedError] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  const validateRoutineCollision = (
    day: string,
    timeRangeStr: string,
    clsName: string,
    teacherName: string,
    teacherId?: string,
    excludeEntryId?: string
  ): { valid: boolean; error?: string } => {
    const parsedRange = parseTimeRange(timeRangeStr);
    if (!parsedRange) {
      return { 
        valid: false, 
        error: "Invalid Time Range syntax. Please use exact format like '09:00 AM - 09:45 AM' or '2:00 PM - 3:00 PM'." 
      };
    }
    
    const { start, end } = parsedRange;
    if (end <= start) {
      return { 
        valid: false, 
        error: `End time of slot must be strictly after the start time. (Entered: ${timeRangeStr})` 
      };
    }

    if (end - start < 5) {
      return { 
        valid: false, 
        error: "The period duration must be at least 5 minutes." 
      };
    }

    for (const ent of entries) {
      if (ent.id === excludeEntryId) continue;
      if (ent.day !== day) continue;

      const entRange = parseTimeRange(ent.time_range);
      if (!entRange) continue;

      const isOverlapping = start < entRange.end && entRange.start < end;
      if (isOverlapping) {
        let isTeacherConflict = false;
        if (teacherId && ent.teacher_id) {
          isTeacherConflict = teacherId === ent.teacher_id;
        } else if (teacherName && ent.teacher) {
          isTeacherConflict = teacherName.trim().toLowerCase() === ent.teacher.trim().toLowerCase();
        }

        if (isTeacherConflict) {
          const conflictRoutine = routines.find(r => r.id === ent.routine_id);
          const conflictClass = conflictRoutine ? conflictRoutine.class_name : 'another class';
          return {
            valid: false,
            error: `Conflict: Teacher "${teacherName}" is already scheduled in ${conflictClass} during the overlapping time slot ${ent.time_range} on ${day}.`
          };
        }

        const targetRoutine = routines.find(r => r.class_name === clsName);
        if (targetRoutine && ent.routine_id === targetRoutine.id) {
          return {
            valid: false,
            error: `Conflict: ${clsName} already has another period "${ent.subject}" scheduled during the overlapping time slot ${ent.time_range} on ${day}.`
          };
        }
      }
    }

    return { valid: true };
  };

  // Core warning conflict structures
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [forceConflict, setForceConflict] = useState(false);

  // Combined Routine state management
  const [editingCombinedCell, setEditingCombinedCell] = useState<{
    className: AcademicClass;
    day: string;
    period: string;
    entry?: RoutineEntry;
  } | null>(null);
  const [combinedForm, setCombinedForm] = useState<{
    subject: string;
    teacher: string;
    teacher_id?: string;
    time_range: string;
    isManual: boolean;
  }>({
    subject: '',
    teacher: '',
    teacher_id: undefined,
    time_range: '09:00 AM - 09:45 AM',
    isManual: false
  });
  const [combinedConflictWarning, setCombinedConflictWarning] = useState<string | null>(null);
  const [combinedForceConflict, setCombinedForceConflict] = useState(false);

  // Smart Analytical & Routine Optimizer states
  const [optimizerTab, setOptimizerTab] = useState<'workload' | 'vacant'>('workload');
  const [analyticsDayFilter, setAnalyticsDayFilter] = useState<string>('All');
  const [analyticsClassFilter, setAnalyticsClassFilter] = useState<string>('All');
  const [workloadTeacherFilter, setWorkloadTeacherFilter] = useState<string>('All');
  const [quickAssignSlot, setQuickAssignSlot] = useState<{
    className: AcademicClass;
    day: string;
    period: string;
    timeRange: string;
  } | null>(null);
  const [quickForm, setQuickForm] = useState<{
    subject: string;
    teacher: string;
    teacher_id?: string;
    isManual: boolean;
  }>({
    subject: '',
    teacher: '',
    teacher_id: undefined,
    isManual: false
  });
  const [quickConflictWarning, setQuickConflictWarning] = useState<string | null>(null);
  const [quickForceConflict, setQuickForceConflict] = useState(false);

  // Day Duplication States
  const [isDuplicatingDay, setIsDuplicatingDay] = useState(false);
  const [duplicationSourceDay, setDuplicationSourceDay] = useState<string>('Monday');
  const [duplicationDestDays, setDuplicationDestDays] = useState<string[]>([]);
  const [copyTeachers, setCopyTeachers] = useState(true);
  const [copySubjects, setCopySubjects] = useState(true);
  const [copyTimeSlots, setCopyTimeSlots] = useState(true);
  const [destinationStrategy, setDestinationStrategy] = useState<'replace' | 'merge' | 'cancel'>('cancel');
  const [duplicationConflictBypass, setDuplicationConflictBypass] = useState(false);
  const [duplicationError, setDuplicationError] = useState<string | null>(null);
  const [duplicationConflicts, setDuplicationConflicts] = useState<string[]>([]);
  
  // Duplication Alert Banner & Undo State
  const [duplicationSuccessAlert, setDuplicationSuccessAlert] = useState<{
    message: string;
    detail: string;
    targetClass: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('gsss_duplication_success_alert');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [duplicationUndoState, setDuplicationUndoState] = useState<{
    createdEntryIds: string[];
    restoredEntries: RoutineEntry[];
    targetClass: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('gsss_duplication_undo_state');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load Routines and standard configurations
  const fetchLocalData = () => {
    setRoutines(dbService.getRoutines());
    setEntries(dbService.getRoutineEntries());
    setFaculty(dbService.getFaculty());
    setPeriodMasters(dbService.getPeriodMasters());
  };

  useEffect(() => {
    fetchLocalData();
  }, []);

  const activeRoutine = (selectedClass !== 'Combined' && selectedClass !== 'PeriodsMaster' && selectedClass !== 'FullMatrix') ? routines.find(r => r.class_name === selectedClass) : undefined;
  const classEntries = activeRoutine ? entries.filter(e => e.routine_id === activeRoutine?.id) : [];

  const initClassRoutineIfMissing = () => {
    if (selectedClass === 'Combined' || selectedClass === 'PeriodsMaster' || selectedClass === 'FullMatrix') return;
    const list = dbService.getRoutines();
    let current = list.find(r => r.class_name === selectedClass);
    if (!current) {
      const newRoutine: Routine = {
        id: `routine-${Date.now()}`,
        class_name: selectedClass as AcademicClass,
        display_mode: 'online',
        pdf_url: '',
        override_active: false,
        override_title: '',
        override_start: '',
        override_end: '',
        override_pdf_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dbService.saveRoutines([...list, newRoutine]);
      fetchLocalData();
    }
  };

  useEffect(() => {
    initClassRoutineIfMissing();
  }, [selectedClass]);

  // Check if a teacher has a conflict on standard day/period in another class
  const checkTeacherConflict = (day: string, period: string, teacherName: string, teacherId?: string, excludeId?: string, targetClass?: string) => {
    if ((!teacherName || teacherName.trim() === '') && !teacherId) return null;
    
    // Find matching records in other classes
    const match = entries.find(e => {
      if (e.id === excludeId) return false;
      if (e.day !== day) return false;
      if (e.period.toLowerCase().trim() !== period.toLowerCase().trim()) return false;
      
      if (teacherId && e.teacher_id) {
        return teacherId === e.teacher_id;
      }
      return teacherName && e.teacher && e.teacher.toLowerCase().trim() === teacherName.toLowerCase().trim();
    });
    
    if (match) {
      const conflictRoutine = routines.find(r => r.id === match.routine_id);
      if (conflictRoutine && conflictRoutine.class_name !== targetClass) {
        return conflictRoutine.class_name;
      }
    }
    return null;
  };

  // Handle Display Mode Change
  const updateDisplayMode = (mode: 'online' | 'pdf') => {
    if (!activeRoutine) return;
    const updated = routines.map(r => r.id === activeRoutine.id ? { ...r, display_mode: mode, updated_at: new Date().toISOString() } : r);
    dbService.saveRoutines(updated);
    fetchLocalData();
  };

  // Handle Routine PDF assignment
  const handleAssignPDF = () => {
    if (!activeRoutine) return;
    triggerMedia(
      `Select PDF for ${selectedClass} Timetable`,
      (url) => {
        if (pdfApplyTarget === 'all') {
          const classesToApply: AcademicClass[] = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];
          let currentRoutines = [...routines];
          
          classesToApply.forEach((cls) => {
            const existingIdx = currentRoutines.findIndex(r => r.class_name === cls);
            if (existingIdx >= 0) {
              currentRoutines[existingIdx] = {
                ...currentRoutines[existingIdx],
                pdf_url: url,
                display_mode: 'pdf',
                updated_at: new Date().toISOString()
              };
            } else {
              const newRoutine: Routine = {
                id: `routine-${Date.now()}-${cls.replace(' ', '')}`,
                class_name: cls,
                display_mode: 'pdf',
                pdf_url: url,
                override_active: false,
                override_title: '',
                override_start: '',
                override_end: '',
                override_pdf_url: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              currentRoutines.push(newRoutine);
            }
          });
          
          dbService.saveRoutines(currentRoutines);
        } else {
          const updated = routines.map(r => r.id === activeRoutine.id ? { ...r, pdf_url: url, updated_at: new Date().toISOString() } : r);
          dbService.saveRoutines(updated);
        }
        fetchLocalData();
      }
    );
  };

  const getPdfFilename = (url: string) => {
    if (!url) return 'Timetable_Routine.pdf';
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      return lastPart.split('?')[0];
    } catch {
      return 'Timetable_Routine.pdf';
    }
  };

  const formatRoutineDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const handleDeletePDF = () => {
    if (!activeRoutine || !activeRoutine.pdf_url) return;
    
    const sharedWith = routines.filter(r => r.pdf_url && r.pdf_url === activeRoutine.pdf_url);
    const isShared = sharedWith.length > 1;
    
    const message = isShared 
      ? `Warning: This PDF is shared across multiple classes (${sharedWith.map(r => r.class_name).join(', ')}). Deleting it will remove the PDF assignment from ALL these classes. Do you want to proceed?`
      : `Are you sure you want to remove the PDF timetable assignment for ${selectedClass}?`;
      
    if (!confirm(message)) return;
    
    if (isShared) {
      const urlToDelete = activeRoutine.pdf_url;
      const updated = routines.map(r => r.pdf_url === urlToDelete ? { ...r, pdf_url: '', updated_at: new Date().toISOString() } : r);
      dbService.saveRoutines(updated);
    } else {
      const updated = routines.map(r => r.id === activeRoutine.id ? { ...r, pdf_url: '', updated_at: new Date().toISOString() } : r);
      dbService.saveRoutines(updated);
    }
    setShowPdfPreview(false);
    fetchLocalData();
  };

  // Form Submit for Routine Grid Entry (Add & Edit)
  const handleAddEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoutine) return;

    const teacherName = entryForm.teacher || '';
    const dayVal = entryForm.day || 'Monday';
    const periodVal = entryForm.period || 'Period 1';
    const timeRangeVal = entryForm.time_range || '';

    // Strict validation
    const validation = validateRoutineCollision(
      dayVal,
      timeRangeVal,
      selectedClass as string,
      teacherName,
      entryForm.teacher_id,
      editingEntryId || undefined
    );
    if (!validation.valid) {
      setFormError(validation.error || 'Conflict detected in timeslots.');
      return;
    }
    setFormError(null);

    // Verify teacher conflict
    const conflictClass = checkTeacherConflict(dayVal, periodVal, teacherName, entryForm.teacher_id, editingEntryId || undefined, selectedClass as string);
    if (conflictClass && !forceConflict) {
      setConflictWarning(`Conflict detected: ${teacherName} is already assigned to lead ${conflictClass} during ${dayVal} ${periodVal}. Proceed anyway?`);
      return;
    }

    if (editingEntryId) {
      // Edit route
      const updated = entries.map(ent => ent.id === editingEntryId ? {
        ...ent,
        day: dayVal as any,
        period: periodVal,
        time_range: timeRangeVal,
        subject: entryForm.subject || '',
        teacher: teacherName,
        teacher_id: entryForm.teacher_id || null
      } : ent);
      dbService.saveRoutineEntries(updated);
    } else {
      // Add route
      const newEntry: RoutineEntry = {
        id: `re_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        routine_id: activeRoutine.id,
        day: dayVal as any,
        period: periodVal,
        time_range: timeRangeVal,
        subject: entryForm.subject || '',
        teacher: teacherName,
        teacher_id: entryForm.teacher_id || null
      };
      dbService.saveRoutineEntries([...entries, newEntry]);
    }

    // Reset forms
    setIsAddingEntry(false);
    setEditingEntryId(null);
    setConflictWarning(null);
    setForceConflict(false);
    setEntryForm({ day: 'Monday', period: 'Period 1', time_range: '09:00 AM - 09:45 AM', subject: '', teacher: '', teacher_id: undefined });
    fetchLocalData();
  };

  const handleDuplicateDaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoutine) return;

    setDuplicationError(null);
    setDuplicationConflicts([]);

    // Always fetch latest entries from database to ensure absolute transactional integrity
    const currentEntries = dbService.getRoutineEntries();

    // Check if source day has entries
    const sourceEntries = currentEntries.filter(
      ent => ent.routine_id === activeRoutine.id && ent.day === duplicationSourceDay
    );

    if (sourceEntries.length === 0) {
      setDuplicationError(`No entries found on the source day (${duplicationSourceDay}) to duplicate.`);
      return;
    }

    if (duplicationDestDays.length === 0) {
      setDuplicationError('Please select at least one destination day.');
      return;
    }

    if (duplicationDestDays.includes(duplicationSourceDay)) {
      setDuplicationError('Source day cannot be selected as a destination day.');
      return;
    }

    // Check if any destination day already has entries
    const hasExistingEntries = duplicationDestDays.some(destDay =>
      currentEntries.some(ent => ent.routine_id === activeRoutine.id && ent.day === destDay)
    );

    if (hasExistingEntries && destinationStrategy === 'cancel') {
      setDuplicationError('Destination days already contain routine entries. Please choose "Replace Existing Entries" or "Merge Into Empty Periods" to proceed.');
      return;
    }

    // Run Pre-validation & Teacher Conflict checks on all cloned entries to build list of conflicts
    let conflictsList: string[] = [];
    const prospectiveEntriesToCreate: RoutineEntry[] = [];
    const restoredEntriesList: RoutineEntry[] = [];
    let skippedCount = 0;
    let copiedCount = 0;

    // We do a target-by-target mock clone to do checks
    for (const destDay of duplicationDestDays) {
      const existingDestEntries = currentEntries.filter(
        ent => ent.routine_id === activeRoutine.id && ent.day === destDay
      );

      for (const sourceEnt of sourceEntries) {
        if (existingDestEntries.length > 0 && destinationStrategy === 'merge') {
          // Check if there's already an entry for this period or overlapping slot
          const hasOverlap = existingDestEntries.some(
            ent => ent.period === sourceEnt.period || ent.time_range === sourceEnt.time_range
          );
          if (hasOverlap) {
            skippedCount++;
            continue;
          }
        }

        // Create virtual cloned entry for conflict check
        const matchedMaster = periodMasters.find(pm => pm.name === sourceEnt.period);
        const defaultTimeRange = matchedMaster ? matchedMaster.time_range : '00:00 AM - 00:00 AM';

        const teacherName = copyTeachers ? (sourceEnt.teacher || '') : '';
        const teacherId = copyTeachers ? sourceEnt.teacher_id : undefined;

        const prospectiveEnt: RoutineEntry = {
          id: `temp_${Math.random()}`,
          routine_id: activeRoutine.id,
          day: destDay as any,
          period: sourceEnt.period,
          time_range: copyTimeSlots ? (sourceEnt.time_range || '') : defaultTimeRange,
          subject: copySubjects ? (sourceEnt.subject || '') : '',
          teacher: teacherName,
          teacher_id: teacherId
        };

        prospectiveEntriesToCreate.push(prospectiveEnt);

        // Check teacher conflict on this destination day (only if copyTeachers is true and teacher is set)
        if (copyTeachers && teacherName) {
          const conflictClass = checkTeacherConflict(
            prospectiveEnt.day,
            prospectiveEnt.period,
            teacherName,
            teacherId,
            undefined, // no editing id
            selectedClass as string
          );
          if (conflictClass) {
            conflictsList.push(
              `Teacher "${teacherName}" is already assigned to ${conflictClass} on ${prospectiveEnt.day} during ${prospectiveEnt.period}.`
            );
          }
        }
      }
    }

    // If there are conflicts and we haven't bypassed them, show warning and return
    if (conflictsList.length > 0 && !duplicationConflictBypass) {
      setDuplicationConflicts(conflictsList);
      return;
    }

    // Perform actual write operations
    let updatedEntries = [...currentEntries];

    // Track for undo
    const newlyCreatedIds: string[] = [];
    const newlyCreatedEntries: RoutineEntry[] = [];

    for (const destDay of duplicationDestDays) {
      const existingDestEntries = currentEntries.filter(
        ent => ent.routine_id === activeRoutine.id && ent.day === destDay
      );

      if (existingDestEntries.length > 0) {
        if (destinationStrategy === 'replace') {
          // Add existing entries to restored list
          restoredEntriesList.push(...existingDestEntries);
          // Remove them from updated entries
          updatedEntries = updatedEntries.filter(
            ent => !(ent.routine_id === activeRoutine.id && ent.day === destDay)
          );
        }
      }

      // Filter prospective entries to this destDay
      const entriesToCreateForThisDay = prospectiveEntriesToCreate.filter(e => e.day === destDay);
      for (const prospectiveEnt of entriesToCreateForThisDay) {
        // Generate new real valid UUID
        const realId = generateUUID();
        const finalEnt: RoutineEntry = {
          ...prospectiveEnt,
          id: realId
        };
        newlyCreatedIds.push(realId);
        newlyCreatedEntries.push(finalEnt);
        updatedEntries.push(finalEnt);
        copiedCount++;
      }
    }

    // Save to DB
    dbService.saveRoutineEntries(updatedEntries);

    // Setup success message and undo state
    let detailMessage = '';
    if (destinationStrategy === 'merge') {
      detailMessage = `${copiedCount} periods copied. ${skippedCount > 0 ? `${skippedCount} periods skipped because they already existed.` : ''}`;
    } else if (destinationStrategy === 'replace') {
      detailMessage = `${restoredEntriesList.length} previous entries replaced. ${copiedCount} new entries created.`;
    } else {
      detailMessage = `${copiedCount} periods copied successfully.`;
    }

    const successAlert = {
      message: `${duplicationSourceDay} successfully duplicated to: ${duplicationDestDays.join(', ')}`,
      detail: detailMessage,
      targetClass: selectedClass as string
    };

    const undoState = {
      createdEntryIds: newlyCreatedIds,
      restoredEntries: restoredEntriesList,
      targetClass: selectedClass as string
    };

    setDuplicationSuccessAlert(successAlert);
    setDuplicationUndoState(undoState);

    // Persist undo state and success alert to localStorage so that they survive refreshes!
    localStorage.setItem('gsss_duplication_undo_state', JSON.stringify(undoState));
    localStorage.setItem('gsss_duplication_success_alert', JSON.stringify(successAlert));

    // Reset state & close modal
    setIsDuplicatingDay(false);
    setDuplicationConflicts([]);
    setDuplicationConflictBypass(false);
    fetchLocalData();
  };

  const handleDuplicationUndo = () => {
    const undoState = duplicationUndoState;
    if (!undoState) return;

    const { createdEntryIds, restoredEntries } = undoState;

    // Get the latest entries directly from the database to guarantee transaction integrity
    const latestEntries = dbService.getRoutineEntries();

    // Remove the newly created entries
    let updatedEntries = latestEntries.filter(ent => !createdEntryIds.includes(ent.id));

    // Restore the original entries that were replaced
    updatedEntries = [...updatedEntries, ...restoredEntries];

    // Save and refresh
    dbService.saveRoutineEntries(updatedEntries);
    
    // Clear undo state
    setDuplicationUndoState(null);
    localStorage.removeItem('gsss_duplication_undo_state');

    const successAlert = {
      message: 'Duplication undone successfully!',
      detail: 'Original timetable slots restored.',
      targetClass: selectedClass as string
    };
    setDuplicationSuccessAlert(successAlert);
    localStorage.setItem('gsss_duplication_success_alert', JSON.stringify(successAlert));

    fetchLocalData();
  };

  const handleEditClick = (ent: RoutineEntry) => {
    setEditingEntryId(ent.id);
    setEntryForm({
      day: ent.day,
      period: ent.period,
      time_range: ent.time_range || '',
      subject: ent.subject,
      teacher: ent.teacher || '',
      teacher_id: ent.teacher_id
    });
    setIsManualTeacher(ent.teacher_id ? false : (ent.teacher ? !faculty.some(f => f.name === ent.teacher) : false));
    setIsManualPeriod(ent.period ? !periodMasters.some(pm => pm.name.toLowerCase().trim() === ent.period.toLowerCase().trim()) : false);
    setIsAddingEntry(true);
    setFormError(null);
    setConflictWarning(null);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleDeleteEntryInline = async (entryId: string) => {
    try {
      await dbService.deleteRoutineEntry(entryId);
    } catch (err) {
      console.error('[ROUTINE ENTRY DELETE] Direct delete inline failed:', err);
    }
    fetchLocalData();
    setDeletingId(null);
  };

  // Consolidated helpers
  const dynamicPeriodNames = periodMasters.map(pm => pm.name);
  const foundPeriodNames = entries.map(e => e.period) as string[];
  const standardPeriods: string[] = Array.from(new Set([...dynamicPeriodNames, ...foundPeriodNames]))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 99;
      const numB = parseInt(b.replace(/\D/g, '')) || 99;
      return numA - numB;
    });
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const getCombinedEntry = (cls: AcademicClass, day: string, period: string) => {
    const routine = routines.find(r => r.class_name === cls);
    if (!routine) return null;
    return entries.find(e => e.routine_id === routine.id && e.day === day && e.period === period);
  };

  const handleOpenCombinedCell = (cls: AcademicClass, day: string, period: string, matched?: RoutineEntry) => {
    setEditingCombinedCell({
      className: cls,
      day,
      period,
      entry: matched
    });
    setCombinedForm({
      subject: matched?.subject || '',
      teacher: matched?.teacher || '',
      teacher_id: matched?.teacher_id,
      time_range: matched?.time_range || (getPeriodTimeCombined(period) || '09:00 AM - 09:45 AM'),
      isManual: matched?.teacher_id ? false : (matched?.teacher ? !faculty.some(f => f.name === matched.teacher) : false)
    });
    setCombinedConflictWarning(null);
    setCombinedForceConflict(false);
    setCombinedError(null);
  };

  const getPeriodTimeCombined = (p: string) => {
    const matched = entries.find(e => e.period === p && e.time_range);
    if (matched?.time_range) return matched.time_range;
    const master = periodMasters.find(pm => pm.name.toLowerCase().trim() === p.toLowerCase().trim());
    return master?.time_range || '';
  };

  const handleSaveCombinedCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombinedCell) return;

    const { className, day, period, entry } = editingCombinedCell;
    const { subject, teacher, teacher_id, time_range } = combinedForm;

    // Strict validation
    const validation = validateRoutineCollision(
      day,
      time_range,
      className,
      teacher,
      teacher_id,
      entry?.id || undefined
    );
    if (!validation.valid) {
      setCombinedError(validation.error || 'Conflict detected in timeslots.');
      return;
    }
    setCombinedError(null);

    // Verify teacher conflict
    const conflictClass = checkTeacherConflict(day, period, teacher, teacher_id, entry?.id || undefined, className);
    if (conflictClass && !combinedForceConflict) {
      setCombinedConflictWarning(`Teacher Conflict: ${teacher} is already occupying ${conflictClass} during ${day} ${period}. Bypass warning and confirm?`);
      return;
    }

    if (entry) {
      // Edit in place
      const updated = entries.map(e => e.id === entry.id ? { ...e, subject, teacher, teacher_id: teacher_id || null, time_range } : e);
      dbService.saveRoutineEntries(updated);
    } else {
      // Create fresh
      const targetRoutine = routines.find(r => r.class_name === className);
      if (targetRoutine) {
        const newEntry: RoutineEntry = {
          id: `re_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
          routine_id: targetRoutine.id,
          day: day as any,
          period,
          subject,
          teacher,
          teacher_id: teacher_id || null,
          time_range
        };
        dbService.saveRoutineEntries([...entries, newEntry]);
      }
    }

    setEditingCombinedCell(null);
    fetchLocalData();
  };

  const handleClearCombinedCell = async () => {
    if (editingCombinedCell?.entry) {
      try {
        await dbService.deleteRoutineEntry(editingCombinedCell.entry.id);
      } catch (err) {
        console.error('[ROUTINE ENTRY DELETE] Clear combined cell failed:', err);
      }
      fetchLocalData();
    }
    setEditingCombinedCell(null);
  };

  // List of all 4 standard classes
  const allClasses: AcademicClass[] = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];

  const getTeacherWorkloadData = () => {
    // 1. Unique faculty members
    const facultyTeachers = faculty.map(f => ({
      id: f.id,
      name: f.name,
      department: f.department || f.subject || 'General Studies',
      isFaculty: true
    }));

    // 2. Custom/legacy teachers
    const customTeachers: typeof facultyTeachers = [];
    entries.forEach(e => {
      if (!e.teacher || !e.teacher.trim()) return;
      
      if (e.teacher_id) {
        const existsInFaculty = facultyTeachers.some(f => f.id === e.teacher_id);
        if (!existsInFaculty) {
          const existsInCustom = customTeachers.some(c => c.id === e.teacher_id);
          if (!existsInCustom) {
            customTeachers.push({
              id: e.teacher_id,
              name: e.teacher,
              department: 'Legacy Faculty',
              isFaculty: false
            });
          }
        }
      } else {
        const matchesFacultyName = facultyTeachers.some(f => f.name.toLowerCase().trim() === e.teacher!.toLowerCase().trim());
        if (!matchesFacultyName) {
          const existsInCustom = customTeachers.some(c => c.name.toLowerCase().trim() === e.teacher!.toLowerCase().trim());
          if (!existsInCustom) {
            customTeachers.push({
              name: e.teacher,
              department: 'Custom / Guest',
              isFaculty: false
            });
          }
        }
      }
    });

    const unifiedTeachers = [...facultyTeachers, ...customTeachers];
    
    const workloadMap = unifiedTeachers.map(t => {
      const assigned = entries.filter(e => {
        if (!e.teacher || !e.teacher.trim()) return false;
        
        if (t.id && e.teacher_id) {
          return t.id === e.teacher_id;
        }
        return t.name.toLowerCase().trim() === e.teacher.toLowerCase().trim();
      });
      
      const details = assigned.map(e => {
        const matchingRoutine = routines.find(r => r.id === e.routine_id);
        const clsName = matchingRoutine ? matchingRoutine.class_name : 'N/A';
        return {
          id: e.id,
          class_name: clsName,
          day: e.day,
          period: e.period,
          subject: e.subject
        };
      });

      return {
        id: t.id,
        name: t.name,
        department: t.department,
        type: t.isFaculty ? 'Regular' : 'Temp / Guest',
        loadCount: assigned.length,
        assignments: details
      };
    });
    
    return workloadMap.sort((a, b) => b.loadCount - a.loadCount);
  };

  const allTeachersFromData = () => {
    const rawData = getTeacherWorkloadData();
    return rawData.map(t => t.name).sort();
  };

  const filteredWorkloadData = () => {
    const rawData = getTeacherWorkloadData();
    if (workloadTeacherFilter === 'All') return rawData;
    return rawData.filter(t => t.name.toLowerCase().trim() === workloadTeacherFilter.toLowerCase().trim());
  };

  const getVacantAndGappedSlots = () => {
    const gapsList: {
      key: string;
      class_name: AcademicClass;
      day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
      period: string;
      time_range: string;
      reason: 'unscheduled' | 'no_teacher';
      entry?: RoutineEntry;
    }[] = [];

    allClasses.forEach(cls => {
      const routine = routines.find(r => r.class_name === cls);
      
      weekDays.forEach(day => {
        standardPeriods.forEach(period => {
          const timeRange = getPeriodTimeCombined(period) || '09:00 AM - 09:45 AM';
          
          if (!routine) {
            gapsList.push({
              key: `${cls}-${day}-${period}`,
              class_name: cls,
              day,
              period,
              time_range: timeRange,
              reason: 'unscheduled'
            });
            return;
          }
          
          const matchedEntry = entries.find(e => e.routine_id === routine.id && e.day === day && e.period === period);
          if (!matchedEntry) {
            gapsList.push({
              key: `${cls}-${day}-${period}`,
              class_name: cls,
              day,
              period,
              time_range: timeRange,
              reason: 'unscheduled'
            });
          } else if ((!matchedEntry.teacher || matchedEntry.teacher.trim() === '') && !matchedEntry.teacher_id) {
            gapsList.push({
              key: `${cls}-${day}-${period}`,
              class_name: cls,
              day,
              period,
              time_range: matchedEntry.time_range || timeRange,
              reason: 'no_teacher',
              entry: matchedEntry
            });
          }
        });
      });
    });

    return gapsList;
  };

  const getAvailableTeachersForSlot = (day: string, period: string) => {
    const workloadData = getTeacherWorkloadData();
    return workloadData.filter(t => {
      const isBusy = t.assignments.some(a => 
        a.day === day && 
        a.period.toLowerCase().trim() === period.toLowerCase().trim()
      );
      return !isBusy;
    });
  };

  const handleQuickAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAssignSlot) return;

    const { className, day, period, timeRange } = quickAssignSlot;
    const { subject, teacher, teacher_id } = quickForm;

    let targetRoutine = routines.find(r => r.class_name === className);
    const existingEntry = targetRoutine ? entries.find(ent => 
      ent.routine_id === targetRoutine?.id && 
      ent.day === day && 
      ent.period === period
    ) : null;

    // Strict validation
    const validation = validateRoutineCollision(
      day,
      timeRange,
      className,
      teacher,
      teacher_id,
      existingEntry?.id || undefined
    );
    if (!validation.valid) {
      setQuickError(validation.error || 'Conflict detected in timeslots.');
      return;
    }
    setQuickError(null);

    const conflictClass = checkTeacherConflict(day, period, teacher, teacher_id, existingEntry?.id || undefined, className);
    if (conflictClass && !quickForceConflict) {
      setQuickConflictWarning(`Teacher Conflict: ${teacher} is already assigned to ${conflictClass} during ${day} ${period}. Bypass warning to assign?`);
      return;
    }
    
    if (!targetRoutine) {
      const newRoutine: Routine = {
        id: `routine-${Date.now()}`,
        class_name: className,
        display_mode: 'online',
        pdf_url: '',
        override_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      dbService.saveRoutines([...routines, newRoutine]);
      targetRoutine = newRoutine;
    }

    const finalExistingEntry = existingEntry || (targetRoutine ? entries.find(ent => 
      ent.routine_id === targetRoutine?.id && 
      ent.day === day && 
      ent.period === period
    ) : null);

    if (finalExistingEntry) {
      const updated = entries.map(ent => 
        ent.id === finalExistingEntry.id 
          ? { ...ent, subject: subject.trim() || ent.subject, teacher, teacher_id: teacher_id || null } 
          : ent
      );
      dbService.saveRoutineEntries(updated);
    } else {
      const newEntry: RoutineEntry = {
        id: `re_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        routine_id: targetRoutine.id,
        day: day as any,
        period,
        subject: subject.trim() || 'General Studies',
        teacher,
        teacher_id: teacher_id || null,
        time_range: timeRange
      };
      dbService.saveRoutineEntries([...entries, newEntry]);
    }

    setQuickAssignSlot(null);
    setQuickForm({ subject: '', teacher: '', teacher_id: undefined, isManual: false });
    setQuickConflictWarning(null);
    setQuickForceConflict(false);
    fetchLocalData();
  };

  const workloadData = getTeacherWorkloadData();
  const vacantSlots = getVacantAndGappedSlots();
  
  const filteredVac_gaps = vacantSlots.filter(s => {
    const matchDay = analyticsDayFilter === 'All' || s.day === analyticsDayFilter;
    const matchClass = analyticsClassFilter === 'All' || s.class_name === analyticsClassFilter;
    return matchDay && matchClass;
  });

  return (
    <div className="space-y-8 pb-10">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8" id="routines-administrative-boundary">
      {/* LEFT SIDEBAR: Selected Classes and Timetable Modes */}
      <div className="lg:col-span-1 space-y-4">
        {/* Class selector */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs">
          <span className="block text-[10px] uppercase font-mono font-bold text-slate-400 pb-2 border-b border-slate-100 mb-3 tracking-wider">
            Academic Grade Division
          </span>
          <div className="space-y-1">
            {(['Class 9', 'Class 10', 'Class 11', 'Class 12'] as AcademicClass[]).map((cls) => (
              <button
                key={cls}
                onClick={() => {
                  setSelectedClass(cls);
                  setIsAddingEntry(false);
                  setEditingEntryId(null);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-55 hover:bg-slate-50'
                }`}
              >
                {cls}
              </button>
            ))}
            
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-1">
              <button
                onClick={() => setSelectedClass('Combined')}
                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-between cursor-pointer border ${
                  selectedClass === 'Combined'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Combined Routine</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                  selectedClass === 'Combined' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'
                }`}>9-12 VIEW</span>
              </button>

              <button
                onClick={() => setSelectedClass('FullMatrix')}
                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-between cursor-pointer border ${
                  selectedClass === 'FullMatrix'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>📊 Full Routine Matrix</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                  selectedClass === 'FullMatrix' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'
                }`}>Matrix</span>
              </button>

              <button
                onClick={() => setSelectedClass('PeriodsMaster')}
                className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                  selectedClass === 'PeriodsMaster'
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>⏱️ Periods Master</span>
                <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Setup</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Method toggle */}
        {activeRoutine && (
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs space-y-3">
            <span className="block text-[10px] uppercase font-mono font-bold text-slate-400 pb-2 border-b border-slate-100 tracking-wider">
              Display Method
            </span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl font-sans text-xs">
              <button
                onClick={() => updateDisplayMode('online')}
                className={`py-1.5 px-3 text-[10px] font-bold uppercase rounded-lg transition text-center cursor-pointer ${
                  activeRoutine.display_mode === 'online'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Online
              </button>
              <button
                onClick={() => updateDisplayMode('pdf')}
                className={`py-1.5 px-3 text-[10px] font-bold uppercase rounded-lg transition text-center cursor-pointer ${
                  activeRoutine.display_mode === 'pdf'
                    ? 'bg-white text-orange-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                PDF Flyer
              </button>
            </div>
            <p className="text-[10.5px] text-slate-400 leading-normal font-medium font-sans italic p-1">
              {activeRoutine.display_mode === 'online' 
                ? 'Dynamic routine grid managed on website directly' 
                : 'Upload an administrative PDF document fallback.'}
            </p>
          </div>
        )}

        {/* Disabled Override Section - relocated to future update safely */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center space-y-1">
          <span className="block text-[10px] uppercase font-mono font-extrabold text-slate-400 pb-1.5 border-b border-slate-200 mb-2 tracking-wider flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-slate-400" />
            Timetable Override
          </span>
          <p className="text-[10.5px] text-slate-500 font-sans leading-normal font-medium italic">
            Override settings have been relocated to Future Updates development roadmap (v2.0 BSEB automatic sync).
          </p>
        </div>
      </div>

      {/* RIGHT DISPLAY WORKSPACE CONTAINER */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* COMBINED CONSOLIDATED ROUTINE WORKSPACE / PERIODS MASTER */}
        {selectedClass === 'PeriodsMaster' ? (
          <PeriodsMasterWorkspace 
            periodMasters={periodMasters} 
            setPeriodMasters={setPeriodMasters} 
            fetchLocalData={fetchLocalData} 
          />
        ) : selectedClass === 'FullMatrix' ? (
          <ConsolidatedRoutineMatrix isAdmin={true} />
        ) : selectedClass === 'Combined' ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <h3 className="text-slate-900 text-sm font-black uppercase tracking-wider">
                  Consolidated 9-12 Routine Grid
                </h3>
              </div>
              <p className="text-slate-500 text-[11px] font-sans mt-0.5">
                Consolidated administrative layout. Click on any block to edit, add, or clear timetable slots immediately across any grade class.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left border-b border-slate-150 font-mono text-[9.5px] uppercase tracking-wider text-slate-500">
                    <th className="p-3 w-28 border-r border-slate-150">Day</th>
                    <th className="p-3 w-32 border-r border-slate-150">Period</th>
                    <th className="p-3 border-r border-slate-150">Class 9</th>
                    <th className="p-3 border-r border-slate-150">Class 10</th>
                    <th className="p-3 border-r border-slate-150">Class 11</th>
                    <th className="p-3">Class 12</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                  {weekDays.map((day) => {
                    return standardPeriods.map((period, pIndex) => (
                      <tr key={`${day}-${period}`} className={`hover:bg-slate-50/25 ${pIndex === standardPeriods.length - 1 ? 'border-b-2 border-slate-200' : ''}`}>
                        {pIndex === 0 && (
                          <td rowSpan={standardPeriods.length} className="p-3 bg-slate-50/70 border-r border-slate-150 font-black text-slate-900 uppercase tracking-wide text-center alignment-middle w-28 select-none">
                            {day}
                          </td>
                        )}
                        <td className="p-3 border-r border-slate-150 font-mono font-bold text-slate-500 flex flex-col justify-center">
                          <span className="text-orange-600 font-extrabold">{period}</span>
                          <span className="text-[10px] text-slate-400 font-medium leading-tight">{getPeriodTimeCombined(period) || 'Timing unset'}</span>
                        </td>
                        
                        {(['Class 9', 'Class 10', 'Class 11', 'Class 12'] as AcademicClass[]).map((cls) => {
                          const matched = getCombinedEntry(cls, day, period);
                          return (
                            <td 
                              key={cls}
                              onClick={() => handleOpenCombinedCell(cls, day, period, matched || undefined)}
                              className="p-3 border-r border-slate-155 min-w-[130px] hover:bg-orange-500/5 cursor-pointer transition-colors duration-100 text-left group"
                            >
                              {matched ? (
                                <div className="space-y-1">
                                  <div className="font-extrabold text-slate-800 leading-tight group-hover:text-orange-600">{matched.subject}</div>
                                  <div className="text-slate-500 flex items-center gap-1 font-mono text-[10px]">
                                    <User className="w-3 h-3 text-slate-400" />
                                    {(() => {
                                      if (matched.teacher_id) {
                                        const f = faculty.find(fac => fac.id === matched.teacher_id);
                                        if (f) return f.name;
                                      }
                                      return matched.teacher || '—';
                                    })()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-300 italic text-[10px] flex items-center gap-1 select-none">
                                  <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  Empty Slot
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            {/* SLEEK MODAL DIALOG OVERLAY FOR COMBINED CELL EDIT */}
            {editingCombinedCell && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 w-full max-w-md shadow-2xl space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-600">
                        Quick Routine Editor
                      </span>
                      <h4 className="text-slate-900 font-extrabold text-sm font-sans mt-0.5">
                        {editingCombinedCell.className} • {editingCombinedCell.day} ({editingCombinedCell.period})
                      </h4>
                    </div>
                    <button 
                      onClick={() => setEditingCombinedCell(null)} 
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCombinedCell} className="space-y-4 text-xs font-semibold font-sans">
                    {/* Time Frame */}
                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Standard Period Timing</label>
                      <input
                        type="text"
                        value={combinedForm.time_range}
                        onChange={(e) => setCombinedForm({ ...combinedForm, time_range: e.target.value })}
                        required
                        placeholder="e.g. 09:00 AM - 09:45 AM"
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                      />
                    </div>

                    {/* Teacher input */}
                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Assigned Teacher</label>
                      <div className="space-y-2">
                        <select
                          value={combinedForm.isManual ? 'manual_option' : (combinedForm.teacher_id || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'manual_option') {
                              setCombinedForm(prev => ({ ...prev, isManual: true, teacher: '', teacher_id: undefined }));
                            } else if (val === '') {
                              setCombinedForm(prev => ({ ...prev, isManual: false, teacher: '', teacher_id: undefined }));
                            } else {
                              const matched = faculty.find(f => f.id === val);
                              setCombinedForm(prev => ({ 
                                ...prev, 
                                isManual: false, 
                                teacher: matched ? matched.name : '',
                                teacher_id: val,
                                subject: (matched && matched.subject) ? matched.subject : (prev.subject || '')
                              }));
                            }
                            setCombinedConflictWarning(null);
                          }}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg font-medium"
                        >
                          <option value="">Select Teacher from Faculty...</option>
                          {faculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.department || f.subject})
                            </option>
                          ))}
                          <option value="manual_option">-- Type manually/custom --</option>
                        </select>

                        {combinedForm.isManual && (
                          <input
                            type="text"
                            value={combinedForm.teacher}
                            onChange={(e) => {
                              setCombinedForm({ ...combinedForm, teacher: e.target.value });
                              setCombinedConflictWarning(null);
                            }}
                            required
                            placeholder="Type teacher name..."
                            className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                          />
                        )}
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Subject Paper</label>
                      <input
                        type="text"
                        value={combinedForm.subject}
                        onChange={(e) => setCombinedForm({ ...combinedForm, subject: e.target.value })}
                        required
                        placeholder="e.g. Social Science II"
                        list="existing-subjects"
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                      />
                    </div>

                    {/* Strict blocker validation error box */}
                    {combinedError && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2.5 text-red-800 animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                        <div className="flex-1 text-left">
                          <p className="text-[11px] leading-relaxed font-bold uppercase tracking-wider text-red-700">Strict Validation Blocker</p>
                          <p className="text-[10.5px] leading-normal">{combinedError}</p>
                        </div>
                      </div>
                    )}

                    {/* Conflict Warning block */}
                    {combinedConflictWarning && (
                      <div className="bg-amber-50 border border-amber-205 p-3 rounded-xl flex items-start gap-2 text-slate-800 font-medium leading-relaxed">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1.5 flex-1 p-0.5">
                          <p className="text-[11px] font-sans">{combinedConflictWarning}</p>
                          <label className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={combinedForceConflict}
                              onChange={(e) => setCombinedForceConflict(e.target.checked)}
                              className="mr-1.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            Ignore collision & merge
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        {editingCombinedCell.entry && (
                          <button
                            type="button"
                            onClick={handleClearCombinedCell}
                            className="px-3.5 py-2 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-200 hover:border-red-500 cursor-pointer transition"
                          >
                            Clear Slot
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingCombinedCell(null)}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold cursor-pointer transition"
                        >
                          Save Slot
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CLASS-WISE ONLINE GRID WORKSPACE */
          activeRoutine && activeRoutine.display_mode === 'pdf' ? (
            /* PDF SOURCING BLOCK WITH COMPLETE LIFECYCLE MANAGEMENT */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-slate-900 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" /> PDF Document Sourcing
              </h3>
              <p className="text-slate-500 text-xs">
                Upload the administrative BSEB timetable flyer template for {selectedClass}. Live frame and download links are automatically set.
              </p>

              {activeRoutine.pdf_url ? (
                /* COMPACT INFORMATION PANEL */
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0">
                        <FileText className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0 flex-grow space-y-2">
                        <span className="block text-[10px] uppercase font-mono font-extrabold tracking-wider text-slate-400">Routine PDF</span>
                        <p className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                          ✓ PDF Attached
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/40">
                          <div>
                            <span className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Status</span>
                            <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                              Available
                            </span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Last Updated</span>
                            <span className="text-xs font-bold text-slate-700 block mt-0.5">
                              {formatRoutineDate(activeRoutine.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/50 space-y-1.5">
                      <span className="block text-[10.5px] uppercase font-mono font-bold tracking-wider text-slate-500">
                        Assignment Scope:
                      </span>
                      {routines.filter(r => r.pdf_url && r.pdf_url === activeRoutine.pdf_url).length === 4 ? (
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="text-emerald-600 font-extrabold">✓</span> Applied to <span className="text-orange-600">All Classes</span>
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 mt-2 pl-4">
                            {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
                              <div key={cls} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                                <span className="text-emerald-500 font-bold">✓</span> {cls}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Applied to custom classes:
                          </p>
                          <div className="flex flex-wrap gap-2.5 mt-1.5">
                            {['Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => {
                              const hasIt = routines.some(r => r.class_name === cls && r.pdf_url === activeRoutine.pdf_url);
                              return (
                                <div key={cls} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  hasIt ? 'bg-orange-50 text-orange-700 border border-orange-200/50' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <span>{hasIt ? '✓' : '✗'}</span>
                                  <span>{cls}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ACTIONS: Preview, Replace, Delete */}
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/50 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                        className="px-3.5 py-1.5 bg-sky-900 hover:bg-sky-950 text-white rounded-lg flex items-center gap-1 cursor-pointer transition uppercase text-[10px] tracking-wide shadow-3xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> {showPdfPreview ? 'Hide Preview' : 'Preview'}
                      </button>
                      <button
                        type="button"
                        onClick={handleAssignPDF}
                        className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-1 cursor-pointer transition uppercase text-[10px] tracking-wide shadow-3xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleDeletePDF}
                        className="px-3.5 py-1.5 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition uppercase text-[10px] tracking-wide shadow-3xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  {showPdfPreview && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative animate-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-sky-900" /> Timetable PDF Live Preview ({selectedClass})
                        </span>
                        <button 
                          onClick={() => setShowPdfPreview(false)}
                          className="text-[10px] uppercase font-bold text-red-650 text-red-600 hover:text-red-700 px-2 py-1 bg-white border border-slate-200 rounded cursor-pointer transition"
                        >
                          Hide Preview
                        </button>
                      </div>
                      <iframe 
                        src={activeRoutine.pdf_url} 
                        className="w-full h-[500px]"
                        title="Routine Calendar PDF View"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* NO PDF ASSIGNED WORKFLOW */
                <div className="p-5 bg-slate-50 border border-slate-150 rounded-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-200 text-slate-500 rounded-lg shrink-0">
                      <FileText className="w-5.5 h-5.5" />
                    </div>
                    <div className="min-w-0 flex-grow space-y-2">
                      <span className="block text-[10px] uppercase font-mono font-extrabold tracking-wider text-slate-400">PDF Document</span>
                      <p className="text-xs font-bold text-slate-500 italic">
                        No physical copy attached yet.
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/40">
                        <div>
                          <span className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Status</span>
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                            ✗ Not Configured
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-mono font-bold tracking-wider text-slate-400">Last Updated</span>
                          <span className="text-xs font-bold text-slate-400 block mt-0.5">
                            —
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/65 space-y-2 select-none">
                    <span className="block text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">Apply PDF Scope</span>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="pdfApplyTarget"
                          value="current"
                          checked={pdfApplyTarget === 'current'}
                          onChange={() => setPdfApplyTarget('current')}
                          className="text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span>Current Class ({selectedClass})</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name="pdfApplyTarget"
                          value="all"
                          checked={pdfApplyTarget === 'all'}
                          onChange={() => setPdfApplyTarget('all')}
                          className="text-orange-500 focus:ring-orange-500 cursor-pointer"
                        />
                        <span>All Academic Classes (Class 9 - 12)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 text-xs font-bold font-sans pt-1">
                    <button
                      onClick={handleAssignPDF}
                      className="py-2 px-4 bg-orange-505 bg-orange-500 hover:bg-orange-600 text-white rounded-lg uppercase tracking-wide shadow-sm cursor-pointer"
                    >
                      Attach PDF from Media Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ONLINE TIMETABLE GRID MATRIX */
            <div className="space-y-4">
              {/* Duplication Success Alert with optional Undo */}
              {duplicationSuccessAlert && duplicationSuccessAlert.targetClass === selectedClass && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start justify-between gap-3 shadow-4xs animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start gap-3">
                    <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold font-mono">
                      ✓
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-emerald-900 leading-none">
                        {duplicationSuccessAlert.message}
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium font-sans">
                        {duplicationSuccessAlert.detail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {duplicationUndoState && duplicationUndoState.targetClass === selectedClass && (
                      <button
                        onClick={handleDuplicationUndo}
                        className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-all shadow-4xs"
                      >
                        Undo
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDuplicationSuccessAlert(null);
                        localStorage.removeItem('gsss_duplication_success_alert');
                        localStorage.removeItem('gsss_duplication_undo_state');
                      }}
                      className="text-emerald-500 hover:text-emerald-800 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* DAY DUPLICATION MODAL */}
              {isDuplicatingDay && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
                  <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150 text-left">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
                        <h3 className="text-slate-900 font-black text-sm uppercase tracking-wider">
                          Smart Day Duplication
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsDuplicatingDay(false);
                          setDuplicationConflicts([]);
                        }}
                        className="text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleDuplicateDaySubmit} className="space-y-4 text-xs font-semibold font-sans">
                      
                      {/* Source Day Selector */}
                      <div className="space-y-1.5">
                        <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold tracking-wider text-left">
                          Source Day
                        </label>
                        <select
                          value={duplicationSourceDay}
                          onChange={(e) => {
                            setDuplicationSourceDay(e.target.value);
                            setDuplicationDestDays(prev => prev.filter(day => day !== e.target.value));
                          }}
                          className="w-full p-2.5 border border-slate-200 bg-white rounded-xl focus:outline-orange-500 text-slate-800 font-bold font-sans text-xs transition animate-none"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-400 italic font-medium leading-none text-left">
                          All period slots configured on {duplicationSourceDay} will be cloned.
                        </p>
                      </div>

                      {/* Destination Days Checkboxes */}
                      <div className="space-y-2">
                        <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold tracking-wider text-left">
                          Destination Days (Target)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                            const isSource = day === duplicationSourceDay;
                            return (
                              <label
                                key={day}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition select-none cursor-pointer ${
                                  isSource
                                    ? 'bg-slate-50 border-slate-150 text-slate-400 cursor-not-allowed opacity-60'
                                    : duplicationDestDays.includes(day)
                                    ? 'bg-orange-50/50 border-orange-200 text-orange-900 shadow-4xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  disabled={isSource}
                                  checked={duplicationDestDays.includes(day)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDuplicationDestDays([...duplicationDestDays, day]);
                                    } else {
                                      setDuplicationDestDays(duplicationDestDays.filter(d => d !== day));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer disabled:cursor-not-allowed"
                                />
                                <span>{day}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Copy Options */}
                      <div className="space-y-2">
                        <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold tracking-wider text-left">
                          Copy Options
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-150 text-left">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={copyTeachers}
                              onChange={(e) => setCopyTeachers(e.target.checked)}
                              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span>Copy Teachers</span>
                          </label>
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={copySubjects}
                              onChange={(e) => setCopySubjects(e.target.checked)}
                              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span>Copy Subjects</span>
                          </label>
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={copyTimeSlots}
                              onChange={(e) => setCopyTimeSlots(e.target.checked)}
                              className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span>Copy Time Slots</span>
                          </label>
                        </div>
                      </div>

                      {/* Check if existing destination days have entries to prompt Strategy selection */}
                      {duplicationDestDays.length > 0 &&
                        duplicationDestDays.some(destDay =>
                          entries.some(ent => ent.routine_id === activeRoutine.id && ent.day === destDay)
                        ) && (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3 text-left">
                            <div className="flex items-start gap-2 text-amber-900">
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                              <div className="space-y-1">
                                <p className="text-xs font-black">Destination already contains routine entries.</p>
                                <p className="text-[10.5px] font-medium text-amber-700 leading-normal">
                                  One or more selected destination days already have schedules configured. Select a strategy to resolve conflicts:
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                              <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="destinationStrategy"
                                  value="replace"
                                  checked={destinationStrategy === 'replace'}
                                  onChange={() => setDestinationStrategy('replace')}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <div className="leading-tight">
                                  <span className="block text-[11px] font-bold text-slate-900">Replace</span>
                                  <span className="text-[9px] text-slate-450 font-medium">Clear target entries</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="destinationStrategy"
                                  value="merge"
                                  checked={destinationStrategy === 'merge'}
                                  onChange={() => setDestinationStrategy('merge')}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <div className="leading-tight">
                                  <span className="block text-[11px] font-bold text-slate-900">Merge</span>
                                  <span className="text-[9px] text-slate-450 font-medium">Skip occupied periods</span>
                                </div>
                              </label>

                              <label className="flex items-center gap-2 p-2.5 rounded-xl border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name="destinationStrategy"
                                  value="cancel"
                                  checked={destinationStrategy === 'cancel'}
                                  onChange={() => setDestinationStrategy('cancel')}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <div className="leading-tight">
                                  <span className="block text-[11px] font-bold text-slate-900">Cancel</span>
                                  <span className="text-[9px] text-slate-450 font-medium">Do not duplicate</span>
                                </div>
                              </label>
                            </div>
                          </div>
                        )}

                      {/* Warnings / Teacher conflicts list */}
                      {duplicationConflicts.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 text-amber-900 text-left">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                            <div className="space-y-1">
                              <p className="text-xs font-black">Teacher Collision Warning</p>
                              <p className="text-[10.5px] font-medium text-amber-700">
                                The duplication would cause scheduling conflicts for the following teachers:
                              </p>
                            </div>
                          </div>
                          
                          <div className="max-h-[120px] overflow-y-auto border border-amber-200/50 bg-white/50 p-2.5 rounded-lg space-y-1 text-[10.5px] font-sans font-medium text-amber-800 list-inside divide-y divide-amber-100/50">
                            {duplicationConflicts.map((conf, idx) => (
                              <div key={idx} className="py-1 first:pt-0 last:pb-0 flex items-start gap-1.5 leading-snug text-left">
                                <span className="text-amber-500 shrink-0 font-mono">•</span>
                                <span>{conf}</span>
                              </div>
                            ))}
                          </div>

                          <label className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-800 tracking-wider uppercase cursor-pointer select-none text-left">
                            <input
                              type="checkbox"
                              checked={duplicationConflictBypass}
                              onChange={(e) => setDuplicationConflictBypass(e.target.checked)}
                              className="rounded border-amber-300 text-amber-600"
                            />
                            <span>Bypass teacher warnings and force save</span>
                          </label>
                        </div>
                      )}

                      {/* Strict blocker errors */}
                      {duplicationError && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2.5 text-red-800 text-left">
                          <AlertTriangle className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] leading-relaxed font-bold uppercase tracking-wider text-red-700">Validation Blocker</p>
                            <p className="text-[10.5px] leading-normal font-medium">{duplicationError}</p>
                          </div>
                        </div>
                      )}

                      {/* Modal Footer / Actions */}
                      <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDuplicatingDay(false);
                            setDuplicationConflicts([]);
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex items-center gap-1.5 font-bold cursor-pointer shadow-xs transition text-xs"
                        >
                          <Save className="w-4 h-4" />
                          Duplicate Day
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-slate-900 text-sm font-bold uppercase tracking-wide">
                    Online Routines Slots Matrix ({selectedClass})
                  </h3>
                  <p className="text-slate-500 text-[11px] font-sans">
                    Construct period sheets by appending lectures (Monday to Saturday sequence).
                  </p>
                </div>

                {!isAddingEntry && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="trigger-duplicate-day-btn"
                      onClick={() => {
                        setDuplicationSourceDay('Monday');
                        setDuplicationDestDays([]);
                        setCopyTeachers(true);
                        setCopySubjects(true);
                        setCopyTimeSlots(true);
                        setDestinationStrategy('cancel');
                        setDuplicationConflictBypass(false);
                        setDuplicationError(null);
                        setDuplicationConflicts([]);
                        setIsDuplicatingDay(true);
                      }}
                      className="py-2 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase rounded-xl tracking-wider shadow-4xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all hover:border-slate-300"
                    >
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      Duplicate Day
                    </button>

                    <button
                      onClick={() => {
                        setEditingEntryId(null);
                        setEntryForm({
                          day: 'Monday',
                          period: 'Period 1',
                          time_range: '09:00 AM - 09:45 AM',
                          subject: '',
                          teacher: ''
                        });
                        setIsManualTeacher(false);
                        setIsAddingEntry(true);
                        setConflictWarning(null);
                        setForceConflict(false);
                        setFormError(null);
                      }}
                      className="py-2 px-4 bg-sky-900 hover:bg-sky-950 text-white font-bold text-[10px] uppercase rounded-xl tracking-wider shadow-sm flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Append Period Lecture
                    </button>
                  </div>
                )}
              </div>

              {isAddingEntry && (
                /* ADD/EDIT ENTRY FORM PANEL */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs animate-in slide-in-from-top-3 duration-150">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 mb-4 text-xs">
                    <span className="font-extrabold uppercase font-mono text-slate-500 text-[10px]">
                      {editingEntryId ? 'Modify Timetable Slot Details' : 'Create Timetable Slot Entry'}
                    </span>
                    <button 
                      onClick={() => {
                        setIsAddingEntry(false);
                        setEditingEntryId(null);
                      }} 
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddEntrySubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold font-sans">
                    {(() => {
                      const uniqueTemplates = entries.reduce((acc, ent) => {
                        const key = `${ent.period || ''}-${ent.subject || ''}-${ent.teacher || ''}`;
                        if (ent.period && ent.subject && !acc.some(x => `${x.period || ''}-${x.subject || ''}-${x.teacher || ''}` === key)) {
                          acc.push(ent);
                        }
                        return acc;
                      }, [] as RoutineEntry[]);
                      if (uniqueTemplates.length === 0) return null;
                      return (
                        <div className="space-y-1 sm:col-span-3 pb-2 border-b border-dashed border-slate-200">
                          <label className="text-orange-600 block text-[10px] uppercase font-mono font-extrabold tracking-wider flex items-center gap-1 leading-none">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                            Smart Inheritance & Clone Template (Optional)
                          </label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const selectedEnt = entries.find(ent => ent.id === val);
                                if (selectedEnt) {
                                  const isPM = periodMasters.some(pm => pm.name === selectedEnt.period);
                                  setIsManualPeriod(!isPM);
                                  const isFacultyUser = faculty.some(f => f.name === selectedEnt.teacher);
                                  setIsManualTeacher(!isFacultyUser && !!selectedEnt.teacher);
                                  setEntryForm(prev => ({
                                    ...prev,
                                    period: selectedEnt.period || '',
                                    time_range: selectedEnt.time_range || '',
                                    subject: selectedEnt.subject || '',
                                    teacher: selectedEnt.teacher || ''
                                  }));
                                }
                              }
                            }}
                            className="w-full p-2 border border-orange-200 bg-orange-50/10 hover:bg-orange-50/25 rounded-lg text-slate-800 focus:outline-orange-500 font-bold font-sans text-xs transition-all cursor-pointer"
                          >
                            <option value="">-- Choose existing configured slot to load & copy --</option>
                            {uniqueTemplates.map(ent => (
                              <option key={ent.id} value={ent.id}>
                                {ent.period} • {ent.subject} {ent.teacher ? `(${ent.teacher})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}

                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Week Day</label>
                      <select
                        value={entryForm.day}
                        onChange={(e) => setEntryForm({ ...entryForm, day: e.target.value as any })}
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Period Slot Template</label>
                      <select
                        value={isManualPeriod ? 'manual_override' : (entryForm.period || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'manual_override') {
                            setIsManualPeriod(true);
                            setEntryForm(prev => ({ ...prev, period: '', time_range: '' }));
                          } else {
                            setIsManualPeriod(false);
                            const matchedMaster = periodMasters.find(pm => pm.name === val);
                            setEntryForm(prev => ({ 
                              ...prev, 
                              period: val, 
                              time_range: matchedMaster ? matchedMaster.time_range : (prev.time_range || '')
                            }));
                          }
                          setConflictWarning(null);
                        }}
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                      >
                        <option value="">-- Choose Period Master --</option>
                        {periodMasters.map(pm => (
                          <option key={pm.id} value={pm.name}>
                            {pm.name} ({pm.time_range})
                          </option>
                        ))}
                        <option value="manual_override">✍️ Custom Period (Manual Override)</option>
                      </select>
                    </div>

                    {isManualPeriod && (
                      <div className="space-y-1">
                        <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Custom Period Name</label>
                        <input
                          type="text"
                          value={entryForm.period || ''}
                          onChange={(e) => {
                            setEntryForm({ ...entryForm, period: e.target.value });
                            setConflictWarning(null);
                          }}
                          placeholder="e.g. Special Assembly"
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                          required
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">
                        Time Frame {!isManualPeriod && entryForm.period && ' (Auto-populated)'}
                      </label>
                      <input
                        type="text"
                        value={entryForm.time_range || ''}
                        onChange={(e) => setEntryForm({ ...entryForm, time_range: e.target.value })}
                        placeholder="e.g. 09:00 AM - 09:45 AM"
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                        required
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Subject Paper</label>
                      <input
                        type="text"
                        value={entryForm.subject}
                        onChange={(e) => setEntryForm({ ...entryForm, subject: e.target.value })}
                        placeholder="e.g. Mathematics II"
                        list="existing-subjects"
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500"
                        required
                      />
                      <datalist id="existing-subjects">
                        {Array.from(new Set([
                          ...entries.map(e => e.subject),
                          ...faculty.map(f => f.subject)
                        ].filter(Boolean))).map(subj => (
                          <option key={subj} value={subj} />
                        ))}
                      </datalist>
                    </div>

                    {/* Teacher Input from Faculty list */}
                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Assigned Teacher</label>
                      <div className="space-y-1.5">
                        <select
                          value={isManualTeacher ? 'manual_option' : (entryForm.teacher_id || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'manual_option') {
                              setIsManualTeacher(true);
                              setEntryForm(prev => ({ ...prev, teacher: '', teacher_id: undefined }));
                            } else if (val === '') {
                              setIsManualTeacher(false);
                              setEntryForm(prev => ({ ...prev, teacher: '', teacher_id: undefined }));
                            } else {
                              setIsManualTeacher(false);
                              const matched = faculty.find(f => f.id === val);
                              setEntryForm(prev => ({ 
                                ...prev, 
                                teacher: matched ? matched.name : '',
                                teacher_id: val,
                                subject: (matched && matched.subject) ? matched.subject : (prev.subject || '')
                              }));
                            }
                            setConflictWarning(null);
                          }}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500"
                        >
                          <option value="">Select from Faculty List...</option>
                          {faculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.department ||'General'})
                            </option>
                          ))}
                          <option value="manual_option">-- Type manually/custom --</option>
                        </select>
                        
                        {isManualTeacher && (
                          <input
                            type="text"
                            value={entryForm.teacher || ''}
                            onChange={(e) => {
                              setEntryForm({ ...entryForm, teacher: e.target.value });
                              setConflictWarning(null);
                            }}
                            placeholder="Type teacher name..."
                            className="w-full p-2 border border-slate-205 bg-white rounded-lg focus:outline-orange-500"
                            required
                          />
                        )}
                      </div>
                    </div>

                    {/* Non-blocking UI override warning block */}
                    {conflictWarning && (
                      <div className="sm:col-span-3 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2.5 text-slate-800">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-2">
                          <p className="text-[11px] leading-relaxed font-bold">{conflictWarning}</p>
                          <label className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-amber-800 tracking-wider uppercase cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={forceConflict}
                              onChange={(e) => setForceConflict(e.target.checked)}
                              className="mr-1 shadow-xs rounded border-amber-300 text-amber-605"
                            />
                            Instruct manual merging collision schedule bypass
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Strict blocker validation error box */}
                    {formError && (
                      <div className="sm:col-span-3 bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2.5 text-red-800 animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[11px] leading-relaxed font-bold uppercase tracking-wider text-red-700">Strict Validation Blocker</p>
                          <p className="text-[10.5px] leading-normal">{formError}</p>
                        </div>
                      </div>
                    )}

                    <div className="sm:col-span-3 pt-3 flex justify-end gap-2 border-t border-slate-200/55 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingEntry(false);
                          setEditingEntryId(null);
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg inline-block font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center gap-1.5 font-bold cursor-pointer shadow-xs"
                      >
                        <Save className="w-4 h-4" />
                        {editingEntryId ? 'Update Slot Row' : 'Save To Timetable'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* List of configured entries for class */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left border-b border-slate-100 font-mono text-[10px] uppercase text-slate-450 tracking-wider">
                        <th className="py-3 px-4 w-32">Day</th>
                        <th className="py-3 px-4 w-32">Period Row</th>
                        <th className="py-3 px-4 w-44">Time Frame</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Teacher</th>
                        <th className="py-3 px-4 w-32 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                      {classEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400 italic">
                            No slot matrix entries mapped for {selectedClass}. Append some rows above.
                          </td>
                        </tr>
                      ) : (
                        classEntries
                          .sort((a,b) => {
                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                            const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                            if (dayDiff !== 0) return dayDiff;
                            return a.period.localeCompare(b.period);
                          })
                          .map((ent) => (
                            <tr key={ent.id} className="hover:bg-slate-50/50 transition duration-150">
                              <td className="py-3 px-4 font-bold text-slate-900">{ent.day}</td>
                              <td className="py-3 px-4 font-mono font-bold text-orange-600">{ent.period}</td>
                              <td className="py-3 px-4 font-mono font-medium text-slate-500">{ent.time_range}</td>
                              <td className="py-3 px-4 font-bold text-slate-800">{ent.subject}</td>
                              <td className="py-3 px-4 text-slate-550 font-medium">
                                {(() => {
                                  if (ent.teacher_id) {
                                    const f = faculty.find(fac => fac.id === ent.teacher_id);
                                    if (f) return f.name;
                                  }
                                  return ent.teacher;
                                })() ? (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    {(() => {
                                      if (ent.teacher_id) {
                                        const f = faculty.find(fac => fac.id === ent.teacher_id);
                                        if (f) return f.name;
                                      }
                                      return ent.teacher;
                                    })()}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {deletingId === ent.id ? (
                                  <div className="flex items-center justify-center gap-1 animate-in fade-in duration-100">
                                    <button
                                      onClick={() => handleDeleteEntryInline(ent.id)}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] rounded uppercase cursor-pointer"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(null)}
                                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-[9px] rounded uppercase cursor-pointer hover:bg-slate-300"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleEditClick(ent)}
                                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-150 text-slate-500 hover:text-orange-600 hover:border-orange-500/20 cursor-pointer transition-colors"
                                      title="Edit Timing Slot"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(ent.id)}
                                      className="p-1.5 rounded-lg bg-slate-50 border border-slate-150 hover:border-red-500/20 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                      title="Delete Period Slot"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>

      {/* SMART RESOURCE INTEGRITY OPTIMIZER */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-3xs space-y-6" id="smart-resource-optimizer-container">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-sky-100 text-sky-800 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75 animate-duration-1000"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                </span>
                Smart Companion v1.1
              </span>
              <span className="text-xs text-slate-400 font-medium font-sans">| School Routine Audit Intelligence</span>
            </div>
            <h3 className="text-slate-900 font-black text-xl tracking-tight leading-none uppercase">
              Schedule Resource Integrity Optimizer
            </h3>
            <p className="text-slate-500 text-xs font-sans max-w-2xl font-medium">
              Real-time teacher workload balance monitors and gaps detection. Automate substitute teacher suggestions to prevent unattended school lectures.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start md:self-center font-mono">
            <div className="bg-white p-3 px-4 rounded-xl border border-slate-200/75 shadow-3xs text-center min-w-[120px]">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Load</div>
              <div className="text-xl font-black text-sky-900">
                {entries.length} <span className="text-xs text-slate-400 font-medium">periods</span>
              </div>
            </div>
            <div className={`p-3 px-4 rounded-xl border shadow-3xs text-center min-w-[120px] ${getVacantAndGappedSlots().length > 0 ? 'bg-amber-50/50 border-amber-200 animate-pulse' : 'bg-white border-slate-200'}`}>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Unattended Gaps</div>
              <div className={`text-xl font-black ${getVacantAndGappedSlots().length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {getVacantAndGappedSlots().length} <span className="text-xs text-slate-400 font-medium">unassigned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
          {/* Tab Selection */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl w-fit border border-slate-250">
            <button
              onClick={() => setOptimizerTab('workload')}
              className={`py-1.5 px-4 font-bold rounded-lg transition-all duration-100 uppercase text-[10.5px] cursor-pointer ${
                optimizerTab === 'workload'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-550 hover:text-slate-900'
              }`}
            >
              Faculty Workload Balance ({getTeacherWorkloadData().length})
            </button>
            <button
              onClick={() => setOptimizerTab('vacant')}
              className={`py-1.5 px-4 font-bold rounded-lg transition-all duration-100 uppercase text-[10.5px] flex items-center gap-1.5 cursor-pointer ${
                optimizerTab === 'vacant'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-550 hover:text-slate-900'
              }`}
            >
              Class Gaps & Substitution Assistant
              {getVacantAndGappedSlots().length > 0 && (
                <span className="bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-mono leading-none">
                  {getVacantAndGappedSlots().length}
                </span>
              )}
            </button>
          </div>

          {/* Filtering for Vacancies tab */}
          {optimizerTab === 'vacant' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 pl-2">
                <span className="text-[9px] font-mono uppercase font-bold text-slate-400">Day:</span>
                <select
                  value={analyticsDayFilter}
                  onChange={(e) => setAnalyticsDayFilter(e.target.value)}
                  className="bg-transparent border-none py-1 px-2 focus:ring-0 font-extrabold text-slate-700 text-[11px] rounded uppercase cursor-pointer"
                >
                  <option value="All">All Days</option>
                  {weekDays.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 pl-2">
                <span className="text-[9px] font-mono uppercase font-bold text-slate-400">Grade:</span>
                <select
                  value={analyticsClassFilter}
                  onChange={(e) => setAnalyticsClassFilter(e.target.value)}
                  className="bg-transparent border-none py-1 px-2 focus:ring-0 font-extrabold text-slate-700 text-[11px] rounded uppercase cursor-pointer"
                >
                  <option value="All">All Grades</option>
                  {allClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Filtering for Workload tab */}
          {optimizerTab === 'workload' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 pl-2">
                <span className="text-[9px] font-mono uppercase font-bold text-slate-400">Filter Teacher:</span>
                <select
                  value={workloadTeacherFilter}
                  onChange={(e) => setWorkloadTeacherFilter(e.target.value)}
                  className="bg-transparent border-none py-1 px-2 focus:ring-0 font-extrabold text-slate-700 text-[11px] rounded uppercase cursor-pointer max-w-[200px]"
                >
                  <option value="All">All Faculty</option>
                  {allTeachersFromData().map(teacher => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tab Content A: Teacher Workload Balance */}
        {optimizerTab === 'workload' ? (
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-2xs animate-in fade-in duration-200" id="teacher-workload-table-container">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse min-w-[650px]" id="teacher-workload-data-table">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-150 text-left font-mono text-[9.5px] uppercase tracking-wider text-slate-450 font-bold">
                    <th className="py-3.5 px-4 sm:px-5 w-[200px]">Instructor</th>
                    <th className="py-3.5 px-4">Department / Specialty</th>
                    <th className="py-3.5 px-4 w-[90px] hidden md:table-cell">Type</th>
                    <th className="py-3.5 px-3 text-center w-[110px]">Weekly Load</th>
                    <th className="py-3.5 px-4 w-[180px] sm:w-[220px]">Workload Balance Guard</th>
                    <th className="py-3.5 px-4 sm:px-5 text-right font-sans lowercase w-[160px] sm:w-[200px]">details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-sans text-slate-750">
                  {filteredWorkloadData().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 italic font-medium">
                        {workloadTeacherFilter === 'All'
                          ? "No teachers scheduled yet across routine database."
                          : `No workload data found for "${workloadTeacherFilter}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredWorkloadData().map((t) => {
                      let loadStatus = "Light Load";
                      let maxLimit = 15;
                      let progressPercent = Math.min((t.loadCount / maxLimit) * 100, 100);
                      
                      if (t.loadCount > 12) {
                        loadStatus = "Heavy Load / Over-booked";
                      } else if (t.loadCount >= 6) {
                        loadStatus = "Optimal Workload";
                      } else if (t.loadCount > 0) {
                        loadStatus = "Under-committed";
                      } else {
                        loadStatus = "No active classes";
                      }

                      return (
                        <tr key={t.name} className="hover:bg-slate-50/40 transition duration-100 group">
                          <td className="py-3.5 px-4 sm:px-5 font-black text-slate-900 text-xs flex items-center gap-2.5">
                            <span className="p-1 px-2 rounded-full bg-slate-100 border border-slate-200 text-[10px] text-slate-500 font-mono font-bold select-none group-hover:bg-white transition-colors">
                              {t.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <div className="font-sans font-extrabold text-slate-900 text-[12.5px] leading-snug truncate">{t.name}</div>
                              <span className="text-[9px] font-mono font-extrabold text-slate-400 uppercase tracking-widest leading-none block sm:inline">{t.type}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-600 font-sans">
                            {t.department}
                          </td>
                          <td className="py-3.5 px-4 text-[10.5px] hidden md:table-cell">
                            <span className={`px-2 py-0.5 border text-[9px] font-mono leading-none rounded uppercase ${t.type === 'Regular' ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-150' : 'bg-slate-50 text-slate-605 border-slate-150'}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="text-sm font-black font-mono text-slate-950">
                              {t.loadCount}
                            </span>
                            <span className="text-[10px] text-slate-450 font-semibold pl-1">slots</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-mono font-bold leading-none">
                                <span className={`font-semibold ${t.loadCount > 12 ? 'text-red-600' : t.loadCount >= 6 ? 'text-emerald-600' : 'text-amber-600'}`}>{loadStatus}</span>
                                <span className="text-slate-450">{Math.round(progressPercent)}% limit</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-4xs border border-slate-200/40">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${t.loadCount > 12 ? 'bg-red-500' : t.loadCount >= 6 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 sm:px-5 text-right">
                            <div className="flex flex-wrap gap-1 justify-end max-w-sm ml-auto">
                              {t.assignments.length === 0 ? (
                                <span className="text-slate-350 text-[10px] italic">No active slots assigned</span>
                              ) : (
                                t.assignments.map(a => (
                                  <span key={a.id} className="text-[9.5px] bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5 text-slate-600 font-mono leading-none select-none hover:bg-orange-50 hover:border-orange-200 hover:text-orange-900 transition-colors" title={`${a.subject}`}>
                                    {a.day.substring(0,3)} {a.period.replace('Period ','P')}: {a.class_name.replace('Class ','C')}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab Content B: Class Gaps / Vacancies Substitution Assistant */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-200">
            {/* Vacancy Checklist List */}
            <div className="xl:col-span-2 space-y-3">
              <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-mono font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Detected Routine Gaps ({filteredVac_gaps.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-sans font-medium">Click on any gap to trigger the substitute advisor</span>
                </div>

                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100/50">
                  {filteredVac_gaps.length === 0 ? (
                    <div className="text-center py-16 space-y-2 select-none">
                      <div className="mx-auto w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold">
                        ✓
                      </div>
                      <p className="text-slate-850 font-black text-sm">Perfect Grid Integrity!</p>
                      <p className="text-slate-400 text-[11px] font-sans max-w-xs mx-auto leading-relaxed">
                        Every single day/period hour for Grade Classes (9-12) has custom scheduled lectures with assigned teachers. No vacant hours detected!
                      </p>
                    </div>
                  ) : (
                    filteredVac_gaps.map((gap) => {
                      const isUnscheduled = gap.reason === 'unscheduled';
                      const isSelected = quickAssignSlot && 
                                         quickAssignSlot.className === gap.class_name && 
                                         quickAssignSlot.day === gap.day && 
                                         quickAssignSlot.period === gap.period;

                      return (
                        <div 
                          key={gap.key}
                          onClick={() => {
                            setQuickAssignSlot({
                              className: gap.class_name,
                              day: gap.day,
                              period: gap.period,
                              timeRange: gap.time_range
                            });
                            setQuickForm({
                              subject: gap.entry?.subject || '',
                              teacher: gap.entry?.teacher || '',
                              isManual: false
                            });
                            setQuickConflictWarning(null);
                            setQuickForceConflict(false);
                            setQuickError(null);
                          }}
                          className={`pt-3 pb-3 px-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer transition ${
                            isSelected 
                              ? 'bg-orange-500/10 border-orange-550/30 border-2 shadow-2xs' 
                              : 'bg-white hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-extrabold uppercase select-none leading-none">
                                {gap.class_name}
                              </span>
                              <span className="text-xs text-slate-800 font-extrabold">
                                {gap.day} • <span className="text-orange-600 font-extrabold font-mono">{gap.period}</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 leading-none">
                                {gap.time_range}
                              </span>
                            </div>
                            
                            <p className="text-[10.5px] text-slate-500 font-sans leading-normal font-medium italic flex items-center gap-1">
                              {isUnscheduled ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                  <span>Unpopulated hour. Absolutely no subject/lecture allocated in database matrix yet.</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-ping" />
                                  <span>Class scheduled (<strong>{gap.entry?.subject}</strong>) but teacher left blank. No faculty assigned.</span>
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border select-none ${
                              isUnscheduled 
                                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                : 'bg-red-50 text-red-705 border-red-200'
                            }`}>
                              {isUnscheduled ? 'Silent Gap' : 'Instructor Omission'}
                            </span>
                            <button className={`py-1.5 px-3 rounded-lg text-[10px] uppercase font-bold transition-all ${
                              isSelected
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-700 hover:bg-orange-500 hover:text-white cursor-pointer'
                            }`}>
                              {isSelected ? 'Selected' : 'Find Substitute'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Substitution Assistant Panel */}
            <div className="xl:col-span-1">
              {quickAssignSlot ? (
                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-3xs space-y-4 animate-in slide-in-from-right-3 duration-150">
                  <div className="pb-2.5 border-b border-slate-100/80">
                    <span className="text-[9px] font-mono font-bold bg-orange-100 text-orange-950 px-2 py-0.5 rounded uppercase select-none leading-none">
                      Cover Optimizer ✨
                    </span>
                    <h4 className="text-slate-900 font-black text-sm font-sans mt-2">
                      Assigning {quickAssignSlot.className}
                    </h4>
                    <p className="text-slate-450 text-[10.5.5px] font-mono font-black leading-tight mt-0.5 uppercase tracking-wide">
                      {quickAssignSlot.day} • {quickAssignSlot.period}
                    </p>
                  </div>

                  {/* Smart substitute recommendations */}
                  <div className="space-y-2.5">
                    <span className="block text-[10px] uppercase font-mono font-extrabold text-slate-400 tracking-wider">
                      Suggested Substitute Teachers (Totally Free now):
                    </span>
                    
                    <div className="space-y-1 w-full max-h-44 overflow-y-auto pr-1">
                      {getAvailableTeachersForSlot(quickAssignSlot.day, quickAssignSlot.period).length === 0 ? (
                        <div className="p-2 border border-dashed border-red-200 bg-red-50 text-red-800 text-[10.5px] rounded-lg leading-normal font-sans">
                          Conflict Alert: Every single teacher in the facility is already busy teaching other classes during this specific period slot! Consider typing a custom temp teacher below.
                        </div>
                      ) : (
                        getAvailableTeachersForSlot(quickAssignSlot.day, quickAssignSlot.period).map(t => {
                          const fModel = faculty.find(f => f.name.toLowerCase().trim() === t.name.toLowerCase().trim());
                          const teacherSubject = fModel?.subject || '';
                          return (
                            <div 
                              key={t.name}
                              onClick={() => {
                                setQuickForm(prev => ({ 
                                  ...prev, 
                                  teacher: t.name, 
                                  teacher_id: t.id,
                                  isManual: false,
                                  subject: teacherSubject ? teacherSubject : (prev.subject || '')
                                }));
                                setQuickConflictWarning(null);
                              }}
                              className={`p-2 border rounded-xl flex items-center justify-between text-xs cursor-pointer select-none transition duration-100 ${
                                quickForm.teacher === t.name 
                                  ? 'bg-orange-50 border-orange-300' 
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                            <div className="space-y-0.5">
                              <div className="font-extrabold text-slate-800 leading-none">{t.name}</div>
                              <div className="text-[9px] font-mono text-slate-450">{t.department}</div>
                            </div>
                            <span className="text-[9px] font-mono font-black uppercase text-orange-700 bg-white px-1.5 py-0.5 rounded border border-orange-100">
                              Free Now ({t.loadCount}c)
                            </span>
                          </div>
                        ); })
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleQuickAssignSubmit} className="space-y-3 text-xs font-semibold font-sans">
                    {/* Teacher Input */}
                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Assigned Teacher</label>
                      <div className="space-y-1.5">
                        <select
                          value={quickForm.isManual ? 'manual_option' : (quickForm.teacher_id || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'manual_option') {
                              setQuickForm(prev => ({ ...prev, isManual: true, teacher: '', teacher_id: undefined }));
                            } else if (val === '') {
                              setQuickForm(prev => ({ ...prev, isManual: false, teacher: '', teacher_id: undefined }));
                            } else {
                              const matched = faculty.find(f => f.id === val);
                              setQuickForm(prev => ({ 
                                ...prev, 
                                isManual: false, 
                                teacher: matched ? matched.name : '',
                                teacher_id: val,
                                subject: (matched && matched.subject) ? matched.subject : (prev.subject || '')
                              }));
                            }
                            setQuickConflictWarning(null);
                          }}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg font-medium font-sans focus:outline-orange-500"
                        >
                          <option value="">Select recommended teacher...</option>
                          {faculty.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.department || 'General'})
                            </option>
                          ))}
                          <option value="manual_option">-- Type manually/custom --</option>
                        </select>

                        {quickForm.isManual && (
                          <input
                            type="text"
                            value={quickForm.teacher}
                            onChange={(e) => {
                              setQuickForm({ ...quickForm, teacher: e.target.value });
                              setQuickConflictWarning(null);
                            }}
                            required
                            placeholder="Type teacher name..."
                            className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                          />
                        )}
                      </div>
                    </div>

                    {/* Subject field */}
                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Subject Paper</label>
                      <input
                        type="text"
                        value={quickForm.subject}
                        onChange={(e) => setQuickForm({ ...quickForm, subject: e.target.value })}
                        required
                        placeholder="e.g. Chemistry II, Biology Lab"
                        list="existing-subjects"
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500 font-medium"
                      />
                    </div>

                    {/* Strict blocker validation error box */}
                    {quickError && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2.5 text-red-800 animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                        <div className="flex-1 text-left">
                          <p className="text-[11px] leading-relaxed font-bold uppercase tracking-wider text-red-700">Strict Validation Blocker</p>
                          <p className="text-[10.5px] leading-normal">{quickError}</p>
                        </div>
                      </div>
                    )}

                    {/* Conflict Override Warn */}
                    {quickConflictWarning && (
                      <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-slate-805 space-y-1.5 font-medium border-dashed">
                        <p className="text-[10.5px] leading-relaxed font-bold">{quickConflictWarning}</p>
                        <label className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase text-amber-800 tracking-wider cursor-pointer">
                          <input
                            type="checkbox"
                            checked={quickForceConflict}
                            onChange={(e) => setQuickForceConflict(e.target.checked)}
                            className="rounded border-amber-300 text-amber-605 focus:ring-amber-500 mr-0.5"
                          />
                          Confirm override collision
                        </label>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-slate-100 font-black">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickAssignSlot(null);
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg uppercase tracking-wider text-[9.5px] cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!quickForm.teacher}
                        className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg uppercase tracking-wider text-[9.5px] shadow-sm disabled:opacity-40 cursor-pointer text-center"
                      >
                        Deploy Assistant!
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-slate-350 rounded-2xl p-6 text-center text-slate-400 font-sans font-medium space-y-2 select-none h-full flex flex-col justify-center items-center min-h-[300px]">
                  <div className="w-12 h-12 rounded-full border bg-white border-slate-150 text-slate-350 shadow-3xs flex items-center justify-center text-lg">
                    ✨
                  </div>
                  <h4 className="text-slate-800 font-black text-xs uppercase tracking-wider leading-none">No Slot Highlighted</h4>
                  <p className="text-[10.5px] max-w-[220px] leading-normal italic text-slate-450">
                    Tap any detected gap or unassigned lecture row inside the gap checklist to analyze available substitutes and auto-assign cover.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// ============================================================================
// B. EXAMS ADMINISTRATIVE MODULE
// ============================================================================
const ExamAdminModule: React.FC<ModuleSubProps> = ({ triggerMedia }) => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Confirmation safe state trackers
  const [deletingSchId, setDeletingSchId] = useState<string | null>(null);
  const [deletingEntId, setDeletingEntId] = useState<string | null>(null);

  // Edit schedule title states
  const [editingSchId, setEditingSchId] = useState<string | null>(null);
  const [editSchTitle, setEditSchTitle] = useState<string>('');

  // Edit exam entry states
  const [editingExamEntId, setEditingExamEntId] = useState<string | null>(null);
  const [editExamEntDate, setEditExamEntDate] = useState<string>('');
  const [editExamEntSubject, setEditExamEntSubject] = useState<string>('');
  const [editExamEntTime, setEditExamEntTime] = useState<string>('');
  const [editExamEntNotes, setEditExamEntNotes] = useState<string>('');

  // Form states
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newEntryForm, setNewEntryForm] = useState<Partial<ExamEntry>>({
    exam_date: '',
    subject: '',
    time: '10:00 AM - 01:00 PM',
    notes: ''
  });

  const fetchLocalData = () => {
    const list = dbService.getExamSchedules();
    setSchedules(list);
    setEntries(dbService.getExamEntries());
    if (list.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(list[0].id);
    }
  };

  useEffect(() => {
    fetchLocalData();
  }, []);

  const activeSchedule = schedules.find(s => s.id === selectedScheduleId);
  const activeEntries = entries.filter(e => e.schedule_id === selectedScheduleId);

  // Toggle display mode between 'online' & 'pdf'
  const toggleDisplayMethod = (mode: 'online' | 'pdf') => {
    if (!activeSchedule) return;
    dbService.updateExamSchedule(activeSchedule.id, { display_mode: mode });
    fetchLocalData();
  };

  // Toggle status (Active / Inactive Datesheet)
  const toggleActiveStatus = (val: boolean) => {
    if (!activeSchedule) return;
    dbService.updateExamSchedule(activeSchedule.id, { is_active: val });
    fetchLocalData();
  };

  // Add Exam Schedule
  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleTitle) return;

    const newSch = dbService.createExamSchedule({
      title: newScheduleTitle,
      display_mode: 'online',
      pdf_url: '',
      is_active: true
    });

    setIsAddingSchedule(false);
    setNewScheduleTitle('');
    setSelectedScheduleId(newSch.id);
    fetchLocalData();
  };

  // Delete Exam datesheet Inline
  const handleDeleteScheduleInline = async (schId: string) => {
    await dbService.deleteExamSchedule(schId);
    if (selectedScheduleId === schId) {
      const remaining = schedules.filter(s => s.id !== schId);
      setSelectedScheduleId(remaining[0]?.id || '');
    }
    setDeletingSchId(null);
    fetchLocalData();
  };

  const handleStartEditSchedule = (sch: ExamSchedule) => {
    setEditingSchId(sch.id);
    setEditSchTitle(sch.title);
  };

  const handleSaveEditSchedule = (schId: string) => {
    if (!editSchTitle.trim()) return;
    dbService.updateExamSchedule(schId, { title: editSchTitle.trim() });
    setEditingSchId(null);
    setEditSchTitle('');
    fetchLocalData();
  };

  const handleCancelEditSchedule = () => {
    setEditingSchId(null);
    setEditSchTitle('');
  };

  const handleStartEditEntry = (ent: ExamEntry) => {
    setEditingExamEntId(ent.id);
    setEditExamEntDate(ent.exam_date);
    setEditExamEntSubject(ent.subject);
    setEditExamEntTime(ent.time || '');
    setEditExamEntNotes(ent.notes || '');
  };

  const handleSaveEditEntry = async (entryId: string) => {
    if (!editExamEntDate.trim() || !editExamEntSubject.trim()) return;
    await dbService.updateExamEntry(entryId, {
      exam_date: editExamEntDate.trim(),
      subject: editExamEntSubject.trim(),
      time: editExamEntTime.trim(),
      notes: editExamEntNotes.trim()
    });
    setEditingExamEntId(null);
    fetchLocalData();
  };

  const handleCancelEditEntry = () => {
    setEditingExamEntId(null);
    setEditExamEntDate('');
    setEditExamEntSubject('');
    setEditExamEntTime('');
    setEditExamEntNotes('');
  };

  // Upload/Choose PDF
  const handlePickPDF = () => {
    if (!activeSchedule) return;
    triggerMedia(
      `Attach Exam Datesheet PDF [${activeSchedule.title}]`,
      (url) => {
        dbService.updateExamSchedule(activeSchedule.id, { pdf_url: url });
        fetchLocalData();
      }
    );
  };

  // Adds an entry subject paper date inside schedule
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSchedule || !newEntryForm.exam_date || !newEntryForm.subject) return;

    dbService.createExamEntry({
      schedule_id: activeSchedule.id,
      exam_date: newEntryForm.exam_date,
      subject: newEntryForm.subject,
      time: newEntryForm.time || '',
      notes: newEntryForm.notes || ''
    });

    setIsAddingEntry(false);
    setNewEntryForm({ exam_date: '', subject: '', time: '10:00 AM - 01:00 PM', notes: '' });
    fetchLocalData();
  };

  // Delete an assessment date column entry Inline
  const handleDeleteEntryInline = async (entId: string) => {
    await dbService.deleteExamEntry(entId);
    setDeletingEntId(null);
    fetchLocalData();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* SIDEBAR SELECTOR PANEL */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-3xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider block">
              Created Datesheets
            </span>
            <button
              onClick={() => setIsAddingSchedule(true)}
              className="p-1 rounded bg-orange-50 text-orange-600 hover:bg-orange-100 transition"
              title="Create Datesheet"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingSchedule ? (
            <form onSubmit={handleCreateSchedule} className="space-y-2.5 animate-in slide-in-from-top-2 duration-100">
              <input
                type="text"
                placeholder="Datesheet Title"
                value={newScheduleTitle}
                onChange={(e) => setNewScheduleTitle(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-55 bg-slate-50 font-sans"
                required
              />
              <div className="flex gap-2 justify-end text-[10px] font-bold font-sans">
                <button
                  type="button"
                  onClick={() => setIsAddingSchedule(false)}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-705 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Create
                </button>
              </div>
            </form>
          ) : null}

          <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
            {schedules.map((sch) => (
              <div
                key={sch.id}
                className={`w-full text-left p-3 rounded-xl border flex justify-between items-start gap-2 ${
                  selectedScheduleId === sch.id
                    ? 'border-orange-500 bg-orange-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {editingSchId === sch.id ? (
                  <div className="flex-grow space-y-1.5 font-sans" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editSchTitle}
                      onChange={(e) => setEditSchTitle(e.target.value)}
                      className="w-full p-1.5 border border-orange-400 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                      placeholder="Exam Datesheet Title"
                      autoFocus
                    />
                    <div className="flex gap-1.5 justify-end text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={handleCancelEditSchedule}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditSchedule(sch.id)}
                        className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded flex items-center gap-0.5"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer flex-grow" onClick={() => setSelectedScheduleId(sch.id)}>
                    <span className={`px-1.5 py-0.5 text-[8.5px] font-mono uppercase font-bold rounded-full ${
                      sch.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-105 text-slate-500 bg-slate-50'
                    }`}>
                      {sch.is_active ? 'Active' : 'Draft'}
                    </span>
                    <p className="font-extrabold text-xs text-slate-900 mt-1 line-clamp-2 leading-tight">
                      {sch.title}
                    </p>
                  </div>
                )}

                {editingSchId === sch.id ? null : (
                  deletingSchId === sch.id ? (
                    <div className="flex flex-col gap-1 items-end animate-in fade-in duration-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-[9px] text-red-600 font-bold">Delete wholly?</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDeleteScheduleInline(sch.id)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] rounded uppercase cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingSchId(null)}
                          className="px-2 py-0.5 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-[9px] rounded uppercase cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartEditSchedule(sch)}
                        className="p-1 text-slate-400 hover:text-orange-500 rounded hover:bg-slate-100 cursor-pointer"
                        title="Edit Exam Datesheet Title"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingSchId(sch.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 cursor-pointer shrink-0"
                        title="Delete Exam Datesheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAIL WORKSPACE DISPLAY */}
      <div className="lg:col-span-3">
        {activeSchedule ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
            
            {/* Header section toggle info */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-orange-600 uppercase">Assessment Configurator</span>
                <h3 className="text-slate-900 font-extrabold text-base leading-snug">{activeSchedule.title}</h3>
              </div>

              {/* Status and Display method buttons */}
              <div className="flex flex-wrap gap-2 text-xs font-bold font-sans">
                {/* Active draft switcher toggle */}
                <button
                  onClick={() => toggleActiveStatus(!activeSchedule.is_active)}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer font-sans text-[11px] ${
                    activeSchedule.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-550 hover:bg-slate-100 border-slate-200/60'
                  }`}
                >
                  {activeSchedule.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {activeSchedule.is_active ? 'Published Active' : 'Draft (Hidden)'}
                </button>

                {/* PDF Online toggle display */}
                <div className="flex bg-slate-50 p-0.5 border border-slate-150 rounded-lg">
                  <button
                    onClick={() => toggleDisplayMethod('online')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                      activeSchedule.display_mode === 'online' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Online Grid
                  </button>
                  <button
                    onClick={() => toggleDisplayMethod('pdf')}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${
                      activeSchedule.display_mode === 'pdf' ? 'bg-white text-orange-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    PDF Flyer
                  </button>
                </div>
              </div>
            </div>

            {/* Depending on toggle: Render direct PDF attachments or Online slot configurations */}
            {activeSchedule.display_mode === 'pdf' ? (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block pb-1 border-b border-slate-100">
                  Document Assignment
                </span>
                <p className="text-slate-500 text-xs">
                  Attach or choose the assessment flyer layout sheet. Download portals automatically sync.
                </p>

                <div className="p-5 bg-slate-50 border border-slate-155 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-850 block">Assigned Document:</span>
                    <span className="font-mono text-[10.5px] text-slate-500 bg-white p-1 border border-slate-200 rounded block max-w-sm truncate">
                      {activeSchedule.pdf_url || 'No document sourced'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handlePickPDF}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg uppercase tracking-wider font-sans text-[10.5px]"
                    >
                      Pick from Media Vault
                    </button>
                    {activeSchedule.pdf_url && (
                      <a href={activeSchedule.pdf_url} target="_blank" rel="noreferrer" className="px-3.5 py-2 border bg-white rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-50">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ONLINE ROW ENTRIES BUILDER */
              <div className="space-y-4" id="exams-online-admin">
                <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-100">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-450 tracking-wider">Exam Papers Slots</span>
                  {!isAddingEntry && (
                    <button
                      onClick={() => setIsAddingEntry(true)}
                      className="py-1.5 px-3 bg-sky-900 hover:bg-sky-950 text-white font-bold text-[10px] uppercase rounded-lg tracking-wider"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isAddingEntry && (
                  /* Form to append entries */
                  <form onSubmit={handleCreateEntry} className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3.5 text-xs font-semibold font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Exam Date</label>
                        <input
                          type="date"
                          value={newEntryForm.exam_date}
                          onChange={(e) => setNewEntryForm({ ...newEntryForm, exam_date: e.target.value })}
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Subject Paper</label>
                        <input
                          type="text"
                          value={newEntryForm.subject}
                          onChange={(e) => setNewEntryForm({ ...newEntryForm, subject: e.target.value })}
                          placeholder="e.g. Mathematics Paper I"
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Exam Session Time</label>
                        <input
                          type="text"
                          value={newEntryForm.time}
                          onChange={(e) => setNewEntryForm({ ...newEntryForm, time: e.target.value })}
                          placeholder="e.g. 10:00 AM - 01:00 PM"
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Directives / Room No / Notes</label>
                      <input
                        type="text"
                        value={newEntryForm.notes}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, notes: e.target.value })}
                        placeholder="e.g. Room No. 12 & 14. Bring registration receipts cardboard sheets."
                        className="w-full p-2 border border-slate-200 bg-white rounded-lg"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/55">
                      <button
                        type="button"
                        onClick={() => setIsAddingEntry(false)}
                        className="px-3.5 py-2 bg-slate-200 text-slate-705 font-bold rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg"
                      >
                        Append Paper Row
                      </button>
                    </div>
                  </form>
                )}

                {/* Grid tabular layout of datesheet entries list */}
                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left border-b border-slate-100 font-mono text-[9.5px] uppercase text-slate-450 tracking-wider">
                        <th className="py-2.5 px-4 w-32">Exam Date</th>
                        <th className="py-2.5 px-4">Subject</th>
                        <th className="py-2.5 px-4 w-44">Exam Timing</th>
                        <th className="py-2.5 px-4">Administrative Directives</th>
                        <th className="py-2.5 px-4 w-16 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                      {activeEntries.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-405 italic">
                            No subject paper dates mapped in datesheet. Append key assessment slots above.
                          </td>
                        </tr>
                      ) : (
                        activeEntries
                          .sort((a,b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
                          .map((ent) => (
                            <tr key={ent.id} className="hover:bg-slate-50/50 transition">
                              {editingExamEntId === ent.id ? (
                                <>
                                  <td className="py-2 px-3">
                                    <input
                                      type="date"
                                      value={editExamEntDate}
                                      onChange={(e) => setEditExamEntDate(e.target.value)}
                                      className="w-full p-1.5 border border-orange-300 rounded font-mono text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="text"
                                      value={editExamEntSubject}
                                      onChange={(e) => setEditExamEntSubject(e.target.value)}
                                      className="w-full p-1.5 border border-orange-300 rounded text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-950"
                                      placeholder="Subject"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <input
                                      type="text"
                                      value={editExamEntTime}
                                      onChange={(e) => setEditExamEntTime(e.target.value)}
                                      className="w-full p-1.5 border border-orange-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 text-orange-600 font-bold"
                                      placeholder="Exam Time"
                                    />
                                  </td>
                                  <td className="py-2 px-3">
                                    <textarea
                                      value={editExamEntNotes}
                                      onChange={(e) => setEditExamEntNotes(e.target.value)}
                                      className="w-full p-1.5 border border-orange-300 rounded text-xs leading-normal focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700"
                                      placeholder="Administrative Directives"
                                      rows={1}
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditEntry(ent.id)}
                                        className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition"
                                        title="Save Changes"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancelEditEntry}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                        title="Cancel Changes"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{formatShortDate(ent.exam_date)}</td>
                                  <td className="py-3 px-4 font-bold text-slate-950">{ent.subject}</td>
                                  <td className="py-3 px-4 text-orange-600 font-mono font-bold leading-none">{ent.time}</td>
                                  <td className="py-3 px-4 text-slate-500 leading-relaxed font-sans font-medium max-w-xs">{ent.notes || '—'}</td>
                                  <td className="py-3 px-4 text-center text-xs">
                                    {deletingEntId === ent.id ? (
                                      <div className="flex items-center justify-center gap-1 animate-in fade-in duration-100">
                                        <button
                                          onClick={() => handleDeleteEntryInline(ent.id)}
                                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] rounded uppercase cursor-pointer"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          onClick={() => setDeletingEntId(null)}
                                          className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-[9px] rounded uppercase cursor-pointer hover:bg-slate-300"
                                        >
                                          No
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => handleStartEditEntry(ent)}
                                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-orange-500 cursor-pointer"
                                          title="Edit assessment timing slot"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setDeletingEntId(ent.id)}
                                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 cursor-pointer"
                                          title="Delete assessment timing slot"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 bg-white border border-slate-150 rounded-2xl text-center max-w-sm mx-auto shadow-2xs">
            <BookOpen className="w-12 h-12 text-slate-350 mx-auto mb-4" />
            <h4 className="text-xs font-mono font-bold uppercase text-slate-700">Assessment Desk Void</h4>
            <p className="text-slate-400 text-xs mt-1 leading-normal font-sans">Use sidebar plus actions to spawn complete board date leaflets.</p>
          </div>
        )}
      </div>
    </div>
  );
};


// ============================================================================
// C. ACADEMIC CALENDAR ADMINISTRATIVE MODULE
// ============================================================================
const CalendarAdminModule: React.FC<ModuleSubProps> = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    event_date: '',
    title: '',
    event_type: 'Holiday',
    description: ''
  });

  const fetchLocalData = () => {
    setEvents(dbService.getCalendarEvents());
  };

  useEffect(() => {
    fetchLocalData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.event_date || !eventForm.title) return;

    if (editingEventId) {
      await dbService.updateCalendarEvent(editingEventId, {
        event_date: eventForm.event_date,
        title: eventForm.title,
        event_type: (eventForm.event_type || 'Holiday') as CalendarEventType,
        description: eventForm.description || ''
      });
    } else {
      await dbService.createCalendarEvent({
        event_date: eventForm.event_date,
        title: eventForm.title,
        event_type: (eventForm.event_type || 'Holiday') as CalendarEventType,
        description: eventForm.description || ''
      });
    }

    setIsAddingEvent(false);
    setEditingEventId(null);
    setEventForm({ event_date: '', title: '', event_type: 'Holiday', description: '' });
    fetchLocalData();
  };

  const handleStartEditEvent = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setEventForm({
      event_date: ev.event_date,
      title: ev.title,
      event_type: ev.event_type,
      description: ev.description || ''
    });
    setIsAddingEvent(true);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const handleDeleteEvent = async (evId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove school calendar event "${name}"?`)) return;
    await dbService.deleteCalendarEvent(evId);
    fetchLocalData();
  };

  const getBadgeStyle = (type: CalendarEventType) => {
    switch (type) {
      case 'Holiday': return 'bg-emerald-50 text-emerald-700 border-emerald-200/55';
      case 'Examination': return 'bg-rose-50 text-rose-700 border-rose-200/55';
      case 'Parent Meeting': return 'bg-indigo-50 text-indigo-700 border-indigo-200/55';
      case 'Admission Date': return 'bg-sky-50 text-sky-700 border-sky-200/55';
      case 'School Event': return 'bg-violet-50 text-violet-700 border-violet-200/55';
      default: return 'bg-slate-55 bg-slate-50 text-slate-705 border-slate-200/55';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-slate-900 text-sm font-bold uppercase tracking-wide">
            School Calendar Registry Matrix
          </h3>
          <p className="text-slate-500 text-[11px] font-sans">
            Add BSEB registrations schedules, holiday files lists, inter-school cultural contests, and parental board meets.
          </p>
        </div>

        {!isAddingEvent && (
          <button
            onClick={() => {
              setEditingEventId(null);
              setEventForm({ event_date: '', title: '', event_type: 'Holiday', description: '' });
              setIsAddingEvent(true);
            }}
            className="py-2 px-4.5 bg-sky-900 hover:bg-sky-950 text-white font-bold text-[10.5px] uppercase rounded-xl tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Calendar Event
          </button>
        )}
      </div>

      {isAddingEvent && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm animate-in zoom-in-95 duration-100">
          <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-200/50 mb-4 font-mono font-bold uppercase text-slate-500 select-none">
            <span>{editingEventId ? 'Edit Calendar Agenda' : 'Register New Calendar Agenda'}</span>
            <button
              onClick={() => {
                setIsAddingEvent(false);
                setEditingEventId(null);
                setEventForm({ event_date: '', title: '', event_type: 'Holiday', description: '' });
              }}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold font-sans">
            <div className="space-y-1">
              <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Event Date</label>
              <input
                type="date"
                value={eventForm.event_date}
                onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                className="w-full p-2 border border-slate-250 bg-white rounded-lg"
                required
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Agenda Title</label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="e.g. Independence Day Patriotic Exhibition"
                className="w-full p-2 border border-slate-250 bg-white rounded-lg"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Activity Category</label>
              <select
                value={eventForm.event_type}
                onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as any })}
                className="w-full p-2 border border-slate-250 bg-white rounded-lg"
              >
                {['Holiday', 'Examination', 'Parent Meeting', 'Admission Date', 'School Event'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-4">
              <label className="text-slate-550 block text-[10px] uppercase font-mono font-bold">Event Circular Description / Directives</label>
              <input
                type="text"
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Details of school circular timings or off-class orders..."
                className="w-full p-2 border border-slate-250 bg-white rounded-lg"
              />
            </div>

            <div className="sm:col-span-4 pt-3 border-t border-slate-205 flex justify-end gap-2 border-slate-200/50 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingEvent(false);
                  setEditingEventId(null);
                  setEventForm({ event_date: '', title: '', event_type: 'Holiday', description: '' });
                }}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold"
              >
                {editingEventId ? 'Save Changes' : 'Save Agenda'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Calendar items chronologically */}
      {events.length === 0 ? (
        <SharedEmptyState
          icon={<Calendar className="w-10 h-10" />}
          headline="No academic calendar events loaded"
          description="Create your first agenda entry using the action button above to populate the registry."
          action={!isAddingEvent ? {
            label: "Create Calendar Event",
            onClick: () => {
              setEditingEventId(null);
              setEventForm({ event_date: '', title: '', event_type: 'Holiday', description: '' });
              setIsAddingEvent(true);
            },
            icon: <Plus className="w-4 h-4" />
          } : undefined}
        />
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs">
          {/* DESKTOP & TABLET ADAPTIVE TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-100 font-mono text-[9.5px] uppercase text-slate-450 tracking-wider">
                  <th className="py-2.5 px-4 w-36">Scheduled Date</th>
                  <th className="py-2.5 px-4 w-40">Agenda Category</th>
                  <th className="py-2.5 px-4">Circular Title</th>
                  <th className="py-2.5 px-4 hidden lg:table-cell">Remarks / Notes</th>
                  <th className="py-2.5 px-4 w-20 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                {events
                  .sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                  .map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatShortDate(ev.event_date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 border rounded-full uppercase tracking-wider font-sans text-[9px] font-bold ${getBadgeStyle(ev.event_type)}`}>
                          {ev.event_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{ev.title}</div>
                        {/* Tablet-only remarks rollup */}
                        <div className="lg:hidden text-[11px] text-slate-500 font-normal leading-normal mt-1">
                          {ev.description || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 leading-normal max-w-sm font-sans font-medium hidden lg:table-cell">
                        {ev.description || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEditEvent(ev)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-orange-500 cursor-pointer"
                            title="Edit Event Agenda"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id, ev.title)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-500 cursor-pointer"
                            title="Remove Event Agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE ACADEMIC CALENDAR CARDS */}
          <div className="block md:hidden p-4 space-y-4 bg-slate-50/50">
            <div className="grid grid-cols-1 gap-4">
              {events
                .sort((a,b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                .map((ev) => {
                  const categoryBadge = (
                    <span className={`px-2 py-0.5 border rounded-full uppercase tracking-wider font-sans text-[9px] font-bold leading-none ${getBadgeStyle(ev.event_type)}`}>
                      {ev.event_type}
                    </span>
                  );

                  const metadataFields = [
                    { icon: <Calendar className="w-3.5 h-3.5 text-sky-900" />, label: 'Scheduled', value: formatShortDate(ev.event_date) }
                  ];

                  const cardActions = [
                    {
                      label: 'Edit',
                      icon: <Edit className="w-3.5 h-3.5" />,
                      onClick: () => handleStartEditEvent(ev)
                    },
                    {
                      label: 'Delete',
                      icon: <Trash2 className="w-3.5 h-3.5" />,
                      onClick: () => handleDeleteEvent(ev.id, ev.title),
                      variant: 'danger' as const
                    }
                  ];

                  return (
                    <ResponsiveEntityCard
                      key={ev.id}
                      id={ev.id}
                      title={ev.title}
                      description={ev.description || '—'}
                      badges={[categoryBadge]}
                      metadata={metadataFields}
                      actions={cardActions}
                    />
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
