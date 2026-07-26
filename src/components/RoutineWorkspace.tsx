/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Grid,
  FileText,
  Upload,
  Eye,
  Trash2,
  AlertTriangle,
  User,
  Users,
  X,
  RefreshCw,
  Sparkles,
  Save,
  Edit,
  SlidersHorizontal,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import {
  Routine,
  RoutineEntry,
  PeriodMaster,
  Faculty,
  TimetableGroup,
  AcademicClass
} from '../types';

export interface RoutineWorkspaceProps {
  selectedClass: string;
  setSelectedClass: (cls: any) => void;
  activeRoutine: Routine | undefined;
  routines: Routine[];
  entries: RoutineEntry[];
  faculty: Faculty[];
  periodMasters: PeriodMaster[];
  timetableGroups: TimetableGroup[];
  allClasses: string[];
  weekDays: string[];
  standardPeriods: string[];
  classEntries: RoutineEntry[];

  // PDF controls
  pdfApplyTarget: 'current' | 'all';
  setPdfApplyTarget: (target: 'current' | 'all') => void;
  showPdfPreview: boolean;
  setShowPdfPreview: (show: boolean) => void;
  updateDisplayMode: (mode: 'online' | 'pdf') => void;
  handleAssignPDF: () => void;
  handleDeletePDF: () => void;
  formatRoutineDate: (dateStr: string | null) => string;

  // Duplication Alert & Undo
  duplicationSuccessAlert: { message: string; detail: string; targetClass: string } | null;
  setDuplicationSuccessAlert: (val: any) => void;
  duplicationUndoState: any;
  handleDuplicationUndo: () => void;

  // Day Duplication Modal
  isDuplicatingDay: boolean;
  setIsDuplicatingDay: (val: boolean) => void;
  duplicationSourceDay: string;
  setDuplicationSourceDay: (val: string) => void;
  duplicationDestDays: string[];
  setDuplicationDestDays: (val: string[]) => void;
  copyTeachers: boolean;
  setCopyTeachers: (val: boolean) => void;
  copySubjects: boolean;
  setCopySubjects: (val: boolean) => void;
  copyTimeSlots: boolean;
  setCopyTimeSlots: (val: boolean) => void;
  destinationStrategy: 'replace' | 'merge' | 'cancel';
  setDestinationStrategy: (val: 'replace' | 'merge' | 'cancel') => void;
  duplicationConflictBypass: boolean;
  setDuplicationConflictBypass: (val: boolean) => void;
  duplicationError: string | null;
  setDuplicationError: (val: string | null) => void;
  duplicationConflicts: string[];
  setDuplicationConflicts: (val: string[]) => void;
  handleDuplicateDaySubmit: (e: React.FormEvent) => void;

  // Add/Edit Entry Form
  isAddingEntry: boolean;
  setIsAddingEntry: (val: boolean) => void;
  editingEntryId: string | null;
  setEditingEntryId: (id: string | null) => void;
  entryForm: Partial<RoutineEntry>;
  setEntryForm: React.Dispatch<React.SetStateAction<Partial<RoutineEntry>>>;
  isManualPeriod: boolean;
  setIsManualPeriod: (val: boolean) => void;
  isManualTeacher: boolean;
  setIsManualTeacher: (val: boolean) => void;
  lectureType: 'regular' | 'shared';
  setLectureType: (val: 'regular' | 'shared') => void;
  sharedWithClasses: string[];
  setSharedWithClasses: (val: string[]) => void;
  applySharedOption: 'all' | 'single';
  setApplySharedOption: (val: 'all' | 'single') => void;
  conflictWarning: string | null;
  setConflictWarning: (val: string | null) => void;
  forceConflict: boolean;
  setForceConflict: (val: boolean) => void;
  formError: string | null;
  setFormError: (val: string | null) => void;
  handleAddEntrySubmit: (e: React.FormEvent) => void;
  resetLectureDialogState: () => void;

  // Inline Table Actions
  deletingId: string | null;
  setDeletingId: (id: string | null) => void;
  deleteSharedOption: 'all' | 'single';
  setDeleteSharedOption: (val: 'all' | 'single') => void;
  handleDeleteEntryInline: (id: string, sharedLectureId?: string) => void;
  handleEditClick: (entry: RoutineEntry) => void;

