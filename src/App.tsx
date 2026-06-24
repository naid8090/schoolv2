/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, BookOpen, GraduationCap, Calendar, PhoneCall, HelpCircle, ShieldAlert, Key, Award, Layers, Activity, Layout, User, Clock, MapPin, Star, Image as ImageIcon } from 'lucide-react';
import { dbService, DEFAULT_HOMEPAGE_MODULES, ensureValidUUID } from './services/db';
import { supabase } from './services/supabase';
import { supabaseDbService } from './services/supabaseDb';
import { SchoolSettings, HomepageModule } from './types';

// Core parts
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { NoticesPage } from './components/NoticesPage';
import { AboutPage, AdmissionsPage, ContactPage } from './components/AdmissionsAboutContact';
import { FacultyDirectory } from './components/FacultyDirectory';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomSchoolEmblem } from './components/CommonAssets';
import { ClassRoutinePage, ExamSchedulePage, AcademicCalendarPage } from './components/AcademicsPublic';
import { EventsPublic } from './components/EventsPublic';

export default function App() {
  // Global View Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() => dbService.getSchoolSettings());
  const [homepageModules, setHomepageModules] = useState<HomepageModule[]>(() => dbService.getHomepageModules());
  const [dataSyncVersion, setDataSyncVersion] = useState<number>(0);

  // Administration Auth States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);

  // Authorization Form bindings
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Load and sync School Settings & Homepage Modules on Startup
  useEffect(() => {
    let active = true;

    const syncMetadata = async () => {
      try {
        // --- 1. SETTINGS SYNC ---
        const remoteSettings = await supabaseDbService.getSchoolSettings();
        if (active) {
          if (remoteSettings) {
            setSchoolSettings(remoteSettings);
            // Sync cache to local storage
            dbService.saveSchoolSettings(remoteSettings, true);
          } else {
            // Seeding phase: Supabase is empty, read local data and seed Supabase
            const localSettings = dbService.getSchoolSettings();
            try {
              const saved = await supabaseDbService.saveSchoolSettings(localSettings);
              if (active && saved) {
                setSchoolSettings(saved);
              }
            } catch (err) {
              console.warn('[Supabase school settings seeding skipped or failed - typical for guest users]:', err);
            }
          }
        }

        // --- 2. HOMEPAGE MODULES SYNC ---
        const remoteModules = await supabaseDbService.getHomepageModules();

        if (active) {
          if (remoteModules && remoteModules.length > 0) {
            let finalizedModules = [...remoteModules];
            const remoteTypes = new Set(remoteModules.map(m => m.module_type));
            const missingDefaults = DEFAULT_HOMEPAGE_MODULES.filter(d => !remoteTypes.has(d.module_type));

            if (missingDefaults.length > 0) {
              missingDefaults.forEach(def => {
                if (def.module_type === 'Events Preview') {
                  const noticeFeed = finalizedModules.find(m => m.module_type === 'Notice Feed');
                  const noticeFeedOrder = noticeFeed ? noticeFeed.display_order : 2;
                  finalizedModules = finalizedModules.map(m => {
                    if (m.display_order > noticeFeedOrder) {
                      return { ...m, display_order: m.display_order + 1 };
                    }
                    return m;
                  });
                  finalizedModules.push({
                    ...def,
                    id: ensureValidUUID(def.id),
                    display_order: noticeFeedOrder + 1,
                    is_visible: true
                  });
                } else {
                  const maxOrder = finalizedModules.reduce((max, m) => Math.max(max, m.display_order || 0), 0);
                  finalizedModules.push({
                    ...def,
                    id: ensureValidUUID(def.id),
                    display_order: maxOrder + 1
                  });
                }
              });

              // Save the repaired array back to Supabase
              try {
                await supabaseDbService.saveHomepageModules(finalizedModules);
              } catch (err) {
                console.warn('[Failed saving repaired homepage modules to Supabase]:', err);
              }
            }

            // Sort to ensure display order sequence is respected
            finalizedModules.sort((a, b) => a.display_order - b.display_order);

            // Verification Log
            console.log('[REMOTE MODULES VERIFICATION]', {
              length: finalizedModules.length,
              hasEventsPreview: finalizedModules.some(m => m.module_type === 'Events Preview'),
              modules: finalizedModules.map(m => m.module_type)
            });

            setHomepageModules(finalizedModules);
            // Sync cache to local storage
            dbService.saveHomepageModules(finalizedModules, true);
          } else {
            // Seeding phase: Supabase is empty, read local data and seed Supabase
            const localModules = dbService.getHomepageModules();
            try {
              await supabaseDbService.saveHomepageModules(localModules);
            } catch (err) {
              console.warn('[Supabase homepage modules seeding skipped or failed]:', err);
            }
            if (active) {
              setHomepageModules(localModules);
            }
          }
        }

        // --- 3. NOTICES SYNC ---
        try {
          const remoteNotices = await supabaseDbService.getNotices();
          if (active) {
            if (remoteNotices && remoteNotices.length > 0) {
              dbService.saveNotices(remoteNotices, true);
            } else {
              // Seeding phase: Supabase is empty, read local data and seed Supabase locally
              const localNotices = dbService.getNotices();
              dbService.saveNotices(localNotices, true);
            }
          }
        } catch (err) {
          console.error('[Supabase notice sync error]:', err);
        }

        // --- 4. FACULTY SYNC ---
        try {
          const remoteFaculty = await supabaseDbService.getFaculty();
          if (active) {
            if (remoteFaculty && remoteFaculty.length > 0) {
              dbService.saveFaculty(remoteFaculty, true);
            } else {
              // Seeding phase: Supabase is empty, read local data and seed Supabase locally
              const localFaculty = dbService.getFaculty();
              dbService.saveFaculty(localFaculty, true);
            }
          }
        } catch (err) {
          console.error('[Supabase faculty sync error]:', err);
        }

        // --- 5. EVENTS SYNC ---
        try {
          const remoteEvents = await supabaseDbService.getEvents();
          console.log(
            '[DEBUG] remoteEvents count:',
            remoteEvents?.length ?? 'null'
          );
          if (active && remoteEvents !== null) {
            console.log(
              '[DEBUG] saving remoteEvents:',
              remoteEvents.length
            );
            dbService.saveEvents(remoteEvents, true);
          }
        } catch (err) {
          console.error('[Supabase events sync error]:', err);
        }

        // --- 6. EVENT IMAGES SYNC ---
        try {
          const remoteEventImages = await supabaseDbService.getEventImages();
          if (active && remoteEventImages !== null) {
            dbService.saveEventImages(remoteEventImages, true);
          }
        } catch (err) {
          console.error('[Supabase event images sync error]:', err);
        }

        // --- 7. PERIOD MASTERS SYNC ---
        try {
          console.log('[PERIODS SYNC] Starting period masters sync...');
          const remotePeriods = await supabaseDbService.getPeriodMasters();
          console.log('[PERIODS REMOTE COUNT]', remotePeriods?.length ?? 0);
          
          if (active) {
            if (remotePeriods && remotePeriods.length > 0) {
              // Remote has records, sync to local cache
              dbService.savePeriodMasters(remotePeriods, true);
              console.log('[PERIODS LOCAL COUNT]', dbService.getPeriodMasters().length);
            } else {
              // Remote table is empty, seed Supabase with local defaults
              const localPeriods = dbService.getPeriodMasters();
              console.log('[PERIODS SYNC] Remote empty. Seeding Supabase with local count:', localPeriods.length);
              try {
                // Save locally first to ensure they are formatted
                dbService.savePeriodMasters(localPeriods, true);
                
                // Then write/seed to Supabase
                await supabaseDbService.savePeriodMasters(localPeriods);
                console.log('[PERIODS SYNC] Seeding completed successfully.');
              } catch (err) {
                console.warn('[Supabase period masters seeding skipped or failed]:', err);
              }
              console.log('[PERIODS LOCAL COUNT]', dbService.getPeriodMasters().length);
            }
          }
        } catch (err) {
          console.error('[Supabase period masters sync error]:', err);
        }

        if (active) {
          setDataSyncVersion(prev => prev + 1);
          window.dispatchEvent(new CustomEvent('gsss-data-synced'));
        }
      } catch (err) {
        console.error('Failed to sync school settings and modules with Supabase:', err);
      }
    };

    syncMetadata();

    return () => {
      active = false;
    };
  }, []);

  // Active session and authentication state persistence listener
  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;
        if (session && session.user) {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (active) {
            setIsAdminLoggedIn(!roleError && roleData?.role === 'admin');
          }
        } else {
          if (active) setIsAdminLoggedIn(false);
        }
      } catch (err) {
        console.error('Session verification check failed', err);
      } finally {
        if (active) setIsVerifyingAuth(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;
      if (session && session.user) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (active) {
            setIsAdminLoggedIn(!roleError && roleData?.role === 'admin');
            setIsVerifyingAuth(false);
          }
        } catch (err) {
          console.error(err);
          if (active) {
            setIsAdminLoggedIn(false);
            setIsVerifyingAuth(false);
          }
        }
      } else {
        if (active) {
          setIsAdminLoggedIn(false);
          setIsVerifyingAuth(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Synchronize browser URL paths with currentView for robust SPA routing
  useEffect(() => {
    const handleUrlRouting = () => {
      let cleanPath = window.location.pathname.toLowerCase().trim();
      if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
      }
      const hash = window.location.hash;
      if (cleanPath === '/admin' || hash === '#admin') {
        setCurrentView('admin');
      } else {
        const view = cleanPath.substring(1);
        const validViews = ['notices', 'contacts', 'admissions', 'faculty', 'routine', 'exams', 'calendar', 'events', 'about'];
        if (validViews.includes(view)) {
          setCurrentView(view);
        } else if (cleanPath === '/' || cleanPath === '') {
          setCurrentView('home');
        }
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => window.removeEventListener('popstate', handleUrlRouting);
  }, []);

  // Auto-verify path routing variables and synchronize history
  useEffect(() => {
    let currentPath = window.location.pathname.toLowerCase().trim();
    if (currentPath.length > 1 && currentPath.endsWith('/')) {
      currentPath = currentPath.slice(0, -1);
    }
    const targetPath = currentView === 'home' ? '/' : `/${currentView}`;
    if (currentPath !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    // Scroll to the top of the viewport whenever view changes
    window.scrollTo({ top: 0, behavior: 'auto' });
    setHomepageModules(dbService.getHomepageModules());
    if (currentView !== 'events') {
      setSelectedEventId(null);
    }
  }, [currentView]);

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginUser.trim(),
        password: loginPass,
      });

      if (error) {
        setLoginError(error.message || 'Invalid Email or Password.');
        return;
      }

      const user = data.user;
      if (user) {
        // Fetch role from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (roleError || !roleData) {
          await supabase.auth.signOut();
          setLoginError('You do not have administrative privileges.');
          return;
        }

        if (roleData.role === 'admin') {
          setIsAdminLoggedIn(true);
          setLoginUser('');
          setLoginPass('');
        } else {
          await supabase.auth.signOut();
          setLoginError('You do not have administrative privileges.');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'An error occurred during authentication.');
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminLoggedIn(false);
    setCurrentView('home');
  };

  const refreshGlobalSchoolSettings = () => {
    setSchoolSettings(dbService.getSchoolSettings());
    setHomepageModules(dbService.getHomepageModules());
  };

  // Helper to resolve Lucide Icon Name to React Component dynamically
  const IconResolver = ({ name, className }: { name: string; className?: string }) => {
    switch (name) {
      case 'GraduationCap': return <GraduationCap className={className} />;
      case 'BookOpen': return <BookOpen className={className} />;
      case 'HelpCircle': return <HelpCircle className={className} />;
      case 'Layout': return <Layout className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Calendar': return <Calendar className={className} />;
      case 'PhoneCall': return <PhoneCall className={className} />;
      case 'Layers': return <Layers className={className} />;
      default: return <GraduationCap className={className} />;
    }
  };

  // Helper to retrieve custom parsed card/grid item settings lists
  const getModuleItems = (mod: HomepageModule, fallbackItems: any[]) => {
    if (mod.items_json) {
      try {
        const parsed = JSON.parse(mod.items_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse items_json for module', mod.id, e);
      }
    }
    return fallbackItems;
  };

  const renderFeaturedFacultySection = (mod?: HomepageModule) => {
    const list = dbService.getFaculty();
    const featured = list.filter(f => f.is_active && f.featured_homepage).slice(0, 6);

    if (featured.length === 0) return null;

    const titleText = mod?.title || 'Featured Faculty & Lecturers';
    const subtitleText = mod?.subtitle || 'Staff and Advisory Council';
    const descriptionText = mod?.description || 'Meet our distinguished educators leading key branches of science, mathematics, literature, and arts.';
    const buttonText = mod?.button_text || 'Show All Faculty Directory';
    const buttonUrl = mod?.button_url || 'faculty';

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="featured-faculty-section">
        <div className="text-center md:text-left mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-widest block font-sans">
              {subtitleText}
            </span>
            <h3 className="text-slate-900 text-lg sm:text-xl font-extrabold tracking-tight mt-1">
              {titleText}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-sans font-semibold">
              {descriptionText}
            </p>
          </div>
          <button
            onClick={() => {
              if (!buttonUrl || buttonUrl === 'faculty') {
                setCurrentView('faculty');
              } else if (buttonUrl.startsWith('http')) {
                window.open(buttonUrl, '_blank', 'noreferrer');
              } else {
                setCurrentView(buttonUrl);
              }
            }}
            className="px-5 py-2.5 border border-slate-200 hover:border-orange-500 text-slate-700 hover:text-orange-600 font-sans font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shrink-0 self-start md:self-auto"
          >
            {buttonText}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map(fac => (
            <div
              key={fac.id}
              onClick={() => setCurrentView('faculty')}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-50 border-2 border-slate-100 group-hover:border-orange-500/30 transition shrink-0 relative">
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
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                    <User className="w-6 h-6 text-orange-600" />
                  </div>
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9px] uppercase font-mono font-bold text-orange-600 block">
                  {fac.designation}
                </span>
                <h4 className="text-slate-900 font-extrabold text-sm sm:text-base truncate group-hover:text-orange-600 transition font-sans">
                  {fac.name}
                </h4>
                <p className="text-slate-500 text-xs truncate font-sans">
                  Subject: <strong className="text-slate-705 font-bold">{fac.subject}</strong>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper renderer to coordinate ordering sequences on homepage
  const renderHomepageModule = (mod: HomepageModule) => {
    if (!mod.is_visible) return null;

    const keyId = `module-block-${mod.id}`;

    const handleButtonClick = (url: string) => {
      if (!url) return;
      if (url === 'about' || url === 'admissions' || url === 'contact' || url === 'notices' || url === 'home' || url === 'events' || url === 'faculty' || url === 'routine' || url === 'exams' || url === 'calendar') {
        setCurrentView(url);
      } else if (url.startsWith('http')) {
        window.open(url, '_blank', 'noreferrer');
      }
    };

    switch (mod.module_type) {
      case 'Hero Section':
        return (
          <Hero 
            key={keyId}
            schoolSettings={schoolSettings} 
            onViewChange={setCurrentView}
            button_text={mod.button_text}
            button_url={mod.button_url}
          />
        );
      
      case 'Notice Feed':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-100">
            {mod.title && (
              <div className="mb-6 text-center md:text-left">
                <span className="text-[11px] uppercase font-mono font-bold text-orange-605 text-orange-600 tracking-wider block">{mod.subtitle || 'Directives Panel'}</span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{mod.title}</h2>
                {mod.description && <p className="text-xs text-slate-500 mt-1 max-w-2xl">{mod.description}</p>}
              </div>
            )}
            <NoticesPage 
              homepageMode={true} 
              onBackToHome={() => setCurrentView('notices')} 
            />
          </div>
        );

      case 'About School':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white border border-slate-150 rounded-2xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm hover:shadow-md transition-all duration-300">
              
              {mod.image_url ? (
                <div className="w-full md:w-1/3 h-48 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                  <img src={mod.image_url} alt="About School Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              ) : null}

              <div className="space-y-3 flex-grow">
                <span className="text-[11px] uppercase font-mono font-bold text-orange-606 text-orange-600 tracking-widest block">
                  {mod.subtitle || "Accredited BSEB Campus"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                  {mod.title || `About ${schoolSettings.school_name}`}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans font-medium">
                  {mod.description || "Offering structured streams in Science, Commerce, and Arts with high-class state board coaching models. Rooted in disciplined moral character alignment."}
                </p>
              </div>

              {mod.button_text && (
                <button
                  onClick={() => handleButtonClick(mod.button_url || 'about')}
                  className="px-6 py-3 bg-sky-900 hover:bg-sky-950 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 transition cursor-pointer shadow-md shadow-sky-900/10 shrink-0 self-stretch md:self-auto text-center justify-center animate-pulse"
                >
                  {mod.button_text}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );

      case 'Principal Message': {
        const facultyList = dbService.getFaculty();
        const principal = facultyList.find(f => f.is_active && (f.designation.toLowerCase() === 'principal' || f.designation.toLowerCase().includes('principal')));
        
        const principalPhoto = principal ? principal.photo_url : (mod.image_url || '');
        const principalName = principal ? principal.name : 'Dr. Satyendra Prasad Narain';
        const principalQual = principal ? principal.qualification : 'Ph.D., M.A., B.Ed';
        const principalDesig = principal ? principal.designation : 'Principal';
        const principalBio = principal ? principal.bio : (mod.description || 'Welcome to our academic platform. We aim to nurture future champions with character alignment and competitive discipline under the state curriculum rules.');

        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center shadow-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_40%)]" />
              
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-orange-500/20 overflow-hidden bg-slate-800 shrink-0 relative flex items-center justify-center shadow-lg">
                {principalPhoto ? (
                  <img src={principalPhoto} alt="Principal desk portrait" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <CustomSchoolEmblem className="w-16 h-16" />
                )}
              </div>

              <div className="space-y-3 flex-grow relative z-10 text-center md:text-left">
                <span className="text-[10px] sm:text-xs uppercase font-mono font-bold text-orange-400 tracking-widest block">
                  {principal ? `${principalDesig}'s Message` : (mod.subtitle || "Principal's Desk Message")}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                  {mod.title || "Cultivating Values & Academic Rigor"}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-sans italic font-semibold">
                  "{principalBio}"
                </p>
                <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 font-mono gap-3">
                  <span>{principalName}{principalQual ? `, ${principalQual}` : ''} ({principalDesig})</span>
                  {mod.button_text && (
                    <button
                      onClick={() => handleButtonClick(mod.button_url || 'about')}
                      className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10px] font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      {mod.button_text} <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'Quick Links':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {mod.title && (
              <div className="text-center md:text-left mb-8">
                <span className="text-[11px] uppercase font-mono font-bold text-sky-900 tracking-widest block font-sans">
                  {mod.subtitle || "Academic Portals"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight uppercase font-sans">
                  {mod.title}
                </h2>
                {mod.description && <p className="text-xs text-slate-500 mt-1 max-w-2xl font-semibold leading-relaxed font-sans">{mod.description}</p>}
              </div>
            )}
            
            {(() => {
              const items = getModuleItems(mod, [
                { title: 'Science Department', description: 'BSEB Science stream focuses on mathematics, biological sciences, computational standards, and lab practices.', extra: 'GraduationCap' },
                { title: 'Commerce Streams', description: 'Commerce track offers advanced practices in double-entry accountancy structures and local entrepreneurial methods.', extra: 'BookOpen' },
                { title: 'Arts Departments', description: 'Arts and humanities modules specialized in state political frameworks, history logs, and sociological standards.', extra: 'HelpCircle' }
              ]);
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="streams-quick-grid">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="p-6 bg-white border border-slate-100 hover:border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <IconResolver name={item.extra || 'GraduationCap'} className="w-8 h-8 text-sky-900 mb-3" />
                        <h4 className="text-slate-900 text-base font-bold tracking-tight mb-2">{item.title}</h4>
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 font-medium">
                          {item.description}
                        </p>
                      </div>
                      <span onClick={() => setCurrentView('admissions')} className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer uppercase flex items-center gap-1 transition-colors">
                        View Seats <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {mod.button_text && (
              <div className="text-center mt-7">
                <button
                  onClick={() => handleButtonClick(mod.button_url || 'admissions')}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm shadow-orange-500/10"
                >
                  {mod.button_text}
                </button>
              </div>
            )}
          </div>
        );

      case 'School Statistics':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white border-y border-slate-150/60 shadow-2xs">
            <div className="text-center mb-8">
              <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-wider block">
                {mod.subtitle || 'By The Numbers'}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                {mod.title || 'Institution Benchmarks'}
              </h3>
              {mod.description && <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto font-semibold leading-relaxed">{mod.description}</p>}
            </div>

            {(() => {
              const items = getModuleItems(mod, [
                { title: 'Enrollments', description: '1,200+' },
                { title: 'Senior Faculty', description: '36+' },
                { title: 'BSEB Pass Rate', description: '98.4%' },
                { title: 'Bihar Legacy', description: '50+ Yrs' }
              ]);
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-5xl mx-auto">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 border border-slate-150 rounded-2xl shadow-2xs">
                      <span className="block text-2xl sm:text-3xl font-extrabold text-sky-900 tracking-tight">{item.description}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold font-mono mt-1">{item.title}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {mod.button_text && (
              <div className="text-center mt-6">
                <button
                  onClick={() => handleButtonClick(mod.button_url || 'about')}
                  className="px-4.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg uppercase cursor-pointer transition-colors shadow-2xs"
                >
                  {mod.button_text}
                </button>
              </div>
            )}
          </div>
        );

      case 'Important Links':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-10 shadow-3xs">
              <div className="text-center md:text-left mb-6">
                <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-wider block">
                  {mod.subtitle || 'Direct Reference indexes'}
                </span>
                <h4 className="text-lg font-bold text-slate-900 uppercase">
                  {mod.title || 'Official Portals & Student Links'}
                </h4>
                {mod.description && <p className="text-xs text-slate-500 mt-1 max-w-2xl font-semibold leading-relaxed">{mod.description}</p>}
              </div>

              {(() => {
                const items = getModuleItems(mod, [
                  { title: 'BSEB Patna Official Portal', description: 'Verify online testing registration dates and board updates', extra: 'https://secondary.biharboardonline.com/' },
                  { title: 'MNSSBY Bihar Student Welfare', description: 'Apply for student credit cards and direct welfare grants', extra: 'https://www.7nishchay-yuvaupaj.bihar.gov.in/' }
                ]);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {items.map((item: any, idx: number) => (
                      <a
                        key={idx}
                        href={item.extra || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-150 flex items-center justify-between group transition-all"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800 block group-hover:text-orange-600 transition-colors uppercase font-sans">{item.title}</span>
                          <span className="text-[10px] text-slate-450 block font-semibold font-sans mt-0.5">{item.description}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-all group-hover:translate-x-0.5" />
                      </a>
                    ))}
                  </div>
                );
              })()}

              {mod.button_text && (
                <div className="text-center mt-6">
                  <button
                    onClick={() => handleButtonClick(mod.button_url)}
                    className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase rounded cursor-pointer transition-colors shadow-2xs"
                  >
                    {mod.button_text}
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'Academic Quick Links':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="homepage-academic-quick-links">
            {mod.title && (
              <div className="text-center md:text-left mb-8">
                <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-wider block">
                  {mod.subtitle || 'ACADEMICS DESK'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  {mod.title}
                </h2>
                {mod.description && (
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium leading-relaxed font-sans">
                    {mod.description}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: CLASS ROUTINE */}
              <div
                onClick={() => setCurrentView('routine')}
                className="group relative bg-white border border-slate-200 hover:border-orange-500/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-48"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 border border-orange-100/35 group-hover:scale-105 transition-transform duration-300">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-slate-900 font-extrabold text-sm sm:text-base tracking-tight mb-1 group-hover:text-orange-600 transition-colors">
                    Class Routine Timetable
                  </h3>
                  <p className="text-slate-500 text-xs font-sans leading-relaxed font-medium line-clamp-2">
                    Review weekly class assignments, scheduled hours, and temporary emergency timing sheets.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 flex items-center gap-1 mt-2">
                  View Timetable <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* CARD 2: EXAM SCHEDULE */}
              <div
                onClick={() => setCurrentView('exams')}
                className="group relative bg-white border border-slate-200 hover:border-sky-500/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-48"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4 border border-sky-100/35 group-hover:scale-105 transition-transform duration-300">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-slate-900 font-extrabold text-sm sm:text-base tracking-tight mb-1 group-hover:text-sky-700 transition-colors">
                    Exam Datesheets
                  </h3>
                  <p className="text-slate-500 text-xs font-sans leading-relaxed font-medium line-clamp-2">
                    Verify examination datesheets for Half-Yearly reviews, Unit assessments, and BSEB boards.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-sky-700 flex items-center gap-1 mt-2">
                  View Datesheet <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>

              {/* CARD 3: ACADEMIC CALENDAR */}
              <div
                onClick={() => setCurrentView('calendar')}
                className="group relative bg-white border border-slate-200 hover:border-emerald-500/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-48"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100/35 group-hover:scale-105 transition-transform duration-300">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-slate-900 font-extrabold text-sm sm:text-base tracking-tight mb-1 group-hover:text-emerald-600 transition-colors">
                    Academic School Calendar
                  </h3>
                  <p className="text-slate-500 text-xs font-sans leading-relaxed font-medium line-clamp-2">
                    Review annual school event dates, BSEB direct registration dates, and upcoming school holidays.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1 mt-2">
                  View Holidays <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        );

      case 'Facilities':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center mb-8">
              <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-wider block">
                {mod.subtitle || 'Campus Infrastructures'}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {mod.title || 'Dynamic Campus Facilities'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto leading-relaxed font-semibold">
                {mod.description || 'Highly sanitized facilities built directly to foster better technical excellence and scientific mindset.'}
              </p>
            </div>

            {(() => {
              const items = getModuleItems(mod, [
                { title: 'State Science Labs', description: 'Equipped with physics boards, salt testing setups, chemistry reagents and biology charts.', extra: 'Layout' },
                { title: 'Advanced ICT Center', description: 'Computers paired with high-speed intranets to compile matriculation registration details safely.', extra: 'Activity' },
                { title: 'Reading Library Block', description: 'Holds reference sheets, state textbook indices and historical political journals.', extra: 'BookOpen' }
              ]);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="p-5.5 bg-white border border-slate-150 rounded-2xl shadow-2xs">
                      <span className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 text-orange-600 flex items-center justify-center mb-4">
                        <IconResolver name={item.extra || 'Layout'} className="w-5 h-5 shadow-2xs" />
                      </span>
                      <span className="font-bold text-slate-900 block text-sm uppercase mb-1">{item.title}</span>
                      <p className="text-slate-600 text-xs leading-relaxed font-semibold">{item.description}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {mod.button_text && (
              <div className="text-center mt-8">
                <button
                  onClick={() => handleButtonClick(mod.button_url || 'about')}
                  className="px-6 py-2.5 bg-sky-900 hover:bg-sky-950 text-white rounded text-xs font-bold uppercase transition shadow-md cursor-pointer"
                >
                  {mod.button_text}
                </button>
              </div>
            )}
          </div>
        );

      case 'Achievements Preview':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white border-y border-slate-100">
            <div className="text-center mb-8">
              <span className="text-[11px] uppercase font-mono font-bold text-orange-600 block tracking-wide">
                {mod.subtitle || 'Bihar Board Hall of Glory'}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {mod.title || 'Our Meritorious Scholars'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto leading-relaxed font-semibold">
                {mod.description || 'Securing top district positions in Science and Arts streams, winning government merit grants.'}
              </p>
            </div>

            {(() => {
              const items = getModuleItems(mod, [
                { title: 'State Board Merit Grants', description: 'Trained state rankers under special coaching packages.', extra: 'Award' },
                { title: 'District Volleyball Shield', description: 'Championship trophy holders for secondary events.', extra: 'Award' }
              ]);
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 border border-slate-150 rounded-xl flex gap-3.5 items-center">
                      <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 shadow-2xs">
                        <IconResolver name={item.extra || 'Award'} className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm block">{item.title}</span>
                        <p className="text-slate-600 text-xs font-semibold">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {mod.button_text && (
              <div className="text-center mt-6">
                <button
                  onClick={() => handleButtonClick(mod.button_url || 'about')}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold uppercase cursor-pointer leading-wide shadow-2xs"
                >
                  {mod.button_text}
                </button>
              </div>
            )}
          </div>
        );

      case 'Events Preview': {
        const activePublishedEvents = dbService.getEvents()
          .filter(e => e.status !== 'Draft')
          // Prioritize featured_homepage first, then sort by event_date descending
          .sort((a, b) => {
            if (a.featured_homepage && !b.featured_homepage) return -1;
            if (!a.featured_homepage && b.featured_homepage) return 1;
            const dateA = a.event_date || '';
            const dateB = b.event_date || '';
            if (dateA !== dateB) {
              return dateB.localeCompare(dateA);
            }
            const createdAtA = a.created_at || '';
            const createdAtB = b.created_at || '';
            return createdAtB.localeCompare(createdAtA);
          })
          .slice(0, 3); // top 3 events

        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="homepage-events-preview">
            <div className="text-center md:text-left mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-wider block font-sans">
                  {mod.subtitle || 'School Life & Chronicles'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight uppercase font-sans">
                  {mod.title || 'Latest School Events & Bulletins'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed font-semibold">
                  {mod.description || 'Stay up to date with Bihar board workshops, science exhibitions, celebrations, and special academic forums.'}
                </p>
              </div>
              <button
                onClick={() => {
                  if (mod.button_url) {
                    handleButtonClick(mod.button_url);
                  } else {
                    setCurrentView('events');
                  }
                }}
                className="text-xs font-bold font-mono uppercase tracking-wider text-orange-600 hover:text-orange-700 hover:translate-x-0.5 transition shrink-0 self-start md:self-auto cursor-pointer"
              >
                {mod.button_text || 'Explore Events Calendar'} &rarr;
              </button>
            </div>

            {activePublishedEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5">
                {activePublishedEvents.map((ev) => {
                  const evDate = new Date(ev.event_date);
                  const formattedDate = !isNaN(evDate.getTime()) ? evDate.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'No Date';

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setCurrentView('events');
                        setSelectedEventId(ev.id);
                      }}
                      className="bg-white border border-slate-150 rounded-2xl overflow-hidden hover:shadow-md transition duration-200 cursor-pointer flex flex-col h-full group"
                    >
                      {/* Banner image with overlay category */}
                      <div className="relative aspect-video w-full bg-slate-50 shrink-0 overflow-hidden border-b border-slate-100">
                        {ev.featured_image ? (
                          <img
                            src={ev.featured_image}
                            alt=""
                            className="w-full h-full object-cover transition duration-300 group-hover:scale-103"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                            <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                            <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">Bulletin Record</span>
                          </div>
                        )}
                        <span className="absolute top-2.5 left-2.5 bg-orange-600 text-white font-bold font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded shadow-2xs">
                          {ev.category}
                        </span>
                        {ev.featured_homepage && (
                          <span className="absolute top-2.5 right-2.5 bg-amber-500 text-slate-900 border border-amber-300 font-bold font-mono text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" /> Featured
                          </span>
                        )}
                      </div>

                      <div className="p-4.5 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] text-orange-600 font-mono font-bold uppercase mb-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          
                          <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 group-hover:text-orange-600 transition duration-150 mb-1 leading-snug">
                            {ev.title}
                          </h4>
                          
                          <p className="text-xs text-slate-500 leading-relaxed font-semibold line-clamp-2 max-w-sm mb-4">
                            {ev.short_description || ev.full_description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-450 border-t border-slate-50 pt-2.5">
                          <span className="truncate max-w-[130px] flex items-center gap-1 leading-none">
                            <MapPin className="w-3 h-3 text-slate-350 shrink-0" /> {ev.venue}
                          </span>
                          <span className="text-orange-600 group-hover:translate-x-0.5 transition font-mono tracking-wider uppercase text-[9px] font-bold">
                            Details &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs uppercase tracking-wider max-w-md mx-auto">
                No active events registered currently.
              </div>
            )}

            {mod.button_text && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setCurrentView('events')}
                  className="px-5 py-2.5 bg-sky-900 hover:bg-sky-950 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-2xs cursor-pointer transition-colors"
                >
                  {mod.button_text}
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'Gallery Preview':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="text-center mb-8">
              <span className="text-[11px] uppercase font-mono font-bold text-orange-600 block tracking-wide">
                {mod.subtitle || 'Campus Photo Records'}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {mod.title || 'Vibrant Campus Corridor'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto font-semibold leading-relaxed">
                {mod.description || 'Snapshot captures representing vintage Patna grounds, science experimentation booths, and athletic displays.'}
              </p>
            </div>

            {(() => {
              const items = getModuleItems(mod, [
                { title: 'Vintage Grounds', description: 'Patna campus grounds representing traditional brick assemblies and playgrounds.', extra: '', image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&auto=format&fit=crop' },
                { title: 'Science Fair', description: 'Showcasing chemical reactions, salt tests and biological diagrams.', extra: '', image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop' },
                { title: 'Central Library', description: 'Quiet research desk blocks stacked with state curriculum books.', extra: '', image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&auto=format&fit=crop' },
                { title: 'Athletic Assembly', description: 'Morning drill commands and annual sport competition matches.', extra: '', image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop' }
              ]);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {items.map((item: any, idx: number) => (
                    <div key={idx} className="aspect-[4/3] rounded-xl bg-slate-100 border border-slate-150 overflow-hidden relative flex flex-col justify-end text-center group shadow-2xs hover:shadow-md transition-all duration-300">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter brightness-90 group-hover:brightness-75"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        <div className="text-left">
                          <span className="text-[10px] font-mono font-bold text-orange-450 text-orange-400 block uppercase tracking-wider">{item.title}</span>
                          {item.description && <p className="text-[9px] text-slate-300 line-clamp-2 leading-tight mt-0.5">{item.description}</p>}
                        </div>
                      </div>
                      {!item.image_url && (
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase p-2">[{item.title}]</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}

            {mod.button_text && (
              <div className="text-center mt-6">
                <button
                  onClick={() => handleButtonClick(mod.button_url || 'about')}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-655 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-bold uppercase cursor-pointer transition-colors shadow-2xs"
                >
                  {mod.button_text}
                </button>
              </div>
            )}
          </div>
        );

      case 'Contact Information':
        return (
          <div key={keyId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="homepage-contact-strip">
            <div className="bg-slate-100 border border-slate-200/50 rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-mono font-bold text-sky-900 tracking-widest block">
                  {mod.subtitle || "Connect Today"}
                </span>
                <h3 className="text-slate-900 text-lg sm:text-xl font-bold tracking-tight leading-tight">
                  {mod.title || "Physical & Digital Desk Queries"}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl font-sans font-medium font-semibold">
                  {mod.description || 'Have inquiries? Submit direct transcripts verification letters, check admission criteria, or call physical administrative offices.'}
                </p>
              </div>

              <button
                onClick={() => handleButtonClick(mod.button_url || 'contact')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md shadow-orange-500/10 cursor-pointer self-stretch md:self-auto text-center"
              >
                {mod.button_text || "Access Contact Desk"}
              </button>
            </div>
          </div>
        );

      case 'Featured Faculty':
        return (
          <div key={keyId}>
            {renderFeaturedFacultySection(mod)}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-600">
      
      {/* 1. STICKY DYNAMIC HEADER NAV */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        schoolSettings={schoolSettings}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={handleAdminLogout}
      />

      {/* 2. PRIMARY VIEWPORT SWITCHBOARD */}
      <main className="flex-grow">
        
        {/* VIEW A: HOMEPAGE (DYNAMIC REORDERABLE MODULE PATTERN) */}
        {currentView === 'home' && (
          <div className="space-y-4 pb-12" id="home-view-canvas">
            {(() => {
              return homepageModules
                .filter(mod => mod.is_visible)
                .map(mod => renderHomepageModule(mod));
            })()}
          </div>
        )}

        {/* VIEW B: ARCHIVES NOTICE BOARD */}
        {currentView === 'notices' && (
          <div className="pb-16" id="notices-view-canvas">
            <NoticesPage />
          </div>
        )}

        {/* VIEW B1.5: EVENTS PUBLIC PAGE (MODULE 4) */}
        {currentView === 'events' && (
          <div className="pb-16" id="events-view-canvas">
            <EventsPublic
              initialSelectedEventId={selectedEventId}
              onClearSelectedEvent={() => setSelectedEventId(null)}
            />
          </div>
        )}

        {/* VIEW B2: ACADEMIC - CLASS ROUTINE */}
        {currentView === 'routine' && (
          <div className="pb-16 animate-fade-in" id="routine-view-canvas">
            <ClassRoutinePage />
          </div>
        )}

        {/* VIEW B3: ACADEMIC - EXAM SCHEDULE */}
        {currentView === 'exams' && (
          <div className="pb-16 animate-fade-in" id="exams-view-canvas">
            <ExamSchedulePage />
          </div>
        )}

        {/* VIEW B4: ACADEMIC - ACADEMIC CALENDAR */}
        {currentView === 'calendar' && (
          <div className="pb-16 animate-fade-in" id="calendar-view-canvas">
            <AcademicCalendarPage />
          </div>
        )}

        {/* VIEW C: ABOUT INSTITUTION */}
        {currentView === 'about' && (
          <div className="pb-16" id="about-view-canvas">
            <AboutPage 
              schoolSettings={schoolSettings} 
              onViewChange={setCurrentView} 
            />
          </div>
        )}

        {/* VIEW D: ENROLLMENT ADMISSIONS */}
        {currentView === 'admissions' && (
          <div className="pb-16" id="admissions-view-canvas">
            <AdmissionsPage 
              schoolSettings={schoolSettings} 
              onViewChange={setCurrentView} 
            />
          </div>
        )}

        {/* VIEW E: CONTACT PORTAL */}
        {currentView === 'contact' && (
          <div className="pb-16" id="contact-view-canvas">
            <ContactPage 
              schoolSettings={schoolSettings} 
              onViewChange={setCurrentView} 
            />
          </div>
        )}

        {/* VIEW G: FACULTY DIRECTORY PORTAL */}
        {currentView === 'faculty' && (
          <div className="pb-16" id="faculty-view-canvas">
            <FacultyDirectory />
          </div>
        )}

        {/* VIEW F: ADMINISTRATION DESK PANEL */}
        {currentView === 'admin' && (
          <div className="pb-16" id="admin-view-canvas">
            {isVerifyingAuth ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                <p className="text-xs font-mono tracking-wider text-slate-400">Verifying Administrative Session...</p>
              </div>
            ) : isAdminLoggedIn ? (
              // Active Admin Panel
              <AdminDashboard
                onLogout={handleAdminLogout}
                onSettingsChanged={refreshGlobalSchoolSettings}
              />
            ) : (
              // Secure Authentication Form Card
              <div className="max-w-md mx-auto mt-16 px-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
                  
                  {/* Icon & Title */}
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-sky-50 border border-sky-100 mx-auto flex items-center justify-center text-sky-900 shadow-sm">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-slate-800 text-lg font-bold tracking-tight">Admin Authentication</h2>
                    <p className="text-[10px] text-orange-600 font-mono tracking-wider uppercase font-bold">Secure Personnel Sign-In</p>
                  </div>

                  {/* credentials instructions note */}
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-2.5 text-slate-600">
                    <Key className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed font-sans">
                      <span className="text-sky-900 font-bold block uppercase tracking-wide text-xs">Supabase Auth Gateway</span>
                      <p className="text-slate-500 mt-1">Please sign in using your registered Supabase administrator credentials. Manual assignment of the administrative role (<code className="font-mono bg-slate-100 px-1 rounded text-red-600">admin</code>) inside the <code className="font-mono bg-slate-100 px-1 rounded text-red-600">user_roles</code> table is required to obtain dashboard privileges.</p>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Administrative Email</label>
                      <input
                        type="email"
                        required
                        placeholder="admin@gsss.edu"
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-sky-900 focus:ring-1 focus:ring-sky-900 rounded text-slate-800 text-xs px-3.5 py-2.5"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 mb-1.5">Secret Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        className="w-full bg-slate-50/65 border border-slate-200 focus:outline-none focus:border-sky-900 focus:ring-1 focus:ring-sky-900 rounded text-slate-800 text-xs px-3.5 py-2.5"
                      />
                    </div>

                    {loginError && (
                      <p className="text-xs font-bold text-rose-600 font-sans" id="login-error-message">
                        {loginError}
                      </p>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                      >
                        Authenticate Member
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. DYNAMIC FOOTER */}
      <Footer
        schoolSettings={schoolSettings}
        onViewChange={setCurrentView}
      />
    </div>
  );
}
