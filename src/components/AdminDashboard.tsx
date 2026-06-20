/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  Calendar, 
  Image as ImageIcon, 
  Layout, 
  Activity, 
  Save, 
  ShieldCheck, 
  HelpCircle, 
  ArrowUp, 
  ArrowDown, 
  LogOut, 
  Check, 
  ChevronUp, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical, 
  Eye, 
  EyeOff, 
  BookOpen, 
  GraduationCap, 
  Link2, 
  Award, 
  PhoneCall,
  ChevronDown,
  User,
  Clock
} from 'lucide-react';
import { SchoolSettings, HomepageModule, MediaItem, ModuleType, Faculty } from '../types';
import { dbService } from '../services/db';
import { MediaLibrary, MediaSelectorModal } from './MediaLibrary';
import { NoticeManagement } from './NoticeManagement';
import { CustomSchoolEmblem } from './CommonAssets';
import { AcademicAdmin } from './AcademicAdmin';
import { EventsAdmin } from './EventsAdmin';

interface AdminDashboardProps {
  onLogout: () => void;
  onSettingsChanged: () => void;
}

type AdminTab = 'overview' | 'settings' | 'modules' | 'notices' | 'media' | 'faculty' | 'academic' | 'events';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout,
  onSettingsChanged
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // School Settings bindings
  const [settings, setSettings] = useState<SchoolSettings>(() => dbService.getSchoolSettings());
  const [modules, setModules] = useState<HomepageModule[]>(() => dbService.getHomepageModules());

  // Media selector modals for School Settings Logo and Hero, or Module Banner
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'logo' | 'hero' | 'module-image' | 'card-item-image' | 'faculty-photo' | null>(null);

  // Homepage module edit/create state
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  
  // Module fields bindings
  const [formModuleType, setFormModuleType] = useState<ModuleType>('Hero Section');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formButtonText, setFormButtonText] = useState('');
  const [formButtonUrl, setFormButtonUrl] = useState('');
  const [formIsVisible, setFormIsVisible] = useState(true);

  // Custom Card/Item List state for modular elements
  const [formItems, setFormItems] = useState<any[]>([]);
  const [activeCardItemIdx, setActiveCardItemIdx] = useState<number | null>(null);

  // Drag and Drop ordering state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedOverIdx, setDraggedOverIdx] = useState<number | null>(null);

  // Faculty State Manager
  const [facultyList, setFacultyList] = useState<Faculty[]>(() => dbService.getFaculty());
  const [designations, setDesignations] = useState<string[]>(() => dbService.getFacultyDesignations());
  const [departments, setDepartments] = useState<string[]>(() => dbService.getFacultyDepartments());
  const [isEditingFaculty, setIsEditingFaculty] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  const [originalFacName, setOriginalFacName] = useState('');

  // Custom Modal Alerts and Confirmations to bypass iframe sandboxing blocks
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  const triggerAlert = (title: string, message: string) => {
    setAlertModal({
      isOpen: true,
      title,
      message
    });
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaveFeedback, setSettingsSaveFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Designation adding state
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  // Faculty form parameters
  const [facName, setFacName] = useState('');
  const [facPhoto, setFacPhoto] = useState('');
  const [facDesignation, setFacDesignation] = useState('');
  const [facDepartment, setFacDepartment] = useState(() => {
    const depts = dbService.getFacultyDepartments();
    return depts[0] || 'Science';
  });
  const [facSubject, setFacSubject] = useState('');
  const [facQualification, setFacQualification] = useState('');
  const [facExperience, setFacExperience] = useState('');
  const [facBio, setFacBio] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facPhone, setFacPhone] = useState('');
  const [facJoinedDate, setFacJoinedDate] = useState('');
  const [facRoomNumber, setFacRoomNumber] = useState('');
  const [facDisplayOrder, setFacDisplayOrder] = useState<number>(0);
  const [facIsActive, setFacIsActive] = useState(true);
  const [facFeatured, setFacFeatured] = useState(false);

  // Faculty table registry search and filters
  const [facSearchQuery, setFacSearchQuery] = useState('');
  const [facDeptFilter, setFacDeptFilter] = useState('ALL');
  const [facDesigFilter, setFacDesigFilter] = useState('ALL');

  const totalFacultyCount = facultyList.length;
  const teachersCount = facultyList.filter(f => f.designation.toLowerCase().includes('teacher')).length;
  const staffCount = facultyList.filter(f => !f.designation.toLowerCase().includes('teacher') && f.designation.toLowerCase() !== 'principal' && f.designation.toLowerCase() !== 'vice principal').length;
  const featuredFacultyCount = facultyList.filter(f => f.featured_homepage).length;

  const filteredFaculty = facultyList
    .filter(fac => {
      if (facSearchQuery.trim()) {
        const q = facSearchQuery.toLowerCase();
        const nameM = fac.name.toLowerCase().includes(q);
        const subjM = fac.subject.toLowerCase().includes(q);
        const emailM = fac.email?.toLowerCase().includes(q) || false;
        const qualM = fac.qualification.toLowerCase().includes(q);
        if (!nameM && !subjM && !emailM && !qualM) return false;
      }
      if (facDeptFilter !== 'ALL' && fac.department !== facDeptFilter) return false;
      if (facDesigFilter !== 'ALL' && fac.designation !== facDesigFilter) return false;
      return true;
    })
    .sort((a,b) => a.display_order - b.display_order);

  const stats = [
    { label: 'Active Notices', count: dbService.getNotices().length, icon: <Calendar className="w-4 h-4 text-orange-500" /> },
    { label: 'Active Events', count: dbService.getEvents().length, icon: <Calendar className="w-4 h-4 text-orange-600 font-bold" /> },
    { label: 'Ingested Media Files', count: dbService.getMediaItems().length, icon: <ImageIcon className="w-4 h-4 text-sky-500" /> },
    { label: 'Visible Grid Modules', count: modules.filter(m => m.is_visible).length, icon: <Layout className="w-4 h-4 text-emerald-500" /> },
    { label: 'Total Faculty', count: totalFacultyCount, icon: <GraduationCap className="w-4 h-4 text-purple-500" /> },
    { label: 'Active Class Routines', count: dbService.getRoutines().length, icon: <Clock className="w-4 h-4 text-orange-500" /> },
    { label: 'Exam Schedules', count: dbService.getExamSchedules().length, icon: <BookOpen className="w-4 h-4 text-sky-500" /> },
    { label: 'Calendar Events', count: dbService.getCalendarEvents().length, icon: <Calendar className="w-4 h-4 text-emerald-500" /> },
    { label: 'Featured Faculty', count: featuredFacultyCount, icon: <GraduationCap className="w-4 h-4 text-pink-500" /> }
  ];

  const getModuleIcon = (type: ModuleType) => {
    switch (type) {
      case 'Hero Section': return <ImageIcon className="w-5 h-5 text-orange-500" />;
      case 'About School': return <BookOpen className="w-5 h-5 text-sky-500" />;
      case 'Principal Message': return <GraduationCap className="w-5 h-5 text-purple-500" />;
      case 'Quick Links': return <Link2 className="w-5 h-5 text-emerald-500" />;
      case 'School Statistics': return <Activity className="w-5 h-5 text-rose-500" />;
      case 'Notice Feed': return <Calendar className="w-5 h-5 text-pink-500" />;
      case 'Important Links': return <Layers className="w-5 h-5 text-cyan-500" />;
      case 'Facilities': return <Layout className="w-5 h-5 text-indigo-500" />;
      case 'Achievements Preview': return <Award className="w-5 h-5 text-amber-500" />;
      case 'Events Preview': return <Calendar className="w-5 h-5 text-orange-600" />;
      case 'Gallery Preview': return <ImageIcon className="w-5 h-5 text-teal-500" />;
      case 'Academic Quick Links': return <GraduationCap className="w-5 h-5 text-amber-500" />;
      case 'Contact Information': return <PhoneCall className="w-5 h-5 text-slate-500" />;
      case 'Featured Faculty': return <GraduationCap className="w-5 h-5 text-rose-500" />;
      default: return <Layout className="w-5 h-5 text-slate-500" />;
    }
  };

  const moduleTypesList: ModuleType[] = [
    'Hero Section',
    'About School',
    'Principal Message',
    'Quick Links',
    'School Statistics',
    'Notice Feed',
    'Important Links',
    'Facilities',
    'Achievements Preview',
    'Events Preview',
    'Gallery Preview',
    'Academic Quick Links',
    'Contact Information',
    'Featured Faculty'
  ];

  // Save Settings actions
  const saveSchoolSettingsForm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSaveFeedback(null);
    
    // Simulate short network delay to display saving loading indicator beautifully
    setTimeout(() => {
      try {
        if (!settings.school_name.trim()) {
          throw new Error('School Affiliated Name cannot be empty.');
        }
        dbService.saveSchoolSettings(settings);
        setSettingsSaveFeedback({
          type: 'success',
          message: 'School profile settings saved successfully. Homepage visual assets and layouts synchronized.'
        });
        onSettingsChanged();
        
        // Auto clear success banner after 5.5 seconds
        setTimeout(() => {
          setSettingsSaveFeedback(prev => prev && prev.type === 'success' ? null : prev);
        }, 5500);
      } catch (err: any) {
        setSettingsSaveFeedback({
          type: 'error',
          message: err.message || 'Failed to sync school profile settings details properly.'
        });
      } finally {
        setIsSavingSettings(false);
      }
    }, 750);
  };

  // Launch media selector modal
  const launchSettingMediaSelector = (target: 'logo' | 'hero' | 'module-image' | 'card-item-image' | 'faculty-photo', cardIdx?: number) => {
    setMediaTarget(target);
    if (cardIdx !== undefined) {
      setActiveCardItemIdx(cardIdx);
    }
    setIsMediaModalOpen(true);
  };

  const handleMediaSelected = (item: MediaItem) => {
    if (mediaTarget === 'logo') {
      setSettings(prev => ({ ...prev, logo_url: item.file_url }));
    } else if (mediaTarget === 'hero') {
      setSettings(prev => ({ ...prev, hero_image_url: item.file_url }));
    } else if (mediaTarget === 'module-image') {
      setFormImageUrl(item.file_url);
    } else if (mediaTarget === 'faculty-photo') {
      setFacPhoto(item.file_url);
    } else if (mediaTarget === 'card-item-image' && activeCardItemIdx !== null) {
      const updated = [...formItems];
      updated[activeCardItemIdx] = { ...updated[activeCardItemIdx], image_url: item.file_url };
      setFormItems(updated);
      setActiveCardItemIdx(null);
    }
    setIsMediaModalOpen(false);
    setMediaTarget(null);
  };

  // Handle Drag & Drop operations
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIdx(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) {
      setDraggedIdx(null);
      setDraggedOverIdx(null);
      return;
    }

    const updated = [...modules];
    const item = updated[draggedIdx];
    updated.splice(draggedIdx, 1);
    updated.splice(index, 0, item);

    // Re-index display orders
    const reindexed = updated.map((mod, idx) => ({ ...mod, display_order: idx + 1 }));
    setModules(reindexed);
    dbService.saveHomepageModules(reindexed);
    onSettingsChanged();

    setDraggedIdx(null);
    setDraggedOverIdx(null);
  };

  // Shift module order manually
  const shiftModuleOrder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === modules.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...modules];

    // Swap indices
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Re-index display orders
    const reindexed = updated.map((mod, idx) => ({ ...mod, display_order: idx + 1 }));
    setModules(reindexed);
    dbService.saveHomepageModules(reindexed);
    onSettingsChanged();
  };

  // Hide or Show module
  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = modules.map(m => m.id === id ? { ...m, is_visible: !m.is_visible } : m);
    setModules(updated);
    dbService.saveHomepageModules(updated);
    onSettingsChanged();
  };

  // Delete module with confirmation
  const deleteModule = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerConfirm(
      'Delete Homepage Section',
      'Are you sure you want to permanently delete this homepage section? This removes it completely from live school portal layouts.',
      () => {
        dbService.deleteHomepageModule(id);
        const updated = dbService.getHomepageModules();
        setModules(updated);
        onSettingsChanged();
      }
    );
  };

  const isItemSupportingModule = (type: ModuleType) => {
    return [
      'Quick Links',
      'School Statistics',
      'Important Links',
      'Facilities',
      'Achievements Preview',
      'Events Preview',
      'Gallery Preview'
    ].includes(type);
  };

  const getDefaultItemsForModule = (type: ModuleType) => {
    switch (type) {
      case 'Quick Links':
        return [
          { title: 'Science Department', description: 'BSEB Science stream focuses on mathematics, biological sciences, computational standards, and lab practices.', extra: 'GraduationCap' },
          { title: 'Commerce Streams', description: 'Commerce track offers advanced practices in double-entry accountancy structures and local entrepreneurial methods.', extra: 'BookOpen' },
          { title: 'Arts Departments', description: 'Arts and humanities modules specialized in state political frameworks, history logs, and sociological standards.', extra: 'HelpCircle' }
        ];
      case 'School Statistics':
        return [
          { title: 'Enrollments', description: '1,200+' },
          { title: 'Senior Faculty', description: '36+' },
          { title: 'BSEB Pass Rate', description: '98.4%' },
          { title: 'Bihar Legacy', description: '50+ Yrs' }
        ];
      case 'Important Links':
        return [
          { title: 'BSEB Patna Official Portal', description: 'Verify online testing registration dates and board updates', extra: 'https://secondary.biharboardonline.com/' },
          { title: 'MNSSBY Bihar Student Welfare', description: 'Apply for student credit cards and direct welfare grants', extra: 'https://www.7nishchay-yuvaupaj.bihar.gov.in/' }
        ];
      case 'Facilities':
        return [
          { title: 'State Science Labs', description: 'Equipped with physics boards, salt testing setups, chemistry reagents and biology charts.', extra: 'Layout' },
          { title: 'Advanced ICT Center', description: 'Computers paired with high-speed intranets to compile matriculation registration details safely.', extra: 'Activity' },
          { title: 'Reading Library Block', description: 'Holds reference sheets, state textbook indices and historical political journals.', extra: 'BookOpen' }
        ];
      case 'Achievements Preview':
        return [
          { title: 'State Board Merit Grants', description: 'Trained state rankers under special coaching packages.', extra: 'Award' },
          { title: 'District Volleyball Shield', description: 'Championship trophy holders for secondary events.', extra: 'Award' }
        ];
      case 'Events Preview':
        return [
          { title: 'Class 12 Term Finals', description: 'Quarterly board descriptive assessment tests across commerce, sciences and humanities blocks.', extra: 'JUN 22' },
          { title: 'Awards Faciliation', description: 'Official certificate distribution ceremony for merit list students at Room 10B.', extra: 'JUN 28' }
        ];
      case 'Gallery Preview':
        return [
          { title: 'Vintage Grounds', description: 'Patna campus grounds representing traditional brick assemblies and playgrounds.', extra: '', image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400&auto=format&fit=crop' },
          { title: 'Science Fair', description: 'Showcasing chemical reactions, salt tests and biological diagrams.', extra: '', image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&auto=format&fit=crop' },
          { title: 'Central Library', description: 'Quiet research desk blocks stacked with state curriculum books.', extra: '', image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&auto=format&fit=crop' },
          { title: 'Athletic Assembly', description: 'Morning drill commands and annual sport competition matches.', extra: '', image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop' }
        ];
      default:
        return [];
    }
  };

  // Setup Create Form or Edit Form
  const initCreateModule = () => {
    setEditingModuleId(null);
    setFormModuleType('Hero Section');
    setFormTitle('');
    setFormSubtitle('');
    setFormDescription('');
    setFormImageUrl('');
    setFormButtonText('');
    setFormButtonUrl('');
    setFormIsVisible(true);
    setFormItems([]);
    setIsEditingModule(true);
  };

  const initEditModule = (mod: HomepageModule) => {
    setEditingModuleId(mod.id);
    setFormModuleType(mod.module_type);
    setFormTitle(mod.title);
    setFormSubtitle(mod.subtitle);
    setFormDescription(mod.description);
    setFormImageUrl(mod.image_url);
    setFormButtonText(mod.button_text);
    setFormButtonUrl(mod.button_url);
    setFormIsVisible(mod.is_visible);
    try {
      setFormItems(mod.items_json ? JSON.parse(mod.items_json) : getDefaultItemsForModule(mod.module_type));
    } catch (e) {
      setFormItems(getDefaultItemsForModule(mod.module_type));
    }
    setIsEditingModule(true);
  };

  // Save Module forms
  const handleModuleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      module_type: formModuleType,
      title: formTitle,
      subtitle: formSubtitle,
      description: formDescription,
      image_url: formImageUrl,
      button_text: formButtonText,
      button_url: formButtonUrl,
      is_visible: formIsVisible,
      items_json: isItemSupportingModule(formModuleType) ? JSON.stringify(formItems) : '',
      display_order: editingModuleId 
        ? modules.find(m => m.id === editingModuleId)?.display_order ?? (modules.length + 1)
        : (modules.length + 1)
    };

    if (editingModuleId) {
      dbService.updateHomepageModule(editingModuleId, payload);
      triggerAlert('Module Workspace', 'Homepage Module updated successfully. Layout has been synchronized.');
    } else {
      dbService.createHomepageModule(payload);
      triggerAlert('Module Workspace', 'New Homepage Module has been created and published successfully.');
    }

    if (formModuleType === 'Principal Message') {
      const list = dbService.getFaculty();
      const principal = list.find(f => f.is_active && (f.designation.toLowerCase() === 'principal' || f.designation.toLowerCase().includes('principal')));
      if (principal) {
        dbService.updateFaculty(principal.id, {
          bio: formDescription,
          photo_url: formImageUrl || principal.photo_url
        });
      }
    }

    setIsEditingModule(false);
    setEditingModuleId(null);
    const updated = dbService.getHomepageModules();
    setModules(updated);
    onSettingsChanged();
  };

  // Faculty & Designation Category Actions
  const handleAddCategory = () => {
    if (!newDesignation.trim()) return;
    if (designations.includes(newDesignation.trim())) {
      triggerAlert('Designation Category', 'Designation category already exists in the selection system.');
      return;
    }
    const updated = [...designations, newDesignation.trim()];
    dbService.saveFacultyDesignations(updated);
    setDesignations(updated);
    setNewDesignation('');
  };

  const handleRemoveCategory = (cat: string) => {
    triggerConfirm(
      'Remove Designation',
      `Are you sure you want to remove the designation "${cat}"? Faculty members currently in this role will keep it, but this designation option will be deleted from the dropdown options list in the editor registry.`,
      () => {
        const updated = designations.filter(c => c !== cat);
        dbService.saveFacultyDesignations(updated);
        setDesignations(updated);
      }
    );
  };

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    if (departments.some(d => d.toLowerCase().trim() === newDepartment.toLowerCase().trim())) {
      triggerAlert('Faculty Department', 'Department profile selection already exists in the active register.');
      return;
    }
    const updated = [...departments, newDepartment.trim()];
    dbService.saveFacultyDepartments(updated);
    setDepartments(updated);
    setNewDepartment('');
  };

  const handleRemoveDepartment = (dept: string) => {
    triggerConfirm(
      'Remove Department',
      `Are you sure you want to remove the department "${dept}"? Faculty members currently in this department will keep it, but it will be removed from future selection options.`,
      () => {
        const updated = departments.filter(d => d !== dept);
        dbService.saveFacultyDepartments(updated);
        setDepartments(updated);
        if (facDepartment === dept) {
          setFacDepartment(updated[0] || 'General');
        }
      }
    );
  };

  const handleSwapOrderByIds = (idA: string, idB: string) => {
    const list = dbService.getFaculty();
    const itemA = list.find(f => f.id === idA);
    const itemB = list.find(f => f.id === idB);
    if (!itemA || !itemB) return;
    
    const orderA = itemA.display_order;
    const orderB = itemB.display_order;

    dbService.updateFaculty(idA, { display_order: orderB });
    dbService.updateFaculty(idB, { display_order: orderA });

    setFacultyList(dbService.getFaculty());
  };

  const handleToggleActive = (id: string, current: boolean) => {
    dbService.updateFaculty(id, { is_active: !current });
    setFacultyList(dbService.getFaculty());
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    dbService.updateFaculty(id, { featured_homepage: !current });
    setFacultyList(dbService.getFaculty());
  };

  const handleDeleteFaculty = (id: string, name: string) => {
    triggerConfirm(
      'Delete Faculty Profile',
      `Are you sure you want to permanently delete the profile of "${name}"? This operation is irreversible. Any active timetable classes currently scheduled for this teacher will still be visible in the schedules but will lose their clickable profile overlays.`,
      () => {
        dbService.deleteFaculty(id);
        setFacultyList(dbService.getFaculty());
      }
    );
  };

  const handleSaveFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facName.trim()) {
      triggerAlert('Validation Warning', 'Faculty Member Scholarly Name is required.');
      return;
    }

    const payload = {
      name: facName.trim(),
      photo_url: facPhoto.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop',
      designation: facDesignation || 'Teacher',
      department: facDepartment || 'Science',
      subject: facSubject.trim() || 'General Studies',
      qualification: facQualification.trim() || 'B.A. / B.Ed. Qualified',
      experience: facExperience.trim() || 'Experienced Educator',
      bio: facBio.trim() || 'Dedicated academic scholar committed to the intellectual and moral growth of students.',
      email: facEmail.trim() || undefined,
      phone: facPhone.trim() || undefined,
      joined_date: facJoinedDate.trim() || undefined,
      room_number: facRoomNumber.trim() || undefined,
      display_order: facDisplayOrder || (facultyList.length + 1),
      is_active: facIsActive,
      featured_homepage: facFeatured
    };

    if (editingFacultyId) {
      dbService.updateFaculty(editingFacultyId, payload);
      // Cascade name change to routine entries if name changed!
      if (originalFacName && originalFacName.trim().toLowerCase() !== payload.name.trim().toLowerCase()) {
        const oldN = originalFacName.trim();
        const newN = payload.name.trim();
        const entries = dbService.getRoutineEntries();
        const updatedEntries = entries.map(re => {
          if (re.teacher?.trim().toLowerCase() === oldN.toLowerCase()) {
            return { ...re, teacher: newN };
          }
          return re;
        });
        dbService.saveRoutineEntries(updatedEntries);
      }
    } else {
      dbService.createFaculty(payload);
    }

    if (payload.designation.toLowerCase() === 'principal' || payload.designation.toLowerCase().includes('principal')) {
      const homepageMods = dbService.getHomepageModules();
      const pmMod = homepageMods.find(m => m.module_type === 'Principal Message');
      if (pmMod) {
        dbService.updateHomepageModule(pmMod.id, {
          description: payload.bio,
          image_url: payload.photo_url || pmMod.image_url
        });
      }
    }

    setFacultyList(dbService.getFaculty());
    setIsEditingFaculty(false);
    setEditingFacultyId(null);
  };

  // Sidebar Tabs Config
  const sidebarTabs = [
    { id: 'overview', label: 'System Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'settings', label: 'School Profile Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic Desk Manager', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'modules', label: 'Homepage Modules', icon: <Layers className="w-4 h-4" /> },
    { id: 'faculty', label: 'Faculty & Staff', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'notices', label: 'Manage Notices', icon: <Calendar className="w-4 h-4" /> },
    { id: 'events', label: 'Events Management', icon: <Calendar className="w-4 h-4 text-orange-600" /> },
    { id: 'media', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="admin-workspace-grid">
      
      {/* Reusable selector model for school logo, hero cover, or module custom image */}
      {isMediaModalOpen && mediaTarget && (
        <MediaSelectorModal
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={handleMediaSelected}
          allowedType="image"
          selectedId={
            mediaTarget === 'logo' ? settings.logo_url : 
            mediaTarget === 'hero' ? settings.hero_image_url : 
            formImageUrl
          }
          activeBucketFilter={
            mediaTarget === 'logo' ? 'logos' : 
            mediaTarget === 'hero' ? 'hero-images' : 
            undefined
          }
          title={
            mediaTarget === 'logo' ? 'Select School Emblem/Logo' : 
            mediaTarget === 'hero' ? 'Select Cover Landing Banner' : 
            'Select Custom Module Image'
          }
        />
      )}

      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 border border-slate-100 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
              ADMIN CONTROL PANEL
            </h1>
            <p className="text-xs text-slate-505 text-slate-500 font-medium">Bihar Secondary Education Board Regulation Console</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 hover:bg-slate-100 hover:text-red-650 hover:text-red-600 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-lg border border-slate-200 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar (1 Col) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs">
            <span className="block text-[10px] uppercase font-mono font-bold text-slate-450 px-3 pb-3 border-b border-slate-100 mb-3 tracking-widest">
              WORKSPACE DOMAINS
            </span>
            <nav className="space-y-1">
              {sidebarTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`admin-tab-btn-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsEditingModule(false); // Close modules editor if tabs are shifted
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10' 
                        : 'text-slate-605 text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick System Stats */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-4">
            <span className="block text-[9px] uppercase font-mono font-bold text-slate-450 tracking-wider">Storage health & indexes</span>
            <div className="space-y-3 font-mono text-[11px]">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-600 bg-white p-2.5 rounded border border-slate-150 shadow-2xs">
                  <span className="flex items-center gap-1.5 font-sans font-bold text-slate-700 uppercase tracking-wide">
                    {stat.icon}
                    {stat.label}
                  </span>
                  <span className="font-bold text-orange-650 text-orange-600">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Workspace (3 Cols) */}
        <div className="lg:col-span-3 min-h-[500px]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6" id="domain-overview-pane">
              
              {/* Top Summary Banner */}
              <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-orange-50/20 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase font-mono font-bold text-orange-600 tracking-widest block mb-1">Bihar Secondary Education Compliance</span>
                  <style>{`
                    .custom-dashboard-gradient {
                      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    }
                  `}</style>
                  <h2 className="text-slate-900 text-xl sm:text-2xl font-extrabold tracking-tight">
                    Administrative Command Center
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed font-sans max-w-2xl font-medium">
                    Manage government regulatory notices, student class routines, academic examinations boards schedules, dynamic homepage layout orders, and campus events. Updates apply immediately.
                  </p>
                </div>
              </div>

              {/* Dynamic Metrics Cards */}
              {(() => {
                const notices = dbService.getNotices() || [];
                const events = dbService.getEvents() || [];
                const faculty = dbService.getFaculty() || [];
                const media = dbService.getMediaItems() || [];
                
                const publishedNotices = notices.filter(n => n.status === 'Published').length;
                const activeFaculty = faculty.filter(f => f.is_active).length;
                const publishedEvents = events.filter(e => e.status === 'Published').length;
                
                const totalMediaSize = media.reduce((acc, current) => acc + (current.size_kb || 0), 0);
                const mediaSizeFormatted = totalMediaSize > 1024 
                  ? `${(totalMediaSize / 1024).toFixed(1)} MB` 
                  : `${totalMediaSize} KB`;

                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-metric-bento">
                    
                    {/* CARD 1: Notices */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Circulars & Notices</span>
                        <div className="p-1.5 bg-pink-100/60 rounded-lg">
                          <BookOpen className="w-4 h-4 text-pink-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-sans">{notices.length}</span>
                        <span className="text-[10.5px] text-slate-450 font-sans mt-1 block">
                          <strong>{publishedNotices}</strong> official announcements
                        </span>
                      </div>
                    </div>

                    {/* CARD 2: Events */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Campus Events</span>
                        <div className="p-1.5 bg-orange-100/60 rounded-lg">
                          <Calendar className="w-4 h-4 text-orange-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-sans">{events.length}</span>
                        <span className="text-[10.5px] text-slate-450 font-sans mt-1 block">
                          <strong>{publishedEvents}</strong> published calendar slots
                        </span>
                      </div>
                    </div>

                    {/* CARD 3: Faculty */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Teachers Directory</span>
                        <div className="p-1.5 bg-teal-100/60 rounded-lg">
                          <GraduationCap className="w-4 h-4 text-teal-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-sans">{faculty.length}</span>
                        <span className="text-[10.5px] text-slate-450 font-sans mt-1 block">
                          <strong>{activeFaculty}</strong> educators registered
                        </span>
                      </div>
                    </div>

                    {/* CARD 4: Media */}
                    <div className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:shadow-xs transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Media Archives</span>
                        <div className="p-1.5 bg-amber-100/60 rounded-lg">
                          <ImageIcon className="w-4 h-4 text-amber-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="block text-2xl sm:text-3xl font-black text-slate-900 font-sans">{media.length}</span>
                        <span className="text-[10.5px] text-slate-450 font-sans mt-1 block">
                          Cumulative size: <strong className="text-slate-700">{mediaSizeFormatted}</strong>
                        </span>
                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* Two-Column Details Block */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* COLUMN 1: RECENT SYSTEM ACTIVITY LOG (3/5 width) */}
                <div className="lg:col-span-3 bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-900 text-xs font-mono font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-orange-500 rounded-sm" />
                      Audited Operations activity feed
                    </h3>

                    {(() => {
                      // Aggregate and sort transactions
                      const activities: Array<{
                        id: string;
                        type: string;
                        title: string;
                        detail: string;
                        date: string;
                        icon: 'Notice' | 'Event' | 'Faculty' | 'Media';
                      }> = [];

                      const noticesList = dbService.getNotices() || [];
                      noticesList.slice(0, 4).forEach(n => {
                        activities.push({
                          id: `notice_${n.id}`,
                          type: 'Notice Announcement',
                          title: n.title,
                          detail: `Priority: ${n.priority || 'Normal'} • Category: ${n.category || 'General'}`,
                          date: n.created_at || new Date().toISOString(),
                          icon: 'Notice'
                        });
                      });

                      const eventsList = dbService.getEvents() || [];
                      eventsList.slice(0, 4).forEach(e => {
                        const dateStr = typeof e.created_at === 'string' ? e.created_at : e.event_date;
                        activities.push({
                          id: `event_${e.id}`,
                          type: 'Event Calendar Scheduled',
                          title: e.title,
                          detail: `Slotted on ${e.event_date} @ ${e.venue || 'Main Highschool grounds'}`,
                          date: dateStr || new Date().toISOString(),
                          icon: 'Event'
                        });
                      });

                      const facultyList = dbService.getFaculty() || [];
                      facultyList.slice(0, 4).forEach(f => {
                        activities.push({
                          id: `fac_${f.id}`,
                          type: 'Academic Staff Recruited',
                          title: f.name,
                          detail: `${f.designation || 'Lecturer'} assigned to lead lessons in ${f.subject}`,
                          date: f.created_at || '2026-06-01T10:00:00Z',
                          icon: 'Faculty'
                        });
                      });

                      const mediaList = dbService.getMediaItems() || [];
                      mediaList.slice(0, 4).forEach(m => {
                        activities.push({
                          id: `media_${m.id}`,
                          type: 'Media Storage Upload',
                          title: m.file_name,
                          detail: `Categorized into bucket [${m.bucket}] size: ${m.size_kb} KB`,
                          date: m.uploaded_at || '2026-06-01T10:00:00Z',
                          icon: 'Media'
                        });
                      });

                      // Sort latest first
                      activities.sort((a, b) => b.date.localeCompare(a.date));
                      const topSix = activities.slice(0, 6);

                      if (topSix.length === 0) {
                        return (
                          <div className="py-8 text-center text-xs text-slate-400 font-mono">
                            No ledger transactions recorded yet.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {topSix.map(act => {
                            let iconEl = <Activity className="w-3.5 h-3.5 text-slate-500" />;
                            let badgeColor = "bg-slate-50 border-slate-150 text-slate-500";
                            if (act.icon === 'Notice') {
                              iconEl = <BookOpen className="w-3.5 h-3.5 text-pink-600" />;
                              badgeColor = "bg-pink-50 border-pink-100 text-pink-700";
                            } else if (act.icon === 'Event') {
                              iconEl = <Calendar className="w-3.5 h-3.5 text-orange-600" />;
                              badgeColor = "bg-orange-50 border-orange-100 text-orange-700";
                            } else if (act.icon === 'Faculty') {
                              iconEl = <GraduationCap className="w-3.5 h-3.5 text-teal-600" />;
                              badgeColor = "bg-teal-50 border-teal-100 text-teal-700";
                            } else if (act.icon === 'Media') {
                              iconEl = <ImageIcon className="w-3.5 h-3.5 text-amber-600" />;
                              badgeColor = "bg-amber-50 border-amber-100 text-amber-700";
                            }

                            const timeLabel = (() => {
                              try {
                                const actDate = new Date(act.date);
                                if (isNaN(actDate.getTime())) return 'Recently';
                                return actDate.toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              } catch {
                                return 'Recently';
                              }
                            })();

                            return (
                              <div key={act.id} className="flex gap-3 text-xs border-b border-dashed border-slate-100 pb-3 last:border-0 last:pb-0 font-sans">
                                <div className="mt-0.5 shrink-0">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center">
                                    {iconEl}
                                  </div>
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                                    <span className="font-extrabold text-slate-900 truncate pr-2">
                                      {act.title}
                                    </span>
                                    <span className="text-[9px] font-bold font-mono text-slate-400 whitespace-nowrap">
                                      {timeLabel}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 font-medium text-[11px] leading-relaxed truncate">
                                    {act.detail}
                                  </p>
                                  <span className={`inline-block border rounded text-[9px] font-extrabold px-1.5 py-0.2 tracking-wide uppercase ${badgeColor}`}>
                                    {act.type}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* COLUMN 2: REGULATION DATABASE CHECKLIST (2/5 width) */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Database Sub-entities counts */}
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-xs">
                    <h3 className="text-slate-900 text-xs font-mono font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-orange-500 rounded-sm" />
                      Academic database indices
                    </h3>

                    {(() => {
                      const routines = dbService.getRoutines() || [];
                      const routinesEntries = dbService.getRoutineEntries() || [];
                      const schedules = dbService.getExamSchedules() || [];
                      const milestoneCal = dbService.getCalendarEvents() || [];
                      const modules = dbService.getHomepageModules() || [];
                      const hiddenModulesCount = modules.filter(m => !m.is_visible).length;

                      return (
                        <div className="space-y-3 font-sans">
                          
                          {/* Item routines */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0" />
                              <span className="text-slate-650 text-xs font-bold leading-tight truncate">Class Timetables (Routines)</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {routines.length} ({routinesEntries.length} entries)
                            </span>
                          </div>

                          {/* Item exams */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                              <span className="text-slate-650 text-xs font-bold leading-tight truncate">Examinations Routines</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {schedules.length} periods
                            </span>
                          </div>

                          {/* Item milestones */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                              <span className="text-slate-650 text-xs font-bold leading-tight truncate">Holiday Calendar Milestones</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-605 text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {milestoneCal.length} dates
                            </span>
                          </div>

                          {/* Item homepage modules */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0" />
                              <span className="text-slate-650 text-xs font-bold leading-tight truncate">Active Page Layout Modules</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                              {modules.length - hiddenModulesCount} shown ({hiddenModulesCount} muted)
                            </span>
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                  {/* System Credentials Guidelines box */}
                  <div className="bg-orange-50/60 border border-orange-100 p-4.5 rounded-2xl flex items-start gap-3">
                    <HelpCircle className="w-4.5 h-4.5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold text-slate-650 font-sans leading-relaxed">
                      <span className="text-orange-600 font-bold block uppercase tracking-wide text-[10px] font-mono">BSEB Compliance Safe-keys</span>
                      <p className="text-[11px] text-slate-605 text-slate-500 mt-1">
                        Use the tabs to easily customize other areas like notice boards or image media vaults. Any modifications are securely persisting locally on this device's memory.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SCHOOL PROFILE SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={saveSchoolSettingsForm} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-6" id="school-settings-pane">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wide text-slate-900">
                    School Profile Settings
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Edit dynamic details displaying across footer blocks, headers, and landing cards.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* School Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    School Affiliated Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.school_name}
                    onChange={(e) => setSettings(prev => ({ ...prev, school_name: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-sm px-4 py-2.5 font-medium"
                  />
                </div>

                {/* School Motto */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    School Motto / Sanskrit Subhashita
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.school_motto}
                    onChange={(e) => setSettings(prev => ({ ...prev, school_motto: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-sm px-4 py-2.5 font-medium"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                  />
                </div>

                {/* Physical Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Physical Campus Landmark Address
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={settings.address}
                    onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 leading-relaxed font-sans font-medium"
                  />
                </div>

                {/* Footer Sub-Tagline */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Footer Sub-Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.footer_subtitle || ''}
                    placeholder="e.g., STATE INFRASTRUCTURE • SECTOR 3"
                    onChange={(e) => setSettings(prev => ({ ...prev, footer_subtitle: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                  />
                </div>

                {/* School Affiliation */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Government Affiliation Details
                  </label>
                  <input
                    type="text"
                    value={settings.school_affiliation || ''}
                    placeholder="e.g., Ministry of Education, State of Bihar Government Affiliate No: 10230501"
                    onChange={(e) => setSettings(prev => ({ ...prev, school_affiliation: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                  />
                </div>

                {/* Footer Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                    Footer Secondary Bios / Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.footer_description || ''}
                    placeholder="Detail describing the school profile within the page margins."
                    onChange={(e) => setSettings(prev => ({ ...prev, footer_description: e.target.value }))}
                    className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 leading-relaxed font-sans font-medium"
                  />
                </div>

                {/* HERO BANNER & MOVEMENT REGISTRY CODES */}
                <div className="md:col-span-2 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-3 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-orange-500 rounded-xs" />
                    Hero Landing Banner Overlays & Foundation Metadata
                  </h4>
                  <p className="text-xs text-slate-500 mb-4 font-normal leading-relaxed">
                    Configure the major text headings, badges, and verification registries displayed on top of the homepage hero banner cover.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hero Title */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-sans">
                        Hero Main Overlay Heading (Title)
                      </label>
                      <input
                        type="text"
                        value={settings.hero_title || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                      />
                    </div>

                    {/* Hero Subtitle */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-sans">
                        Hero Small Sub-Heading (Subtitle)
                      </label>
                      <input
                        type="text"
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                      />
                    </div>

                    {/* Hero Description */}
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-sans">
                        Hero Paragraph Description
                      </label>
                      <textarea
                        rows={2}
                        value={settings.hero_description || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_description: e.target.value }))}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 leading-relaxed font-sans font-medium"
                      />
                    </div>

                    {/* Hero Badge */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-sans">
                        Hero Top Affiliation Badge
                      </label>
                      <input
                        type="text"
                        value={settings.hero_badge_text || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_badge_text: e.target.value }))}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                      />
                    </div>

                    {/* ESTD Year */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-sans">
                        Establishment Label (e.g. ESTD. 1947)
                      </label>
                      <input
                        type="text"
                        value={settings.hero_estd_text || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_estd_text: e.target.value }))}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                      />
                    </div>

                    {/* DISE Code */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1 font-sans">
                        DISE Code (e.g. DISE: 10230501XXX)
                      </label>
                      <input
                        type="text"
                        value={settings.hero_dise_text || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_dise_text: e.target.value }))}
                        className="w-full bg-slate-50/60 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-xs sm:text-sm px-3.5 py-2.5 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Graphical Assets Choose parameters */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  
                  {/* Logo/Emblem Selection */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sans">School Emblem Seal</span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden bg-white shrink-0">
                        {settings.logo_url === 'school_logo_default' ? (
                          <CustomSchoolEmblem className="w-10 h-10" />
                        ) : (
                          <img src={settings.logo_url} alt="Emblem logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono truncate font-bold">
                          {settings.logo_url === 'school_logo_default' ? 'Affiliate Vector Fallback' : 'Custom Uploaded Emblem'}
                        </span>
                        <button
                          type="button"
                          onClick={() => launchSettingMediaSelector('logo')}
                          className="mt-1 px-3 py-1 bg-white hover:bg-slate-100 text-orange-600 text-[10.5px] font-bold uppercase rounded border border-orange-200 cursor-pointer transition-colors"
                        >
                          Choose Symbol
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hero banner Image Selection */}
                  <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                    <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sans">Homepage Cover Landing</span>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-12 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-white shrink-0">
                        {settings.hero_image_url === 'school_hero_default' ? (
                          <div className="text-[8px] font-mono font-bold text-slate-450 text-center uppercase">[Default Cover]</div>
                        ) : (
                          <img src={settings.hero_image_url} alt="Hero banner cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[10px] text-slate-500 font-mono truncate font-bold">
                          {settings.hero_image_url === 'school_hero_default' ? 'Academic Vector Wireframe' : 'Custom Cover Image'}
                        </span>
                        <button
                          type="button"
                          onClick={() => launchSettingMediaSelector('hero')}
                          className="mt-1 px-3 py-1 bg-white hover:bg-slate-100 text-orange-600 text-[10.5px] font-bold uppercase rounded border border-orange-200 cursor-pointer transition-colors"
                        >
                          Choose Cover
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Form submit footer */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                {settingsSaveFeedback && (
                  <div className={`p-4 rounded-xl flex items-start gap-2.5 border text-xs leading-relaxed font-semibold animate-in fade-in duration-200 ${
                    settingsSaveFeedback.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`} id="settings-save-feedback">
                    <span className="text-sm shrink-0 leading-none">
                      {settingsSaveFeedback.type === 'success' ? '✓' : '⚠'}
                    </span>
                    <div>
                      {settingsSaveFeedback.message}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end items-center gap-3">
                  {isSavingSettings && (
                    <span className="text-slate-500 font-mono text-[10px] font-bold uppercase animate-pulse">
                      Broadcasting changes...
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-lg cursor-pointer shadow-lg shadow-orange-500/10 transition-colors"
                    id="settings-save-submit"
                  >
                    {isSavingSettings ? (
                      <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent shrink-0" />
                    ) : (
                      <Save className="w-4 h-4 shrink-0" />
                    )}
                    {isSavingSettings ? 'Synchronizing...' : 'Save and Sync Profiles'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: DYNAMIC HOMEPAGE MODULE MANAGER */}
          {activeTab === 'modules' && (
            <div className="space-y-6" id="homepage-modules-pane">
              
              {/* Form to create/edit homepage module */}
              {isEditingModule ? (
                <form onSubmit={handleModuleFormSubmit} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in-60 duration-150">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-150">
                    <h3 className="text-base font-bold uppercase tracking-wide text-orange-600">
                      {editingModuleId ? 'Modify Layout Module' : 'Create Custom Homepage Module'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingModule(false)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 text-slate-650 hover:text-slate-800 rounded font-bold text-xs uppercase transition-colors"
                    >
                      Back to List
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Module Type selection list */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                        Module Template / Type
                      </label>
                      <select
                        value={formModuleType}
                        onChange={(e) => {
                          const newType = e.target.value as ModuleType;
                          setFormModuleType(newType);
                          if (isItemSupportingModule(newType)) {
                            setFormItems(getDefaultItemsForModule(newType));
                          } else {
                            setFormItems([]);
                          }
                        }}
                        className="w-full bg-slate-55 bg-slate-50 border border-slate-200 text-slate-850 text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-orange-500 font-medium"
                      >
                        {moduleTypesList.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-450 mt-1 font-sans">
                        Determines the custom visual style, widgets, and dynamic feeds rendered on the frontpage.
                      </p>
                    </div>

                    {formModuleType === 'Hero Section' && (
                      <div className="md:col-span-2 p-4 bg-orange-50 border border-orange-200/60 rounded-xl space-y-1 font-sans">
                        <span className="text-orange-700 font-bold block text-xs uppercase tracking-wide">Single Source of Truth</span>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                          The Hero section heading, subtitle, main description, and background cover are managed directly from the <span className="font-extrabold text-orange-600">School Profile Settings</span> tab. This prevents duplicate configuration conflicts.
                        </p>
                      </div>
                    )}

                    {/* Title */}
                    {formModuleType !== 'Hero Section' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                          Section Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Campus Academic Programs"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-sm px-4 py-2.5 font-medium"
                        />
                      </div>
                    )}

                    {/* Subtitle */}
                    {formModuleType !== 'Hero Section' && (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                          Section Subtitle / Small Badge
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., BSEB Streaming Core"
                          value={formSubtitle}
                          onChange={(e) => setFormSubtitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-sm px-4 py-2.5 font-medium"
                        />
                      </div>
                    )}

                    {/* Description */}
                    {formModuleType !== 'Hero Section' && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                          Introductory Description / Body Text
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Describe the highlight of this section beautifully..."
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-sm px-4 py-2.5 font-sans font-medium"
                        />
                      </div>
                    )}

                    {/* Image URL selection via Media Library */}
                    {formModuleType !== 'Hero Section' && (
                      <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                        <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sans">Section Image Banner</span>
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-16 rounded border border-slate-200 flex items-center justify-center overflow-hidden bg-white shrink-0">
                            {formImageUrl ? (
                              formImageUrl === 'school_hero_default' ? (
                                <div className="text-[8px] font-mono font-bold text-slate-400 text-center uppercase">[Hero Default]</div>
                              ) : (
                                <img src={formImageUrl} alt="Module banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              )
                            ) : (
                              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">[No Image]</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-[10px] text-slate-500 font-mono truncate font-bold">
                              {formImageUrl ? 'Library Resource Attached' : 'Unspecified URL (reverts to placeholder)'}
                            </span>
                            <div className="flex items-center gap-2 mt-1.5">
                              <button
                                type="button"
                                onClick={() => launchSettingMediaSelector('module-image')}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-orange-600 text-[10.5px] font-bold uppercase rounded border border-orange-200 cursor-pointer transition-colors shadow-2xs"
                              >
                                Choose from Vault
                              </button>
                              {formImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setFormImageUrl('')}
                                  className="px-3 py-1 bg-white hover:bg-slate-100 text-red-600 text-[10.5px] font-bold uppercase rounded border border-red-200 cursor-pointer transition-colors"
                                >
                                  Clear Image
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Button Text */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                        Button Label / Action Text
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Learn More"
                        value={formButtonText}
                        onChange={(e) => setFormButtonText(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg text-slate-800 text-sm px-4 py-2.5 font-medium"
                      />
                    </div>

                    {/* Button URL */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-sans">
                        Button Route Destination / External URL
                      </label>
                      <select
                        value={formButtonUrl}
                        onChange={(e) => setFormButtonUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-orange-500 font-medium"
                      >
                        <option value="">No Button Action</option>
                        <option value="notices">Internal Route: Announcements Portal</option>
                        <option value="about">Internal Route: About Campus Details</option>
                        <option value="admissions">Internal Route: Admissions Criteria and Cuts</option>
                        <option value="contact">Internal Route: Contact physical Helpdesk</option>
                        <option value="https://secondary.biharboardonline.com/">External Route: BSEB Patna Link</option>
                      </select>
                      <p className="text-[9.5px] text-slate-450 mt-1 font-sans">
                        Select internal templates, directories, or direct students to the parent Bihar Board portal safely.
                      </p>
                    </div>

                    {/* Visibility status */}
                    <div className="md:col-span-2 pt-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formIsVisible}
                          onChange={(e) => setFormIsVisible(e.target.checked)}
                          className="accent-orange-500 w-4 h-4 rounded text-slate-850"
                        />
                        <span>Enable Layout Visibility (Show Immediately on Homepage)</span>
                      </label>
                    </div>

                  </div>

                  {/* CARD ITEMS CONFIGURATION IF APPLICABLE */}
                  {isItemSupportingModule(formModuleType) && (
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <div className="border-b border-slate-200 pb-2.5 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <span className="block text-xs font-mono font-bold text-orange-600 uppercase tracking-widest">
                            Section Cards / Custom Items Configuration
                          </span>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            Customize titles, body text, icons/badges, or upload custom card photos for each card inside the <b>{formModuleType}</b> section.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formItems, { title: 'New Custom Card', description: 'Brief description.', extra: '' }];
                            setFormItems(updated);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-orange-600 border border-orange-200 rounded text-[10px] font-bold uppercase transition"
                        >
                          + Add Card
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {formItems.map((item, idx) => (
                          <div key={idx} className="p-4 bg-white border border-slate-150 rounded-xl space-y-3 shadow-3xs hover:border-orange-500/25 transition-all relative">
                            <button
                              type="button"
                              onClick={() => {
                                triggerConfirm(
                                  'Remove Card Item',
                                  'Are you sure you want to remove this card item from this collection? It will be deleted from your draft list.',
                                  () => {
                                    const updated = formItems.filter((_, i) => i !== idx);
                                    setFormItems(updated);
                                  }
                                );
                              }}
                              className="absolute top-3.5 right-3 px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-bold rounded"
                            >
                              Remove
                            </button>
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-mono font-bold">
                              {idx + 1}
                            </span>
                            
                            {/* Card Item Title */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                                Card Title
                              </label>
                              <input
                                type="text"
                                required
                                value={item.title || ''}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx] = { ...updated[idx], title: e.target.value };
                                  setFormItems(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-150 rounded px-2 py-1 text-xs text-slate-800 font-medium"
                              />
                            </div>

                            {/* Card Item Description */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                                Card Text / Description
                              </label>
                              <textarea
                                rows={2}
                                value={item.description || ''}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx] = { ...updated[idx], description: e.target.value };
                                  setFormItems(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-150 rounded px-2 py-1 text-xs text-slate-800 font-sans leading-relaxed font-semibold"
                              />
                            </div>

                            {/* Extra field (Badge, Date, Icon, or Link) */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                                {formModuleType === 'Quick Links' || formModuleType === 'Facilities' || formModuleType === 'Achievements Preview'
                                  ? 'Icon (GraduationCap, BookOpen, Activity, Layout, Award, HelpCircle, PhoneCall)' 
                                  : formModuleType === 'Important Links' 
                                  ? 'Destination URL / External Link'
                                  : formModuleType === 'Events Preview'
                                  ? 'Schedule Date (e.g., JUN 22)'
                                  : 'Param Badge Label'
                                }
                              </label>
                              <input
                                type="text"
                                value={item.extra || ''}
                                onChange={(e) => {
                                  const updated = [...formItems];
                                  updated[idx] = { ...updated[idx], extra: e.target.value };
                                  setFormItems(updated);
                                }}
                                className="w-full bg-slate-50 border border-slate-150 rounded px-2 py-1 text-xs text-slate-800 font-mono font-bold"
                              />
                            </div>

                            {/* Custom Card Picture (Optional) */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <div className="text-[10px] font-bold text-slate-400 font-sans uppercase">Card Image (e.g. Facilities or Gallery)</div>
                              <div className="flex items-center gap-2">
                                {item.image_url ? (
                                  <div className="w-8 h-8 rounded overflow-hidden shrink-0 border border-slate-200">
                                    <img src={item.image_url} alt="card photo" className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-slate-400 font-mono">[No Photo]</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => launchSettingMediaSelector('card-item-image', idx)}
                                  className="px-2 py-1 text-[9.5px] font-bold uppercase tracking-wide bg-orange-50 hover:bg-orange-100 text-orange-600 rounded border border-orange-100/50 cursor-pointer"
                                >
                                  Set Photo
                                </button>
                                {item.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...formItems];
                                      delete updated[idx].image_url;
                                      setFormItems(updated);
                                    }}
                                    className="px-1.5 py-1 text-[9px] font-bold uppercase text-red-600 hover:bg-red-50 rounded"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form Footer */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditingModule(false)}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-600 font-bold rounded-lg text-xs uppercase cursor-pointer"
                    >
                      Discard Form
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer shadow-lg shadow-orange-500/10 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      Save Layout Module
                    </button>
                  </div>
                </form>
              ) : (
                /* Primary Modules manager overview */
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-slate-900 text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                        <span className="w-2.5 h-6 bg-orange-500 rounded-sm" />
                        Homepage Module Grid Architect
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        Create multiple sections, customize badges, descriptions or toggle positions via Drag-and-Drop. Updates immediately.
                      </p>
                    </div>

                    <button
                      onClick={initCreateModule}
                      className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer transition-colors shadow-md shadow-orange-500/10"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      Add Custom Section
                    </button>
                  </div>

                  {/* Module cards template rendering list */}
                  <div className="space-y-4 pt-3" id="admin-module-list-root">
                    {modules.map((mod, index) => {
                      const isDraggedOver = draggedOverIdx === index;
                      return (
                        <div
                          key={mod.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={() => {
                            setDraggedIdx(null);
                            setDraggedOverIdx(null);
                          }}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-200 bg-white ${
                            isDraggedOver 
                              ? 'border-dashed border-orange-500 bg-orange-50/20' 
                              : mod.is_visible 
                              ? 'border-slate-150 hover:border-slate-205 hover:bg-slate-50/40 text-slate-850' 
                              : 'border-slate-100 bg-slate-50/40 text-slate-400'
                          }`}
                        >
                          {/* Left Drag handles / titles */}
                          <div className="flex items-center gap-3">
                            <div 
                              className="p-1 text-slate-450 hover:text-slate-700 cursor-grab active:cursor-grabbing hover:bg-slate-50 rounded"
                              title="Drag to change display layout height order"
                            >
                              <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>

                            <span className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center font-mono text-[10.5px] font-bold text-orange-600 shrink-0">
                              {index + 1}
                            </span>

                            <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-150 rounded-xl shrink-0">
                              {getModuleIcon(mod.module_type)}
                            </div>

                            <div className="flex flex-col leading-relaxed">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs uppercase tracking-wider ${mod.is_visible ? 'text-slate-850' : 'text-slate-400'}`}>
                                  {mod.title || `${mod.module_type} Segment`}
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm font-semibold tracking-wide uppercase border border-slate-150">
                                  {mod.module_type}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-450 font-medium truncate max-w-[250px] sm:max-w-md">
                                {mod.description || 'No specialized paragraph description details populated.'}
                              </span>
                            </div>
                          </div>

                          {/* Action Items */}
                          <div className="flex items-center justify-end gap-2.5">
                            {/* Up down sorting helpers */}
                            <div className="flex items-center bg-white border border-slate-200 rounded p-0.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => shiftModuleOrder(index, 'up')}
                                className="p-1 hover:bg-slate-100 disabled:opacity-20 rounded text-slate-450 cursor-pointer"
                                title="Move layout row Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === modules.length - 1}
                                onClick={() => shiftModuleOrder(index, 'down')}
                                className="p-1 hover:bg-slate-100 disabled:opacity-20 rounded text-slate-450 cursor-pointer"
                                title="Move layout row Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => initEditModule(mod)}
                              className="p-1 px-3.5 bg-slate-50 hover:bg-orange-500 border border-slate-150 hover:border-orange-500 text-slate-600 hover:text-white rounded text-[10.5px] font-bold uppercase transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 inline mr-1" />
                              Edit
                            </button>

                            {/* Visibility Mute / Expose Button */}
                            <button
                              type="button"
                              onClick={(e) => toggleVisibility(mod.id, e)}
                              className={`px-3 py-1 text-[9.5px] font-semibold uppercase rounded-lg border tracking-wider transition-all cursor-pointer ${
                                mod.is_visible 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50/80 shadow-2xs' 
                                  : 'bg-slate-100 border-slate-150 text-slate-450 hover:text-slate-650'
                              }`}
                            >
                              {mod.is_visible ? 'VISIBLE' : 'HIDDEN'}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => deleteModule(mod.id, e)}
                              className="p-1.5 bg-slate-50 hover:bg-red-600 hover:text-white border border-slate-150 hover:border-red-650 rounded cursor-pointer transition-colors"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl leading-relaxed text-[10.5px] text-slate-550 text-slate-500 font-sans font-medium mt-4">
                    <span className="font-bold text-orange-600 block uppercase mb-1 font-mono">Dnd / Drag instruction memo</span>
                    To rearrange page sequences, utilize the hand grab-handle <GripVertical className="inline w-3.5 h-3.5 text-slate-400 mx-0.5" /> on the left side to drag tiles directly up or down. Hidden blocks slide closed seamlessly without causing layout padding defects on mobile or desktop viewports.
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: NOTICES BOARD CRUD SYSTEM (MODULE 1) */}
          {activeTab === 'notices' && (
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs" id="notice-management-pane">
              <NoticeManagement />
            </div>
          )}

          {/* TAB 8: EVENTS MANAGEMENT (MODULE 4) */}
          {activeTab === 'events' && (
            <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs" id="events-management-pane">
              <EventsAdmin />
            </div>
          )}

          {/* TAB 5: REUSABLE MEDIA LIBRARY (MODULE 0.5) */}
          {activeTab === 'media' && (
            <div id="media-vault-pane">
              <MediaLibrary />
            </div>
          )}

          {/* TAB 6: FACULTY PROFILE DATABASE CRUD SYSTEM */}
          {activeTab === 'faculty' && (
            <div className="space-y-6" id="faculty-management-pane">
              {/* HEADER BLOCK */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-slate-900 text-base sm:text-lg font-bold uppercase tracking-wide">
                    Faculty & Staff Management Desk
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed font-sans font-medium">
                    Maintain the profile registry, configure categories, reorder indices, and showcase scholars dynamically.
                  </p>
                </div>
                {!isEditingFaculty && (
                  <button
                    onClick={() => {
                      setEditingFacultyId(null);
                      setFacName('');
                      setFacPhoto('');
                      setFacDesignation(designations[0] || 'Teacher');
                      setFacDepartment(departments[0] || 'Science');
                      setFacSubject('');
                      setFacQualification('');
                      setFacExperience('');
                      setFacBio('');
                      setFacEmail('');
                      setFacPhone('');
                      setFacJoinedDate('');
                      setFacRoomNumber('');
                      setFacDisplayOrder(facultyList.length + 1);
                      setFacIsActive(true);
                      setFacFeatured(false);
                      setIsEditingFaculty(true);
                    }}
                    className="px-4.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 transition cursor-pointer self-stretch sm:self-auto text-center justify-center font-sans font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add New Profile
                  </button>
                )}
              </div>

              {isEditingFaculty ? (
                /* PROFILE FORM */
                <form onSubmit={handleSaveFaculty} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600 font-mono">
                      {editingFacultyId ? 'Modify Faculty Member Profile' : 'Publish New Scholar Profile'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingFaculty(false)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 transition uppercase tracking-wider font-sans"
                    >
                      Cancel Profile Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-705 font-medium font-sans">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Faculty Name *</label>
                      <input
                        type="text"
                        required
                        value={facName}
                        onChange={(e) => setFacName(e.target.value)}
                        placeholder="e.g. Dr. Satya Dev Prasad"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-505 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Designation / Category */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Designation Category *</label>
                      <select
                        value={facDesignation}
                        onChange={(e) => setFacDesignation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-semibold text-slate-700"
                      >
                        {designations.map(desig => (
                          <option key={desig} value={desig}>{desig}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Department *</label>
                      <select
                        value={facDepartment}
                        onChange={(e) => setFacDepartment(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-semibold text-slate-700"
                      >
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Specialty */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Subject Specialty (Optional)</label>
                      <input
                        type="text"
                        value={facSubject}
                        onChange={(e) => setFacSubject(e.target.value)}
                        placeholder="e.g. Pure Geophysics, Advanced Sanskrit, Accounting standards"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Qualification */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Qualification Credentials (Optional)</label>
                      <input
                        type="text"
                        value={facQualification}
                        onChange={(e) => setFacQualification(e.target.value)}
                        placeholder="e.g. M.Sc (Dublin Institute), B.Ed (Patna University)"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Experience */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Teaching Experience (Optional)</label>
                      <input
                        type="text"
                        value={facExperience}
                        onChange={(e) => setFacExperience(e.target.value)}
                        placeholder="e.g. 15+ years lecturing at State Level Academies"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={facEmail}
                        onChange={(e) => setFacEmail(e.target.value)}
                        placeholder="e.g. professor.patna@gmail.com"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Phone Desk (Optional)</label>
                      <input
                        type="text"
                        value={facPhone}
                        onChange={(e) => setFacPhone(e.target.value)}
                        placeholder="e.g. +91 9988776655"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Joined Year/Date */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Joined Year / Service Start (Optional)</label>
                      <input
                        type="text"
                        value={facJoinedDate}
                        onChange={(e) => setFacJoinedDate(e.target.value)}
                        placeholder="e.g. 2018, July 2021"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Room / Office Number */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Office Room / Desk Location (Optional)</label>
                      <input
                        type="text"
                        value={facRoomNumber}
                        onChange={(e) => setFacRoomNumber(e.target.value)}
                        placeholder="e.g. Room 12, Science Lab block"
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Display Order */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Display Priority Order *</label>
                      <input
                        type="number"
                        required
                        value={facDisplayOrder}
                        onChange={(e) => setFacDisplayOrder(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-medium text-slate-800"
                      />
                    </div>

                    {/* Photo Picker linked directly to Media selector */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Profile Photo URL (or select from Media Library)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={facPhoto}
                          onChange={(e) => setFacPhoto(e.target.value)}
                          placeholder="Select from Media Library or paste any custom image URL..."
                          className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-2.5 font-mono text-[10px] text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => launchSettingMediaSelector('faculty-photo')}
                          className="px-3.5 py-2.5 bg-sky-900 border border-sky-950 font-bold hover:bg-sky-950 text-white rounded-lg text-[10px] uppercase tracking-wider cursor-pointer shrink-0 font-sans"
                        >
                          Select Photo
                        </button>
                      </div>
                      {facPhoto && (
                        <div className="pt-2 flex items-center gap-3">
                          <img src={facPhoto} alt="Selected preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm" referrerPolicy="no-referrer" />
                          <button type="button" onClick={() => setFacPhoto('')} className="text-rose-600 hover:text-rose-700 font-extrabold text-[10px] uppercase font-mono tracking-wider">Remove selected</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Biography Area */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold font-sans">Academic Biography & Advisory Message (Optional)</label>
                    <textarea
                      rows={4}
                      value={facBio}
                      onChange={(e) => setFacBio(e.target.value)}
                      placeholder="e.g. Write a brief professional biography summarizing their academic research papers, Bihar heritage, or advisory message desks."
                      className="w-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-lg p-3 text-xs sm:text-sm font-medium text-slate-800 font-sans"
                    />
                  </div>

                  {/* Visibility & Homepage Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100/50 p-3 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={facIsActive}
                        onChange={(e) => setFacIsActive(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-slate-300"
                      />
                      <div className="text-xs">
                        <span className="text-slate-800 block font-bold">Publish Active Status</span>
                        <span className="text-slate-500 block text-[10px] leading-tight mt-0.5 font-medium">Toggle whether profile renders publicly on lists.</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:bg-slate-100/50 p-3 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={facFeatured}
                        onChange={(e) => setFacFeatured(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-slate-300"
                      />
                      <div className="text-xs">
                        <span className="text-slate-800 block font-bold font-sans">Highlight Featured On Homepage</span>
                        <span className="text-slate-500 block text-[10px] leading-tight mt-0.5 font-medium">Feature profile selectively in the home section.</span>
                      </div>
                    </label>
                  </div>

                  {/* Submit / Cancel Buttons */}
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 -mx-6 -mb-6 flex justify-end gap-3 rounded-b-2xl">
                    <button
                      type="button"
                      onClick={() => setIsEditingFaculty(false)}
                      className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer font-sans font-semibold"
                    >
                      Dismiss Form
                    </button>
                    <button
                      type="submit"
                      className="px-4.5 py-2.5 bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer font-sans"
                    >
                      <Save className="w-4 h-4" /> Save Profile Details
                    </button>
                  </div>
                </form>
              ) : (
                /* PROFILE TABLE REGISTRY */
                <div className="space-y-6">
                  {/* DESIGNATION / CATEGORY & DEPARTMENT MANAGER GRIDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* DESIGNATION MANAGER */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-sm">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-orange-400 font-mono">
                          Create Custom Designation Categories
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5 font-sans leading-relaxed font-semibold">
                          Predefined categories exist by default. Admin can expand designations below recursively.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDesignation}
                          onChange={(e) => setNewDesignation(e.target.value)}
                          placeholder="e.g. Senior Lecturer, Guest Speaker"
                          className="bg-slate-800 border border-slate-700 focus:outline-none focus:border-orange-500 rounded-lg p-2 text-xs font-medium text-white placeholder-slate-550 flex-1 font-sans"
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold uppercase shrink-0 cursor-pointer font-sans"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {designations.map(cat => (
                          <div key={cat} className="flex items-center gap-1 bg-slate-850 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold hover:border-rose-500/30 transition-colors">
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCategory(cat)}
                              title={`Remove ${cat} category`}
                              className="text-rose-500 hover:text-rose-300 ml-1 cursor-pointer text-xs font-black transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DEPARTMENT MANAGER */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4 shadow-sm">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-sky-400 font-mono">
                          Manage Faculty Departments
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-0.5 font-sans leading-relaxed font-semibold">
                          Edit departments list. Add or delete options to modify dropdown items during profile publishing.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          placeholder="e.g. Science, Commerce, Arts"
                          className="bg-slate-800 border border-slate-700 focus:outline-none focus:border-sky-505 rounded-lg p-2 text-xs font-medium text-white placeholder-slate-550 flex-1 font-sans"
                        />
                        <button
                          type="button"
                          onClick={handleAddDepartment}
                          className="px-3.5 py-2 bg-sky-650 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold uppercase shrink-0 cursor-pointer font-sans"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {departments.map(dept => (
                          <div key={dept} className="flex items-center gap-1 bg-slate-850 bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-lg text-[9.5px] font-mono font-bold hover:border-rose-500/30 transition-colors">
                            <span>{dept}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDepartment(dept)}
                              title={`Remove ${dept} department`}
                              className="text-rose-500 hover:text-rose-300 ml-1 cursor-pointer text-xs font-black transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {facultyList.length > 0 ? (
                    <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                      {/* Search & Filter Strip */}
                      <div className="bg-slate-50 border-b border-slate-150 p-4 flex flex-col md:flex-row gap-3 items-center justify-between text-xs font-sans">
                        <div className="relative w-full md:w-72">
                          <span className="absolute inset-y-0 left-3 flex items-center pr-2 text-slate-450 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search by name, subject, qualification..."
                            value={facSearchQuery}
                            onChange={(e) => setFacSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-semibold text-xs shadow-none"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-mono text-[9.5px] uppercase font-bold">Dept:</span>
                            <select
                              value={facDeptFilter}
                              onChange={(e) => setFacDeptFilter(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold focus:outline-none focus:border-orange-500 cursor-pointer text-xs"
                            >
                              <option value="ALL">All Departments</option>
                              {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-mono text-[9.5px] uppercase font-bold">Category:</span>
                            <select
                              value={facDesigFilter}
                              onChange={(e) => setFacDesigFilter(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold focus:outline-none focus:border-orange-500 cursor-pointer text-xs"
                            >
                              <option value="ALL">All Designations</option>
                              {designations.map(desig => (
                                <option key={desig} value={desig}>{desig}</option>
                              ))}
                            </select>
                          </div>
                          {(facSearchQuery || facDeptFilter !== 'ALL' || facDesigFilter !== 'ALL') && (
                            <button
                              type="button"
                              onClick={() => {
                                setFacSearchQuery('');
                                setFacDeptFilter('ALL');
                                setFacDesigFilter('ALL');
                              }}
                              className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 rounded-lg font-bold text-[9.5px] uppercase tracking-wide cursor-pointer ml-1 animate-none"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
                              <th className="p-4 w-12 text-center">Order</th>
                              <th className="p-4">Staff Name</th>
                              <th className="p-4">Designation & Dept</th>
                              <th className="p-4">Subject</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-center">Featured</th>
                              <th className="p-4 text-right w-36">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-sans font-semibold text-slate-700">
                            {filteredFaculty.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 font-bold">
                                  No faculty members found matching your search presets.
                                </td>
                              </tr>
                            ) : (
                              filteredFaculty.map((fac, idx) => {
                                return (
                                  <tr key={fac.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-4 text-center font-mono">
                                      <div className="flex flex-col items-center gap-1 justify-center animate-none">
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={() => handleSwapOrderByIds(fac.id, filteredFaculty[idx - 1].id)}
                                          className="p-0.5 hover:text-orange-500 text-slate-400 disabled:opacity-20 cursor-pointer"
                                        >
                                          <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <span className="text-slate-800 font-bold">{fac.display_order}</span>
                                        <button
                                          type="button"
                                          disabled={idx === filteredFaculty.length - 1}
                                          onClick={() => handleSwapOrderByIds(fac.id, filteredFaculty[idx + 1].id)}
                                          className="p-0.5 hover:text-orange-500 text-slate-400 disabled:opacity-20 cursor-pointer"
                                        >
                                          <ChevronDown className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-150 shrink-0 relative bg-slate-50">
                                          {fac.photo_url ? (
                                            <img src={fac.photo_url} alt={fac.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-450">
                                              <User className="w-5 h-5" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="block text-slate-900 font-extrabold text-sm truncate">{fac.name}</span>
                                          <span className="block text-slate-400 text-[10px] uppercase font-mono font-bold truncate tracking-wide">{fac.qualification}</span>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4">
                                      <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-600 text-[9px] uppercase font-mono font-bold border border-orange-100 rounded leading-none">
                                        {fac.designation}
                                      </span>
                                      <span className="block text-slate-500 text-[10px] mt-0.5 font-sans font-semibold uppercase tracking-wide">{fac.department} Department</span>
                                      {(fac.joined_date || fac.room_number) && (
                                        <div className="flex flex-wrap gap-1 mt-1 text-[9.5px] font-mono font-bold uppercase tracking-wide text-gray-500">
                                          {fac.joined_date && <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-550">Since: {fac.joined_date}</span>}
                                          {fac.room_number && <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-550">Loc: {fac.room_number}</span>}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-4 truncate max-w-[150px] font-sans font-semibold text-slate-600">
                                      {fac.subject}
                                    </td>
                                    <td className="p-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleActive(fac.id, fac.is_active)}
                                        title={fac.is_active ? 'Hide Faculty Profile' : 'Show Faculty Profile'}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-mono font-bold border transition cursor-pointer ${
                                          fac.is_active 
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-110 border-emerald-100 hover:bg-emerald-100/50' 
                                            : 'text-slate-450 bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                                        }`}
                                      >
                                        {fac.is_active ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                                        {fac.is_active ? 'Active' : 'Hidden'}
                                      </button>
                                    </td>
                                    <td className="p-4 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleFeatured(fac.id, fac.featured_homepage)}
                                        title={fac.featured_homepage ? 'Unfeature Profile' : 'Feature Profile'}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-mono font-bold border transition cursor-pointer ${
                                          fac.featured_homepage 
                                            ? 'text-pink-700 bg-pink-50 border-pink-100 hover:bg-pink-100/50' 
                                            : 'text-slate-450 bg-slate-50 border-slate-150 hover:bg-slate-100/50'
                                        }`}
                                      >
                                        <Award className="w-3.5 h-3.5 text-pink-500" />
                                        {fac.featured_homepage ? 'Featured' : 'Regular'}
                                      </button>
                                    </td>
                                    <td className="p-4 text-right">
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingFacultyId(fac.id);
                                            setOriginalFacName(fac.name);
                                            setFacName(fac.name);
                                            setFacPhoto(fac.photo_url || '');
                                            setFacDesignation(fac.designation);
                                            setFacDepartment(fac.department);
                                            setFacSubject(fac.subject);
                                            setFacQualification(fac.qualification);
                                            setFacExperience(fac.experience);
                                            setFacBio(fac.bio || '');
                                            setFacEmail(fac.email || '');
                                            setFacPhone(fac.phone || '');
                                            setFacJoinedDate(fac.joined_date || '');
                                            setFacRoomNumber(fac.room_number || '');
                                            setFacDisplayOrder(fac.display_order);
                                            setFacIsActive(fac.is_active);
                                            setFacFeatured(fac.featured_homepage);
                                            setIsEditingFaculty(true);
                                          }}
                                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-150 hover:border-orange-500/30 text-slate-500 hover:text-orange-600 cursor-pointer transition-colors"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFaculty(fac.id, fac.name)}
                                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-150 hover:border-rose-500/30 text-slate-500 hover:text-rose-600 cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 rounded-2xl p-12 text-center max-w-sm mx-auto animate-none">
                      <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-slate-800 font-bold uppercase font-mono text-xs">Profiles Registry Blank</h4>
                      <p className="text-slate-500 text-xs mt-1 font-sans">Publish scholars to seed your directory page circulars.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: ACADEMIC MANAGEMENT DESK */}
          {activeTab === 'academic' && (
            <AcademicAdmin />
          )}

        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setConfirmModal(null)}
          />
          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-605 text-rose-600 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-900 text-sm font-bold uppercase font-mono tracking-wider">
                  {confirmModal.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed font-sans font-medium">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-705 text-slate-700 rounded-lg text-[10px] uppercase font-mono tracking-wider font-extrabold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] uppercase font-mono tracking-wider font-extrabold cursor-pointer transition shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertModal && alertModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setAlertModal(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-xl shrink-0">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-slate-900 text-sm font-bold uppercase font-mono tracking-wider">
                  {alertModal.title}
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed font-sans font-medium">
                  {alertModal.message}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] uppercase font-mono tracking-wider font-extrabold cursor-pointer transition shadow-xs"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
