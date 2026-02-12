import { useStatsStore } from '@/stores/statsStore.js';
import { formatCurrency, formatPercent } from '@/utils/formatters.js';
import SessionChart from '@/components/charts/SessionChart.js';
import type { ShoeRecord } from '@/engine/types.js';

interface ReportHeaderProps {
  overallGrade: number;
  shoes: ShoeRecord[];
}

export default function ReportHeader({ overallGrade, shoes }: ReportHeaderProps) {
  const stats = useStatsStore();
  const strategyAccuracy = stats.totalStrategyDecisions > 0
    ? stats.correctStrategyDecisions / stats.totalStrategyDecisions
    : 0;

  return (
    <div className="report-header">
      <div className="report-header__grade-section">
        <div className="report-header__grade">{overallGrade}</div>
        <div className="report-header__grade-label">Session Grade</div>
      </div>

      <div className="report-header__stats">
        <div className="report-header__stat">
          <span className="report-header__stat-value">{stats.handsPlayed}</span>
          <span className="report-header__stat-label">Hands</span>
        </div>
        <div className="report-header__stat">
          <span className="report-header__stat-value">{stats.handsWon}/{stats.handsLost}/{stats.handsPushed}</span>
          <span className="report-header__stat-label">W/L/P</span>
        </div>
        <div className="report-header__stat">
          <span className={`report-header__stat-value ${stats.netProfit >= 0 ? 'report-header__stat-value--positive' : 'report-header__stat-value--negative'}`}>
            {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
          </span>
          <span className="report-header__stat-label">Net Profit</span>
        </div>
        <div className="report-header__stat">
          <span className="report-header__stat-value">
            {stats.totalStrategyDecisions > 0 ? formatPercent(strategyAccuracy) : 'N/A'}
          </span>
          <span className="report-header__stat-label">Accuracy</span>
        </div>
        <div className="report-header__stat">
          <span className="report-header__stat-value">{shoes.length}</span>
          <span className="report-header__stat-label">Shoes</span>
        </div>
      </div>

      {stats.evHistory.length > 0 && (
        <div className="chart-container">
          <SessionChart data={stats.evHistory} />
        </div>
      )}
    </div>
  );
}
