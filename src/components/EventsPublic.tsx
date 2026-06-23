/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Search, ArrowLeft, FileText, Download, Grid, Award, Eye, CalendarDays, Image as ImageIcon } from 'lucide-react';
import { dbService } from '../services/db';
import { SchoolEvent, SchoolEventImage } from '../types';

interface EventsPublicProps {
  initialSelectedEventId?: string | null;
  onClearSelectedEvent?: () => void;
}

export const EventsPublic: React.FC<EventsPublicProps> = ({
  initialSelectedEventId,
  onClearSelectedEvent
}) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(initialSelectedEventId || null);

  useEffect(() => {
    // Load published events
    const allEvents = dbService.getEvents();
    console.log(
      '[DEBUG] EventsPublic allEvents:',
      allEvents.length
    );
    // Public view only shows Published and Archived events (not drafts)
    const publicEvents = allEvents.filter(e => e.status !== 'Draft');
    setEvents(publicEvents);
    setCategories(dbService.getEventCategories());
  }, []);

  useEffect(() => {
    const handleSync = () => {
      console.log(
        '[DEBUG] handleSync fired'
      );
      const allEvents = dbService.getEvents();
      console.log(
        '[DEBUG] EventsPublic allEvents:',
        allEvents.length
      );
      console.log(
        '[DEBUG] handleSync events:',
        allEvents.length
      );
      const publicEvents = allEvents.filter(e => e.status !== 'Draft');
      setEvents(publicEvents);
      setCategories(dbService.getEventCategories());
    };
    window.addEventListener('gsss-data-synced', handleSync);
    return () => {
      window.removeEventListener('gsss-data-synced', handleSync);
    };
  }, []);

  useEffect(() => {
    if (initialSelectedEventId) {
      setSelectedEventId(initialSelectedEventId);
    }
  }, [initialSelectedEventId]);

  const handleBackToList = () => {
    setSelectedEventId(null);
    if (onClearSelectedEvent) {
      onClearSelectedEvent();
    }
  };

  // Get unique list of event years
  const availableYears = Array.from(
    new Set(
      events.map(e => {
        if (!e.event_date) return '';
        const d = new Date(e.event_date);
        return isNaN(d.getFullYear()) ? '' : d.getFullYear().toString();
      }).filter(y => y !== '')
    )
  ).sort((a, b) => (b as string).localeCompare(a as string)) as string[];

  // Filter events
  const filteredEvents = events.filter(ev => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchShort = ev.short_description.toLowerCase().includes(q);
      const matchOrganizer = ev.organizer.toLowerCase().includes(q);
      const matchVenue = ev.venue.toLowerCase().includes(q);
      if (!matchTitle && !matchShort && !matchOrganizer && !matchVenue) return false;
    }

    if (categoryFilter !== 'ALL' && ev.category !== categoryFilter) return false;

    if (yearFilter !== 'ALL') {
      const evYear = ev.event_date ? new Date(ev.event_date).getFullYear().toString() : '';
      if (evYear !== yearFilter) return false;
    }

    return true;
  });

  // Render detail view if a specific event is clicked
  if (selectedEventId) {
    const eventItem = events.find(e => e.id === selectedEventId) || dbService.getEvents().find(e => e.id === selectedEventId);
    if (!eventItem) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-slate-500 font-bold mb-4">Event records could not be fetched or found.</p>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold leading-none cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to List
          </button>
        </div>
      );
    }

    const albumImages = dbService.getEventImagesByEvent(eventItem.id);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans" id={`event-detail-${eventItem.id}`}>
        {/* Back Button */}
        <button
          onClick={handleBackToList}
          className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-orange-600 border border-slate-200 hover:border-orange-500/20 bg-white px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Events Calendar
        </button>

        {/* Featured Card Banner */}
        <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-xs mb-8">
          <div className="relative h-64 sm:h-96 w-full bg-slate-900 flex items-center justify-center">
            {eventItem.featured_image ? (
              <img
                src={eventItem.featured_image}
                alt={eventItem.title}
                className="w-full h-full object-cover opacity-85"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                <Calendar className="w-16 h-16 text-slate-500" />
                <span className="font-semibold text-xs text-slate-500 uppercase tracking-widest">No featured banner</span>
              </div>
            )}
            
            {/* Status and Category Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-orange-600 text-white font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full shadow-xs">
                {eventItem.category}
              </span>
              {eventItem.status === 'Archived' && (
                <span className="bg-slate-750 bg-slate-800 text-slate-200 font-bold text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full shadow-xs">
                  Archived Record
                </span>
              )}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
              {eventItem.title}
            </h1>

            {/* Quick Metadata Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-100 py-4.5 mb-6 text-xs text-slate-600 font-semibold uppercase font-mono tracking-wide">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal -mb-0.5">Event Date</span>
                  <span>{new Date(eventItem.event_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal -mb-0.5">Venue Location</span>
                  <span className="normal-case font-sans font-bold text-slate-700 truncate block max-w-xs">{eventItem.venue}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-orange-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-normal -mb-0.5">Organizer Desk</span>
                  <span className="normal-case font-sans font-bold text-slate-700 truncate block max-w-xs">{eventItem.organizer}</span>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="text-slate-700 text-xs sm:text-sm leading-relaxed mb-8">
              <h3 className="text-slate-800 font-extrabold text-sm uppercase tracking-wider mb-2 font-mono">About this Event</h3>
              <p className="whitespace-pre-line font-medium text-slate-600 mb-6 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">{eventItem.short_description}</p>
              
              <h3 className="text-slate-800 font-extrabold text-sm uppercase tracking-wider mb-2 font-mono">Full Detailed Transcript</h3>
              <p className="whitespace-pre-line font-medium text-slate-600 font-sans leading-relaxed">
                {eventItem.full_description || "No full description transcript available currently."}
              </p>
            </div>

            {/* PDF attachment button */}
            {eventItem.pdf_url ? (
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Official Event Circular/Handbook</span>
                    <span className="text-[10px] text-slate-500 font-semibold font-mono">Download authorized document (PDF)</span>
                  </div>
                </div>
                <a
                  href={eventItem.pdf_url}
                  download={`Event_Directive_${eventItem.id}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-sky-900 hover:bg-sky-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ) : null}

            {/* Dynamic Event Album / Photo Gallery */}
            <div className="mt-10 border-t border-slate-100 pt-8" id="event-album-gallery">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 tracking-tight">
                <Grid className="w-5 h-5 text-orange-600" />
                Official Event Album ({albumImages.length})
              </h3>
              
              {albumImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {albumImages.map((img) => (
                    <div
                      key={img.id}
                      className="group aspect-video rounded-xl overflow-hidden border border-slate-150 bg-slate-50 relative cursor-pointer shadow-xs transition hover:shadow-md"
                    >
                      <img
                        src={img.image_url}
                        alt="Album Attachment"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 font-semibold text-xs">
                  No photographic transcripts have been uploaded to this event album yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans" id="events-public-index">
      {/* Page Header */}
      <div className="text-center md:text-left mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] uppercase font-mono font-bold text-orange-600 tracking-widest block">
            School Bulletin & Chronicles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-905 text-slate-900 tracking-tight mt-1">
            Official School Events
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-xl font-semibold leading-relaxed">
            Review organized workshops, athletic championships, BSEB consultations, state festivals and academic sessions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center pr-2 text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search by event title, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-semibold text-xs shadow-none"
          />
        </div>

        {/* Right filters */}
        <div className="flex flex-wrap gap-3.5 w-full md:w-auto items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wide">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((catOpt) => (
                <option key={catOpt} value={catOpt}>{catOpt}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-mono text-[9px] uppercase font-bold tracking-wide">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-xs focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="ALL">All Years</option>
              {availableYears.map((yearOpt) => (
                <option key={yearOpt} value={yearOpt}>{yearOpt}</option>
              ))}
            </select>
          </div>

          {(searchQuery || categoryFilter !== 'ALL' || yearFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('ALL');
                setYearFilter('ALL');
              }}
              className="px-3 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 rounded-lg font-bold text-[10px] uppercase tracking-wide cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Events Grid layout */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
          {filteredEvents.map((evItem) => {
            const formattedDate = evItem.event_date ? new Date(evItem.event_date).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }) : 'No Date Set';

            return (
              <div
                key={evItem.id}
                onClick={() => setSelectedEventId(evItem.id)}
                className="bg-white border border-slate-150 rounded-2xl overflow-hidden hover:shadow-md transition duration-200 cursor-pointer flex flex-col group h-full"
                id={`event-card-${evItem.id}`}
              >
                {/* Event Image */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden shrink-0">
                  {evItem.featured_image ? (
                    <img
                      src={evItem.featured_image}
                      alt={evItem.title}
                      className="w-full h-full object-cover transition-transform duration-350 group-hover:scale-103"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50">
                      <ImageIcon className="w-10 h-10 text-slate-300" />
                      <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-slate-400">Preview Unavailable</span>
                    </div>
                  )}
                  {/* Category Pill overlay */}
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-100 text-slate-800 font-bold font-mono text-[9px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow-2xs">
                    {evItem.category}
                  </span>
                </div>

                {/* Event Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-600 font-mono font-bold uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formattedDate}</span>
                  </div>

                  <h3 className="text-slate-900 font-extrabold text-sm group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight tracking-tight mb-2">
                    {evItem.title}
                  </h3>

                  <p className="text-slate-500 text-xs font-semibold leading-relaxed line-clamp-3 mb-4.5">
                    {evItem.short_description || "No description overview provided for this event bulletin."}
                  </p>

                  <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span className="flex items-center gap-1 normal-case font-sans tracking-wide max-w-[180px] truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {evItem.venue}
                    </span>
                    <span className="text-orange-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider font-bold">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl p-16 text-center shadow-2xs max-w-2xl mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-slate-800 font-extrabold text-sm uppercase tracking-wider mb-1">No Active Bulletins Found</h4>
          <p className="text-slate-500 text-xs font-bold font-sans max-w-sm mx-auto leading-relaxed">
            There are no scheduled school events matching your active search keywords or filter dropdown options.
          </p>
        </div>
      )}
    </div>
  );
};
