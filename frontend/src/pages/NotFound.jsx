import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative overflow-hidden px-4">
      {/* Background Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="glass-card max-w-lg w-full p-10 md:p-14 text-center relative z-10"
      >
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-indigo-500 mb-6 drop-shadow-sm"
        >
          404
        </motion.div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
          Page introuvable
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 text-lg leading-relaxed">
          Il semble que vous ayez atterri sur une page qui n'existe pas ou qui a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => window.history.back()}
            className="btn btn-outline border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 px-6 group"
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>
          
          <Link to="/" className="btn btn-primary py-3.5 px-8 group">
            <Home size={18} className="mr-2" />
            Accueil
            <motion.div 
              className="absolute inset-0 bg-white/20"
              initial={{ x: '-100%', skewX: -15 }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
