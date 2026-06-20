/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const CustomSchoolEmblem: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} text-amber-500 fill-none`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Golden/Bronze Dual Ring */}
      <circle cx="50" cy="50" r="46" className="stroke-amber-500 stroke-2" />
      <circle cx="50" cy="50" r="42" className="stroke-amber-600/40 stroke-[0.5]" />
      
      {/* Navy Blue circular shield background */}
      <circle cx="50" cy="50" r="41" className="fill-slate-900" />
      
      {/* Emblem Shield */}
      <path 
        d="M32 30 H68 V55 C68 67 50 78 50 78 C50 78 32 67 32 55 V30 Z" 
        className="fill-slate-800 stroke-amber-500/80 stroke-2" 
      />
      
      {/* Sun / Rays (Bihar Board Symbolization of enlightenment) */}
      <circle cx="50" cy="40" r="7" className="fill-amber-400 stroke-amber-500" />
      <path d="M50 28 V31M50 49 V52M38 40 H41M59 40 H62" className="stroke-amber-400 stroke-[1.5] stroke-linecap-round" />
      <path d="M42 32 L44 34M58 32 L56 34M42 48 L44 46M58 48 L56 46" className="stroke-amber-400 stroke-[1.5] stroke-linecap-round" />
      
      {/* Open Book (Saraswati / Wisdom) */}
      <path 
        d="M38 58 C44 56 50 59 50 59 C50 59 56 56 62 58 V47 C56 45 50 48 50 48 C50 48 44 45 38 47 V58 Z" 
        className="fill-slate-100 stroke-amber-500 stroke-[1.5]" 
      />
      <path d="M50 48 V59" className="stroke-amber-500 stroke-[1.5]" />
      
      {/* Bottom Bihar Flourish Banner */}
      <path d="M25 78 Q50 87 75 78 L72 84 Q50 91 28 84 Z" className="fill-amber-500 stroke-amber-600 stroke-[0.5]" />
      <text 
        x="50" 
        y="83" 
        textAnchor="middle" 
        className="font-sans font-bold select-none" 
        style={{ fontSize: '4.5px', fill: '#0a0f1d', letterSpacing: '0.5px' }}
      >
        GSSS BIHAR
      </text>
    </svg>
  );
};

export const CustomFallbackHero: React.FC<{ schoolName: string; schoolMotto: string }> = ({ schoolName, schoolMotto }) => {
  return (
    <div className="relative w-full h-[450px] overflow-hidden bg-slate-950 flex flex-col justify-center items-center px-4">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-70" />
      
      {/* Subtle Radial Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

      {/* Modern architectural wireframe/lines representation of school block */}
      <div className="absolute bottom-0 w-full max-w-4xl opacity-20 flex justify-between items-end h-40 pointer-events-none">
        <div className="w-[12%] h-full border-t border-r border-slate-700 bg-slate-900/40 relative">
          <div className="absolute inset-2 grid grid-cols-2 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-slate-700/60 rounded-[1px]" />
            ))}
          </div>
        </div>
        <div className="w-[20%] h-[120%] border-t border-x border-slate-700 bg-slate-900/40 relative">
          <div className="absolute inset-x-0 -top-5 h-5 flex justify-center">
            {/* Clock Tower spire */}
            <div className="w-1/3 h-full border-t border-x border-slate-700 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-slate-500" />
            </div>
          </div>
          <div className="absolute inset-4 grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-slate-700/60 rounded-[1px]" />
            ))}
          </div>
        </div>
        <div className="w-[45%] h-[80%] border-t border-slate-700 bg-slate-800/20 relative rounded-t flex items-center justify-center">
          <div className="w-2/3 h-1/2 border border-dashed border-slate-700/60 rounded flex items-center justify-center">
            <span className="text-[10px] text-slate-600 tracking-wider uppercase font-mono">Academic Portico Block</span>
          </div>
        </div>
        <div className="w-[15%] h-[110%] border-t border-l border-slate-700 bg-slate-900/40 relative">
          <div className="absolute inset-3 grid grid-cols-2 gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-slate-700/60 rounded-[1px]" />
            ))}
          </div>
        </div>
      </div>

      <div className="z-10 text-center max-w-3xl flex flex-col items-center">
        {/* Government Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-medium tracking-wide uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Department of Education, Govt. of Bihar
        </div>
        
        {/* School Name */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 line-clamp-2 px-2 uppercase leading-tight font-sans">
          {schoolName}
        </h1>
        
        {/* Mottos & Decorative lines */}
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent my-2" />
        <p className="text-amber-400 font-medium italic text-base sm:text-lg mb-6 tracking-wide drop-shadow-md">
          "{schoolMotto}"
        </p>

        {/* Dynamic decorative counters mimicking top secondary features */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">ESTD.</span>
            <span>1947</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">BOARD ACCREDITATION</span>
            <span>BSEB PATNA (CLASSES 9-12)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 font-bold">DISE CODE</span>
            <span>10230501XXX</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomPDFIcon: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${className} text-red-500 fill-current`} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 6c0-.55.45-1 1-1h1c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1h-1v2h1.5c.28 0 .5.22.5.5s-.22.5-.5.5h-2c-.28 0-.5-.22-.5-.5V9.5c0-.28.22-.5.5-.5zM15 15h-1.5V9h2c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1zm-6-2.5h-1.5V14H6.5c-.28 0-.5-.22-.5-.5V9.5c0-.28.22-.5.5-.5H9c.28 0 .5.22.5.5s-.22.5-.5.5H7.5v2.5H9c.28 0 .5.22.5.5s-.22.5-.5.5z" />
    </svg>
  );
};
