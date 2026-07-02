/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Trash2, RefreshCw, FileText, Check, Search, Filter, Image as ImageIcon, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { MediaItem, MediaBucket } from '../types';
import { dbService } from '../services/db';
import { supabaseDbService } from '../services/supabaseDb';
import { referenceService } from '../services/referenceService';
import { CustomPDFIcon, CustomSchoolEmblem } from './CommonAssets';

interface MediaLibraryProps {
  onSelect?: (item: MediaItem) => void; // Reusable selector mode callback
  selectedId?: string;
  allowedType?: 'image' | 'pdf' | 'all';
  activeBucketFilter?: MediaBucket;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelect,
  selectedId,
  allowedType = 'all',
  activeBucketFilter
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => dbService.getMediaItems());
  const [activeBucket, setActiveBucket] = useState<MediaBucket | 'all'>(activeBucketFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'pdf'>(
    allowedType === 'all' ? 'all' : allowedType
  );
  
  // Drag & drop / upload states
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadBucket, setUploadBucket] = useState<MediaBucket>(activeBucketFilter || 'notices');
  const [uploadError, setUploadError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replacingItemId, setReplacingItemId] = useState<string | null>(null);

  // Deferment and warning states for reference integrity & duplicate checks
  const [duplicateFilePending, setDuplicateFilePending] = useState<{ file: File; bucket: MediaBucket; duplicateItem: MediaItem } | null>(null);
  const [deleteRefPending, setDeleteRefPending] = useState<{ id: string; name: string; refs: any[] } | null>(null);

  const buckets: { value: MediaBucket | 'all'; label: string }[] = [
    { value: 'all', label: 'All Folders' },
    { value: 'logos', label: 'Logos (School Setting)' },
    { value: 'hero-images', label: 'Hero Banners' },
    { value: 'notices', label: 'Notice Board Assets' },
    { value: 'downloads', label: 'Downloads' },
    { value: 'gallery', label: 'Campus Gallery' },
    { value: 'faculty', label: 'Faculty Profiles' },
    { value: 'events', label: 'Event Media' },
    { value: 'achievements', label: 'Achievements Work' }
  ];

  // Refresh items list from storage
  const refreshMediaList = () => {
    setMediaItems(dbService.getMediaItems());
  };

  // Process and ingest file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      ingestFile(e.target.files[0], uploadBucket);
    }
  };

  const ingestFile = async (file: File, bucket: MediaBucket, bypassDuplicateCheck = false) => {
    setUploadError('');
    
    // Validations
    const mimeType = file.type;
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      setUploadError('Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    if (isImage && allowedType === 'pdf') {
      setUploadError('Only PDF files are allowed in this current field selection.');
      return;
    }

    if (isPdf && allowedType === 'image') {
      setUploadError('Only image files are allowed in this current field selection.');
      return;
    }

    // Limit sandbox client uploads to 10MB
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('File exceeds max 10MB size constraint for sandbox cloud uploads.');
      return;
    }

    const sizeKb = Math.round(file.size / 1024);
    const fileType = isImage ? 'image' : 'pdf';

    // Duplicate detection check
    if (!bypassDuplicateCheck) {
      const dupCheck = referenceService.detectDuplicate(file.name, sizeKb, fileType);
      if (dupCheck.isDuplicate && dupCheck.duplicateItem) {
        setDuplicateFilePending({
          file,
          bucket,
          duplicateItem: dupCheck.duplicateItem
        });
        return;
      }
    }

    try {
      setIsUploading(true);
      
      // 1. Upload file to Supabase storage bucket
      const { publicUrl } = await supabaseDbService.uploadMediaFile(file, bucket);
      
      // 2. Insert metadata row into Supabase
      const newMedia = await supabaseDbService.createMediaItem({
        file_name: file.name,
        bucket,
        file_url: publicUrl,
        file_type: fileType,
        size_kb: sizeKb
      });

      // 3. Update local cache
      dbService.saveMediaItemSingle(newMedia);
      
      refreshMediaList();

      // Trigger sync event
      window.dispatchEvent(new CustomEvent('gsss-data-synced'));
      
      // If of select mode, trigger auto-select
      if (onSelect) {
        onSelect(newMedia);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop actions
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      ingestFile(e.dataTransfer.files[0], uploadBucket);
    }
  };

  // Actual Deletion Operation
  const performActualDelete = async (id: string) => {
    const targetItem = mediaItems.find(item => item.id === id);
    if (!targetItem) return;

    try {
      setIsUploading(true);
      
      // 1. Delete storage file if it exists
      const filePath = supabaseDbService.getStoragePathFromUrl(targetItem.file_url);
      if (filePath) {
        await supabaseDbService.deleteMediaFile(filePath);
      }

      // 2. Delete metadata row from Supabase
      await supabaseDbService.deleteMediaItem(id);

      // 3. Delete from Local Cache
      dbService.deleteMediaItem(id);

      refreshMediaList();

      // 4. Trigger sync event
      window.dispatchEvent(new CustomEvent('gsss-data-synced'));
    } catch (err: any) {
      alert(`Delete failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Action
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetItem = mediaItems.find(item => item.id === id);
    if (!targetItem) return;

    // Check active references across other modules
    const refs = referenceService.findMediaReferences(targetItem.file_url);
    if (refs.length > 0) {
      setDeleteRefPending({
        id,
        name: targetItem.file_name,
        refs
      });
      return;
    }

    if (confirm('Are you sure you want to permanently delete this media asset?')) {
      performActualDelete(id);
    }
  };

  // Replace file action
  const handleReplaceClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUploading) return;
    setReplacingItemId(id);
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && replacingItemId) {
      const file = e.target.files[0];
      const targetItem = mediaItems.find(item => item.id === replacingItemId);
      if (!targetItem) return;

      const mimeType = file.type;
      const isImage = mimeType.startsWith('image/');
      const isPdf = mimeType === 'application/pdf';
      const expectedType = targetItem.file_type;

      if ((expectedType === 'image' && !isImage) || (expectedType === 'pdf' && !isPdf)) {
        alert(`Replacement error: You must replace this slot with a file of the same type (${expectedType.toUpperCase()})`);
        return;
      }

      // Size cap
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      try {
        setIsUploading(true);

        // 1. Delete old storage file if it exists
        const oldFilePath = supabaseDbService.getStoragePathFromUrl(targetItem.file_url);
        if (oldFilePath) {
          await supabaseDbService.deleteMediaFile(oldFilePath);
        }

        // 2. Upload new storage file
        const { publicUrl } = await supabaseDbService.uploadMediaFile(file, targetItem.bucket);

        // 3. Update Supabase metadata row
        const sizeKb = Math.round(file.size / 1024);
        const updatedItem = await supabaseDbService.updateMediaItem(replacingItemId, {
          file_url: publicUrl,
          size_kb: sizeKb,
          file_name: file.name
        });

        // 4. Update Local Cache
        dbService.saveMediaItemSingle(updatedItem);

        alert('File replaced successfully.');
        setReplacingItemId(null);
        refreshMediaList();

        // 5. Trigger sync event
        window.dispatchEvent(new CustomEvent('gsss-data-synced'));
      } catch (err: any) {
        alert(`Replace failed: ${err.message || err}`);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Filter and display items
  const filteredItems = mediaItems.filter(item => {
    const matchesBucket = activeBucket === 'all' ? true : item.bucket === activeBucket;
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === 'all' ? true : item.file_type === fileTypeFilter;
    
    // Match selector requirements if in a parent frame
    const matchesAllowedType = allowedType === 'all' ? true : item.file_type === allowedType;
    const matchesForcedBucket = activeBucketFilter ? item.bucket === activeBucketFilter : true;

    return matchesBucket && matchesSearch && matchesType && matchesAllowedType && matchesForcedBucket;
  });

  return (
    <div className="w-full bg-white border border-slate-150 rounded-xl overflow-hidden p-6 text-slate-750 text-slate-700" id="media-library-core">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-500" />
            Media Infrastructure Vault
          </h2>
          <p className="text-xs text-slate-550 text-slate-500 font-medium">
            Upload, preview, replace, or select assets for various school circulars and portals.
          </p>
        </div>
        
        {/* Compact quick-selection helper if selector callback is alive */}
        {onSelect && (
          <div className="px-3 py-1 bg-orange-50 border border-orange-100 text-orange-600 rounded text-xs font-bold uppercase animate-pulse">
            Active Selector Board
          </div>
        )}
      </div>

      {/* Grid of upload & filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upload panel (Col 1) */}
        <div className="lg:col-span-1 rounded-xl bg-slate-50 p-4 border border-slate-150 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase text-slate-800 mb-3 tracking-wide">
              Centralized Ingest Desk
            </h3>
            
            {/* Folder Destination selector */}
            {!activeBucketFilter ? (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 font-mono">
                  Target Media Folder
                </label>
                <select
                  value={uploadBucket}
                  onChange={(e) => setUploadBucket(e.target.value as MediaBucket)}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-xs px-3 py-2 rounded focus:outline-none focus:border-orange-500 font-medium"
                >
                  {buckets
                    .filter(b => b.value !== 'all')
                    .map(b => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="mb-4 py-2 px-3 bg-white border border-slate-200 rounded text-xs">
                <span className="text-slate-450 block pb-0.5 uppercase tracking-wide text-[10px] font-mono font-bold">Hardlocked Target Area</span>
                <span className="text-orange-600 font-bold">{buckets.find(b => b.value === activeBucketFilter)?.label}</span>
              </div>
            )}

            {/* Drag & Drop Canvas */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center relative min-h-[160px] ${
                isUploading ? 'border-orange-200 bg-slate-100/50 cursor-not-allowed' :
                isDragging 
                  ? 'border-orange-500 bg-orange-50/20 cursor-pointer' 
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 cursor-pointer'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center justify-center animate-pulse">
                  <RefreshCw className="w-8 h-8 text-orange-500 mb-2 animate-spin" />
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Uploading to Cloud...</p>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">Bypassing local Base64 cache</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-705 text-slate-755 text-slate-700">Drag & Drop Document Here</p>
                  <p className="text-[10px] text-slate-450 mt-1 font-medium">or Click to open your device browser profile</p>
                  <p className="text-[9px] text-slate-500 mt-2 font-medium">
                    Limits: Images (JPG/PNG/WEBP) or PDF documents up to 10MB.
                  </p>
                </>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={allowedType === 'image' ? 'image/*' : allowedType === 'pdf' ? 'application/pdf' : 'image/*,application/pdf'}
              className="hidden"
            />
            
            {/* For replace logic */}
            <input
              type="file"
              ref={replaceInputRef}
              onChange={handleReplaceFileChange}
              className="hidden"
            />

            {uploadError && (
              <div className="mt-3 p-2 bg-red-50 border border-red-105 border-red-100 text-red-600 text-xs rounded font-bold">
                {uploadError}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-150 text-[10px] text-slate-450 leading-relaxed font-sans font-medium">
            Files uploaded to this infrastructure remain persistently secured in local sandbox containers. Supports immediate selector referencing.
          </div>
        </div>

        {/* Search, Filter & Gallery panel (Col 2 & 3) */}
        <div className="lg:col-span-2 flex flex-col">
          {/* Filters controls */}
          <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl mb-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search text */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-450 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search file names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2 rounded focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              {/* Type toggle */}
              {allowedType === 'all' && (
                <div className="flex gap-1 bg-white p-0.5 rounded border border-slate-205">
                  {(['all', 'image', 'pdf'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFileTypeFilter(type)}
                      className={`px-3 py-1 text-xs font-bold rounded uppercase transition cursor-pointer ${
                        fileTypeFilter === type 
                          ? 'bg-orange-500 text-white font-bold' 
                          : 'text-slate-505 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Buckets horizontal scroll filter */}
            {!activeBucketFilter && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                {buckets.map(b => (
                  <button
                    key={b.value}
                    onClick={() => setActiveBucket(b.value)}
                    className={`px-3 py-1 rounded text-xs font-bold whitespace-nowrap border shrink-0 transition-all cursor-pointer ${
                      activeBucket === b.value
                        ? 'bg-orange-50 border-orange-200 text-orange-600 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-850 hover:border-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results view */}
          <div className="flex-1 bg-slate-50 border border-slate-150 rounded-xl p-4 min-h-[250px] max-h-[360px] overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center py-10 text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-slate-505 text-slate-500 text-sm font-bold">No assets found</p>
                <p className="text-slate-450 text-xs mt-1 font-medium">Try relaxing filters, change folder scopes, or upload the file.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="media-card-grid">
                {filteredItems.map((item) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelect?.(item)}
                      className={`relative group bg-white border rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'border-orange-500 shadow-md shadow-orange-500/5 ring-1 ring-orange-500' 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative w-full h-24 bg-slate-100 flex items-center justify-center p-2 border-b border-slate-155 border-slate-150">
                        {item.file_type === 'image' ? (
                          item.file_url === 'school_logo_default' ? (
                            <CustomSchoolEmblem className="w-14 h-14" />
                          ) : item.file_url === 'school_hero_default' ? (
                            <div className="w-full h-full bg-slate-200 rounded flex items-center justify-center text-[10px] font-mono text-slate-450 text-center font-bold">
                              [Campus Banner]
                            </div>
                          ) : (
                            <img
                              src={item.file_url}
                              alt={item.file_name}
                              className="max-w-full max-h-full object-contain filter group-hover:brightness-105 transition-all"
                              referrerPolicy="no-referrer"
                            />
                          )
                        ) : (
                          <CustomPDFIcon className="w-12 h-12" />
                        )}

                        {/* Top action badge hooks (Delete / Replace) */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity z-10">
                          <button
                            title="Replace File"
                            onClick={(e) => handleReplaceClick(item.id, e)}
                            className="p-1.5 bg-white/95 hover:bg-orange-500 rounded text-slate-600 hover:text-white border border-slate-200 transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            title="Delete File"
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 bg-white/95 hover:bg-red-650 bg-white/95 hover:bg-red-600 rounded text-slate-600 hover:text-white border border-slate-200 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Selection check Indicator if selected */}
                        {isSelected && (
                          <div className="absolute top-1 left-1 p-1 bg-orange-500 text-white rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}

                        <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-white/90 border border-slate-150 rounded text-[8.5px] uppercase font-mono tracking-wide text-orange-600 font-bold truncate max-w-[85%]">
                          {item.bucket}
                        </div>
                      </div>

                      {/* Info Panel */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-[10px] font-bold text-slate-800 truncate tracking-wide" title={item.file_name}>
                          {item.file_name}
                        </p>
                        <div className="flex justify-between items-center mt-1 text-[9px] text-slate-450 font-mono font-bold">
                          <span>{item.size_kb} KB</span>
                          <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Detection Alert Modal */}
      {duplicateFilePending && (
        <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 flex items-start gap-3 border-b border-slate-100 bg-amber-50/50">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wide">Duplicate Asset Detected</h3>
                <p className="text-slate-500 text-[10.5px] mt-0.5 font-medium">An identical asset already exists in the cloud system repository.</p>
              </div>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 space-y-2">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Incoming File</span>
                  <span className="font-bold text-slate-700 truncate block">{duplicateFilePending.file.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Size: {Math.round(duplicateFilePending.file.size / 1024)} KB</span>
                </div>
                <div className="border-t border-slate-200 pt-2">
                  <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Existing File Match</span>
                  <span className="font-bold text-slate-700 truncate block">{duplicateFilePending.duplicateItem.file_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Size: {duplicateFilePending.duplicateItem.size_kb} KB • Folder: {duplicateFilePending.duplicateItem.bucket}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                To conserve storage space and maintain integrity, you can choose to use the existing file reference or continue with the upload.
              </p>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  const existingItem = duplicateFilePending.duplicateItem;
                  setDuplicateFilePending(null);
                  if (onSelect) {
                    onSelect(existingItem);
                  }
                }}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-mono font-bold uppercase rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Use Existing
              </button>
              <button
                type="button"
                onClick={() => {
                  const f = duplicateFilePending.file;
                  const b = duplicateFilePending.bucket;
                  setDuplicateFilePending(null);
                  ingestFile(f, b, true); // bypass duplicate check
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-mono font-bold uppercase rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                Upload Again
              </button>
              <button
                type="button"
                onClick={() => setDuplicateFilePending(null)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-500 border border-slate-150 text-[11px] font-mono font-bold uppercase rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Reference Warning Modal */}
      {deleteRefPending && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="p-5 flex items-start gap-3 border-b border-slate-100 bg-rose-50/50">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-rose-800 uppercase tracking-wide">Safe Delete Intercept</h3>
                <p className="text-slate-500 text-[10.5px] mt-0.5 font-medium">This asset is actively referenced by other modules.</p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="text-[11px] text-slate-600 leading-normal">
                The file <span className="font-black text-slate-800 font-mono bg-slate-100 px-1 py-0.5 rounded">{deleteRefPending.name}</span> is currently used by these sections:
              </div>

              <div className="border border-rose-150 bg-rose-50/5 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {deleteRefPending.refs.map((ref, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold uppercase">{ref.module}</span>
                      <span className="text-slate-700 font-bold">{ref.recordName}</span>
                    </div>
                    <span className="text-slate-400 font-medium font-mono text-[9px]">{ref.fieldName}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-[10.5px] leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>WARNING:</strong> Deleting this asset will break rendering in the affected sections listed above. It is recommended to replace the media or update the referencing modules first.
                </span>
              </div>
              
              <div className="text-[11px] text-slate-500 font-semibold">
                Are you absolutely sure you want to proceed and permanently delete this asset?
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  const id = deleteRefPending.id;
                  setDeleteRefPending(null);
                  performActualDelete(id);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-mono font-bold uppercase rounded-lg shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Delete Anyway
              </button>
              <button
                type="button"
                onClick={() => setDeleteRefPending(null)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-bold uppercase rounded-lg cursor-pointer shadow-2xs"
              >
                Keep File (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable file selector component modal
interface MediaSelectorModalProps {
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  allowedType?: 'image' | 'pdf' | 'all';
  activeBucketFilter?: MediaBucket;
  selectedId?: string;
  title: string;
}

export const MediaSelectorModal: React.FC<MediaSelectorModalProps> = ({
  onClose,
  onSelect,
  allowedType = 'all',
  activeBucketFilter,
  selectedId,
  title
}) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 backdrop-blur-xs flex justify-center items-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-150 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h3 className="text-slate-900 text-base font-bold uppercase tracking-wide flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-orange-500" />
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-450 hover:text-slate-705 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Inner Media Library workspace */}
        <div className="p-6 max-h-[75vh] overflow-y-auto bg-slate-50">
          <MediaLibrary
            onSelect={(item) => {
              onSelect(item);
              onClose();
            }}
            selectedId={selectedId}
            allowedType={allowedType}
            activeBucketFilter={activeBucketFilter}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-right flex justify-between items-center">
          <span className="text-[10px] text-slate-450 font-mono font-bold">Select any tile, it will load file variables automatically.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold uppercase rounded-lg cursor-pointer transition-colors shadow-2xs"
          >
            Cancel Selection
          </button>
        </div>
      </div>
    </div>
  );
};
