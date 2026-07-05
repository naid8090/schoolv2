/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, PhoneCall, Award, Inbox } from 'lucide-react';
import { SchoolSettings } from '../types';
import { CustomFallbackHero } from './CommonAssets';

interface HeroProps {
  schoolSettings: SchoolSettings;
  onViewChange: (view: string) => void;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
}

export const Hero: React.FC<HeroProps> = ({ 
  schoolSettings, 
  onViewChange,
  title,
  subtitle,
  description,
  image_url,
  button_text,
  button_url
}) => {
  const activeTitle = title || schoolSettings.hero_title || schoolSettings.school_name;
  const activeSubtitle = subtitle || schoolSettings.hero_subtitle || schoolSettings.school_motto;
  const activeDescription = description || schoolSettings.hero_description || "A premier educational institute offering secondary coaching, moral guidance, and holistic academic development for boys and girls.";
  const activeImageUrl = image_url !== undefined ? image_url : schoolSettings.hero_image_url;
  
  const activeBadgeText = schoolSettings.hero_badge_text || "Government Senior Secondary Institution, Bihar";
  const activeEstdText = schoolSettings.hero_estd_text || "ESTD. 1947";
  const activeDiseText = schoolSettings.hero_dise_text || "DISE: 10230501XXX";
  
  // Track currently displayed image URL to enable seamless preloaded transition on change
  const [displayedImageUrl, setDisplayedImageUrl] = React.useState(activeImageUrl);

  React.useEffect(() => {
    // If the active URL is a default fallback or empty, switch immediately
    if (!activeImageUrl || activeImageUrl === 'school_hero_default') {
      setDisplayedImageUrl(activeImageUrl);
      return;
    }

    // If the active URL is already displayed, no action is needed
    if (activeImageUrl === displayedImageUrl) {
      return;
    }

    let active = true;
    const img = new Image();
    img.src = activeImageUrl;
    img.referrerPolicy = 'no-referrer';

    img.onload = () => {
      if (active) {
        setDisplayedImageUrl(activeImageUrl);
      }
    };

    img.onerror = () => {
      console.warn(`[Hero Image Preload Failed] Retaining current background: ${displayedImageUrl}`);
    };

    return () => {
      active = false;
    };
  }, [activeImageUrl, displayedImageUrl]);

  const isDefaultHero = !displayedImageUrl || displayedImageUrl === 'school_hero_default';

  if (isDefaultHero) {
    return (
      <section id="hero-section" className="w-full">
        <CustomFallbackHero 
          schoolName={activeTitle} 
          schoolMotto={activeSubtitle} 
        />
        {activeDescription && (
          <div className="max-w-3xl mx-auto text-center px-4 -mt-16 mb-8 relative z-20">
            <p className="text-slate-300 text-xs sm:text-sm bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur-xs leading-relaxed">
              {activeDescription}
            </p>
          </div>
        )}
        <HeroActionCards onViewChange={onViewChange} customText={button_text} customUrl={button_url} />
      </section>
    );
  }

  return (
    <section id="hero-section" className="relative w-full overflow-hidden bg-slate-950">
      {/* Background Image Container (Stretches with dynamic content height) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <img 
          src={displayedImageUrl} 
          alt="School Campus Banner"
          className="w-full h-full object-cover object-center scale-105 filter brightness-45 blur-[1px]"
          referrerPolicy="no-referrer"
        />
        {/* Navy Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/45 to-slate-950/60" />
      </div>

      {/* Content Layer (Uses minimal height & relaxed vertical paddings to prevent overlapping) */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-28 sm:px-6 lg:px-8 min-h-[460px] sm:min-h-[500px] flex flex-col justify-center items-center text-center">
        {/* Affiliate Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/15 text-orange-400 text-xs font-semibold tracking-wider uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          {activeBadgeText}
        </div>

        {/* School Name / Major Heading (leading-snug prevents layout overlaps) */}
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-4 uppercase leading-snug font-sans drop-shadow-md max-w-4xl">
          {activeTitle}
        </h1>

        {/* Motto Divider line */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent my-2" />
        <p className="text-orange-400 font-medium italic text-sm sm:text-base mb-4 tracking-wide drop-shadow-sm max-w-2xl">
          "{activeSubtitle}"
        </p>

        {activeDescription && (
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed px-4 mb-4">
            {activeDescription}
          </p>
        )}

        {/* Registration Index Strip */}
        <div className="mt-2 flex items-center justify-center gap-4 sm:gap-6 text-[10px] text-slate-400 font-mono flex-wrap">
          <span>{activeEstdText}</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span>{activeDiseText}</span>
        </div>
      </div>

      <HeroActionCards onViewChange={onViewChange} customText={button_text} customUrl={button_url} />
    </section>
  );
};

// Helper action panels displayed directly beneath the hero
const HeroActionCards: React.FC<{ 
  onViewChange: (view: string) => void;
  customText?: string;
  customUrl?: string;
}> = ({ onViewChange, customText, customUrl }) => {
  const cards = [
    {
      title: 'Active Notice Board',
      description: 'Review BSEB registration dates, holiday declarations, government circulars, and exam timetables.',
      buttonText: 'View Circulars',
      icon: <Calendar className="w-5 h-5 text-orange-600" />,
      onClick: () => onViewChange('notices'),
      id: 'hero-action-notices'
    },
    {
      title: 'Class 9-12 Admissions',
      description: 'Download brochures, view stream cutoff lists, eligibility credentials, and reservation quotas.',
      buttonText: 'View Guidelines',
      icon: <Award className="w-5 h-5 text-orange-600" />,
      onClick: () => onViewChange('admissions'),
      id: 'hero-action-admissions'
    },
    {
      title: customText || 'Connect With School',
      description: 'Official counters, direct query lines, physical addresses, and administrative contact links.',
      buttonText: customText || 'Get Contact Info',
      icon: <PhoneCall className="w-5 h-5 text-orange-600" />,
      onClick: () => {
        if (customUrl === 'notices' || customUrl === 'about' || customUrl === 'admissions' || customUrl === 'contact') {
          onViewChange(customUrl);
        } else if (customUrl && customUrl.startsWith('http')) {
          window.open(customUrl, '_blank', 'noreferrer');
        } else {
          onViewChange('contact');
        }
      },
      id: 'hero-action-contact'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 -mt-10 sm:-mt-12 mb-12 relative z-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-transparent">
        {cards.map((card) => (
          <div 
            key={card.id}
            id={card.id}
            className="flex flex-col justify-between bg-white border border-slate-100 hover:border-orange-500/20 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-4 border border-orange-100">
                {card.icon}
              </div>
              <h3 className="text-slate-900 text-base font-bold mb-2 uppercase tracking-wide">
                {card.title}
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-medium">
                {card.description}
              </p>
            </div>
            
            <button
              onClick={card.onClick}
              className="w-full py-2.5 bg-slate-50 border border-slate-200/60 hover:border-transparent hover:bg-orange-500 text-slate-705 hover:text-white text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer"
            >
              {card.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
