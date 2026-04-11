import React from 'react';
import { motion } from 'framer-motion';

const GoldButton = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const styles = {
    primary: 'bg-gold-gradient text-midnight font-bold',
    outline: 'border border-gold text-gold bg-transparent hover:bg-gold/10',
    ghost: 'text-gold bg-transparent hover:bg-gold/10',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-2.5 rounded-xl text-sm tracking-wide transition-all
        ${styles[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
};

export default GoldButton;
