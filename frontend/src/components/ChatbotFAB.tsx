import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, X } from 'lucide-react';
import { AIChatInterface } from './ai/AIChatInterface';

export const ChatbotFAB: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = i18n.dir() === 'rtl';

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-gold-600 text-slate-950 shadow-lg hover:shadow-xl transition-shadow`}
        aria-label={isOpen ? t('chatbot.close', 'Fermer le chat') : t('chatbot.open', 'Ouvrir le chat')}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Bot size={24} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification dot */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 border-2 border-white dark:border-slate-900">
            <MessageCircle size={8} className="text-white" />
          </span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed bottom-24 ${isRTL ? 'left-6' : 'right-6'} z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-3xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col`}
          >
            <AIChatInterface embedded />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
