import React from 'react';
import { motion } from 'framer-motion';
import campusBanner from '../assets/campus_banner.png';

/**
 * HeroBanner — Premium institutional header banner with campus photo background.
 * Features: parallax-ready image, diagonal gradient overlay, animated grain texture,
 * and emerald accent line.
 */
const HeroBanner = ({
  title,
  subtitle,
  badge,
  height = '220px',
  animate = true,
  children,
}) => {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.7 } }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="hero-banner relative w-full overflow-hidden"
      style={{ minHeight: height }}
    >
      {/* ── Campus Photo ── */}
      <img
        src={campusBanner}
        alt="Campus du Lycée Technique Mohamed V"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        draggable={false}
        style={{ filter: 'saturate(1.1)' }}
      />

      {/* ── Multi-layer Overlay ── */}
      {/* Diagonal dark scrim for readability */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, rgba(15,23,42,0.70) 0%, rgba(30,27,75,0.55) 40%, rgba(12,26,20,0.72) 100%)',
        }}
      />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none animate-grain"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      {/* Emerald accent line at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-emerald-600/0 via-emerald-400/90 to-emerald-600/0" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-12" style={{ minHeight: height }}>

        {/* Optional badge pill */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', bounce: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-md text-white/90 text-[11px] font-black uppercase tracking-widest mb-5 shadow-lg shadow-black/10"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
            {badge}
          </motion.div>
        )}

        {/* Main title */}
        {title && (
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg leading-snug"
          >
            {title}
          </motion.h1>
        )}

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 text-base sm:text-lg md:text-xl font-semibold text-white/85 drop-shadow max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Slot for extra content */}
        {children}
      </div>
    </Wrapper>
  );
};

export default HeroBanner;
