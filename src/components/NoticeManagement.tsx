/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, X, Pin, Eye, EyeOff, FileText, Check, Paperclip, ChevronRight, AlertTriangle } from 'lucide-react';
import { Notice, NoticeCategory, NoticePriority, NoticeStatus, MediaItem } from '../types';
import { dbService } from '../services/db';
import { MediaSelectorModal } from './MediaLibrary';

export const NoticeManagement: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>(() => dbService.getNotices());
  const [editingId, setEditingId] = useState<string | null>(null);

  React.useEffect(() => {
    const handleSync = () => {
      setNotices(dbService.getNotices());
    };
    window.addEventListener('gsss-data-synced', handleSync);
    return () => {
      window.removeEventListener('gsss-data-synced', handleSync);
    };
  }, []);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<NoticeCategory>('General Notice');
  const [formPriority, setFormPriority] = useState<NoticePriority>('Normal');
  const [formStatus, setFormStatus] = useState<NoticeStatus>('Published');
  const [formFeaturedImage, setFormFeaturedImage] = useState(''); // Stores mediaId or empty
  const [formPdfUrl, setFormPdfUrl] = useState(''); // Stores mediaId or empty
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formShowOnHomepage, setFormShowOnHomepage] = useState(true);
  const [formPublishDate, setFormPublishDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Media selector modal flow
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [mediaSelectTarget, setMediaSelectTarget] = useState<'image' | 'pdf' | null>(null);

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
  const statuses: NoticeStatus[] = ['Draft', 'Published', 'Archived'];

  const refreshNoticesList = () => {
    setNotices(dbService.getNotices());
  };

  const startCreate = () => {
    setFormTitle('');
    setFormSummary('');
    setFormContent('');
    setFormCategory('General Notice');
    setFormPriority('Normal');
    setFormStatus('Published');
    setFormFeaturedImage('');
    setFormPdfUrl('');
    setFormIsPinned(false);
    setFormShowOnHomepage(true);
    setFormPublishDate(new Date().toISOString().split('T')[0]);
    setIsCreating(true);
    setEditingId(null);
  };

  const startEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setFormTitle(notice.title);
    setFormSummary(notice.summary);
    setFormContent(notice.content);
    setFormCategory(notice.category);
    setFormPriority(notice.priority);
    setFormStatus(notice.status);
    setFormFeaturedImage(notice.featured_image);
    setFormPdfUrl(notice.pdf_url);
    setFormIsPinned(notice.is_pinned);
    setFormShowOnHomepage(notice.show_on_homepage);
    setFormPublishDate(notice.publish_date);
    setIsCreating(false);
  };

  const saveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Title is required.');
      return;
    }

    const noticePayload = {
      title: formTitle,
      summary: formSummary,
      content: formContent,
      category: formCategory,
      priority: formPriority,
      status: formStatus,
      featured_image: formFeaturedImage,
      pdf_url: formPdfUrl,
      is_pinned: formIsPinned,
      show_on_homepage: formShowOnHomepage,
      publish_date: formPublishDate
    };

    if (isCreating) {
      dbService.createNotice(noticePayload);
      alert('Notice created successfully.');
    } else if (editingId) {
      dbService.updateNotice(editingId, noticePayload);
      alert('Notice details updated successfully.');
    }

    setIsCreating(false);
    setEditingId(null);
    refreshNoticesList();
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  // Launch Media selector helper
  const openMediaSelector = (target: 'image' | 'pdf') => {
    setMediaSelectTarget(target);
    setIsMediaSelectorOpen(true);
  };

  const handleMediaSelected = (item: MediaItem) => {
    if (mediaSelectTarget === 'image') {
      setFormFeaturedImage(item.id);
    } else if (mediaSelectTarget === 'pdf') {
      setFormPdfUrl(item.id);
    }
    setIsMediaSelectorOpen(false);
    setMediaSelectTarget(null);
  };

  // Helper getters to translate Media references to readable name badges
  const mediaItemsMap = dbService.getMediaItems();
  const getMediaItemName = (mediaId: string): string => {
    const item = mediaItemsMap.find(m => m.id === mediaId);
    return item ? item.file_name : 'Attached Document (Reference lost)';
  };

  return (
    <div className="w-full text-slate-605 text-slate-600" id="notice-management-module">
      
      {/* Selector Modal wrapper hook */}
      {isMediaSelectorOpen && mediaSelectTarget && (
        <MediaSelectorModal
          onClose={() => setIsMediaSelectorOpen(false)}
          onSelect={handleMediaSelected}
          allowedType={mediaSelectTarget === 'image' ? 'image' : 'pdf'}
          selectedId={mediaSelectTarget === 'image' ? formFeaturedImage : formPdfUrl}
          activeBucketFilter={mediaSelectTarget === 'image' ? 'notices' : undefined}
          title={
            mediaSelectTarget === 'image' 
              ? 'Select Image from Board Repository' 
              : 'Select PDF Document Attachment'
          }
        />
      )}

      {/* Main Panel Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-orange-500 rounded-sm" />
            Active notice board cockpit
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Publish Bihar secondary circulars, holidays directives, examinations datesheets, and student scholarships announcements.
          </p>
        </div>

        {!isCreating && !editingId && (
          <button
            onClick={startCreate}
            id="create-notice-btn"
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Publish New Circular
          </button>
        )}
      </div>

      {/* Creation or editing screen split */}
      {isCreating || editingId ? (
        <form onSubmit={saveForm} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold uppercase tracking-wide text-orange-600">
              {isCreating ? 'Write and Dispatch Circular' : 'Modify Existing Circular Properties'}
            </h3>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditingId(null); }}
              className="p-1 px-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-650 hover:text-slate-800 rounded text-xs font-bold uppercase transition-colors"
            >
              Cancel Forms
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Columns 1 & 2: Text inputs */}
            <div className="lg:col-span-2 space-y-4">
              {/* Notice Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                  Notice / Circular Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Bihar Board Intermediate Science Registration Correction Schedule 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-505 text-slate-800 text-sm px-4 py-2.5 rounded-lg focus:outline-none font-medium"
                />
              </div>

              {/* Notice Short Summary */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                  Short Summary
                </label>
                <input
                  type="text"
                  placeholder="A one-sentence scannable excerpt for list summaries."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-505 text-slate-800 text-sm px-4 py-2.5 rounded-lg focus:outline-none font-medium"
                />
              </div>

              {/* Full Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                  Detailed Circular content
                </label>
                <textarea
                  rows={10}
                  placeholder="Draft deep circular content. Supporting lists, datesheets, contact desks, Room designations, parent approvals notices details."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-slate-50/65 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-505 text-slate-800 text-xs sm:text-sm px-4 py-3 rounded-lg focus:outline-none font-sans leading-relaxed font-medium"
                />
              </div>
            </div>

            {/* Sidebar Columns 3: Meta & attachments */}
            <div className="lg:col-span-1 space-y-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                  Category Type
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as NoticeCategory)}
                  className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 text-slate-700 text-xs px-3.5 py-2.5 rounded-lg font-medium"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Grouped Priority, Status */}
              <div className="grid grid-cols-2 gap-4 font-sans">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Priority Status
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as NoticePriority)}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 text-slate-700 text-xs px-2 py-2.5 rounded-lg font-medium"
                  >
                    {priorities.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Discourse status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as NoticeStatus)}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 text-slate-700 text-xs px-2 py-2.5 rounded-lg font-medium"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Publish Date Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                  Circular Dispatch Date
                </label>
                <input
                  type="date"
                  value={formPublishDate}
                  onChange={(e) => setFormPublishDate(e.target.value)}
                  className="w-full bg-slate-50/60 border border-slate-200 text-slate-700 text-xs px-3.5 py-2.5 rounded-lg focus:outline-none font-medium"
                />
              </div>

              {/* Flags controls checkboxes */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3.5">
                <span className="block text-[10px] text-slate-450 font-mono font-bold uppercase tracking-wider">Display Guidelines</span>
                
                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="accent-orange-550 accent-orange-500 w-4 h-4 rounded text-slate-800 border-none"
                  />
                  <span className="flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-orange-500" />
                    Pin Notice to Top
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formShowOnHomepage}
                    onChange={(e) => setFormShowOnHomepage(e.target.checked)}
                    className="accent-orange-550 accent-orange-500 w-4 h-4 rounded text-slate-800 border-none"
                  />
                  <span>Show On School Homepage</span>
                </label>
              </div>

              {/* Media Infrastructure Integrations - No Manual URL Paste constraint */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-4">
                <span className="block text-[10px] text-slate-450 font-mono font-bold uppercase tracking-wider">Media attachments desk</span>
                
                {/* Featured Image Selector */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 pb-1 font-sans">Featured Circular Banner Image</span>
                  {formFeaturedImage ? (
                    <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded shadow-2xs font-medium">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Check className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="text-[10px] text-slate-605 text-slate-600 truncate max-w-[150px]">{getMediaItemName(formFeaturedImage)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormFeaturedImage('')}
                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="Remove banner"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openMediaSelector('image')}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-orange-500" />
                      Select Featured Banner
                    </button>
                  )}
                </div>

                {/* PDF Attachment Selector */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 pb-1 font-sans">Official Document (PDF)</span>
                  {formPdfUrl ? (
                    <div className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded shadow-2xs font-medium">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-[10px] text-slate-650 text-slate-600 truncate max-w-[150px]">{getMediaItemName(formPdfUrl)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormPdfUrl('')}
                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="Remove PDF"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openMediaSelector('pdf')}
                      className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-orange-500" />
                      Select PDF Circular
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditingId(null); }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-bold uppercase transition cursor-pointer"
            >
              Cancel Forms
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-orange-500/10 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save and Broadcast
            </button>
          </div>
        </form>
      ) : (
        /* Notices Grid Listing Table inside Admin Panel */
        <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold uppercase text-slate-800 tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-4 bg-orange-500" />
              Circular dispatch log indexes ({notices.length})
            </h3>
            
            <div className="text-[10px] text-slate-450 font-mono font-bold uppercase">
              Drag & Sort Homepage module settings for reordering priority
            </div>
          </div>

          {notices.length === 0 ? (
            <div className="p-16 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-350 mx-auto mb-2 animate-pulse" />
              <p className="text-slate-650 text-sm font-bold">No active notices compiled</p>
              <p className="text-slate-500 text-xs mt-1 font-medium">Deploy your first circular to populate the bulletin board system.</p>
              <button
                onClick={startCreate}
                className="mt-4 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase rounded cursor-pointer shadow-md shadow-orange-500/10"
              >
                Create Notice
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto font-sans font-medium">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[9.5px]">
                    <th className="px-5 py-3 font-bold">Flags</th>
                    <th className="px-4 py-3 font-bold">Title & Summary</th>
                    <th className="px-4 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold">Priority</th>
                    <th className="px-4 py-3 font-bold">Publish Date</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notices.map((notice) => {
                    const isDraft = notice.status === 'Draft';
                    const isArchived = notice.status === 'Archived';
                    return (
                      <tr key={notice.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Flags indicators */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {notice.is_pinned ? (
                              <span className="p-1 bg-orange-50 text-orange-500 border border-orange-100 rounded" title="Pinned to top">
                                <Pin className="w-3.5 h-3.5 transform rotate-45 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span className="w-5.5" />
                            )}
                            
                            {notice.show_on_homepage ? (
                              <span className="p-1 bg-sky-50 text-sky-600 border border-sky-100 rounded" title="Visible on Home">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="p-1 bg-slate-100 text-slate-500 rounded" title="Hidden from Home">
                                <EyeOff className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {(notice.pdf_url) ? (
                              <span className="p-1 bg-red-50 text-red-630 text-red-600 border border-red-100 rounded" title="PDF enclosure attached">
                                <Paperclip className="w-3.5 h-3.5" />
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Title Info */}
                        <td className="px-4 py-4 max-w-xs sm:max-w-md">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 truncate leading-relaxed">{notice.title}</span>
                            <span className="text-slate-450 text-[10px] sm:text-xs truncate">{notice.summary || 'No summary excerpt compiled.'}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-orange-50 text-[10px] text-orange-655 text-orange-600 rounded font-bold border border-orange-100 uppercase tracking-wider">
                            {notice.category}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-4 whitespace-nowrap font-sans font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            notice.priority === 'Critical' 
                              ? 'bg-rose-50 border border-rose-150 text-rose-555 text-rose-600' 
                              : notice.priority === 'High' 
                              ? 'bg-orange-50 border border-orange-150 text-orange-605 text-orange-600' 
                              : 'bg-slate-50 text-slate-500 border border-slate-150'
                          }`}>
                            {notice.priority}
                          </span>
                        </td>

                        {/* Publish Date */}
                        <td className="px-4 py-4 whitespace-nowrap font-mono text-[10px] text-slate-500 font-bold">
                          {notice.publish_date}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap font-bold">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                            isDraft 
                              ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                              : isArchived 
                              ? 'bg-red-50 text-red-600 border border-red-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {notice.status}
                          </span>
                        </td>

                        {/* Actions Desk */}
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(notice)}
                              className="p-1 px-2.5 bg-slate-50 hover:bg-orange-500 border border-slate-150 hover:border-orange-500 text-slate-600 hover:text-white rounded text-[10px] font-bold uppercase transition cursor-pointer"
                              title="Edit Circular"
                            >
                              <Edit className="w-3 h-3 inline mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(notice.id)}
                              className="p-1 bg-slate-50 hover:bg-red-600 border border-slate-150 text-slate-600 hover:text-white rounded cursor-pointer transition"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in duration-200" id="delete-notice-confirm-overlay">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-sm w-full space-y-4 shadow-xl text-left">
            <div className="flex items-center gap-3 text-red-650">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-sans text-slate-800">Clear Circular Notice</h3>
            </div>
            <p className="text-slate-650 text-xs font-sans leading-relaxed">
              Are you sure you want to delete this notice permanently? This dynamic entry will be scrubbed from the local registry and can never be retrieved.
            </p>
            <div className="flex justify-end gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  dbService.deleteNotice(confirmDeleteId);
                  refreshNoticesList();
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wide rounded-lg cursor-pointer transition-colors"
                id="notice-delete-confirm-btn"
              >
                Yes, Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
