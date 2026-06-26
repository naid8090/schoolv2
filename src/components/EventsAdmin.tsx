/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Tag, MapPin, User, Eye, EyeOff, Archive, Trash2, Edit2, Plus, Star, ArrowLeft, Image as ImageIcon, ChevronLeft, ChevronRight, FileText, UploadCloud, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { dbService } from '../services/db';
import { SchoolEvent, SchoolEventImage, MediaItem } from '../types';
import { MediaSelectorModal } from './MediaLibrary';
import { useDataSync } from '../hooks/useDataSync';

export const EventsAdmin: React.FC = () => {
  const [eventsList, setEventsList] = useState<SchoolEvent[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  
  // Custom categories helper states
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  // View states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Mode: 'Create' | 'Edit'
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // Form variables
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNewCategory, setFormNewCategory] = useState('');
  const [formEventDate, setFormEventDate] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formOrganizer, setFormOrganizer] = useState('');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Published' | 'Archived'>('Draft');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formFullDescription, setFormFullDescription] = useState('');
  const [formFeaturedImage, setFormFeaturedImage] = useState('');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formFeaturedHomepage, setFormFeaturedHomepage] = useState(false);

  // Selector Modal state
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'featured_image' | 'pdf_url' | 'album_image' | null>(null);

  // Album images state for current editing event
  const [currentAlbum, setCurrentAlbum] = useState<SchoolEventImage[]>([]);

  const refreshLists = () => {
    setEventsList(dbService.getEvents());
    const categories = dbService.getEventCategories();
    setCategoriesList(categories);
    if (!formCategory && categories.length > 0) {
      setFormCategory(categories[0]);
    }
  };

  useEffect(() => {
    refreshLists();
  }, []);

  useDataSync(refreshLists);

  // Switch to Create Mode
  const handleInitCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setFormTitle('');
    setFormCategory(categoriesList[0] || 'Academic Event');
    setFormNewCategory('');
    setFormEventDate(new Date().toISOString().split('T')[0]);
    setFormVenue('');
    setFormOrganizer('');
    setFormStatus('Published'); // default as published for simple workflows
    setFormShortDescription('');
    setFormFullDescription('');
    setFormFeaturedImage('');
    setFormPdfUrl('');
    setFormFeaturedHomepage(false);
    setCurrentAlbum([]);
    setIsEditing(true);
  };

  // Switch to Edit Mode
  const handleInitEdit = (eventItem: SchoolEvent) => {
    setFormMode('edit');
    setEditingId(eventItem.id);
    setFormTitle(eventItem.title);
    setFormCategory(eventItem.category);
    setFormNewCategory('');
    setFormEventDate(eventItem.event_date);
    setFormVenue(eventItem.venue);
    setFormOrganizer(eventItem.organizer);
    setFormStatus(eventItem.status);
    setFormShortDescription(eventItem.short_description);
    setFormFullDescription(eventItem.full_description);
    setFormFeaturedImage(eventItem.featured_image);
    setFormPdfUrl(eventItem.pdf_url || '');
    setFormFeaturedHomepage(evItemFeaturedOnHomepage(eventItem.id) || eventItem.featured_homepage);
    
    // Load album
    const album = dbService.getEventImagesByEvent(eventItem.id);
    setCurrentAlbum(album);
    setIsEditing(true);
  };

  const evItemFeaturedOnHomepage = (id: string): boolean => {
    const ev = eventsList.find(e => e.id === id);
    return ev ? ev.featured_homepage : false;
  };

  // Inline Category Creator
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCat = formNewCategory.trim();
    if (!cleanCat) return;

    dbService.createEventCategory(cleanCat);
    setFormCategory(cleanCat);
    setFormNewCategory('');
    refreshLists();
  };

  // Delete Category with validation and custom confirmation
  const handleDeleteCategory = (catToDelete: string) => {
    // 1. Check if category is actively used by existing events
    const isUsed = eventsList.some(evt => evt.category.toLowerCase() === catToDelete.toLowerCase());
    if (isUsed) {
      setCategoryError(`Cannot delete category "${catToDelete}" because there are active school events referencing it.`);
      setTimeout(() => setCategoryError(null), 5000);
      return;
    }

    setCategoryError(null);
    setConfirmDeleteCategory(catToDelete);
  };

  const handleConfirmDeleteCategory = () => {
    if (!confirmDeleteCategory) return;
    
    const filteredCats = categoriesList.filter(c => c !== confirmDeleteCategory);
    dbService.saveEventCategories(filteredCats);
    
    // Choose fallback category
    if (formCategory === confirmDeleteCategory) {
      setFormCategory(filteredCats[0] || 'Academic Event');
    }
    
    setConfirmDeleteCategory(null);
    refreshLists();
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      alert('Event Title is required.');
      return;
    }
    if (!formEventDate) {
      alert('Event Date is required.');
      return;
    }

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      event_date: formEventDate,
      short_description: formShortDescription.trim(),
      full_description: formFullDescription.trim(),
      featured_image: formFeaturedImage,
      venue: formVenue.trim() || 'Main Campus',
      organizer: formOrganizer.trim() || 'School Administration',
      status: formStatus,
      featured_homepage: formFeaturedHomepage,
      pdf_url: formPdfUrl.trim()
    };

    if (formMode === 'create') {
      dbService.createEvent(payload);
    } else if (editingId) {
      dbService.updateEvent(editingId, payload);
    }

    setIsEditing(false);
    refreshLists();
  };

  // Direct toggle statuses (quick actions)
  const handleToggleHomepageFeature = (id: string) => {
    const ev = eventsList.find(e => e.id === id);
    if (ev) {
      dbService.updateEvent(id, { featured_homepage: !ev.featured_homepage });
      refreshLists();
    }
  };

  const handleToggleStatus = (id: string) => {
    const ev = eventsList.find(e => e.id === id);
    if (ev) {
      const nextStatus = ev.status === 'Draft' ? 'Published' : 'Draft';
      dbService.updateEvent(id, { status: nextStatus });
      refreshLists();
    }
  };

  const handleArchiveEvent = (id: string) => {
    dbService.updateEvent(id, { status: 'Archived' });
    refreshLists();
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Delete this event? All associated album photo references will also be removed.')) {
      dbService.deleteEvent(id);
      refreshLists();
    }
  };

  // Media Library Selection Handler
  const handleOpenMediaSelector = (target: 'featured_image' | 'pdf_url' | 'album_image') => {
    setMediaTarget(target);
    setIsMediaOpen(true);
  };

  const handleMediaSelected = (item: MediaItem) => {
    if (!mediaTarget) return;

    if (mediaTarget === 'featured_image') {
      setFormFeaturedImage(item.file_url);
    } else if (mediaTarget === 'pdf_url') {
      setFormPdfUrl(item.file_url);
    } else if (mediaTarget === 'album_image' && editingId) {
      // Add immediately to album
      dbService.addEventImage(editingId, item.file_url);
      // Reload current album
      const album = dbService.getEventImagesByEvent(editingId);
      setCurrentAlbum(album);
    }
  };

  // Album Image Operations
  const handleDeleteAlbumImage = (imageId: string) => {
    if (!editingId) return;
    dbService.deleteEventImage(imageId);
    const album = dbService.getEventImagesByEvent(editingId);
    setCurrentAlbum(album);
  };

  const handleMakeAlbumImgFeatured = (imageUrl: string) => {
    setFormFeaturedImage(imageUrl);
  };

  const handleMoveAlbumImage = (index: number, direction: 'left' | 'right') => {
    if (!editingId) return;
    const albumCopy = [...currentAlbum];
    const swapIndex = direction === 'left' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= albumCopy.length) return;

    // Swap elements
    const temp = albumCopy[index];
    albumCopy[index] = albumCopy[swapIndex];
    albumCopy[swapIndex] = temp;

    const idsOrdered = albumCopy.map(img => img.id);
    dbService.updateEventImagesOrder(editingId, idsOrdered);
    
    // Reload
    const album = dbService.getEventImagesByEvent(editingId);
    setCurrentAlbum(album);
  };

  return (
    <div className="w-full font-sans" id="events-admin-management">
      {/* Media Selector integration */}
      {isMediaOpen && mediaTarget && (
        <MediaSelectorModal
          onClose={() => setIsMediaOpen(false)}
          onSelect={handleMediaSelected}
          allowedType={mediaTarget === 'pdf_url' ? 'pdf' : 'image'}
          activeBucketFilter={mediaTarget === 'pdf_url' ? 'downloads' : 'events'}
          title={
            mediaTarget === 'featured_image'
              ? 'Select Theme Featured Image'
              : mediaTarget === 'pdf_url'
              ? 'Select Event Pamphlet PDF'
              : 'Add Album Photo'
          }
        />
      )}

      {/* Editor view */}
      {isEditing ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-6.5 shadow-2xs">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 mb-6 border border-slate-150 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Return
          </button>

          <h2 className="text-lg font-extrabold uppercase text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-orange-500 rounded-sm" />
            {formMode === 'create' ? 'Assemble New School Event' : 'Modify Event Coordinates'}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left side Form */}
            <form onSubmit={handleFormSubmit} className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Title */}
                <div className="col-span-1 md:col-span-2">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="e.g. Science Fair or Annual Athletic Meet"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold"
                  />
                </div>

                {/* Event Category Selector */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Event Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold cursor-pointer"
                  >
                    {categoriesList.map((catOpt) => (
                      <option key={catOpt} value={catOpt}>{catOpt}</option>
                    ))}
                  </select>
                </div>

                {/* Category Addition segment */}
                <div className="space-y-2">
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-0.5">Or Append Custom Category</label>
                  <div className="flex gap-1.5 mt-0.5">
                    <input
                      type="text"
                      placeholder="New category label..."
                      value={formNewCategory}
                      onChange={(e) => setFormNewCategory(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Category interactive list manager */}
                  <div className="mt-2.5 space-y-1.5 bg-slate-50 border border-slate-150 rounded-xl p-3">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Interactive Category Registry ({categoriesList.length})</span>
                    {categoryError && (
                      <div className="p-2 bg-red-50 border border-red-150 rounded-lg text-[10px] font-semibold text-red-600 flex items-center gap-1.5 animate-pulse mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>{categoryError}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {categoriesList.map((catOpt) => {
                        const isReferenced = eventsList.some(evt => evt.category.toLowerCase() === catOpt.toLowerCase());
                        const isDefault = ['Academic Event', 'Sports Day', 'Cultural Fest', 'Excursion / Tour', 'National Festival', 'Exhibition'].includes(catOpt);
                        return (
                          <div 
                            key={catOpt} 
                            className={`group/chip inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-[10px] font-bold rounded-full font-mono border transition-all ${
                              formCategory === catOpt
                                ? 'bg-orange-500/10 border-orange-500 text-orange-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'
                            }`}
                          >
                            <span 
                              className="cursor-pointer" 
                              onClick={() => {
                                setFormCategory(catOpt);
                                setCategoryError(null);
                              }}
                              title="Click to select"
                            >
                              {catOpt}
                            </span>
                            
                            {!isDefault && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(catOpt)}
                                className="p-0.5 hover:bg-red-500/15 hover:text-red-600 rounded text-slate-400 font-extrabold transition cursor-pointer"
                                title={isReferenced ? "Actively referenced by events" : "Delete category permanently"}
                                id={`delete-cat-btn-${catOpt.replace(/\s+/g, '-')}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Event Date */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={formEventDate}
                    onChange={(e) => setFormEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold cursor-pointer"
                  />
                </div>

                {/* Venue */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Venue Location</label>
                  <input
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="e.g. Auditorium Hall, Room 10B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold"
                  />
                </div>

                {/* Organizer */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Organizer Desk</label>
                  <input
                    type="text"
                    value={formOrganizer}
                    onChange={(e) => setFormOrganizer(e.target.value)}
                    placeholder="e.g. Science Club, Humanities Council"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-semibold cursor-pointer"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Short Summary (Featured Snippet) *</label>
                <textarea
                  rows={2}
                  required
                  value={formShortDescription}
                  onChange={(e) => setFormShortDescription(e.target.value)}
                  placeholder="Summarize key deadlines or events briefly for card grids..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-medium leading-relaxed"
                />
              </div>

              {/* Full description */}
              <div>
                <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Full Descriptive Transcript</label>
                <textarea
                  rows={5}
                  value={formFullDescription}
                  onChange={(e) => setFormFullDescription(e.target.value)}
                  placeholder="Provide complete historical record or event description details here..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-450 focus:outline-none focus:border-orange-500 focus:bg-white text-xs font-medium leading-relaxed"
                />
              </div>

              {/* Media selector buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-150 rounded-xl">
                {/* Featured image select */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Featured Image URL</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formFeaturedImage}
                      onChange={(e) => setFormFeaturedImage(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 text-[11px] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenMediaSelector('featured_image')}
                      className="px-2.5 py-1.5 bg-sky-900 hover:bg-sky-950 text-white font-bold rounded-md text-[10px] uppercase flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" /> Library
                    </button>
                  </div>
                  {formFeaturedImage ? (
                    <div className="mt-2 text-center">
                      <img src={formFeaturedImage} alt="Featured Preview" className="h-16 w-32 object-cover rounded-md border border-slate-200 mx-auto" referrerPolicy="no-referrer" />
                    </div>
                  ) : null}
                </div>

                {/* PDF selector */}
                <div>
                  <label className="text-slate-700 text-xs font-bold uppercase tracking-wider block mb-1">Event PDF Circular (Optional)</label>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="Attached file link..."
                      value={formPdfUrl}
                      onChange={(e) => setFormPdfUrl(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 text-[11px] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenMediaSelector('pdf_url')}
                      className="px-2.5 py-1.5 bg-sky-900 hover:bg-sky-950 text-white font-bold rounded-md text-[10px] uppercase flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Library
                    </button>
                  </div>
                  {formPdfUrl ? (
                    <p className="mt-1 text-[10px] text-green-600 font-bold flex items-center gap-1 justify-center">
                      <CheckCircle className="w-3 h-3" /> PDF document registered successfully
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Homepage Feature Toggle */}
              <div className="flex items-center gap-2 py-1.5">
                <input
                  type="checkbox"
                  id="featured_homepage_box"
                  checked={formFeaturedHomepage}
                  onChange={(e) => setFormFeaturedHomepage(e.target.checked)}
                  className="w-4 h-4 text-orange-600 accent-orange-500 rounded border-slate-300 focus:ring-0 focus:outline-none cursor-pointer"
                />
                <label htmlFor="featured_homepage_box" className="text-slate-700 font-bold text-xs uppercase tracking-wide cursor-pointer flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Feature this event on the public homepage
                </label>
              </div>

              {/* Final form actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg font-bold text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  Save and Publish
                </button>
              </div>
            </form>

            {/* Right side: Event Album management */}
            <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl flex flex-col h-fit">
              <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2.5 mb-4">
                <ImageIcon className="w-4 h-4 text-orange-600" />
                Album Photo Gallery
              </h3>

              {formMode === 'create' ? (
                <div className="p-6 text-center text-slate-400 font-bold text-[11px] leading-relaxed">
                  Album creation is activated once the event is saved. Save this event first, then open it for edit to manage its physical album photos.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Grid */}
                  {currentAlbum.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3.5 max-h-72 overflow-y-auto pr-1">
                      {currentAlbum.map((img, idx) => (
                        <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-white group">
                          <img src={img.image_url} alt="Album Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          
                          {/* Top controls: crown / set header */}
                          <button
                            type="button"
                            title="Set as featured banner"
                            onClick={() => handleMakeAlbumImgFeatured(img.image_url)}
                            className={`absolute top-1 left-1 p-1 rounded backdrop-blur-xs transition ${
                              formFeaturedImage === img.image_url
                                ? 'bg-amber-500 text-slate-950 scale-105'
                                : 'bg-slate-900/40 text-white hover:bg-slate-900/80'
                            }`}
                          >
                            <Star className={`w-3 h-3 ${formFeaturedImage === img.image_url ? 'fill-current' : ''}`} />
                          </button>

                          {/* Delete from album */}
                          <button
                            type="button"
                            title="Delete photo reference"
                            onClick={() => handleDeleteAlbumImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-red-650 bg-red-600 hover:bg-red-700 text-white rounded shadow-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          {/* Left/Right sorting controls */}
                          <div className="absolute bottom-1 right-1 flex gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveAlbumImage(idx, 'left')}
                              className="p-1 bg-slate-900/60 disabled:opacity-20 hover:bg-slate-900/80 text-white rounded"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === currentAlbum.length - 1}
                              onClick={() => handleMoveAlbumImage(idx, 'right')}
                              className="p-1 bg-slate-900/60 disabled:opacity-20 hover:bg-slate-900/80 text-white rounded"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Index badge */}
                          <span className="absolute bottom-1 left-1 font-mono font-bold text-[8px] bg-slate-900/70 text-slate-300 px-1 py-0.5 rounded">
                            #{img.display_order}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 font-bold text-[11px]">
                      No photos uploaded for this album. Select references below.
                    </div>
                  )}

                  {/* Add Image trigger */}
                  <button
                    type="button"
                    onClick={() => handleOpenMediaSelector('album_image')}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-sky-900 hover:bg-sky-950 text-white rounded-lg font-bold text-xs uppercase cursor-pointer transition-colors mt-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Link Photo from Repository
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Events overview table (CRUD checklist views) */
        <div className="bg-white border border-slate-150 rounded-2xl p-6.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-6 bg-orange-500 rounded-sm" />
                Active School Events Roster
              </h2>
              <p className="text-slate-500 text-xs font-semibold">
                Organize, edit, publish calendars, or manage multi-photo albums for school chronicles.
              </p>
            </div>

            <button
              onClick={handleInitCreate}
              className="px-4.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-extrabold text-xs uppercase tracking-wide flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Create School Event
            </button>
          </div>

          {eventsList.length > 0 ? (
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5 pl-4.5">Event Banner</th>
                    <th className="p-3.5">Details</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Date & Venue</th>
                    <th className="p-3.5 text-center">Featured (Home)</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-4.5 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {eventsList.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 transition">
                      {/* Banner */}
                      <td className="p-3.5 pl-4.5">
                        {ev.featured_image ? (
                          <img
                            src={ev.featured_image}
                            alt=""
                            className="w-14 h-9 object-cover rounded-md border border-slate-100 shadow-3xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-9 bg-slate-100 border border-slate-150 rounded-md flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Title */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-slate-900 hover:text-orange-600 transition truncate block max-w-xs">{ev.title}</span>
                        {ev.organizer && (
                          <span className="text-[10px] text-slate-400 font-mono tracking-tight block mt-0.5">By {ev.organizer}</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-bold font-mono text-[9px] uppercase tracking-wide">
                          {ev.category}
                        </span>
                      </td>

                      {/* Date & Venue */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-900 font-mono">
                          <Calendar className="w-3 h-3 text-orange-500 shrink-0" />
                          <span>{ev.event_date}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-450 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{ev.venue}</span>
                        </div>
                      </td>

                      {/* Home Star toggle */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleHomepageFeature(ev.id)}
                          className="p-1 hover:bg-amber-50 rounded cursor-pointer transition"
                          title="Toggle homepage module preview inclusion"
                        >
                          <Star className={`w-4 h-4 ${ev.featured_homepage ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                        </button>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded font-bold text-[9px] uppercase tracking-wide ${
                          ev.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : ev.status === 'Archived'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-150'
                        }`}>
                          {ev.status}
                        </span>
                      </td>

                      {/* Action controllers */}
                      <td className="p-3.5 pr-4.5 text-right w-36">
                        <div className="inline-flex items-center gap-1">
                          {/* Toggle Draft/Publish */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(ev.id)}
                            className="p-1.5 text-slate-400 hover:text-orange-500 cursor-pointer transition"
                            title={ev.status === 'Draft' ? 'Publish Event' : 'Revert to Draft'}
                          >
                            {ev.status === 'Draft' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Archive Event */}
                          {ev.status !== 'Archived' && (
                            <button
                              type="button"
                              onClick={() => handleArchiveEvent(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-500 cursor-pointer transition"
                              title="Archive Event"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Event */}
                          <button
                            type="button"
                            onClick={() => handleInitEdit(ev)}
                            className="p-1.5 text-slate-400 hover:text-sky-900 cursor-pointer transition"
                            title="Edit Event & Album"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Event */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-wider">
              No school events registered. Click 'Create School Event' above to begin.
            </div>
          )}
        </div>
      )}

      {/* Custom Category Delete confirmation modal popup */}
      {confirmDeleteCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in duration-200" id="delete-category-confirm-overlay">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-sm w-full space-y-4 shadow-xl text-left">
            <div className="flex items-center gap-3 text-red-650">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-slate-800">Clear Event Category</h3>
            </div>
            <p className="text-slate-650 text-xs font-sans leading-relaxed">
              Are you sure you want to delete the custom event category &ldquo;<strong className="text-slate-800 font-bold">{confirmDeleteCategory}</strong>&rdquo;? This category will be scrubbed from the active categories registry.
            </p>
            <div className="flex justify-end gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteCategory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors"
                id="category-delete-confirm-btn"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
