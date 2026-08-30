import React from 'react';

// Standard ANSI / ISO Flowchart Shape SVG Component (Ultra-Modern Glass & Gradient Edition)
export const FlowchartShapeSvg = ({ shape, label = '', className = '', active = false }) => {
  const activeEffect = active ? 'ring-4 ring-amber-400 ring-offset-2 scale-105 transition-all duration-300 shadow-lg' : '';

  switch (shape) {
    case 'terminator':
      return (
        <svg viewBox="0 0 220 62" className={`w-full max-h-[70px] drop-shadow-sm filter hover:drop-shadow-md transition-all duration-200 ${activeEffect} ${className}`}>
          <defs>
            <linearGradient id="termGradModern" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="termHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="8" y="6" width="204" height="48" rx="24" ry="24" fill="url(#termGradModern)" stroke="#065f46" strokeWidth="2" />
          <rect x="12" y="8" width="196" height="20" rx="10" ry="10" fill="url(#termHighlight)" />
          <text x="110" y="36" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="13" fontFamily="Prompt, sans-serif" letterSpacing="0.3px">
            {label || 'Start / End (เริ่มต้น/จบ)'}
          </text>
        </svg>
      );

    case 'process':
      return (
        <svg viewBox="0 0 220 62" className={`w-full max-h-[70px] drop-shadow-sm filter hover:drop-shadow-md transition-all duration-200 ${activeEffect} ${className}`}>
          <defs>
            <linearGradient id="procGradModern" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="procHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="8" y="6" width="204" height="48" rx="10" ry="10" fill="url(#procGradModern)" stroke="#1e40af" strokeWidth="2" />
          <rect x="10" y="8" width="200" height="18" rx="6" ry="6" fill="url(#procHighlight)" />
          <text x="110" y="36" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="13" fontFamily="Prompt, sans-serif" letterSpacing="0.2px">
            {label || 'Process (คำนวณ / ปฏิบัติงาน)'}
          </text>
        </svg>
      );

    case 'inputOutput':
      return (
        <svg viewBox="0 0 220 62" className={`w-full max-h-[70px] drop-shadow-sm filter hover:drop-shadow-md transition-all duration-200 ${activeEffect} ${className}`}>
          <defs>
            <linearGradient id="ioGradModern" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <polygon points="32,6 212,6 188,54 8,54" fill="url(#ioGradModern)" stroke="#92400e" strokeWidth="2" strokeLinejoin="round" />
          <text x="110" y="35" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="12.5" fontFamily="Prompt, sans-serif" letterSpacing="0.2px">
            {label || 'Data (รับค่า / แสดงผล)'}
          </text>
        </svg>
      );

    case 'decision':
      return (
        <svg viewBox="0 0 220 72" className={`w-full max-h-[80px] drop-shadow-sm filter hover:drop-shadow-md transition-all duration-200 ${activeEffect} ${className}`}>
          <defs>
            <linearGradient id="decGradModern" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#3730a3" />
            </linearGradient>
          </defs>
          <polygon points="110,5 212,36 110,67 8,36" fill="url(#decGradModern)" stroke="#312e81" strokeWidth="2" strokeLinejoin="round" />
          <text x="110" y="40" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Decision (เงื่อนไขตัดสินใจ ?)'}
          </text>
        </svg>
      );

    case 'display':
      return (
        <svg viewBox="0 0 220 62" className={`w-full max-h-[70px] drop-shadow-sm filter hover:drop-shadow-md transition-all duration-200 ${activeEffect} ${className}`}>
          <defs>
            <linearGradient id="dispGradModern" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M 38 6 L 198 6 L 212 30 L 198 54 L 38 54 C 10 54 10 6 38 6 Z" fill="url(#dispGradModern)" stroke="#075985" strokeWidth="2" strokeLinejoin="round" />
          <text x="115" y="35" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="12" fontFamily="Prompt, sans-serif">
            {label || 'Display (แสดงผลจอภาพ)'}
          </text>
        </svg>
      );

    case 'connector':
      return (
        <svg viewBox="0 0 62 62" className={`w-12 h-12 drop-shadow-sm filter hover:drop-shadow-md transition-all duration-200 ${activeEffect} ${className}`}>
          <defs>
            <linearGradient id="connGradModern" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
          </defs>
          <circle cx="31" cy="31" r="26" fill="url(#connGradModern)" stroke="#881337" strokeWidth="2" />
          <text x="31" y="37" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="13" fontFamily="Prompt, sans-serif">
            {label || 'A'}
          </text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 220 62" className={`w-full max-h-[70px] drop-shadow-sm ${activeEffect} ${className}`}>
          <rect x="8" y="6" width="204" height="48" rx="8" ry="8" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
          <text x="110" y="35" textAnchor="middle" fill="#ffffff" fontWeight="700" fontSize="13" fontFamily="Prompt, sans-serif">
            {label || 'Process'}
          </text>
        </svg>
      );
  }
};

export default FlowchartShapeSvg;
