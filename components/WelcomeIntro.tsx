import React, { useEffect, useState } from 'react';

interface WelcomeIntroProps {
  onComplete: () => void;
}

export const WelcomeIntro: React.FC<WelcomeIntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Sequence the animation
    const t1 = setTimeout(() => setStage(1), 500); // Lines appear
    const t2 = setTimeout(() => setStage(2), 1500); // Text appears
    const t3 = setTimeout(() => setStage(3), 3500); // Fade out
    const t4 = setTimeout(() => onComplete(), 4000); // Unmount

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  if (stage === 4) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-[#0B0F19] flex flex-col items-center justify-center transition-opacity duration-700 ${stage === 3 ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Animated Circuit Background Grid */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute w-full h-full bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(500px)_rotateX(60deg)] origin-top animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <div className={`transition-all duration-1000 transform ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-t-infra-accent border-r-transparent border-b-infra-purple border-l-transparent animate-spin-slow"></div>
            <div className="absolute inset-2 rounded-full border-2 border-r-infra-accent border-t-transparent border-l-infra-purple border-b-transparent animate-spin reverse duration-[3s]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
               </svg>
            </div>
          </div>
        </div>

        {/* Text Animation */}
        <div className={`text-center transition-all duration-1000 delay-300 ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-infra-accent to-infra-purple tracking-tighter mb-2">
            INFRASENSE AI
          </h1>
          <p className="text-slate-400 text-sm tracking-[0.3em] uppercase">
            Next Gen Hardware Validation
          </p>
        </div>
      </div>
    </div>
  );
};