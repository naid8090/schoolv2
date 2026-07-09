/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { dbService } from '../services/db';
import { Routine, RoutineEntry, PeriodMaster, AcademicClass, SchoolSettings } from '../types';
import * as XLSX from 'xlsx';
import { useDataSync } from '../hooks/useDataSync';

interface ConsolidatedRoutineMatrixProps {
  isAdmin?: boolean;
}

export const ConsolidatedRoutineMatrix: React.FC<ConsolidatedRoutineMatrixProps> = ({ isAdmin = false }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [periodMasters, setPeriodMasters] = useState<PeriodMaster[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'>('Monday');
  const [faculty, setFaculty] = useState<any[]>([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const loadData = () => {
    const allRoutines = dbService.getRoutines();
    // Clean up any polluted 'FullMatrix' routine key if any legacy bug polluted it
    const cleanRoutines = allRoutines.filter(r => r.class_name as string !== 'FullMatrix');
    if (allRoutines.length !== cleanRoutines.length) {
      dbService.saveRoutines(cleanRoutines);
      setRoutines(cleanRoutines);
    } else {
      setRoutines(allRoutines);
    }

    setEntries(dbService.getRoutineEntries());
    setPeriodMasters(dbService.getPeriodMasters());
    setSchoolSettings(dbService.getSchoolSettings());
    setFaculty(dbService.getFaculty());
  };

  useEffect(() => {
    loadData();
  }, []);

  useDataSync(loadData, 'ConsolidatedRoutineMatrix');

  const dynamicClasses: AcademicClass[] = dbService.getTimetableGroups()
    .filter(g => g.is_active)
    .map(g => g.name);

  const dynamicPeriodNames = periodMasters.map(pm => pm.name);
  const foundPeriodNames = entries.map(e => e.period) as string[];
  const uniquePeriods: string[] = Array.from(new Set([...dynamicPeriodNames, ...foundPeriodNames]))
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 99;
      const numB = parseInt(b.replace(/\D/g, '')) || 99;
      return numA - numB;
    });

  const getPeriodTime = (p: string) => {
    const matched = entries.find(e => e.period === p && e.time_range);
    if (matched?.time_range) return matched.time_range;
    
    const master = periodMasters.find(pm => pm.name.toLowerCase().trim() === p.toLowerCase().trim());
    return master?.time_range || '';
  };

  const getMatrixEntry = (cls: AcademicClass, day: string, period: string) => {
    const routine = routines.find(r => r.class_name === cls);
    if (!routine) return null;
    return entries.find(e => e.routine_id === routine.id && e.day === day && e.period === period);
  };

  // EXCEL EXPORT ACTION - Exclusively for Admin
  const handleExportExcel = () => {
    if (!isAdmin) return;

    const schoolName = schoolSettings?.school_name || "Government Secondary School";
    const exportDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // Prepare Excel rows (SheetJS format)
    const data: any[][] = [];

    // Rows for Title, School Info, and Date metadata
    data.push([schoolName]);
    data.push(["CONSOLIDATED ROUTINE MATRIX - " + selectedDay.toUpperCase()]);
    data.push(["Export Date: " + exportDateStr]);
    data.push([]); // blank row space

    // Column headers: Class / Period | Period 1 (Time Range) | Period 2 (Time Range)...
    const headers = ["Class / Period"];
    uniquePeriods.forEach((period) => {
      const time = getPeriodTime(period);
      headers.push(time ? `${period} (${time})` : period);
    });
    data.push(headers);

    // Class rows
    dynamicClasses.forEach((cls) => {
      const row: string[] = [cls];
      uniquePeriods.forEach((period) => {
        const matched = getMatrixEntry(cls, selectedDay, period);
        if (matched) {
          const resolvedTeacher = matched.teacher_id 
            ? (faculty.find(f => f.id === matched.teacher_id)?.name || matched.teacher || 'N/A')
            : (matched.teacher || 'N/A');
          row.push(`${matched.subject} - ${resolvedTeacher}`);
        } else {
          row.push("Empty Slot");
        }
      });
      data.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Dynamic and comfortable column widths
    const cols = [{ wch: 18 }]; // Column 1 width
    uniquePeriods.forEach(() => {
      cols.push({ wch: 25 }); // Period Column widths
    });
    worksheet['!cols'] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, selectedDay);

    const safeSchoolName = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `${safeSchoolName}_Routine_${selectedDay}.xlsx`);
  };

  // Find the latest update timestamp from Routines using the global timetable timestamp
  const getLatestUpdatedString = () => {
    const lastUpdated = dbService.getTimetableLastUpdated();
    const d = new Date(lastUpdated);
    if (isNaN(d.getTime())) return '19 June 2026, 11:47 PM';
    
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

  return (
    <div className="space-y-6" id="consolidated-routine-matrix-layer">
      {/* MATRIX CONTROL HEADER */}
      <div className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print shadow-3xs animate-in fade-in duration-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
            <span className="text-[10px] font-mono font-extrabold text-orange-605 uppercase tracking-wider block">
              Consolidated Timetable View
            </span>
          </div>
          <h2 className="text-slate-900 text-lg font-black tracking-tight flex items-center gap-2">
            School Timetable Overview
          </h2>
          <p className="text-slate-500 text-xs font-sans font-medium">
            View the complete academic timetable for all classes. This timetable is maintained by the school administration and reflects the latest approved schedule.
          </p>
        </div>

        {/* Export and action controls (Exclusively for Admins) */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={loadData}
            title="Reload Timetable Matrix"
            className="p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition duration-155 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {isAdmin && (
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition duration-155 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB DAY SELECTIONS */}
      <div className="tab-selection-container flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl max-w-2xl no-print animate-in fade-in duration-100">
        {daysOfWeek.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex-1 py-1.5 px-3 text-xs font-bold font-sans tracking-wide uppercase rounded-lg transition-all duration-155 cursor-pointer text-center ${
              selectedDay === day
                ? 'bg-white text-orange-600 shadow-3xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/45'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* MATRIX TABLE DISPLAY CONTAINER */}
      <div 
        id="print-area-matrix" 
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-6 shadow-3xs space-y-5"
      >
        {/* BRANDING HEADER */}
        <div className="border-b-2 border-slate-950 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black select-none shadow-xs">
                GP
              </span>
              <h1 className="text-slate-955 text-base font-black tracking-tight uppercase leading-none">
                {schoolSettings?.school_name || "Government Secondary School"}
              </h1>
            </div>
            <p className="text-slate-500 text-[10px] font-mono font-medium max-w-xl">
              {schoolSettings?.school_affiliation || "Bihar State Board Affiliated School Timetable"}
            </p>
          </div>
          <div className="md:text-right font-mono text-[10.5px] text-slate-500 font-bold space-y-0.5 leading-snug">
            <div>DOCUMENT: FULL SCHOOL ROUTINE MATRIX</div>
            <div>DAY ROSTER: <span className="text-orange-600 uppercase font-black">{selectedDay}</span></div>
          </div>
        </div>

        {/* LAST UPDATED & METADATA BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 font-sans">Last Updated:</span>
            <span className="font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 font-sans">{getLatestUpdatedString()}</span>
          </div>
          <div className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
            Roster: {selectedDay} • Configured Status
          </div>
        </div>

        {/* COMPACT ROUTINE HIGH COMPARATIVE MATRIX */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-700 font-mono text-[10px] uppercase font-black tracking-wider text-left">
                <th className="p-4 border border-slate-300 w-36 bg-slate-50 font-black text-center">
                  Class / Period
                </th>
                {uniquePeriods.map((period) => (
                  <th key={period} className="p-4 border border-slate-300 min-w-[140px] align-top bg-slate-50/50">
                    <div className="font-extrabold text-slate-900 text-xs">{period}</div>
                    <div className="text-[10px] text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-orange-400 shrink-0" />
                      {getPeriodTime(period) || 'Hours unset'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 text-xs font-sans font-medium text-slate-800 bg-white">
              {dynamicClasses.map((cls) => (
                <tr key={cls} className="hover:bg-slate-50/25 transition">
                  {/* Class Identity Column */}
                  <td className="p-4 border border-slate-300 bg-slate-50 font-black text-slate-900 uppercase text-xs w-36 text-center align-middle">
                    {cls}
                  </td>
                  
                  {/* Period Time Cells mapping */}
                  {uniquePeriods.map((period) => {
                    const matched = getMatrixEntry(cls, selectedDay, period);
                    return (
                      <td key={period} className="p-4 border border-slate-300 align-top min-w-[140px] transition duration-150">
                        {matched ? (
                          <div className="space-y-1">
                            <span className="block text-slate-950 font-bold text-xs leading-snug">
                              {matched.subject}
                            </span>
                            {(() => {
                              if (matched.teacher_id) {
                                const f = faculty.find(fac => fac.id === matched.teacher_id);
                                if (f) return f.name;
                              }
                              return matched.teacher;
                            })() && (
                              <span className="text-[10.5px] text-slate-550 font-medium flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                {(() => {
                                  if (matched.teacher_id) {
                                    const f = faculty.find(fac => fac.id === matched.teacher_id);
                                    if (f) return f.name;
                                  }
                                  return matched.teacher;
                                })()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="py-2 flex flex-col justify-start select-none">
                            <span className="text-slate-300 italic text-[10px] tracking-wide font-medium">
                              Empty Slot
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER DOCUMENTATION INFORMATION */}
        <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-mono font-medium leading-relaxed gap-2">
          <span>GP-Roster System v2.6 • School Timetable database synchronised.</span>
          <span className="print:inline hidden font-bold">Official Bihar Board Affiliation document code 102305.</span>
        </div>
      </div>
    </div>
  );
};
