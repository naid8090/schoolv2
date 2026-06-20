/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, X, Lock, LogOut, ShieldAlert, Award, ChevronDown } from 'lucide-react';
import { SchoolSettings } from '../types';
import { CustomSchoolEmblem } from './CommonAssets';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  schoolSettings: SchoolSettings;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  schoolSettings,
  isAdminLoggedIn,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItemsLeft = [
    { label: 'Home', id: 'home' },
    { label: 'Notice Board', id: 'notices' },
    { label: 'Events Calendar', id: 'events' },
  ];

  const navItemsRight = [
    { label: 'Faculty & Staff', id: 'faculty' },
    { label: 'About', id: 'about' },
    { label: 'Admissions', id: 'admissions' },
    { label: 'Contact', id: 'contact' },
  ];

  const mobileNavItems = [
    { label: 'Home', id: 'home' },
    { label: 'Notice Board', id: 'notices' },
    { label: 'Events Calendar', id: 'events' },
    { label: 'Class Routine', id: 'routine' },
    { label: 'Exam Schedule', id: 'exams' },
    { label: 'Academic Calendar', id: 'calendar' },
    { label: 'Faculty & Staff', id: 'faculty' },
    { label: 'About', id: 'about' },
    { label: 'Admissions', id: 'admissions' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full" id="site-header">
      {/* Top Affiliate Mini-Bar */}
      <div className="w-full bg-amber-500 text-slate-950 px-4 py-1 text-center text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2">
        <Award className="w-3.5 h-3.5" />
        <span>A Government School under the Education Department, Government of Bihar</span>
      </div>

      {/* Main navigation container */}
      <nav className="w-full bg-white border-b border-slate-100 text-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* School Logo & Title */}
            <div 
              className="flex items-center gap-3.5 cursor-pointer group"
              onClick={() => { onViewChange('home'); setIsMobileMenuOpen(false); }}
              id="brand-container"
            >
              {schoolSettings.logo_url === 'school_logo_default' ? (
                <CustomSchoolEmblem className="w-12 h-12 group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <img 
                  src={schoolSettings.logo_url} 
                  alt="School Logo" 
                  className="w-12 h-12 object-contain rounded-full border border-orange-500/20 bg-slate-50 p-0.5 group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-800 group-hover:text-orange-600 transition-colors duration-300 uppercase font-sans line-clamp-1 max-w-[280px] sm:max-w-[420px]">
                  {schoolSettings.school_name}
                </span>
                <span className="text-[10px] sm:text-xs text-orange-600 font-medium font-sans italic line-clamp-1">
                  Government of Bihar Portal
                </span>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center space-x-1" id="desktop-menu">
              {navItemsLeft.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onViewChange(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-all duration-200 ${
                      isActive 
                        ? 'text-orange-600 border-b-2 border-orange-500 rounded-none bg-orange-500/5' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* Academics Hover Dropdown */}
              <div className="relative group/academics shrink-0">
                <button
                  id="nav-link-academics"
                  className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-all duration-250 ${
                    ['routine', 'exams', 'calendar'].includes(currentView)
                      ? 'text-orange-600 border-b-2 border-orange-500 rounded-none bg-orange-500/5 font-semibold'
                      : ''
                  }`}
                >
                  Academics
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover/academics:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-0 w-52 bg-white border border-slate-100 rounded-xl shadow-lg py-1.5 hidden group-hover/academics:block z-50 transition-all duration-200">
                  <button
                    id="dropdown-link-routine"
                    onClick={() => onViewChange('routine')}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 block ${
                      currentView === 'routine' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                    }`}
                  >
                    Class Routine
                  </button>
                  <button
                    id="dropdown-link-exams"
                    onClick={() => onViewChange('exams')}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 block ${
                      currentView === 'exams' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                    }`}
                  >
                    Exam Schedule
                  </button>
                  <button
                    id="dropdown-link-calendar"
                    onClick={() => onViewChange('calendar')}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 block ${
                      currentView === 'calendar' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                    }`}
                  >
                    Academic Calendar
                  </button>
                </div>
              </div>

              {navItemsRight.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => onViewChange(item.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium tracking-wide transition-all duration-200 ${
                      isActive 
                        ? 'text-orange-600 border-b-2 border-orange-500 rounded-none bg-orange-500/5' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <span className="h-5 w-[1px] bg-slate-200 mx-2" />

              {/* Admin Button */}
              {isAdminLoggedIn ? (
                <div className="flex items-center gap-2">
                  <button
                    id="nav-link-admin-panel"
                    onClick={() => onViewChange('admin')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium tracking-wide border border-sky-900/30 text-sky-900 transition-all duration-200 ${
                      currentView === 'admin' ? 'bg-sky-900 text-white font-semibold' : 'hover:bg-sky-50'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Dashboard
                  </button>
                  <button
                    id="nav-logout-btn"
                    onClick={onLogout}
                    title="Sign Out Admin"
                    className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="nav-link-admin"
                  onClick={() => onViewChange('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs sm:text-sm font-medium tracking-wide border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-500/30 hover:bg-orange-50/20 transition-all duration-200`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Admin Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {isAdminLoggedIn && (
                <button
                  id="mobile-admin-dashboard-shortcut"
                  onClick={() => { onViewChange('admin'); setIsMobileMenuOpen(false); }}
                  className="p-2 rounded-md text-orange-600 border border-orange-500/15 bg-orange-50"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              )}
              <button
                id="mobile-menu-trigger"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-4 space-y-1 shadow-lg" id="mobile-menu">
            {mobileNavItems.map((item) => {
               const isActive = currentView === item.id;
               return (
                <button
                  key={item.id}
                  id={`mobile-nav-link-${item.id}`}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2.5 rounded-md text-base font-bold transition-all duration-200 ${
                    isActive 
                      ? 'bg-orange-500 text-white' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            <div className="border-t border-slate-100 my-2 pt-2" />

            {isAdminLoggedIn ? (
              <div className="space-y-1 pb-1">
                <button
                  id="mobile-nav-link-admin-dash"
                  onClick={() => {
                    onViewChange('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-md text-base font-bold text-sky-900 bg-sky-50 border border-sky-900/10`}
                >
                  <ShieldAlert className="w-5 h-5" />
                  Admin Dashboard
                </button>
                <button
                  id="mobile-logout-btn"
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-md text-base font-bold text-red-500 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  Logout Session
                </button>
              </div>
            ) : (
              <button
                id="mobile-nav-link-admin-login"
                onClick={() => {
                  onViewChange('admin');
                  setIsMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
              >
                <Lock className="w-5 h-5 text-slate-400" />
                Admin Authentication
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};
