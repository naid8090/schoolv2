/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Award, BookOpen, Clock, FileCheck, CheckCircle2, Send, HelpCircle, Star, Sparkles } from 'lucide-react';
import { SchoolSettings } from '../types';
import { dbService } from '../services/db';

interface ViewProps {
  schoolSettings: SchoolSettings;
  onViewChange: (view: string) => void;
}

// 1. ABOUT PAGE COMPONENT
export const AboutPage: React.FC<ViewProps> = ({ schoolSettings, onViewChange }) => {
  const stats = [
    { value: '1,800+', label: 'Registered Students' },
    { value: '55+', label: 'Certified Lecturers' },
    { value: '100%', label: 'BSEB Matric Pass-Rate' },
    { value: 'Est. 1947', label: 'Academic Independence' }
  ];

  const facultyList = dbService.getFaculty();
  const principal = facultyList.find(f => f.is_active && (f.designation.toLowerCase() === 'principal' || f.designation.toLowerCase().includes('principal')));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-slate-600" id="about-domain-view">
      
      {/* Overview Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-full text-xs font-mono font-bold uppercase tracking-widest">
            Institutional Legacy
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight uppercase leading-none">
            Empowering Secondary Academic Eminence in Patna
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans font-medium">
            Rajendra Prasad Government Senior Secondary School stands as a premier educational establishment under the Ministry of Education, State of Bihar. Anchoring classes from 9 to 12, we specialize in high-caliber instruction formats mapping strict NCERT modules and official Bihar School Examination Board patterns.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
            <span className="font-bold text-sky-900 text-xs uppercase block tracking-wide">Motto Affirmation</span>
            <p className="text-xs italic text-slate-600">
              "{schoolSettings.school_motto}"
            </p>
          </div>
        </div>

        {/* Aesthetic illustrations blocks */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent pointer-events-none" />
          <h3 className="text-slate-900 text-base font-bold uppercase mb-4 tracking-wide flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            BSEB PATNA RECOGNITIONS
          </h3>
          
          <ul className="space-y-4 text-xs tracking-wide font-medium text-slate-600">
            <li className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
              <div>
                <strong className="text-slate-800 block uppercase font-bold">Continuous grading matrices</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">Regular terminal diagnostics ensuring students top state science quotas.</span>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
              <div>
                <strong className="text-slate-800 block uppercase font-bold">Infrastructure expansion</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">Equipped with physics, chemistry, biology laboratories and localized computer centers.</span>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
              <div>
                <strong className="text-slate-800 block uppercase font-bold">Bihar Govt Scholarship integration</strong>
                <span className="text-slate-600 text-[11px] sm:text-xs">Post-Matric scholarship facilitation counters assisting diverse background students.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-100 p-6 rounded-2xl text-center shadow-sm transform hover:-translate-y-1 transition duration-200">
            <span className="block text-2xl sm:text-3xl font-bold text-orange-600 tracking-tight font-mono">{stat.value}</span>
            <span className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Principal Address Message Panel */}
      <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="w-16 h-16 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
          {principal?.photo_url && principal.photo_url.trim() !== '' ? (
            <img src={principal.photo_url} alt={principal.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <BookOpen className="w-8 h-8 text-orange-600" />
          )}
        </div>
        <div className="space-y-3 flex-1">
          <span className="text-[10px] uppercase font-mono font-bold text-orange-600 tracking-widest">{principal?.designation || "Office of the Principal"} Desk</span>
          <h3 className="text-slate-900 text-base sm:text-lg font-bold uppercase tracking-wider">
            "Academic Devotion and Cultural Character"
          </h3>
          <p className="text-slate-605 text-xs sm:text-sm leading-relaxed font-sans italic">
            "{principal?.bio || "Rajendra Prasad GSSS is dedicated to fostering not just structural scores but deep moral character matching Bihar heritage. Our classrooms ensure students from all sectors achieve independent capacities in physics, mathematics, humanities, and accounting standards. We welcome guardians to inspect and support our academic board schedules."}"
          </p>
          <span className="block text-xs font-semibold text-slate-500 tracking-wide uppercase mt-1">
            — {principal ? `${principal.name}${principal.qualification ? ", " + principal.qualification : ""} (${principal.designation})` : "Shri S.K. Chaudhary, M.Sc., B.Ed. (Principal)"}
          </span>
        </div>
      </div>

    </div>
  );
};


