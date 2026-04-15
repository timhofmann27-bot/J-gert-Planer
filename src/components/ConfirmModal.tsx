import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
            <button 
              onClick={onCancel} 
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            
            <p className="text-white/60 text-sm mb-8 font-medium leading-relaxed">{message}</p>
            
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button 
                onClick={onCancel} 
                className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-white border border-white/10 hover:bg-white/5 rounded-xl transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={onConfirm} 
                className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                Bestätigen
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