  // Combined View Props
  getPeriodTimeCombined: (period: string) => string | undefined;
  getCombinedEntry: (className: string, day: string, period: string) => RoutineEntry | undefined;
  handleOpenCombinedCell: (cls: string, day: string, period: string, matched?: RoutineEntry) => void;
  editingCombinedCell: { className: AcademicClass; day: string; period: string; entry?: RoutineEntry } | null;
  setEditingCombinedCell: (val: any) => void;
  combinedForm: { subject: string; teacher: string; teacher_id?: string; time_range: string; isManual: boolean };
  setCombinedForm: React.Dispatch<React.SetStateAction<{ subject: string; teacher: string; teacher_id?: string; time_range: string; isManual: boolean }>>;
  combinedError: string | null;
  combinedConflictWarning: string | null;
  setCombinedConflictWarning: (val: string | null) => void;
  combinedForceConflict: boolean;
  setCombinedForceConflict: (val: boolean) => void;
  handleSaveCombinedCell: (e: React.FormEvent) => void;
  handleClearCombinedCell: () => void;

  setIsInspectorOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const RoutineWorkspace: React.FC<RoutineWorkspaceProps> = ({
  selectedClass,
  setSelectedClass,
  activeRoutine,
  routines,
  entries,
  faculty,
  periodMasters,
  timetableGroups,
  allClasses,
  weekDays,
  standardPeriods,
  classEntries,

  pdfApplyTarget,
  setPdfApplyTarget,
  showPdfPreview,
  setShowPdfPreview,
  updateDisplayMode,
  handleAssignPDF,
  handleDeletePDF,
  formatRoutineDate,

  duplicationSuccessAlert,
  setDuplicationSuccessAlert,
  duplicationUndoState,
  handleDuplicationUndo,

  isDuplicatingDay,
  setIsDuplicatingDay,
  duplicationSourceDay,
  setDuplicationSourceDay,
  duplicationDestDays,
  setDuplicationDestDays,
  copyTeachers,
  setCopyTeachers,
  copySubjects,
  setCopySubjects,
  copyTimeSlots,
  setCopyTimeSlots,
  destinationStrategy,
  setDestinationStrategy,
  duplicationConflictBypass,
  setDuplicationConflictBypass,
  duplicationError,
  setDuplicationError,
  duplicationConflicts,
  setDuplicationConflicts,
  handleDuplicateDaySubmit,

  isAddingEntry,
  setIsAddingEntry,
  editingEntryId,
  setEditingEntryId,
  entryForm,
  setEntryForm,
  isManualPeriod,
  setIsManualPeriod,
  isManualTeacher,
  setIsManualTeacher,
  lectureType,
  setLectureType,
  sharedWithClasses,
  setSharedWithClasses,
  applySharedOption,
  setApplySharedOption,
  conflictWarning,
  setConflictWarning,
  forceConflict,
  setForceConflict,
  formError,
  setFormError,
  handleAddEntrySubmit,
  resetLectureDialogState,

  deletingId,
  setDeletingId,
  deleteSharedOption,
  setDeleteSharedOption,
  handleDeleteEntryInline,
  handleEditClick,

  getPeriodTimeCombined,
  getCombinedEntry,
  handleOpenCombinedCell,
  editingCombinedCell,
  setEditingCombinedCell,
  combinedForm,
  setCombinedForm,
  combinedError,
  combinedConflictWarning,
  setCombinedConflictWarning,
  combinedForceConflict,
  setCombinedForceConflict,
  handleSaveCombinedCell,
  handleClearCombinedCell,

  setIsInspectorOpen
}) => {
  const [routineViewMode, setRoutineViewMode] = useState<'matrix' | 'detailed'>('matrix');

  const displayPeriods = useMemo(() => {
    const base = periodMasters && periodMasters.length > 0
      ? periodMasters.map(pm => pm.name)
      : (standardPeriods || ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8']);
    
    const customInEntries = classEntries
      .map(e => e.period)
      .filter(p => p && !base.some(b => b.toLowerCase().trim() === p.toLowerCase().trim()));
      
    const uniqueCustom = Array.from(new Set(customInEntries));
    return [...base, ...uniqueCustom];
  }, [periodMasters, standardPeriods, classEntries]);

  const getPeriodAbbr = (pName: string) => {
    const trimmed = pName.trim();
    if (/^period\s*\d+$/i.test(trimmed)) {
      return trimmed.replace(/^period\s*/i, 'P');
    }
    return trimmed;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4 h-full" id="routine-workspace-container">
      {/* SECTION 1: Class Selector / Grade Selector Pills */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase text-slate-400 px-2 shrink-0">Grade:</span>
        {timetableGroups.filter(g => g.is_active).map((g) => (
          <button
            key={g.id}
            onClick={() => {
              setSelectedClass(g.name);
              setIsAddingEntry(false);
              setEditingEntryId(null);
            }}
            className={`px-3 py-1.5 text-xs font-extrabold uppercase rounded-lg transition duration-150 cursor-pointer shrink-0 ${
              selectedClass === g.name
                ? 'bg-orange-500 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {g.name}
          </button>
        ))}
        <button
          onClick={() => {
            setSelectedClass('Combined');
            setIsAddingEntry(false);
            setEditingEntryId(null);
          }}
          className={`px-3 py-1.5 text-xs font-extrabold uppercase rounded-lg transition duration-150 cursor-pointer shrink-0 ${
            selectedClass === 'Combined'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Combined 9-12
        </button>
      </div>

      {/* SECTION 2: Routine Canvas (Combined or Class View) */}
      {selectedClass === 'Combined' ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4 min-w-0 w-full animate-in fade-in duration-200 flex flex-col flex-1 min-h-0 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)]">
          <div className="shrink-0">
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

          <div className="w-full min-w-0 overflow-auto border border-slate-200 rounded-xl flex-1 min-h-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr className="bg-slate-50 text-left border-b border-slate-150 font-mono text-[9.5px] uppercase tracking-wider text-slate-500">
                  <th className="p-3 w-28 border-r border-slate-150">Day</th>
                  <th className="p-3 w-32 border-r border-slate-150">Period</th>
                  {allClasses.map((cls, idx) => (
                    <th key={cls} className={`p-3 ${idx < allClasses.length - 1 ? 'border-r border-slate-150' : ''}`}>{cls}</th>
                  ))}
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
                      
                      {allClasses.map((cls) => {
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
        /* CLASS-WISE ONLINE GRID / PDF WORKSPACE */
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
                    {routines.filter(r => r.pdf_url && r.pdf_url === activeRoutine.pdf_url).length === allClasses.length ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <span className="text-emerald-600 font-extrabold">✓</span> Applied to <span className="text-orange-600">All Classes</span>
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 pl-4">
                          {allClasses.map((cls) => (
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
                          {allClasses.map((cls) => {
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
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 cursor-pointer transition uppercase text-[10px] tracking-wide shadow-3xs"
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
                        className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700 px-2 py-1 bg-white border border-slate-200 rounded cursor-pointer transition"
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
                    className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg uppercase tracking-wide shadow-sm cursor-pointer"
                  >
                    Attach PDF from Media Library
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ONLINE TIMETABLE GRID MATRIX */
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
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
            {isDuplicatingDay && activeRoutine && (
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
                          setDuplicationDestDays(duplicationDestDays.filter(day => day !== e.target.value));
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
                                <span className="text-[9px] text-slate-400 font-medium">Clear target entries</span>
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
                                <span className="text-[9px] text-slate-400 font-medium">Skip occupied periods</span>
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
                                <span className="text-[9px] text-slate-400 font-medium">Do not duplicate</span>
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
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
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

            {/* SECTION: Toolbar Header - 3 Logical Zones (Single Row on Desktop) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 shrink-0">
              {/* ZONE 1: Routine Title & Context */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0 shadow-2xs" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-slate-900 text-xs sm:text-sm font-black uppercase tracking-wide truncate">
                      Weekly Class Routine
                    </h3>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 border border-orange-200/80 rounded-md text-[10px] font-mono font-extrabold uppercase shrink-0">
                      {selectedClass}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] font-sans truncate font-medium">
                    Manage weekly timetable for the selected class.
                  </p>
                </div>
              </div>

              {/* ZONE 2: View Selector (Segmented Control) */}
              <div className="flex items-center p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRoutineViewMode('matrix')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    routineViewMode === 'matrix'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                  <span>Matrix View</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoutineViewMode('detailed')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    routineViewMode === 'detailed'
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5 shrink-0" />
                  <span>Detailed View</span>
                </button>
              </div>

              {/* ZONE 3: Primary Actions */}
              {!isAddingEntry && (
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
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
                    className="py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] uppercase rounded-xl tracking-wider shadow-4xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all hover:border-slate-300 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>Duplicate Day</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingEntryId(null);
                      const defaultPeriod = periodMasters.length > 0 ? periodMasters[0].name : 'Period 1';
                      const defaultTimeRange = periodMasters.length > 0 ? periodMasters[0].time_range : '09:00 AM - 09:45 AM';
                      setEntryForm({
                        day: 'Monday',
                        period: defaultPeriod,
                        time_range: defaultTimeRange,
                        subject: '',
                        teacher: ''
                      });
                      setIsManualTeacher(false);
                      setIsAddingEntry(true);
                      setConflictWarning(null);
                      setForceConflict(false);
                      setFormError(null);
                    }}
                    className="py-1.5 px-3 bg-sky-900 hover:bg-sky-950 text-white font-extrabold text-[10px] uppercase rounded-xl tracking-wider shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Append Lecture</span>
                  </button>
                </div>
              )}
            </div>

            {isAddingEntry && (
              /* ADD/EDIT ENTRY FORM PANEL */
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-2xs animate-in slide-in-from-top-3 duration-150 shrink-0">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/50 mb-4 text-xs">
                  <span className="font-extrabold uppercase font-mono text-slate-500 text-[10px]">
                    {editingEntryId ? 'Modify Timetable Slot Details' : 'Create Timetable Slot Entry'}
                  </span>
                  <button 
                    onClick={resetLectureDialogState} 
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
                    <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold">Week Day</label>
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
                    <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold">Period Slot Template</label>
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
                      <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold">Custom Period Name</label>
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
                    <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold">
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
                    <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold">Subject Paper</label>
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
                    <label className="text-slate-500 block text-[10px] uppercase font-mono font-bold">Assigned Teacher</label>
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
                            {f.name} ({f.department || 'General'})
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
                          className="w-full p-2 border border-slate-200 bg-white rounded-lg focus:outline-orange-500"
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
                            className="mr-1 shadow-xs rounded border-amber-300 text-amber-600"
                          />
                          Instruct manual merging collision schedule bypass
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Strict blocker validation error box */}
                  {formError && (
                    <div className="sm:col-span-3 bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2.5 text-red-800 animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[11px] leading-relaxed font-bold uppercase tracking-wider text-red-700">Strict Validation Blocker</p>
                        <p className="text-[10.5px] leading-normal">{formError}</p>
                      </div>
                    </div>
                  )}

                  {/* Shared Lecture Section */}
                  <div className="sm:col-span-3 border-t border-dashed border-slate-200 pt-4 mt-2 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">Lecture Configuration</span>
                      <div className="flex flex-wrap items-center gap-6 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                          <input
                            type="radio"
                            name="lectureType"
                            value="regular"
                            checked={lectureType === 'regular'}
                            onChange={() => setLectureType('regular')}
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          <span>Standard Single-Group Lecture</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
                          <input
                            type="radio"
                            name="lectureType"
                            value="shared"
                            checked={lectureType === 'shared'}
                            onChange={() => setLectureType('shared')}
                            className="text-orange-500 focus:ring-orange-500"
                          />
                          <span className="flex items-center gap-1.5 font-bold text-orange-600">
                            <Sparkles className="w-3.5 h-3.5" /> Shared Lecture (Co-teaching/Joint groups)
                          </span>
                        </label>
                      </div>
                    </div>

                    {lectureType === 'shared' && (
                      <div className="bg-orange-50/15 border border-orange-100 rounded-xl p-4 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div>
                          <label className="text-slate-600 block text-[10.5px] uppercase font-mono font-bold">
                            Select Timetable Groups to share this lecture with:
                          </label>
                          <p className="text-slate-500 text-[10px] font-sans mt-0.5">
                            The teacher, subject, day, and timeslot will be perfectly shared across all selected classes with zero conflicts.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {allClasses.filter(cls => cls !== selectedClass).map(cls => {
                            const isChecked = sharedWithClasses.includes(cls);
                            return (
                              <label
                                key={cls}
                                className={`px-3 py-1.5 border rounded-lg flex items-center gap-1.5 cursor-pointer text-xs font-bold transition-all select-none ${
                                  isChecked
                                    ? 'border-orange-500 bg-orange-500/5 text-orange-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSharedWithClasses([...sharedWithClasses, cls]);
                                    } else {
                                      setSharedWithClasses(sharedWithClasses.filter(x => x !== cls));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                                />
                                <span>{cls}</span>
                              </label>
                            );
                          })}
                        </div>

                        {editingEntryId && entries.find(e => e.id === editingEntryId)?.shared_lecture_id && (
                          <div className="border-t border-orange-100 pt-3 mt-1.5">
                            <label className="text-slate-600 block text-[10.5px] uppercase font-mono font-bold">
                              Edit Scope:
                            </label>
                            <div className="flex items-center gap-4 mt-1.5">
                              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 text-xs font-semibold">
                                <input
                                  type="radio"
                                  name="applySharedOption"
                                  value="all"
                                  checked={applySharedOption === 'all'}
                                  onChange={() => setApplySharedOption('all')}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <span>Apply Changes to Entire Shared Lecture</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 text-xs font-semibold">
                                <input
                                  type="radio"
                                  name="applySharedOption"
                                  value="single"
                                  checked={applySharedOption === 'single'}
                                  onChange={() => setApplySharedOption('single')}
                                  className="text-orange-500 focus:ring-orange-500"
                                />
                                <span>Only This Timetable Group ({selectedClass})</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-3 pt-3 flex justify-end gap-2 border-t border-slate-200/55 mt-2">
                    <button
                      type="button"
                      onClick={resetLectureDialogState}
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

            {/* Timetable Presentation Views (Matrix View vs Detailed View) */}
            {routineViewMode === 'matrix' ? (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex-1 min-h-0 flex flex-col max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)]" id="matrix-timetable-container">
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200">
                      <tr className="font-mono text-[10px] uppercase text-slate-500 tracking-wider">
                        <th className="py-2.5 px-3 w-28 bg-slate-100 border-r border-slate-200 text-slate-700 font-extrabold sticky left-0 z-20 shadow-2xs">
                          Day
                        </th>
                        {displayPeriods.map((periodName) => {
                          const pm = periodMasters.find(p => p.name.toLowerCase().trim() === periodName.toLowerCase().trim());
                          return (
                            <th key={periodName} className="py-2.5 px-2 text-center border-r border-slate-200 min-w-[115px] font-extrabold">
                              <div className="text-orange-600 text-xs font-black">{getPeriodAbbr(periodName)}</div>
                              <div className="text-[9px] text-slate-400 font-normal font-sans tracking-tight">
                                {pm ? pm.time_range : (getPeriodTimeCombined(periodName) || 'Standard')}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-sans">
                      {weekDays.map((day) => (
                        <tr key={day} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3 bg-slate-50/80 border-r border-slate-200 font-extrabold text-slate-800 uppercase text-[11px] font-mono tracking-wider sticky left-0 z-10 shadow-2xs">
                            {day}
                          </td>
                          {displayPeriods.map((periodName) => {
                            const entry = classEntries.find(
                              e => e.day === day && e.period.toLowerCase().trim() === periodName.toLowerCase().trim()
                            );
                            
                            let teacherName = entry ? entry.teacher : '';
                            if (entry && entry.teacher_id) {
                              const f = faculty.find(fac => fac.id === entry.teacher_id);
                              if (f) teacherName = f.name;
                            }

                            return (
                              <td
                                key={`${day}-${periodName}`}
                                className="p-1.5 border-r border-slate-200 align-top h-20 min-w-[115px] transition-colors hover:bg-orange-50/20"
                              >
                                {entry ? (
                                  /* Occupied Slot Cell */
                                  <div
                                    onClick={() => handleEditClick(entry)}
                                    className="h-full w-full bg-orange-50/60 border border-orange-200/80 hover:border-orange-400 rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all shadow-4xs hover:shadow-2xs group relative"
                                    title="Click to edit lecture"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="font-extrabold text-slate-900 text-[11px] leading-tight line-clamp-2">
                                          {entry.subject}
                                        </span>
                                        {entry.shared_lecture_id && (
                                          <span
                                            className="px-1 py-0.5 bg-purple-100 text-purple-800 rounded text-[8px] font-black uppercase shrink-0 border border-purple-200 flex items-center gap-0.5"
                                            title="Shared Lecture"
                                          >
                                            <Users className="w-2.5 h-2.5" />
                                          </span>
                                        )}
                                      </div>
                                      {teacherName && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-600 font-medium">
                                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{teacherName}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-mono">
                                      <span className="text-[8px] uppercase tracking-wider text-orange-600 font-bold">Occupied</span>
                                      <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 text-orange-600 transition-opacity" />
                                    </div>
                                  </div>
                                ) : (
                                  /* Empty Slot Cell */
                                  <button
                                    onClick={() => {
                                      setEditingEntryId(null);
                                      const matchedPM = periodMasters.find(pm => pm.name.toLowerCase().trim() === periodName.toLowerCase().trim());
                                      const timeRange = matchedPM ? matchedPM.time_range : '09:00 AM - 09:45 AM';
                                      setEntryForm({
                                        day,
                                        period: periodName,
                                        time_range: timeRange,
                                        subject: '',
                                        teacher: ''
                                      });
                                      setIsManualTeacher(false);
                                      setIsManualPeriod(false);
                                      setIsAddingEntry(true);
                                      setConflictWarning(null);
                                      setForceConflict(false);
                                      setFormError(null);
                                    }}
                                    className="h-full w-full border border-dashed border-slate-200 hover:border-orange-300 bg-slate-50/40 hover:bg-orange-50/30 rounded-xl p-2 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-orange-600 transition-all cursor-pointer group"
                                    title={`Add period entry for ${day} ${periodName}`}
                                  >
                                    <Plus className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:scale-110 transition-all" />
                                    <span className="text-[9px] font-extrabold uppercase font-mono tracking-wider opacity-60 group-hover:opacity-100">+ Add</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* List of configured entries for class (Detailed View) */
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex-1 min-h-0 flex flex-col max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-320px)]" id="timetable-container">
                <div className="overflow-auto flex-1 min-h-0">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="bg-slate-50 text-left border-b border-slate-100 font-mono text-[10px] uppercase text-slate-400 tracking-wider">
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
                              <td className="py-3 px-4 text-slate-600 font-medium">
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
                                  <div className="flex flex-col items-center gap-1.5 animate-in fade-in duration-100 p-1">
                                    {ent.shared_lecture_id && (
                                      <div className="flex flex-col items-start gap-1 bg-orange-50/50 p-1.5 rounded border border-orange-100 mb-1">
                                        <span className="text-[8px] font-bold text-orange-600 uppercase">Shared Lecture Scope:</span>
                                        <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-700">
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`deleteOpt-${ent.id}`}
                                              value="all"
                                              checked={deleteSharedOption === 'all'}
                                              onChange={() => setDeleteSharedOption('all')}
                                              className="h-2.5 w-2.5 text-orange-500 focus:ring-0"
                                            />
                                            All Groups
                                          </label>
                                          <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                              type="radio"
                                              name={`deleteOpt-${ent.id}`}
                                              value="single"
                                              checked={deleteSharedOption === 'single'}
                                              onChange={() => setDeleteSharedOption('single')}
                                              className="h-2.5 w-2.5 text-orange-500 focus:ring-0"
                                            />
                                            Only This
                                          </label>
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleDeleteEntryInline(ent.id, ent.shared_lecture_id)}
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
                                      onClick={() => {
                                        setDeletingId(ent.id);
                                        setDeleteSharedOption('all');
                                      }}
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
            )}
          </div>
        )
      )}
    </div>
  );
};