// 2. ADMISSIONS PAGE COMPONENT
export const AdmissionsPage: React.FC<ViewProps> = ({ schoolSettings, onViewChange }) => {
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    guardianName: '',
    classLevel: 'Class 11 Science',
    matricRollCode: '',
    contactNum: '',
    streamPreference: 'General Science',
  });

  const streams = [
    { title: 'Intermediate Science (I.Sc)', seats: '240 Seats', detail: 'Physics, Chemistry, Mathematics, Biology, Hindi, English core mapping BSEB standards.' },
    { title: 'Intermediate Commerce (I.Com)', seats: '160 Seats', detail: 'Accountancy, Business Studies, Entrepreneurship, Economics, Core Languages.' },
    { title: 'Intermediate Arts (I.A)', seats: '160 Seats', detail: 'History, Political Science, Geography, Sociology, Philosophy core streams.' }
  ];

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.contactNum) {
      alert('Student Name and Contact Number are required fields.');
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-slate-600" id="admissions-domain-view">
      
      {/* Banner introduction */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline px-3.5 py-1 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-mono font-bold uppercase rounded-full tracking-widest">
          Academic Registrations 2026-2027
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 uppercase tracking-tight">
          Class 9 to 12 Enrollment desk
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Inspect stream criteria, cut-off indexes, reservation matrices, and dispatch online admission inquiries directly to the administrative panel registrar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Streams Available List (Left) */}
        <div className="space-y-6">
          <h3 className="text-slate-900 text-base font-bold uppercase tracking-wide border-l-2 border-orange-500 pl-3.5 mb-6">
            Offered Streams and Seat Matrices
          </h3>

          <div className="space-y-4">
            {streams.map((stream, idx) => (
              <div key={idx} className="p-5 bg-white border border-slate-100 hover:border-orange-500/20 rounded-2xl shadow-sm transition-all duration-300">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wide">{stream.title}</h4>
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10.5px] font-mono font-bold rounded border border-orange-100">
                    {stream.seats}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2">{stream.detail}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-100 border border-slate-200/50 rounded-xl space-y-3">
            <span className="block text-xs font-bold uppercase text-sky-900 tracking-wider">Eligibility cutoff criteria</span>
            <ul className="space-y-2 text-xs text-slate-600 font-medium">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Class 11 Science: Minimum 60% cumulative score in Matric board.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Class 11 Commerce: Minimum 50% score in Matric board.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>Government reservation guidelines (OBC/EBC/SC/ST/EWS) apply in full matching State directives.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Admissions Inquiry Form (Right) */}
        <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-sm relative" id="admission-form-panel">
          <h3 className="text-slate-900 text-sm font-bold uppercase tracking-wide border-b border-slate-100 pb-3 mb-6">
            Dispatch Admission Inquiry form
          </h3>

          {success ? (
            <div className="text-center py-10 space-y-4" id="inquiry-success-message">
              <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 animate-bounce">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-slate-930 font-bold text-base uppercase tracking-wider">Inquiry Record Saved successfully!</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Thank you for dispatching admissions interest for {formData.studentName}. Administrative clerks will verify roll parameters and get in contact at {formData.contactNum}.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-600 text-xs font-bold rounded uppercase cursor-pointer transition-colors"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdmissionSubmit} className="space-y-4.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Name */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shashi Shekhar Kumar"
                    value={formData.studentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-505 rounded text-slate-800 text-xs px-3.5 py-2.5"
                  />
                </div>

                {/* Guardian Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Father's / Guardian Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ram Kishor Prasad"
                    value={formData.guardianName}
                    onChange={(e) => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-505 rounded text-slate-800 text-xs px-3.5 py-2.5"
                  />
                </div>

                {/* Contact Num */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Contact Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., +91 94310 12XXX"
                    value={formData.contactNum}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactNum: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-505 rounded text-slate-800 text-xs px-3.5 py-2.5"
                  />
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Seeking Entry Class</label>
                  <select
                    value={formData.classLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, classLevel: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-505 rounded text-slate-650 text-xs px-3 py-2.5"
                  >
                    <option value="Class 9 Entry">Class 9 Matric Track</option>
                    <option value="Class 10 Transfer">Class 10 Matric Track</option>
                    <option value="Class 11 Science">Class 11 Intermediate Science</option>
                    <option value="Class 11 Commerce">Class 11 Intermediate Commerce</option>
                    <option value="Class 11 Arts">Class 11 Intermediate Arts</option>
                  </select>
                </div>

                {/* Previous Roll Index */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Matric Roll / School Vouchers</label>
                  <input
                    type="text"
                    placeholder="e.g., BSEB Roll Code-No."
                    value={formData.matricRollCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, matricRollCode: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-505 rounded text-slate-800 text-xs px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-right">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Inquiry
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

    </div>
  );
};


// 3. CONTACT PAGE COMPONENT
export const ContactPage: React.FC<ViewProps> = ({ schoolSettings, onViewChange }) => {
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      alert('Name and Message are required.');
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-slate-600" id="contact-domain-view">
      
      {/* Overview */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline px-3 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 text-xs font-mono font-bold uppercase rounded-full tracking-widest">
          Public Contact desk
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 uppercase tracking-tight">
          School contact and directions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Inquire about board registrations, holiday schedules, student portfolios verification, or report security feedback lines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Coordinates (Col 1) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-6">
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wide border-l-2 border-orange-500 pl-3">
              Direct Desk Lines
            </h4>

            <ul className="space-y-4 text-xs tracking-wide">
              {/* Address */}
              <li className="flex items-start gap-3">
                <MapPin className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-500 font-mono font-bold text-[10px] uppercase">Physical Location</span>
                  <span className="text-slate-800 leading-relaxed font-sans">{schoolSettings.address}</span>
                </div>
              </li>

              {/* Phone */}
              <li className="flex items-start gap-4">
                <Phone className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-500 font-mono font-bold text-[10px] uppercase">Telephone lines</span>
                  <a href={`tel:${schoolSettings.phone}`} className="text-slate-800 hover:text-orange-655 transition leading-snug">{schoolSettings.phone}</a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-4">
                <Mail className="w-4.5 h-4.5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-slate-500 font-mono font-bold text-[10px] uppercase">Official Email</span>
                  <a href={`mailto:${schoolSettings.email}`} className="text-slate-800 hover:text-orange-655 transition leading-snug break-all">{schoolSettings.email}</a>
                </div>
              </li>
            </ul>

            {/* Timing specifications */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
              <span className="text-[10px] uppercase font-mono font-bold text-sky-90">Summer office hours</span>
              <ul className="space-y-1 text-[11px] text-slate-600 font-sans font-medium">
                <li className="flex justify-between">
                  <span>Mon - Fri:</span>
                  <span className="font-bold text-slate-800">07:30 AM to 01:30 PM</span>
                </li>
                <li className="flex justify-between">
                  <span>Saturday:</span>
                  <span className="font-bold text-slate-800">07:30 AM to 11:30 AM</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact direct inquiry (Col 2 & 3) */}
        <div className="lg:col-span-2 bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-sm">
          <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wide border-b border-slate-100 pb-3 mb-6">
            Dispatch direct inquiry record
          </h4>

          {success ? (
            <div className="text-center py-12 space-y-4" id="contact-success-message">
              <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-500 animate-bounce">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="text-slate-900 font-bold text-base uppercase">Message Dispatched successfully!</h4>
              <p className="text-xs text-slate-605 leading-relaxed max-w-sm mx-auto">
                Thank you, {formData.name}. Your direct inquire about "{formData.subject}" has been successfully logged with the board registrar desk.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-600 text-xs font-bold rounded uppercase cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Ram Sagar Sah"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded text-slate-800 text-xs px-3.5 py-2.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g., ram@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded text-slate-800 text-xs px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Inquiry category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-510 rounded text-slate-600 text-xs px-3 py-2.5"
                >
                  <option value="General Inquiry">General School Inquiry</option>
                  <option value="BSEB Board Registration">Matric & Intermediate BSEB Board registrations</option>
                  <option value="Scholarships circulars eligibility">OBC/EBC Post-Matric Scholarship guidelines</option>
                  <option value="Student Transcript verifying">Student Transcript Verification Requests</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Detailed Message Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail your request..."
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full bg-slate-55 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded text-slate-800 text-xs px-3.5 py-3.5 leading-relaxed font-sans"
                />
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Inquiry
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

    </div>
  );
};
