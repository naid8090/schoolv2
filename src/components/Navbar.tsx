/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, X, Lock, LogOut, ShieldAlert, Award, ChevronDown } from 'lucide-react';
import { SchoolSettings } from '../types';
import { CustomSchoolEmblem } from './CommonAssets';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isMobileAcademicsOpen, setIsMobileAcademicsOpen] = useState(() => {
    return ['routine', 'exams', 'calendar'].includes(currentView);
  });

  // Lock page scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle window resizing to close mobile drawer when crossing the desktop breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
      <div className="w-full bg-amber-500 text-slate-950 px-4 py-1.5 text-center text-[10px] xs:text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-1.5 overflow-hidden h-9">
        <Award className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate whitespace-nowrap">A Government School under the Education Department, Government of Bihar</span>
      </div>

      {/* Main navigation container */}
      <nav className="w-full bg-white border-b border-slate-100 text-slate-700 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* School Logo & Title */}
            <div 
              className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0 flex-1 xl:flex-initial transition-all duration-300"
              onClick={() => { onViewChange('home'); setIsMobileMenuOpen(false); }}
              id="brand-container"
            >
              {schoolSettings.logo_url === 'school_logo_default' ? (
                <CustomSchoolEmblem className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <img 
                  src={schoolSettings.logo_url} 
                  alt="School Logo" 
                  className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 object-contain rounded-full border border-orange-500/20 bg-slate-50 p-0.5 group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-extrabold text-xs xs:text-sm md:text-base xl:text-lg tracking-tight text-slate-800 group-hover:text-orange-600 transition-colors duration-300 uppercase font-sans truncate pr-2">
                  {schoolSettings.school_name}
                </span>
                
                {/* Desktop: Government of Bihar Portal */}
                <span className="hidden xl:block text-xs text-orange-600 font-semibold font-sans italic truncate">
                  Government of Bihar Portal
                </span>
                
                {/* Tablet: Govt. of Bihar Portal */}
                <span className="hidden md:block xl:hidden text-[10px] md:text-xs text-orange-600 font-medium font-sans italic truncate">
                  Govt. of Bihar Portal
                </span>
                
                {/* Mobile: Hidden completely (< md) */}
              </div>
            </div>

            {/* Right-side Group: Desktop Nav + Responsive Admin Button + Hamburger */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0" id="right-nav-group">
              
              {/* Desktop Nav Items */}
              <div className="hidden xl:flex items-center space-x-1" id="desktop-menu">
                {navItemsLeft.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-link-${item.id}`}
                      onClick={() => onViewChange(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
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
                    className={`px-3 py-2 rounded-md text-sm font-semibold tracking-wide text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-all duration-250 cursor-pointer ${
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
                      className={`w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 block cursor-pointer ${
                        currentView === 'routine' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                      }`}
                    >
                      Class Routine
                    </button>
                    <button
                      id="dropdown-link-exams"
                      onClick={() => onViewChange('exams')}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 block cursor-pointer ${
                        currentView === 'exams' ? 'text-orange-600 bg-orange-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-orange-600'
                      }`}
                    >
                      Exam Schedule
                    </button>
                    <button
                      id="dropdown-link-calendar"
                      onClick={() => onViewChange('calendar')}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-150 block cursor-pointer ${
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
                      className={`px-3 py-2 rounded-md text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? 'text-orange-600 border-b-2 border-orange-500 rounded-none bg-orange-500/5' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}

                <span className="h-5 w-[1px] bg-slate-200 mx-2 animate-in fade-in" />
              </div>

              {/* Responsive Admin / Dashboard Button */}
              <div className="flex items-center gap-1.5" id="adaptive-admin-container">
                {isAdminLoggedIn ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      id="nav-link-admin-panel"
                      onClick={() => onViewChange('admin')}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide border transition-all duration-200 cursor-pointer ${
                        currentView === 'admin' 
                          ? 'bg-sky-900 text-white border-sky-900 font-bold shadow-sm shadow-sky-900/10' 
                          : 'border-sky-900/35 text-sky-900 bg-sky-50/50 hover:bg-sky-50'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-sky-700" />
                      <span className="hidden md:inline">Dashboard</span>
                      <span className="hidden xs:inline md:hidden">Admin</span>
                    </button>
                    
                    {/* Logout Button (Desktop & Tablet, Hidden on Mobile) */}
                    <button
                      id="nav-logout-btn"
                      onClick={onLogout}
                      title="Sign Out Admin"
                      className="hidden xs:flex p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-all duration-200 cursor-pointer shrink-0 border border-slate-100 bg-slate-50"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    id="nav-link-admin"
                    onClick={() => onViewChange('admin')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2 rounded-lg text-xs sm:text-sm font-bold tracking-wide border transition-all duration-200 cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/10 font-bold'
                        : 'border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-500/30 hover:bg-orange-50/20'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">Admin Login</span>
                    <span className="hidden xs:inline md:hidden">Admin</span>
                  </button>
                )}
              </div>

              {/* Hamburger Menu Trigger */}
              <button
                id="mobile-menu-trigger"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="xl:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none cursor-pointer shrink-0 transition-colors border border-slate-100 bg-slate-50"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-Over Drawer Overlay with Backdrop */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Semi-transparent Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 xl:hidden"
                id="mobile-menu-backdrop"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 xl:hidden flex flex-col h-full border-l border-slate-100"
                id="mobile-drawer"
              >
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    {schoolSettings.logo_url === 'school_logo_default' ? (
                      <CustomSchoolEmblem className="w-9 h-9 shrink-0" />
                    ) : (
                      <img 
                        src={schoolSettings.logo_url} 
                        alt="School Logo" 
                        className="w-9 h-9 shrink-0 object-contain rounded-full border border-orange-500/10 bg-slate-50 p-0.5"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs tracking-tight text-slate-800 uppercase font-sans line-clamp-1 max-w-[180px]">
                        {schoolSettings.school_name}
                      </span>
                      <span className="text-[9px] text-orange-600 font-medium font-sans italic">
                        Menu Directory
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Close Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className="flex-grow overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
                  <button
                    id="mobile-nav-link-home"
                    onClick={() => { onViewChange('home'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'home' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Home
                  </button>
                  
                  <button
                    id="mobile-nav-link-notices"
                    onClick={() => { onViewChange('notices'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'notices' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Notice Board
                  </button>
                  
                  <button
                    id="mobile-nav-link-events"
                    onClick={() => { onViewChange('events'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'events' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Events Calendar
                  </button>

                  {/* Academics Accordion */}
                  <div className="space-y-1">
                    <button
                      id="mobile-nav-link-academics-trigger"
                      onClick={() => setIsMobileAcademicsOpen(!isMobileAcademicsOpen)}
                      className={`flex items-center justify-between w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                        ['routine', 'exams', 'calendar'].includes(currentView)
                          ? 'text-orange-600 bg-orange-50' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>Academics</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isMobileAcademicsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isMobileAcademicsOpen && (
                      <div className="pl-4 border-l-2 border-orange-200 ml-4 space-y-1 mt-1">
                        <button
                          id="mobile-nav-link-routine"
                          onClick={() => { onViewChange('routine'); setIsMobileMenuOpen(false); }}
                          className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            currentView === 'routine' ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          Class Routine
                        </button>
                        <button
                          id="mobile-nav-link-exams"
                          onClick={() => { onViewChange('exams'); setIsMobileMenuOpen(false); }}
                          className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            currentView === 'exams' ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          Exam Schedule
                        </button>
                        <button
                          id="mobile-nav-link-calendar"
                          onClick={() => { onViewChange('calendar'); setIsMobileMenuOpen(false); }}
                          className={`block w-full text-left px-3 py-2 rounded-md text-xs font-semibold transition-all duration-150 cursor-pointer ${
                            currentView === 'calendar' ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          Academic Calendar
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    id="mobile-nav-link-faculty"
                    onClick={() => { onViewChange('faculty'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'faculty' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Faculty & Staff
                  </button>

                  <button
                    id="mobile-nav-link-about"
                    onClick={() => { onViewChange('about'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'about' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    About School
                  </button>

                  <button
                    id="mobile-nav-link-admissions"
                    onClick={() => { onViewChange('admissions'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'admissions' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Admissions
                  </button>

                  <button
                    id="mobile-nav-link-contact"
                    onClick={() => { onViewChange('contact'); setIsMobileMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'contact' 
                        ? 'bg-orange-500 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    Contact Us
                  </button>
                </div>

                {/* Drawer Footer Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  {isAdminLoggedIn ? (
                    <div className="space-y-2">
                      <button
                        id="mobile-nav-link-admin-dash"
                        onClick={() => {
                          onViewChange('admin');
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-900/15 transition-all cursor-pointer"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Dashboard
                      </button>
                      <button
                        id="mobile-logout-btn"
                        onClick={() => {
                          onLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
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
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      Admin Authentication
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
