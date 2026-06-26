/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Calendar, Tag, AlertOctagon, Download, X, Pin, ArrowRight, ExternalLink, CalendarDays, ChevronRight, FileText } from 'lucide-react';
import { Notice, NoticeCategory, NoticePriority, MediaItem } from '../types';
import { dbService } from '../services/db';
import { CustomPDFIcon, CustomSchoolEmblem } from './CommonAssets';
import { useDataSync } from '../hooks/useDataSync';

interface NoticesPageProps {
  onBackToHome?: () => void;
  homepageMode?: boolean; // Limits to latest 5 if active on homepage
}

export const NoticesPage: React.FC<NoticesPageProps> = ({ 
  onBackToHome,
  homepageMode = false 
}) => {
  // Read references
  const allNotices = () => {
    return dbService.getNotices().filter(n => n.status === 'Published');
  };

  const [notices, setNotices] = useState<Notice[]>(allNotices);
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);

  // Auto-sync list if remote data is loaded
  useDataSync(() => {
    setNotices(allNotices());
  });
  
  // Notice detail image viewer zoom states
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Focus reference for modal
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Scroll lock and focus side effect
  useEffect(() => {
    if (activeNotice) {
      document.body.style.overflow = 'hidden';
      // Automatically move focus to the modal container to capture keyboard/mouse scroll immediately
      const focusTimeout = setTimeout(() => {
        if (modalContainerRef.current) {
          modalContainerRef.current.focus();
        }
      }, 50);
      return () => {
        clearTimeout(focusTimeout);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [activeNotice]);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState<NoticeCategory | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<NoticePriority | 'all'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  const categories: NoticeCategory[] = [
    'General Notice',
    'Admission Notice',
    'Exam Notice',
    'Holiday Notice',
    'Scholarship Notice',
    'Government Circular',
    'Important Announcement'
  ];

  const priorities: NoticePriority[] = ['Critical', 'High', 'Normal'];

  // Extract unique years from the published notices
  const uniqueYears = Array.from(
    new Set(
      allNotices()
        .map(n => {
          try {
            return n.publish_date.split('-')[0];
          } catch {
            return '';
          }
        })
        .filter(y => y !== '')
    )
  ).sort((a, b) => b.localeCompare(a)); // Descending chronological years

  // Look up item references inside Media Library
  const helperMediaItems = dbService.getMediaItems();
  const getMediaItem = (mediaId: string): MediaItem | undefined => {
    if (!mediaId) return undefined;
    return helperMediaItems.find(m => m.id === mediaId);
  };

  // Trigger PDF file downloads safely
  const triggerDownload = (mediaId: string) => {
    const media = getMediaItem(mediaId);
    if (!media) {
      alert('Attachment was not found or was removed from Media Infrastructure.');
      return;
    }
    
    // Create direct virtual anchor and force-download base64 file payloads
    const link = document.createElement('a');
    link.href = media.file_url;
    link.download = media.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // sorting logic order:
  // 1. Pinned Notices
  // 2. Critical Notices
  // 3. High Priority Notices
  // 4. Normal Notices
  const sortNotices = (noticeList: Notice[]): Notice[] => {
    return [...noticeList].sort((a, b) => {
      // Pinned status comparison
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;

      // Priority weights
      const getWeight = (p: NoticePriority) => {
        if (p === 'Critical') return 3;
        if (p === 'High') return 2;
        return 1;
      };

      const diff = getWeight(b.priority) - getWeight(a.priority);
      if (diff !== 0) return diff;

      // Chronological descending secondary order
      return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
    });
  };

  // Filtering filter cascade logic
  const filteredNotices = notices.filter(n => {
    // Show only active ones allowed on homepage if homepage mode is active
    if (homepageMode && !n.show_on_homepage) return false;

    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = catFilter === 'all' ? true : n.category === catFilter;
    const matchesPriority = priorityFilter === 'all' ? true : n.priority === priorityFilter;
    
    const noticeYear = n.publish_date.split('-')[0];
    const matchesYear = yearFilter === 'all' ? true : noticeYear === yearFilter;

    return matchesSearch && matchesCat && matchesPriority && matchesYear;
  });

  // Sort and cap items based on active board view settings
  const displayedNotices = homepageMode 
    ? sortNotices(filteredNotices).slice(0, 5) 
    : sortNotices(filteredNotices);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="notices-board-screen">
      
      {/* Background visual detail modal drawer */}
      {activeNotice && (
        <div 
          onClick={() => setActiveNotice(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4 cursor-pointer"
          ref={modalContainerRef}
          tabIndex={-1}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white border border-slate-150 rounded-2xl shadow-xl p-6 sm:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            
            {/* Corner exit button */}
            <button
              onClick={() => setActiveNotice(null)}
              className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-red-500 hover:text-white rounded-full text-slate-400 border border-slate-100 transition-all cursor-pointer z-10 font-bold"
              id="notice-modal-close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header details */}
            <div className="flex flex-wrap gap-2.5 items-center mb-4 pr-12">
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] sm:text-xs font-bold rounded uppercase tracking-wider border border-orange-100/30">
                {activeNotice.category}
              </span>
              
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                activeNotice.priority === 'Critical' 
                  ? 'bg-rose-50 border border-rose-200 text-rose-600 animate-pulse' 
                  : activeNotice.priority === 'High' 
                  ? 'bg-orange-50 border border-orange-100 text-orange-600' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {activeNotice.priority} PRIORITY
              </span>

              {activeNotice.is_pinned && (
                <span className="flex items-center gap-1 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded font-extrabold uppercase">
                  <Pin className="w-3 h-3 transform rotate-45" /> PINNED
                </span>
              )}

              <div className="flex items-center gap-1 text-[10px] bg-slate-100 border border-slate-150 text-slate-650 px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{activeNotice.publish_date}</span>
              </div>
            </div>

            {/* Notice Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight uppercase border-b border-slate-100 pb-4 leading-snug">
              {activeNotice.title}
            </h1>

            {/* Scrollable Document container body */}
            <div className="mt-6 space-y-6 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Optional banner display from media selection */}
              {activeNotice.featured_image && (
                <div 
                  onClick={() => {
                    setZoomLevel(1);
                    setIsLightboxOpen(true);
                  }}
                  className="w-full h-48 sm:h-64 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative group cursor-zoom-in"
                  title="Click to view full image & zoom"
                  id="notice-featured-image-trigger"
                >
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider font-mono text-center opacity-70 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10">
                    <span>🔍 Full Document image / Click to Zoom</span>
                  </div>
                  {getMediaItem(activeNotice.featured_image)?.file_url === 'school_logo_default' ? (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-200">
                      <CustomSchoolEmblem className="w-20 h-20" />
                    </div>
                  ) : (
                    <img
                      src={getMediaItem(activeNotice.featured_image)?.file_url || activeNotice.featured_image}
                      alt="Featured circular panel"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              )}

              {/* Text content formatting lines */}
              <div className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans font-medium">
                {activeNotice.content}
              </div>

              {/* Attachment Cards */}
              {activeNotice.pdf_url && (
                <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/10">
                      <CustomPDFIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500 font-mono uppercase tracking-wider font-bold">PDF Enclosure Enclosed</span>
                      <span className="block text-slate-800 text-xs sm:text-sm font-bold truncate max-w-[200px] sm:max-w-sm">
                        {getMediaItem(activeNotice.pdf_url)?.file_name || 'Circular Attachment File'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerDownload(activeNotice.pdf_url)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase transition"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Main Board view listing */}
      {homepageMode ? (
        // Minimalist lists inside Homepage Module Manager
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm" id="home-notices-container">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-sm" />
                Latest Notices Bulletin
              </h2>
              <p className="text-xs text-slate-500">Department authorizations, board registration deadlines and campus closures.</p>
            </div>
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-orange-500 border border-slate-200/50 hover:border-orange-500 hover:text-white text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
              >
                View Bulletin Box <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            {displayedNotices.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-250 rounded-xl bg-slate-50">
                School campus stands active • No urgent bulletins dispatched.
              </div>
            ) : (
              displayedNotices.map((notice) => (
                <NoticeStripCard
                  key={notice.id}
                  notice={notice}
                  onClick={() => setActiveNotice(notice)}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        // Full board viewport featuring filtering grids
        <div className="space-y-8" id="notices-archive-view">
          
          {/* Header titles */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1 px-3 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
              State Information Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 uppercase tracking-tight leading-none">
              School notices & circular library
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-medium">
              Inspect current board timelines, syllabus listings, post-matric student scholarships, state merit tables, and day gazette sheets.
            </p>
          </div>

          {/* Filtering Workspace */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search text query */}
              <div className="relative md:col-span-1.5">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Query titles or content keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 hover:text-slate-900 text-xs pl-9 pr-3 py-2.5 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Category Drop */}
              <div>
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:border-orange-500 text-xs px-3.5 py-2.5 rounded-lg"
                >
                  <option value="all">Any Category</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Priority Drop */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:border-orange-500 text-xs px-3.5 py-2.5 rounded-lg"
                >
                  <option value="all">Any Priority</option>
                  {priorities.map(p => (
                    <option key={p} value={p}>{p} Priority</option>
                  ))}
                </select>
              </div>

              {/* Chronological Year filter */}
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 focus:outline-none focus:border-orange-500 text-xs px-3.5 py-2.5 rounded-lg"
                >
                  <option value="all font-semibold">Any Calendar Year</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>{year} Circulars</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Help guidelines */}
            <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-mono font-bold px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              Sorting hierarchy: Pinned posts float first, followed by Critical, High, and Normal priorities with descending chronological timelines.
            </div>
          </div>

          {/* Core Card layout List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="public-notice-grid">
            {displayedNotices.length === 0 ? (
              <div className="md:col-span-2 lg:col-span-3 py-16 text-center bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
                <AlertOctagon className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                <p className="text-slate-700 text-sm font-bold">No dispatch sheets match your filter settings</p>
                <p className="text-slate-500 text-xs mt-1">Refine your query variables or clear category parameters.</p>
              </div>
            ) : (
              displayedNotices.map((notice) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  onClick={() => setActiveNotice(notice)}
                />
              ))
            )}
          </div>

        </div>
      )}

      {isLightboxOpen && activeNotice && activeNotice.featured_image && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-60 flex flex-col p-4 animate-in fade-in duration-200 text-left" id="notice-image-lightbox">
          {/* Top Panel */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800 text-white select-none shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs uppercase font-mono tracking-wider text-orange-400 font-extrabold">Notice Image Lightbox</span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">{activeNotice.title}</span>
            </div>
            
            {/* Zoom Controls & Close */}
            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-bold bg-slate-900 border border-slate-800 px-2 py-1 rounded">Zoom: {Math.round(zoomLevel * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-xs font-bold font-mono transition-colors cursor-pointer text-slate-200 hover:text-white"
                title="Zoom In"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-xs font-bold font-mono transition-colors cursor-pointer text-slate-200 hover:text-white"
                title="Zoom Out"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 px-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="p-2 bg-rose-600 hover:bg-rose-700 hover:shadow-lg rounded-full text-white transition-all cursor-pointer ml-1 inline-flex items-center justify-center font-bold"
                title="Exit Lightbox"
                id="lightbox-close-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main scrollable view container */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4" id="lightbox-scroll-area">
            <div 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }} 
              className="transition-transform duration-100 ease-out shrink-0"
            >
              <img
                src={getMediaItem(activeNotice.featured_image)?.file_url || activeNotice.featured_image}
                alt={activeNotice.title}
                className="max-w-[85vw] max-h-[75vh] object-contain select-none rounded shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="text-center text-slate-500 font-mono text-[9px] uppercase font-bold pt-2 border-t border-slate-850 shrink-0">
            Use screen touch or mouse scrollbars to scroll the larger notice sheet when zoomed.
          </div>
        </div>
      )}

    </div>
  );
};

// Layout 1: Horizontal item bar used to present Latest Notices on School Homepage
const NoticeStripCard: React.FC<{ notice: Notice; onClick: () => void }> = ({ notice, onClick }) => {
  const isCritical = notice.priority === 'Critical';
  const isHigh = notice.priority === 'High';

  return (
    <div
      onClick={onClick}
      id={`notice-strip-${notice.id}`}
      className={`group relative flex items-center justify-between gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
        isCritical 
          ? 'bg-rose-50/40 hover:bg-rose-50 border-rose-200/70 shadow-sm' 
          : 'bg-white hover:bg-slate-50/40 border-slate-100 hover:border-orange-500/20 shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Left edge identifier tag */}
        <div className={`w-1 h-8 rounded-full shrink-0 ${
          isCritical 
            ? 'bg-rose-500 animate-pulse' 
            : isHigh 
            ? 'bg-orange-500' 
            : 'bg-slate-300'
        }`} />

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] text-orange-600 font-mono tracking-wider font-semibold uppercase">{notice.category}</span>
            <span className="text-slate-300 font-mono text-[10px]">•</span>
            {notice.is_pinned && (
              <span className="flex items-center gap-0.5 text-[8px] sm:text-[9.5px] bg-orange-500 text-white px-1.5 py-0.2 rounded font-extrabold uppercase">
                <Pin className="w-2.5 h-2.5 transform rotate-45" /> PINNED
              </span>
            )}
            {isCritical && (
              <span className="px-1.5 py-0.2 bg-red-650 bg-red-600 text-white rounded text-[8.5px] sm:text-[9.5px] font-bold tracking-wider uppercase animate-pulse">
                CRITICAL ALERT
              </span>
            )}
          </div>
          <h3 className="text-slate-800 group-hover:text-orange-600 font-bold text-xs sm:text-sm tracking-wide uppercase line-clamp-1 truncate max-w-full leading-snug">
            {notice.title}
          </h3>
          <p className="text-slate-500 text-xs line-clamp-1 truncate font-medium mt-0.5 leading-relaxed">
            {notice.summary}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden sm:inline text-[10.5px] text-slate-400 font-mono tracking-wider font-semibold">{notice.publish_date}</span>
        <ChevronRight className="w-4 h-4 text-slate-450 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
};

// Layout 2: Modular Card layouts for the archival filter pages
const NoticeCard: React.FC<{ notice: Notice; onClick: () => void }> = ({ notice, onClick }) => {
  const isCritical = notice.priority === 'Critical';
  const isHigh = notice.priority === 'High';

  return (
    <div
      onClick={onClick}
      id={`notice-card-${notice.id}`}
      className={`group relative flex flex-col justify-between p-5.5 rounded-2xl cursor-pointer transition-all duration-300 border ${
        isCritical 
          ? 'bg-rose-50/20 hover:bg-rose-50/40 border-rose-250 hover:border-rose-450 shadow-sm' 
          : 'bg-white border-slate-100 hover:border-orange-500/20 shadow-xs hover:shadow-md'
      }`}
    >
      <div>
        {/* Banner metadata tags */}
        <div className="flex justify-between items-center gap-2 mb-3.5 text-xs">
          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] sm:text-xs font-bold rounded uppercase tracking-wider border border-orange-100">
            {notice.category}
          </span>
          <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
            <Calendar className="w-3.5 h-3.5" />
            <span>{notice.publish_date}</span>
          </div>
        </div>

        {/* Pin or Alert markers */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {notice.is_pinned && (
            <span className="inline-flex items-center gap-1 text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded font-bold uppercase">
              <Pin className="w-2.5 h-2.5 transform rotate-45" /> PINNED
            </span>
          )}
          {isCritical ? (
            <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold tracking-wider uppercase animate-pulse">
              Urgent Critical
            </span>
          ) : isHigh ? (
            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold uppercase tracking-wider border border-orange-100/30">
              High Priority
            </span>
          ) : null}
        </div>

        {/* Titles */}
        <h3 className="text-slate-800 group-hover:text-orange-500 font-bold text-sm sm:text-base tracking-tight leading-snug uppercase mb-2 line-clamp-2">
          {notice.title}
        </h3>

        {/* Summary text */}
        <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed mb-6 line-clamp-2">
          {notice.summary}
        </p>
      </div>

      {/* Footer trigger indicators */}
      <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
        <span className="text-orange-500 font-bold group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1 uppercase tracking-wider text-[11px]">
          Read Details <ArrowRight className="w-3.5 h-3.5" />
        </span>
        
        {notice.pdf_url && (
          <span className="px-2 py-0.5 bg-red-50 text-red-650 rounded text-[9.5px] uppercase font-bold tracking-wider flex items-center gap-1 border border-red-100">
            <FileText className="w-3 h-3" /> PDF File
          </span>
        )}
      </div>
    </div>
  );
};
