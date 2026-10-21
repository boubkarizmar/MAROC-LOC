import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Clock, User, Phone, Mail, MessageSquare, CheckCircle, MapPin } from 'lucide-react';
import { Property } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { visitApi } from '../../api/visitApi';

interface ScheduleVisitProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
];

export const ScheduleVisit: React.FC<ScheduleVisitProps> = ({
  property,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await visitApi.schedule({
        propertyId: property.id,
        visitDate: selectedDate,
        visitTime: selectedTime,
        visitorName: name,
        visitorPhone: phone,
        visitorEmail: email,
        notes: notes,
      });
      setStep(3);
      showToast(t('booking.scheduleVisit.success'), 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || t('booking.scheduleVisit.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const formatDateFull = (d: Date) =>
    d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { reset(); onClose(); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-morocco-royal to-morocco-emerald p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-lg">{t('booking.scheduleVisit.title')}</h2>
                  <p className="text-white/70 text-sm flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {property.city}
                  </p>
                </div>
                <button
                  onClick={() => { reset(); onClose(); }}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-5">
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{t('booking.scheduleVisit.chooseDate')}</p>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {dates.map((d) => {
                      const dateStr = d.toISOString().split('T')[0];
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`flex flex-col items-center p-2 rounded-xl text-xs transition ${
                            isSelected
                              ? 'bg-teal-600 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="uppercase font-bold">{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                          <span className="text-lg font-black">{d.getDate()}</span>
                          <span className="uppercase">{d.toLocaleDateString('fr-FR', { month: 'short' })}</span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium pt-2">{t('booking.scheduleVisit.chooseSlot')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 rounded-lg text-sm font-medium transition ${
                              selectedTime === time
                                ? 'bg-teal-600 text-white shadow-md'
                                : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => selectedDate && selectedTime && setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed mt-4"
                  >
                    {t('booking.scheduleVisit.continue')}
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-3 mb-2">
                    <p className="text-sm text-teal-700 dark:text-teal-300 font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateFull(new Date(selectedDate))} {t('booking.scheduleVisit.at')} {selectedTime}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('booking.scheduleVisit.fullName')}</label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-50 outline-none"
                        placeholder={t('booking.scheduleVisit.yourNamePlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('booking.scheduleVisit.phone')}</label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-50 outline-none"
                        placeholder={t('booking.scheduleVisit.phonePlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('booking.scheduleVisit.email')}</label>
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-50 outline-none"
                        placeholder={t('booking.scheduleVisit.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">{t('booking.scheduleVisit.notesOptional')}</label>
                    <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-700 rounded-xl px-3 py-2">
                      <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-50 outline-none resize-none"
                        placeholder={t('booking.scheduleVisit.notesPlaceholder')}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 transition"
                    >
                      {t('booking.scheduleVisit.back')}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!name || !phone || loading}
                      className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition disabled:opacity-40"
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mx-auto" />
                      ) : (
                        t('booking.scheduleVisit.confirm')
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t('booking.scheduleVisit.confirmed')}</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {t('booking.scheduleVisit.confirmedMessage', { date: formatDateFull(new Date(selectedDate)), time: selectedTime })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t('booking.scheduleVisit.ownerWillContact')}
                  </p>
                  <button
                    onClick={() => { reset(); onClose(); }}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
                  >
                    {t('booking.scheduleVisit.finish')}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
