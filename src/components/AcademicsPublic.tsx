/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  Download, 
  Search, 
  FileText, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  ArrowUpRight, 
  CheckCircle,
  Award,
  CalendarDays,
  ListFilter,
  Users,
  Info
} from 'lucide-react';
import { dbService } from '../services/db';
import { Routine, RoutineEntry, ExamSchedule, ExamEntry, CalendarEvent, CalendarEventType, AcademicClass } from '../types';
import { ConsolidatedRoutineMatrix } from './ConsolidatedRoutineMatrix';
import { useDataSync } from '../hooks/useDataSync';

// ==========================================
// UTILS
// ==========================================
const formatLongDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimetableTimestamp = (isoString: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  
  return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
};

const getCategoryColor = (type: CalendarEventType) => {
  switch (type) {
    case 'Holiday':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
    case 'Examination':
      return 'bg-rose-50 text-rose-700 border-rose-200/50';
    case 'Parent Meeting':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
    case 'Admission Date':
      return 'bg-sky-50 text-sky-700 border-sky-200/50';
    case 'School Event':
      return 'bg-violet-50 text-violet-700 border-violet-200/50';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200/50';
  }
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

// ==========================================
// 1. CLASS ROUTINE MODULE
// ==========================================
export const ClassRoutinePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<AcademicClass | 'FullMatrix'>('Class 9');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [entries, setEntries] = useState<RoutineEntry[]>([]);

  const loadRoutines = () => {
    console.log('[ACADEMICS RELOAD]');
    console.log(dbService.getRoutines().length);
    setRoutines(dbService.getRoutines());
    console.log('[ACADEMICS STATE UPDATED]');
    setEntries(dbService.getRoutineEntries());
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  useDataSync(loadRoutines, 'ClassRoutinePage');

  const activeRoutine = routines.find(r => r.class_name === selectedClass);
  const classEntries = entries.filter(e => e.routine_id === activeRoutine?.id);

  // Check override eligibility
  const isOverrideActive = () => {
    if (!activeRoutine || !activeRoutine.override_active) return false;
    if (!activeRoutine.override_start || !activeRoutine.override_end) return activeRoutine.override_active;
    
    const todayStr = new Date().toISOString().split('T')[0];
    return todayStr >= activeRoutine.override_start && todayStr <= activeRoutine.override_end;
  };

  const hasOverride = isOverrideActive();

  // Organise entries into Days and Periods map
  // Find all periods (dynamically includes central masters so columns match cleanly)
  const masterPeriodNames = dbService.getPeriodMasters().map(pm => pm.name);
  const foundPeriodNames = classEntries.map(e => e.period) as string[];
  const uniquePeriods: string[] = Array.from(new Set([...masterPeriodNames, ...foundPeriodNames]))
    .sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 99;
      const numB = parseInt(b.replace(/\D/g, '')) || 99;
      return numA - numB;
    });

  // Get time for period from any entry that has it matching selectedClass or fall back to Period Master
  const getPeriodTime = (p: string) => {
    const matched = classEntries.find(e => e.period === p && e.time_range);
    if (matched?.time_range) return matched.time_range;
    const master = dbService.getPeriodMasters().find(m => m.name.toLowerCase().trim() === p.toLowerCase().trim());
    return master?.time_range || '';
  };

  const getEntry = (day: string, period: string) => {
    return classEntries.find(e => e.day === day && e.period === period);
  };

  const isSimplifiedPdfMode = routines.length > 0 &&
    routines.every(r => r.display_mode === 'pdf') &&
    routines.every(r => r.pdf_url && r.pdf_url === routines[0].pdf_url);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="class-routine-public">
      {/* Header Summary Tab */}
      <div className="border-b border-slate-200 pb-5 mb-8">
        <span className="text-xs font-mono font-extrabold text-orange-600 uppercase tracking-widest block">
          {isSimplifiedPdfMode ? 'Official School Timetable' : 'Academic Timetable Registry'}
        </span>
        <h1 className="text-slate-900 text-2xl sm:text-3xl font-black mt-1 tracking-tight">
          {isSimplifiedPdfMode ? 'Weekly Class Routine' : 'Weekly Class Routines'}
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-xl font-sans font-medium">
          {isSimplifiedPdfMode 
            ? 'Access the centralized, unified school timetable approved by the school administration.'
            : 'Access structured period listings, assigned subject teachers, and digital override dates authorized by BSEB code.'}
        </p>
      </div>

      {/* Class Level Selection Buttons (Hidden in simplified mode) */}
      {!isSimplifiedPdfMode && (
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-100 p-1.5 rounded-xl max-w-xl">
          {(['Class 9', 'Class 10', 'Class 11', 'Class 12'] as AcademicClass[]).map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`flex-1 py-2.5 px-4 text-xs font-bold font-sans tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer text-center ${
                selectedClass === cls
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/45'
              }`}
            >
              {cls}
            </button>
          ))}

          <button
            onClick={() => setSelectedClass('FullMatrix')}
            className={`py-2.5 px-4 text-xs font-extrabold font-sans tracking-wide uppercase rounded-lg transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5 border ${
              selectedClass === 'FullMatrix'
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-950 bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>📊 Full Routine Matrix</span>
            <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase shrink-0 ${
              selectedClass === 'FullMatrix' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-705'
            }`}>ROSTER</span>
          </button>
        </div>
      )}

      {/* Primary Display Logic */}
      {isSimplifiedPdfMode ? (
        /* SIMPLIFIED PDF INTERFACE FOR CENTRALIZED TIMETABLE */
        <div className="bg-white border border-slate-150 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs animate-in fade-in duration-150" id="routine-pdf-simplified-module">
          <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100/50 mx-auto flex items-center justify-center text-orange-600">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-900 font-extrabold text-lg">📄 Official Timetable</h3>
            <p className="text-slate-400 text-xs">This physical copy is currently the active master calendar for all academic years.</p>
          </div>
          
          <div className="space-y-4">
            <a
              href={routines[0].pdf_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              View Timetable
            </a>
            <div className="w-full h-[550px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative hidden sm:block">
              <iframe 
                src={routines[0].pdf_url} 
                className="w-full h-full"
                title="Official Routine Calendar PDF View"
              />
            </div>
          </div>
        </div>
      ) : selectedClass === 'FullMatrix' ? (
        <ConsolidatedRoutineMatrix isAdmin={false} />
      ) : !activeRoutine ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl p-8" id="no-routine-alert">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-xs uppercase font-mono tracking-wider font-bold">No Timetable Initialized</p>
          <p className="text-slate-400 text-xs mt-1">Please log into the Admin panel to configure the routine.</p>
        </div>
      ) : hasOverride ? (
        /* EMERGENCY TIMETABLE OVERRIDE PANEL */
        <div className="bg-amber-500/5 border-2 border-dashed border-amber-300 rounded-2xl p-6 sm:p-10 text-center space-y-4 max-w-3xl mx-auto" id="routine-override-banner">
          <div className="w-14 h-14 rounded-full bg-amber-100 border border-amber-200 mx-auto flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] bg-amber-500/10 text-amber-700 py-0.5 px-2 rounded-full font-mono font-bold uppercase tracking-wider">
              Emergency Routine Active
            </span>
            <h3 className="text-slate-950 font-extrabold text-lg sm:text-xl mt-2">
              {activeRoutine.override_title || 'Temporary Class Timetable Adjustment'}
            </h3>
            {activeRoutine.override_start && activeRoutine.override_end && (
              <p className="text-xs text-slate-500 font-mono font-semibold">
                Range: {formatLongDate(activeRoutine.override_start)} — {formatLongDate(activeRoutine.override_end)}
              </p>
            )}
          </div>
          
          <p className="text-slate-600 text-sm leading-relaxed max-w-lg mx-auto font-sans font-medium">
            The standard online weekly table is temporarily paused for special events, examinations or physical programs. Please review the official state alternative schedule document.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            {activeRoutine.override_pdf_url ? (
              <a
                href={activeRoutine.override_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download Emergency PDF
              </a>
            ) : (
              <span className="text-xs text-slate-400 font-medium italic">No alternative PDF file attached.</span>
            )}
          </div>
        </div>
      ) : activeRoutine.display_mode === 'pdf' ? (
        /* PDF BOARD DISPLAY */
        <div className="bg-white border border-slate-150 rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs" id="routine-pdf-module">
          <div className="w-14 h-14 rounded-full bg-orange-50 border border-orange-100/50 mx-auto flex items-center justify-center text-orange-600">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-900 font-extrabold text-lg">Official School Timetable PDF</h3>
            <p className="text-slate-400 text-xs">Bihar state board affiliated administrative calendar.</p>
          </div>
          
          {activeRoutine.pdf_url ? (
            <div className="space-y-4">
              <a
                href={activeRoutine.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                View Timetable Sheet
              </a>
              <div className="w-full h-[500px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative hidden sm:block">
                <iframe 
                  src={activeRoutine.pdf_url} 
                  className="w-full h-full"
                  title="Routine Calendar PDF View"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 text-slate-400 text-xs rounded-xl font-medium italic">
              No physical copy uploaded yet. Please contact school administration.
            </div>
          )}
        </div>
      ) : (
        /* ONLINE DYNAMIC GRID DISPLAY */
        <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm" id="routine-grid-canvas">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-800 font-bold uppercase tracking-wider font-sans">
                Active Normal Timetable
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-medium">
              Last Updated: {formatTimetableTimestamp(dbService.getTimetableLastUpdated())}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" id="timetable-table">
              <thead>
                <tr className="bg-slate-100/75 text-left border-b border-slate-150">
                  <th className="py-4 px-5 text-[11px] uppercase font-mono font-extrabold text-slate-500 tracking-wider w-36">
                    Period / Time
                  </th>
                  {DAYS_OF_WEEK.map((day) => (
                    <th key={day} className="py-4 px-5 text-[11px] uppercase font-mono font-extrabold text-slate-500 tracking-wider">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {uniquePeriods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-xs italic">
                      No period rows populated.
                    </td>
                  </tr>
                ) : (
                  uniquePeriods.map((period) => {
                    const timeRange = getPeriodTime(period);
                    return (
                      <tr key={period} className="hover:bg-slate-50/50 transition">
                        <td className="py-4.5 px-5 bg-slate-50/55 border-r border-slate-100/70">
                          <span className="text-slate-900 font-extrabold text-xs block">{period}</span>
                          {timeRange && (
                            <span className="flex items-center gap-1 text-[10px] text-orange-600 font-mono font-medium mt-1">
                              <Clock className="w-3 h-3" />
                              {timeRange}
                            </span>
                          )}
                        </td>
                        {DAYS_OF_WEEK.map((day) => {
                          const entry = getEntry(day, period);
                          return (
                            <td key={day} className="py-4.5 px-5 align-top min-w-[150px]">
                              {entry ? (
                                <div className="space-y-1">
                                  <span className="text-slate-850 font-bold text-xs text-slate-800 block leading-tight">
                                    {entry.subject}
                                  </span>
                                  {entry.teacher && (
                                    <span className="text-[10px] text-slate-550 text-slate-500 flex items-center gap-1">
                                      <Users className="w-3 h-3 text-slate-400" />
                                      {entry.teacher}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-350 italic">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 2. EXAM SCHEDULE MODULE
// ==========================================
export const ExamSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [entries, setEntries] = useState<ExamEntry[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  const loadExamData = () => {
    const list = dbService.getExamSchedules();
    const active = list.filter(s => s.is_active);
    setSchedules(active);
    setEntries(dbService.getExamEntries());
    if (active.length > 0 && !selectedScheduleId) {
      setSelectedScheduleId(active[0].id);
    }
  };

  useEffect(() => {
    loadExamData();
  }, []);

  useDataSync(loadExamData, 'ExamSchedulePage');

  const activeSchedule = schedules.find(s => s.id === selectedScheduleId);
  const activeEntries = entries.filter(e => e.schedule_id === selectedScheduleId)
    .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="exams-schedule-public">
      {/* Header Summary */}
      <div className="border-b border-slate-200 pb-5 mb-8">
        <span className="text-xs font-mono font-extrabold text-orange-600 uppercase tracking-widest block">
          State assessments datesheet
        </span>
        <h1 className="text-slate-900 text-2xl sm:text-3xl font-black mt-1 tracking-tight">
          Exam Datesheets & Schedules
        </h1>
        <p className="text-slate-500 text-sm mt-1 max-w-xl font-sans font-medium">
          Access Unit assessments, Half-Yearly, Board Practical, and BSEB annual matric assessment dates sheets.
        </p>
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl p-8 shadow-xs" id="no-exams-alert">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-xs uppercase font-mono tracking-wider font-bold">No Active Date Sheets</p>
          <p className="text-slate-400 text-xs mt-1">There are no examinations scheduled currently scheduled.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar selector */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider block mb-1">
              Active Assessment Schedules
            </span>
            <div className="space-y-2">
              {schedules.map((sch) => (
                <button
                  key={sch.id}
                  onClick={() => setSelectedScheduleId(sch.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedScheduleId === sch.id
                      ? 'bg-sky-900 text-white border-sky-900/30 shadow-md shadow-sky-900/10'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono font-extrabold tracking-wider block opacity-75">
                    {sch.display_mode === 'pdf' ? 'PDF Flyer Download' : 'Digital Grid'}
                  </span>
                  <h4 className="font-extrabold text-xs sm:text-sm mt-1 leading-snug">
                    {sch.title}
                  </h4>
                  <span className="text-[10px] font-mono block mt-2 opacity-60">
                    Published: {sch.created_at ? formatLongDate(sch.created_at.split('T')[0]) : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active schedule display */}
          <div className="lg:col-span-8">
            {activeSchedule && (
              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs" id="exams-detail-view">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b border-slate-100 pb-4 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-sky-50 text-sky-950 py-0.5 px-2 rounded-full font-mono font-bold uppercase tracking-wider">
                      Assessment Datesheet
                    </span>
                    <h3 className="text-slate-900 font-extrabold text-base sm:text-lg mt-2 leading-tight">
                      {activeSchedule.title}
                    </h3>
                  </div>

                  {activeSchedule.pdf_url && (
                    <a
                      href={activeSchedule.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 text-[11px] font-mono tracking-wide rounded-lg transition shrink-0 uppercase font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF Document
                    </a>
                  )}
                </div>

                {activeSchedule.display_mode === 'pdf' ? (
                  /* PDF Display Block */
                  <div className="space-y-4">
                    <p className="text-slate-500 text-xs">
                      This date sheet is issued in physical document format. Render preview below or download directly.
                    </p>
                    {activeSchedule.pdf_url ? (
                      <div className="w-full h-[450px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50 relative">
                        <iframe 
                          src={activeSchedule.pdf_url} 
                          className="w-full h-full"
                          title="Exam DateSheet PDF view"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 text-slate-400 text-xs rounded-xl font-medium italic">
                        No physical file was uploaded. Please request from register office.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Digital assessment schedule table */
                  <div className="space-y-4">
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left border-b border-slate-100">
                            <th className="py-3 px-4 text-[10px] uppercase font-mono font-extrabold text-slate-500 tracking-wider w-36">
                              Date
                            </th>
                            <th className="py-3 px-4 text-[10px] uppercase font-mono font-extrabold text-slate-500 tracking-wider">
                              Subject Papers
                            </th>
                            <th className="py-3 px-4 text-[10px] uppercase font-mono font-extrabold text-slate-500 tracking-wider w-40">
                              Session Timing
                            </th>
                            <th className="py-3 px-4 text-[10px] uppercase font-mono font-extrabold text-slate-500 tracking-wider">
                              Directives / Notes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-sans">
                          {activeEntries.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-slate-400 font-medium italic">
                                Rows not configured for this datesheet.
                              </td>
                            </tr>
                          ) : (
                            activeEntries.map((ent) => (
                              <tr key={ent.id} className="hover:bg-slate-55/45 hover:bg-slate-50/50 transition duration-150">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                                  {formatLongDate(ent.exam_date)}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {ent.subject}
                                </td>
                                <td className="py-3.5 px-4 text-orange-600 font-mono font-semibold">
                                  {ent.time}
                                </td>
                                <td className="py-3.5 px-4 text-slate-500 leading-normal max-w-xs font-medium">
                                  {ent.notes || '—'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 3. ACADEMIC CALENDAR MODULE
// ==========================================
export const AcademicCalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  // Date states for the Grid Calendar
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const loadCalendarEvents = () => {
    const list = dbService.getCalendarEvents()
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
    setEvents(list);
  };

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  useDataSync(loadCalendarEvents, 'AcademicCalendarPage');

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter(e => e.event_type === selectedCategory));
    }
  }, [selectedCategory, events]);

  // Calendar Grid builder helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay(); // Sunday=0, Monday=1, etc.

  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfMonth(year, month); // Offset index

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDay = (dayNum: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    return events.filter(e => e.event_date === dStr);
  };

  const CATEGORIES: (CalendarEventType | 'All')[] = ['All', 'Holiday', 'Examination', 'Parent Meeting', 'Admission Date', 'School Event'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="academic-calendar-public">
      
      {/* Header Summary */}
      <div className="border-b border-slate-200 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs font-mono font-extrabold text-orange-600 uppercase tracking-widest block">
            Annual administrative registry
          </span>
          <h1 className="text-slate-900 text-2xl sm:text-3xl font-black mt-1 tracking-tight">
            Academic Calendar & Holidays
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-xl font-sans font-medium">
            Review BSEB registrations schedules, holiday announcements, inter-school cultural meets, and parental committee calls.
          </p>
        </div>

        {/* View mode toggle switcher links */}
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 border border-slate-200/40">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 text-xs font-bold font-sans tracking-wide uppercase rounded-md transition duration-150 cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calendar Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 text-xs font-bold font-sans tracking-wide uppercase rounded-md transition duration-150 cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-orange-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Events List
          </button>
        </div>
      </div>

      {/* Categories Filter Strip */}
      <div className="mb-8 flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-wider block mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-450" />
          Filter Category:
        </span>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`py-1.5 px-3.5 border text-xs font-bold tracking-wide rounded-lg transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/10'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main View Port Canvas */}
      {viewMode === 'calendar' ? (
        /* GRID CALENDAR ENGINE */
        <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-xs" id="calendar-grid-canvas">
          
          {/* Calendar top controller */}
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4.5 flex items-center justify-between">
            <h3 className="text-slate-800 font-extrabold text-sm sm:text-base font-sans flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-600" />
              {currentDate.toLocaleString('default', { month: 'long' })} {year}
            </h3>
            
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="p-4">
            {/* Weekdays Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2 font-mono font-bold text-[10px] uppercase text-slate-450 tracking-wider">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
                <div key={w} className="py-2 bg-slate-50 rounded-md text-slate-500 border border-slate-100/50">{w}</div>
              ))}
            </div>

            {/* Month Day Cells */}
            <div className="grid grid-cols-7 gap-1.5 min-h-[380px]">
              {/* Empty placeholder slots for previous month offset */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="bg-slate-50/25 border border-slate-100/30 rounded-lg" />
              ))}

              {/* Real month days cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayEvents = getEventsForDay(dayNum)
                  .filter(e => selectedCategory === 'All' || e.event_type === selectedCategory);
                  
                return (
                  <div
                    key={`day-${dayNum}`}
                    className="bg-white border border-slate-150 hover:border-orange-200 rounded-xl p-2.5 flex flex-col justify-between transition h-28 group min-w-[70px]"
                  >
                    {/* Date label */}
                    <span className="text-slate-850 font-bold text-xs h-6 w-6 rounded-full flex items-center justify-center group-hover:bg-slate-50 group-hover:text-orange-600 transition font-mono self-start">
                      {dayNum}
                    </span>

                    {/* Events bullet blocks inside cells */}
                    <div className="mt-1 space-y-1 max-h-[70px] overflow-y-auto overflow-hidden">
                      {dayEvents.map(ev => (
                        <div
                          key={ev.id}
                          className={`text-[9.5px] font-sans font-bold py-0.5 px-1.5 rounded-md truncate border leading-tight ${getCategoryColor(ev.event_type)}`}
                          title={`${ev.title} (${ev.event_type}) - ${ev.description}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* SIMPLE LIST VIEW */
        <div className="space-y-4" id="calendar-list-canvas">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-150 rounded-2xl p-8 shadow-xs">
              <ListFilter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-xs uppercase font-mono tracking-wider font-bold">No Events Found</p>
              <p className="text-slate-400 text-xs mt-1">There are no events registered matching the filter selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-slate-155 rounded-2xl p-5 hover:border-orange-500/20 shadow-2xs hover:shadow-xs transition flex gap-4"
                >
                  {/* Event Mini Date badge */}
                  <div className="w-16 h-16 rounded-xl bg-orange-50/75 border border-orange-100/30 shrink-0 flex flex-col justify-center items-center font-mono">
                    <span className="text-[10px] uppercase font-extrabold text-orange-600/80">
                      {new Date(ev.event_date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-slate-800 leading-none">
                      {new Date(ev.event_date).getDate()}
                    </span>
                  </div>

                  {/* Descriptions block */}
                  <div className="space-y-1.5 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[9.5px] font-sans font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider ${getCategoryColor(ev.event_type)}`}>
                        {ev.event_type}
                      </span>
                    </div>
                    <h4 className="text-slate-950 font-extrabold text-sm font-sans tracking-tight">
                      {ev.title}
                    </h4>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-md font-sans font-medium">
                      {ev.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
