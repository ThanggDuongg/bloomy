import { motion } from 'motion/react';

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-gradient-to-b from-sky-deep to-sky-soft">
      <motion.div
        className="absolute top-10 left-0 text-6xl"
        animate={{ x: ['-10vw', '110vw'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute top-32 left-0 text-4xl"
        animate={{ x: ['-10vw', '110vw'] }}
        transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 5 }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute top-1/2 text-3xl"
        animate={{ x: ['-10vw', '110vw'], y: [0, -20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      >
        🦋
      </motion.div>
      <div className="absolute bottom-0 h-24 w-full bg-grass" />
    </div>
  );
}
