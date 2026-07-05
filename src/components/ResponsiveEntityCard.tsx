/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export interface CardAction {
  label: string;
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success' | 'neutral';
}

export interface CardMetadata {
  label?: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface ResponsiveEntityCardProps {
  id: string;
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode[];
  metadata?: CardMetadata[];
  description?: React.ReactNode;
  actions: CardAction[];
  className?: string;
}

export const ResponsiveEntityCard: React.FC<ResponsiveEntityCardProps> = ({
  avatar,
  title,
  subtitle,
  badges = [],
  metadata = [],
  description,
  actions = [],
  className = '',
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Determine actions layout based on count
  const renderActions = () => {
    if (actions.length === 0) return null;

    if (actions.length <= 2) {
      // 1-2 actions: Display directly side-by-side
      return (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100/80">
          {actions.map((act, index) => {
            const variantClasses = 
              act.variant === 'danger'
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100'
                : act.variant === 'warning'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100'
                : act.variant === 'success'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200';

            return (
              <button
                key={index}
                onClick={act.onClick}
                title={act.title || act.label}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${variantClasses}`}
              >
                {act.icon}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      );
    } else {
      // 3 or more actions: Show first 2 directly or compress everything to a dropdown
      // Actually, standard says: "If there are: 3 or more actions - Compress into a three-dot overflow menu."
      return (
        <div className="flex justify-end mt-4 pt-3 border-t border-slate-100/80 relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition flex items-center gap-1.5 border border-slate-150 text-xs font-bold uppercase tracking-wide cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
            <span>Options</span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {actions.map((act, index) => {
                const hoverClass =
                  act.variant === 'danger'
                    ? 'hover:bg-rose-50 text-rose-600'
                    : act.variant === 'warning'
                    ? 'hover:bg-amber-50 text-amber-700'
                    : act.variant === 'success'
                    ? 'hover:bg-emerald-50 text-emerald-700'
                    : 'hover:bg-slate-50 text-slate-700';

                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      act.onClick(e);
                    }}
                    title={act.title || act.label}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs font-bold uppercase tracking-wider transition-colors ${hoverClass}`}
                  >
                    <span className="shrink-0">{act.icon}</span>
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`p-4 bg-white border border-slate-150 rounded-2xl shadow-3xs flex flex-col justify-between hover:border-slate-300 transition duration-300 ${className}`}>
      <div className="space-y-3">
        {/* Header containing avatar, title, subtitle & badges */}
        <div className="flex items-start gap-3">
          {avatar && (
            <div className="shrink-0">
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {badges.map((badge, idx) => (
                <div key={idx} className="shrink-0">{badge}</div>
              ))}
            </div>
            <h3 className="text-slate-900 font-extrabold text-sm sm:text-base leading-snug break-words">
              {title}
            </h3>
            {subtitle && (
              <div className="text-slate-400 text-[10px] uppercase font-mono font-bold tracking-wide mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Description/Summary if present */}
        {description && (
          <div className="text-slate-600 text-xs leading-relaxed font-sans font-medium line-clamp-3">
            {description}
          </div>
        )}

        {/* Metadata fields (e.g. key-values with icons) */}
        {metadata.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {metadata.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                {item.icon && <span className="text-slate-400 shrink-0">{item.icon}</span>}
                <div className="min-w-0 truncate">
                  {item.label && <span className="text-slate-400 font-medium mr-1">{item.label}:</span>}
                  <span className="text-slate-800 font-bold">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render the contextual action buttons */}
      {renderActions()}
    </div>
  );
};

interface SharedEmptyStateProps {
  icon: React.ReactNode;
  headline: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const SharedEmptyState: React.FC<SharedEmptyStateProps> = ({
  icon,
  headline,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
      <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 shadow-3xs mb-4">
        {icon}
      </div>
      <h3 className="text-slate-800 font-black text-sm uppercase tracking-wider mb-1.5">
        {headline}
      </h3>
      <p className="text-slate-500 text-xs font-medium max-w-sm leading-relaxed mb-5">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wide rounded-lg transition shadow-2xs cursor-pointer"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
