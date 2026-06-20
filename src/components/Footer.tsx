/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, Phone, MapPin, Award, ExternalLink, CalendarDays } from 'lucide-react';
import { SchoolSettings } from '../types';
import { CustomSchoolEmblem } from './CommonAssets';

interface FooterProps {
  schoolSettings: SchoolSettings;
  onViewChange: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ schoolSettings, onViewChange }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-sky-950 text-slate-300 border-t border-sky-900" id="site-footer">
      {/* Primary footer layout */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: School Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {schoolSettings.logo_url === 'school_logo_default' ? (
                <CustomSchoolEmblem className="w-12 h-12" />
              ) : (
                <img 
                  src={schoolSettings.logo_url} 
                  alt="School Emblem" 
                  className="w-12 h-12 object-contain rounded-full bg-sky-900 border border-orange-500/20 p-0.5"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex flex-col">
                <span className="text-white font-extrabold text-sm sm:text-base tracking-tight uppercase font-sans">
                  {schoolSettings.school_name}
                </span>
                <span className="text-orange-400 text-[10px] sm:text-xs font-mono font-bold tracking-wide uppercase">
                  {schoolSettings.footer_subtitle || "STATE INFRASTRUCTURE • SECTOR 3"}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm font-medium">
              {schoolSettings.footer_description || "Established with the vision of offering high-standard secondary education to students across Bihar. Providing dedicated Streams in Science, Commerce, and Arts with certified faculties and modernized educational support."}
            </p>
            
            <div className="text-xs italic text-orange-400 font-medium font-sans">
              "{schoolSettings.school_motto}"
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold tracking-widest uppercase border-l-2 border-orange-500 pl-2">
              Navigation
            </h3>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button 
                  onClick={() => onViewChange('home')} 
                  className="hover:text-orange-400 transition-colors duration-150 text-slate-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-500 font-bold">›</span> Home Campus
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onViewChange('notices')} 
                  className="hover:text-orange-400 transition-colors duration-150 text-slate-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-500 font-bold">›</span> Notice Board Archives
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onViewChange('faculty')} 
                  className="hover:text-orange-400 transition-colors duration-150 text-slate-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-500 font-bold">›</span> Faculty & Staff Directory
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onViewChange('about')} 
                  className="hover:text-orange-400 transition-colors duration-150 text-slate-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-500 font-bold">›</span> Academic Backgrounds
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onViewChange('admissions')} 
                  className="hover:text-orange-400 transition-colors duration-150 text-slate-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-500 font-bold">›</span> Admissions & Vouchers
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onViewChange('contact')} 
                  className="hover:text-orange-400 transition-colors duration-150 text-slate-400 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="text-orange-500 font-bold">›</span> Contact Channels
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div className="space-y-4">
            <h3 className="text-white text-sm font-bold tracking-widest uppercase border-l-2 border-orange-500 pl-2">
              Official Desk
            </h3>
            <ul className="space-y-3.5 text-xs text-slate-400 font-medium">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{schoolSettings.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-500 shrink-0" />
                <a href={`tel:${schoolSettings.phone}`} className="hover:text-orange-400 transition-colors">{schoolSettings.phone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <a href={`mailto:${schoolSettings.email}`} className="hover:text-orange-400 transition-colors break-all">{schoolSettings.email}</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-sky-900/60 my-8" />

        {/* Affiliate and Credentials */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-[11px] text-slate-500 font-medium text-center">
          <div className="flex items-center justify-center gap-2.5">
            <Award className="w-4 h-4 text-orange-600" />
            <span>{schoolSettings.school_affiliation || "Ministry of Education, State of Bihar Government Affiliate No: 10230501"}</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-slate-550 font-medium">
          © {currentYear} {schoolSettings.school_name}. Developed in compliance with state secondary guidelines.
        </div>
      </div>
    </footer>
  );
};
