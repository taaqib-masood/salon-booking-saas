import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', hover = false, onClick }) => {
  const base = `
    rounded-2xl border border-gold/15
    bg-white/[0.04] backdrop-blur-md
    shadow-glass
    ${hover ? 'cursor-pointer' : ''}
    ${className}
  `;

  if (hover) {
    return (
      <motion.div
        className={base}
        whileHover={{ y: -4, boxShadow: '0 8px 40px rgba(212,175,55,0.25)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={onClick}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={base}>{onClick ? <div onClick={onClick}>{children}</div> : children}</div>;
};

export default GlassCard;
