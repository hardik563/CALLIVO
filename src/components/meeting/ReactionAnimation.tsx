import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReactionAnimationProps {
  reaction?: {
    emoji: string;
    timestamp: number;
  };
}

export const ReactionAnimation: React.FC<ReactionAnimationProps> = ({ reaction }) => {
  return (
    <AnimatePresence>
      {reaction && (
        <motion.div
          key={reaction.timestamp}
          initial={{ opacity: 0, y: 10, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: -60,
            scale: [0.5, 1.4, 1.2, 0.8],
          }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center justify-center filter drop-shadow-lg"
        >
          <span className="text-3xl select-none">{reaction.emoji}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
