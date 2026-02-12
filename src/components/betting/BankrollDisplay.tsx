import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters.js';

interface BankrollDisplayProps {
  bankroll: number;
  startingBankroll: number;
}

export default function BankrollDisplay({ bankroll, startingBankroll }: BankrollDisplayProps) {
  const diff = bankroll - startingBankroll;
  const className = diff > 0
    ? 'bankroll-display bankroll-display--up'
    : diff < 0
    ? 'bankroll-display bankroll-display--down'
    : 'bankroll-display';

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={bankroll}
        className={className}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {formatCurrency(bankroll)}
      </motion.span>
    </AnimatePresence>
  );
}
