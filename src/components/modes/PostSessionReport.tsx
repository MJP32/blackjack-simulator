import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStatsStore } from '@/stores/statsStore.js';
import { useGameStore } from '@/stores/gameStore.js';
import Button from '@/components/shared/Button.js';
import ReportHeader from '@/components/report/ReportHeader.js';
import ShoeSection from '@/components/report/ShoeSection.js';

interface PostSessionReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostSessionReport({ isOpen, onClose }: PostSessionReportProps) {
  const stats = useStatsStore();

  // Finalize current shoe when report opens
  useEffect(() => {
    if (isOpen) {
      const humanPlayer = useGameStore.getState().players.find(p => p.isHuman);
      if (humanPlayer) {
        stats.finalizeCurrentShoe(humanPlayer.bankroll);
      }
    }
  }, [isOpen]);

  const shoes = stats.shoeRecords;

  const overallGrade = useMemo(() => {
    if (shoes.length === 0) return 0;
    let totalWeight = 0;
    let weightedSum = 0;
    for (const shoe of shoes) {
      const weight = shoe.hands.length;
      weightedSum += shoe.grade * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }, [shoes]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="report-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="report-page"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="report-page__header">
              <span className="report-page__title">Session Report</span>
              <div className="report-page__actions">
                <Button variant="secondary" size="small" onClick={() => { stats.resetSession(); onClose(); }}>
                  Reset & Close
                </Button>
                <Button variant="primary" size="small" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>

            <div className="report-page__content">
              <ReportHeader overallGrade={overallGrade} shoes={shoes} />

              {shoes.length > 0 ? (
                <div className="report-page__shoes">
                  {shoes.map((shoe, i) => (
                    <ShoeSection key={i} shoe={shoe} />
                  ))}
                </div>
              ) : (
                <div className="report-page__empty">
                  Play some hands to see your session report.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
