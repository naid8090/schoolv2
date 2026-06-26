/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Mail, Phone, BookOpen, GraduationCap, Briefcase, User, X } from 'lucide-react';
import { Faculty } from '../types';
import { dbService } from '../services/db';
import { useDataSync } from '../hooks/useDataSync';

export const FacultyDirectory: React.FC = () => {
  const [facultyList, setFacultyList] = useState<Faculty[]>(() => dbService.getFaculty());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedDesig, setSelectedDesig] = useState('All');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  useDataSync(() => {
    setFacultyList(dbService.getFaculty());
  }, 'FacultyDirectory');

  // Derive filters from active list
  const activeFaculty = facultyList.filter(f => f.is_active);
  
  const departments = ['All', ...Array.from(new Set(activeFaculty.map(f => f.department).filter(Boolean)))];
  const designations = ['All', ...Array.from(new Set(activeFaculty.map(f => f.designation).filter(Boolean)))];

  // Search & Filter
  const filteredFaculty = activeFaculty.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ((f.bio || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDept === 'All' || f.department === selectedDept;
    const matchesDesig = selectedDesig === 'All' || f.designation === selectedDesig;

    return matchesSearch && matchesDept && matchesDesig;
  }).sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="faculty-directory">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-[10px] uppercase font-mono font-bold text-orange-600 tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
          Academic Registry
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
          Our Scholars & Lecturers
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed font-sans">
          The certified educators and administrative pillars guiding candidates toward academic honors under BSEB Bihar directives.
        </p>
      </div>

      {/* SEARCH AND FILTER PANEL */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 mb-8 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        {/* Search input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, subject, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-xs sm:text-sm pl-11 pr-4 py-2.5 font-sans font-medium text-slate-800"
          />
        </div>

        {/* Filter Department */}
        <div className="w-full md:w-52">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-xs sm:text-sm px-3.5 py-2.5 font-sans font-semibold text-slate-700"
          >
            <option value="All">All Departments</option>
            {departments.filter(d => d !== 'All').map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Filter Designation */}
        <div className="w-full md:w-52">
          <select
            value={selectedDesig}
            onChange={(e) => setSelectedDesig(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-xs sm:text-sm px-3.5 py-2.5 font-sans font-semibold text-slate-700"
          >
            <option value="All">All Designations</option>
            {designations.filter(d => d !== 'All').map(desig => (
              <option key={desig} value={desig}>{desig}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CARDS GRID */}
      {filteredFaculty.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map(fac => (
            <div
              key={fac.id}
              onClick={() => setSelectedFaculty(fac)}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs transition hover:shadow-md hover:scale-[1.01] cursor-pointer flex items-center gap-4.5 group"
            >
              {/* Photo Box */}
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 group-hover:border-orange-500/30 transition shadow-inner shrink-0 relative">
                {fac.photo_url ? (
                  <img
                    src={fac.photo_url}
                    alt={fac.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-sky-50 flex items-center justify-center">
                    <User className="w-8 h-8 text-sky-700" />
                  </div>
                )}
              </div>

              {/* Basic Fields */}
              <div className="space-y-1 min-w-0">
                <span className="inline-block text-[9px] uppercase font-mono font-bold text-orange-600 bg-orange-50/80 px-2 py-0.5 rounded border border-orange-100/55">
                  {fac.designation}
                </span>
                <h4 className="text-slate-900 font-bold text-sm sm:text-base truncate group-hover:text-orange-600 transition">
                  {fac.name}
                </h4>
                <p className="text-slate-500 text-xs truncate font-sans">
                  <span className="font-semibold text-slate-700">Subject: </span>
                  {fac.subject}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <span>{fac.department} Department</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-12 text-center max-w-md mx-auto">
          <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-slate-800 font-bold text-sm uppercase font-mono">No Faculty Members Found</h4>
          <p className="text-slate-500 text-xs mt-1 font-sans">Try resetting your filter parameters or search queries values.</p>
        </div>
      )}

      {/* FACULTY DETAIL POPUP */}
      {selectedFaculty && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]">
            {/* Elegant Header Accent */}
            <div className="h-2 bg-orange-500 w-full" />
            
            {/* Close button */}
            <button
              onClick={() => setSelectedFaculty(null)}
              className="absolute right-4 top-5 p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-150 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Photo & Identity Hero Block */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left border-b border-slate-100 pb-5">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border-3 border-orange-500/20 shadow-md shrink-0 relative">
                  {selectedFaculty.photo_url ? (
                    <img
                      src={selectedFaculty.photo_url}
                      alt={selectedFaculty.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-sky-50 flex items-center justify-center">
                      <User className="w-10 h-10 text-sky-700" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block text-[10px] uppercase font-mono font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                    {selectedFaculty.designation}
                  </span>
                  <h3 className="text-slate-900 font-extrabold text-lg sm:text-xl tracking-tight leading-tight">
                    {selectedFaculty.name}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500 font-semibold font-sans">
                    <span>{selectedFaculty.department} Department</span>
                    <span className="hidden sm:inline text-slate-305">•</span>
                    <span>Subject: <strong className="text-slate-700 font-bold">{selectedFaculty.subject}</strong></span>
                  </div>
                </div>
              </div>

              {/* Qualifications & Experience Lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="text-slate-400 block font-mono uppercase tracking-wide text-[9px] font-bold">Qualification credentials</span>
                    <span className="text-slate-800 font-bold block mt-0.5 font-sans leading-relaxed">{selectedFaculty.qualification}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="text-slate-400 block font-mono uppercase tracking-wide text-[9px] font-bold">Experience record</span>
                    <span className="text-slate-800 font-bold block mt-0.5 font-sans leading-relaxed">{selectedFaculty.experience}</span>
                  </div>
                </div>
              </div>

              {/* Biography Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-orange-500" /> Biography Overview
                </h4>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed p-4 bg-slate-50 border border-slate-100 rounded-xl italic font-sans font-medium">
                  "{selectedFaculty.bio || "No custom biography details configured for this scholar."}"
                </p>
              </div>

              {/* Optional Contact details */}
              {(selectedFaculty.email || selectedFaculty.phone) && (
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-semibold font-sans">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono mb-2">Direct Contact Desks</h4>
                  
                  {selectedFaculty.email && (
                    <div className="flex items-center gap-2 text-slate-605 hover:text-orange-600 transition">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={`mailto:${selectedFaculty.email}`} className="truncate transition-colors">{selectedFaculty.email}</a>
                    </div>
                  )}

                  {selectedFaculty.phone && (
                    <div className="flex items-center gap-2 text-slate-605 hover:text-orange-600 transition mt-1.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <a href={`tel:${selectedFaculty.phone}`} className="transition-colors">{selectedFaculty.phone}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Popup footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-105 flex justify-end">
              <button
                onClick={() => setSelectedFaculty(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold tracking-wide transition cursor-pointer font-sans"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
