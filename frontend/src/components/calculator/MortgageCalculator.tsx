import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Calculator, X, TrendingDown, Calendar, Percent, Banknote, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MortgageCalculatorProps {
  propertyPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  propertyPrice,
  isOpen,
  onClose,
}) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(20);
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const calculations = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    let monthlyPayment = 0;
    if (interestRate === 0) {
      monthlyPayment = loanAmount / numPayments;
    } else {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    const totalPayment = monthlyPayment * numPayments;
    const totalInterest = totalPayment - loanAmount;

    return {
      downPayment,
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
      numPayments,
    };
  }, [propertyPrice, downPaymentPercent, interestRate, loanTerm]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(amount);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={prefersReducedMotion ? {} : undefined}
            className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-morocco-royal to-morocco-emerald p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">{t('mortgageCalculator.title')}</h2>
                    <p className="text-white/70 text-sm">{t('mortgageCalculator.subtitle')}</p>
                  </div>
                </div>
                <button onClick={onClose} aria-label={t('common.close')} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition">
                  <X className="w-5 h-5 text-white" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Property Price */}
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4">
                <p className="text-xs text-teal-600 dark:text-teal-400 font-medium uppercase tracking-wide">{t('mortgageCalculator.propertyPrice')}</p>
                <p className="text-2xl font-black text-teal-700 dark:text-teal-300">{formatCurrency(propertyPrice)}</p>
              </div>

              {/* Down Payment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-amber-500" /> {t('mortgageCalculator.downPayment', { percent: downPaymentPercent })}
                  </label>
                  <span className="text-sm font-bold text-teal-600">{formatCurrency(calculations.downPayment)}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-500" /> {t('mortgageCalculator.interestRate')}
                  </label>
                  <span className="text-sm font-bold text-teal-600">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Loan Term */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-500" /> {t('mortgageCalculator.loanTerm')}
                  </label>
                  <span className="text-sm font-bold text-teal-600">{t('mortgageCalculator.years', { years: loanTerm })}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={loanTerm}
                  onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>5 ans</span>
                  <span>30 ans</span>
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('mortgageCalculator.loanAmount')}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-50">{formatCurrency(calculations.loanAmount)}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-600" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-teal-500" /> {t('mortgageCalculator.monthlyPayment')}
                  </span>
                  <span className="text-xl font-black text-teal-600">{formatCurrency(calculations.monthlyPayment)}</span>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-600" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('mortgageCalculator.totalCost')}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-50">{formatCurrency(calculations.totalPayment)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('mortgageCalculator.totalInterest')}</span>
                  <span className="font-bold text-amber-600">{formatCurrency(calculations.totalInterest)}</span>
                </div>
              </div>

              <p className="flex items-start gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {t('mortgageCalculator.disclaimer')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
