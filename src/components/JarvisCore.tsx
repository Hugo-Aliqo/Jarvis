import { motion } from 'motion/react';
import clsx from 'clsx';

export function JarvisCore({ isActive }: { isActive: boolean }) {
  // Speed multiplies when active
  const baseDuration = isActive ? 2 : 10;
  
  return (
    <div className="relative flex items-center justify-center pointer-events-none">
      {/* Outer Rings */}
      <div className="absolute w-[400px] h-[400px] border border-cyan-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
      <div className="absolute w-[360px] h-[360px] border border-cyan-500/20 border-dashed rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      
      {/* Orbiting Data Points */}
      <motion.div 
         animate={{ rotate: 360 }}
         transition={{ repeat: Infinity, duration: baseDuration * 1.5, ease: "linear" }}
         className="absolute w-[260px] h-[260px] border-l-2 border-cyan-400/50 rounded-full"
      />
      <motion.div 
         animate={{ rotate: -360 }}
         transition={{ repeat: Infinity, duration: baseDuration * 2.5, ease: "linear" }}
         className="absolute w-[290px] h-[290px] border-r-2 border-cyan-500/50 rounded-full"
      />

      {/* Middle Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: baseDuration, ease: "linear" }}
        className={clsx(
          "absolute rounded-full border-2 opacity-60 border-t-cyan-500 border-r-cyan-400 border-b-transparent border-l-transparent",
          isActive ? "w-48 h-48 shadow-[0_0_20px_rgba(6,182,212,0.8)]" : "w-40 h-40"
        )}
      />
      
      {/* Inner Core element similar to Design HTML */}
      <div 
        className="w-48 h-48 rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex flex-col items-center justify-center glow-cyan transition-transform duration-500"
        style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
      >
        <div className="w-40 h-40 rounded-full border border-cyan-400/30 flex items-center justify-center mix-blend-screen bg-slate-950/40">
           <div className="text-center">
              <div className="text-[10px] font-mono uppercase opacity-70 text-cyan-500 mb-1 tracking-widest">{isActive ? 'Processing' : 'Neural Link'}</div>
              <motion.div 
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: isActive ? [1, 0.6, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-2xl font-bold tracking-tighter text-cyan-400"
              >
                  {isActive ? 'ACTIVE' : 'READY'}
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
}
