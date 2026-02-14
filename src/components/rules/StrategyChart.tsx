import { useState } from 'react';

type Tab = 'hard' | 'soft' | 'pairs' | 'deviations';

const DEALER_COLS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  H:  { label: 'H',  className: 'strat-cell--hit' },
  S:  { label: 'S',  className: 'strat-cell--stand' },
  D:  { label: 'D',  className: 'strat-cell--double' },
  Ds: { label: 'Ds', className: 'strat-cell--double' },
  P:  { label: 'P',  className: 'strat-cell--split' },
  Ph: { label: 'Ph', className: 'strat-cell--split' },
  Rh: { label: 'Rh', className: 'strat-cell--surrender' },
  Rs: { label: 'Rs', className: 'strat-cell--surrender' },
};

// H17 6-deck basic strategy tables
const HARD: [string, string[]][] = [
  ['5',  ['H','H','H','H','H','H','H','H','H','H']],
  ['6',  ['H','H','H','H','H','H','H','H','H','H']],
  ['7',  ['H','H','H','H','H','H','H','H','H','H']],
  ['8',  ['H','H','H','H','H','H','H','H','H','H']],
  ['9',  ['H','D','D','D','D','H','H','H','H','H']],
  ['10', ['D','D','D','D','D','D','D','D','H','H']],
  ['11', ['D','D','D','D','D','D','D','D','D','D']],
  ['12', ['H','H','S','S','S','H','H','H','H','H']],
  ['13', ['S','S','S','S','S','H','H','H','H','H']],
  ['14', ['S','S','S','S','S','H','H','H','H','H']],
  ['15', ['S','S','S','S','S','H','H','H','Rh','Rh']],
  ['16', ['S','S','S','S','S','H','H','Rh','Rh','Rh']],
  ['17', ['S','S','S','S','S','S','S','S','S','Rs']],
  ['18+',['S','S','S','S','S','S','S','S','S','S']],
];

const SOFT: [string, string[]][] = [
  ['A,2', ['H','H','H','D','D','H','H','H','H','H']],
  ['A,3', ['H','H','H','D','D','H','H','H','H','H']],
  ['A,4', ['H','H','D','D','D','H','H','H','H','H']],
  ['A,5', ['H','H','D','D','D','H','H','H','H','H']],
  ['A,6', ['H','D','D','D','D','H','H','H','H','H']],
  ['A,7', ['Ds','Ds','Ds','Ds','Ds','S','S','H','H','H']],
  ['A,8', ['S','S','S','S','Ds','S','S','S','S','S']],
  ['A,9', ['S','S','S','S','S','S','S','S','S','S']],
];

const PAIRS: [string, string[]][] = [
  ['2,2', ['Ph','Ph','P','P','P','P','H','H','H','H']],
  ['3,3', ['Ph','Ph','P','P','P','P','H','H','H','H']],
  ['4,4', ['H','H','H','Ph','Ph','H','H','H','H','H']],
  ['5,5', ['D','D','D','D','D','D','D','D','H','H']],
  ['6,6', ['Ph','P','P','P','P','H','H','H','H','H']],
  ['7,7', ['P','P','P','P','P','P','H','H','H','H']],
  ['8,8', ['P','P','P','P','P','P','P','P','P','P']],
  ['9,9', ['P','P','P','P','P','S','P','P','S','S']],
  ['T,T', ['S','S','S','S','S','S','S','S','S','S']],
  ['A,A', ['P','P','P','P','P','P','P','P','P','P']],
];

// Illustrious 18 + Fab 4 deviations (Hi-Lo, H17, 6-deck)
// Each deviation: table ('hard'|'soft'|'pairs'), rowLabel, dealerColIndex, threshold TC, direction ('gte'|'lte'), new action code
interface Deviation {
  table: 'hard' | 'soft' | 'pairs';
  row: string;
  dealerIdx: number; // index into DEALER_COLS
  threshold: number;
  direction: 'gte' | 'lte';
  action: string; // action code to use when deviation is active
}

const COUNT_DEVIATIONS: Deviation[] = [
  // Illustrious 18
  { table: 'hard', row: '16', dealerIdx: 8, threshold: 0,  direction: 'gte', action: 'S' },  // 16 vs 10: stand at TC>=0
  { table: 'hard', row: '15', dealerIdx: 8, threshold: 4,  direction: 'gte', action: 'S' },  // 15 vs 10: stand at TC>=4
  { table: 'hard', row: '10', dealerIdx: 8, threshold: 4,  direction: 'gte', action: 'D' },  // 10 vs 10: double at TC>=4
  { table: 'hard', row: '10', dealerIdx: 9, threshold: 4,  direction: 'gte', action: 'D' },  // 10 vs A: double at TC>=4
  { table: 'hard', row: '12', dealerIdx: 1, threshold: 2,  direction: 'gte', action: 'S' },  // 12 vs 3: stand at TC>=2
  { table: 'hard', row: '12', dealerIdx: 0, threshold: 3,  direction: 'gte', action: 'S' },  // 12 vs 2: stand at TC>=3
  { table: 'hard', row: '11', dealerIdx: 9, threshold: 1,  direction: 'gte', action: 'D' },  // 11 vs A: double at TC>=1
  { table: 'hard', row: '9',  dealerIdx: 0, threshold: 1,  direction: 'gte', action: 'D' },  // 9 vs 2: double at TC>=1
  { table: 'hard', row: '9',  dealerIdx: 5, threshold: 3,  direction: 'gte', action: 'D' },  // 9 vs 7: double at TC>=3
  { table: 'hard', row: '16', dealerIdx: 7, threshold: 5,  direction: 'gte', action: 'S' },  // 16 vs 9: stand at TC>=5
  { table: 'hard', row: '13', dealerIdx: 0, threshold: -1, direction: 'lte', action: 'H' },  // 13 vs 2: hit at TC<=-1
  { table: 'hard', row: '12', dealerIdx: 2, threshold: 0,  direction: 'lte', action: 'H' },  // 12 vs 4: hit at TC<=0
  { table: 'hard', row: '12', dealerIdx: 3, threshold: -2, direction: 'lte', action: 'H' },  // 12 vs 5: hit at TC<=-2
  { table: 'hard', row: '12', dealerIdx: 4, threshold: -1, direction: 'lte', action: 'H' },  // 12 vs 6: hit at TC<=-1
  { table: 'hard', row: '13', dealerIdx: 1, threshold: -2, direction: 'lte', action: 'H' },  // 13 vs 3: hit at TC<=-2
  { table: 'pairs', row: 'T,T', dealerIdx: 3, threshold: 5, direction: 'gte', action: 'P' }, // TT vs 5: split at TC>=5
  { table: 'pairs', row: 'T,T', dealerIdx: 4, threshold: 4, direction: 'gte', action: 'P' }, // TT vs 6: split at TC>=4
  // Fab 4 surrender deviations
  { table: 'hard', row: '15', dealerIdx: 8, threshold: 0,  direction: 'gte', action: 'Rh' }, // 15 vs 10: surrender at TC>=0
  { table: 'hard', row: '14', dealerIdx: 8, threshold: 3,  direction: 'gte', action: 'Rh' }, // 14 vs 10: surrender at TC>=3
  { table: 'hard', row: '15', dealerIdx: 7, threshold: 2,  direction: 'gte', action: 'Rh' }, // 15 vs 9: surrender at TC>=2
  { table: 'hard', row: '15', dealerIdx: 9, threshold: 1,  direction: 'gte', action: 'Rh' }, // 15 vs A: surrender at TC>=1
];

// Readable deviations list for the deviations tab
const DEVIATIONS_LIST: { hand: string; dealer: string; tc: string; deviation: string; normal: string }[] = [
  { hand: 'Insurance',  dealer: 'A',  tc: '\u2265 +3', deviation: 'Take insurance', normal: 'Decline' },
  { hand: 'Hard 16',    dealer: '10', tc: '\u2265 0',  deviation: 'Stand',          normal: 'Hit' },
  { hand: 'Hard 15',    dealer: '10', tc: '\u2265 +4', deviation: 'Stand',          normal: 'Hit' },
  { hand: 'Hard 10',    dealer: '10', tc: '\u2265 +4', deviation: 'Double',         normal: 'Hit' },
  { hand: 'Hard 10',    dealer: 'A',  tc: '\u2265 +4', deviation: 'Double',         normal: 'Hit' },
  { hand: 'Hard 12',    dealer: '3',  tc: '\u2265 +2', deviation: 'Stand',          normal: 'Hit' },
  { hand: 'Hard 12',    dealer: '2',  tc: '\u2265 +3', deviation: 'Stand',          normal: 'Hit' },
  { hand: 'Hard 11',    dealer: 'A',  tc: '\u2265 +1', deviation: 'Double',         normal: 'Hit' },
  { hand: 'Hard 9',     dealer: '2',  tc: '\u2265 +1', deviation: 'Double',         normal: 'Hit' },
  { hand: 'Hard 9',     dealer: '7',  tc: '\u2265 +3', deviation: 'Double',         normal: 'Hit' },
  { hand: 'Hard 16',    dealer: '9',  tc: '\u2265 +5', deviation: 'Stand',          normal: 'Hit' },
  { hand: 'Hard 13',    dealer: '2',  tc: '\u2264 \u22121', deviation: 'Hit',       normal: 'Stand' },
  { hand: 'Hard 12',    dealer: '4',  tc: '\u2264 0',  deviation: 'Hit',            normal: 'Stand' },
  { hand: 'Hard 12',    dealer: '5',  tc: '\u2264 \u22122', deviation: 'Hit',       normal: 'Stand' },
  { hand: 'Hard 12',    dealer: '6',  tc: '\u2264 \u22121', deviation: 'Hit',       normal: 'Stand' },
  { hand: 'Hard 13',    dealer: '3',  tc: '\u2264 \u22122', deviation: 'Hit',       normal: 'Stand' },
  { hand: 'T,T',        dealer: '5',  tc: '\u2265 +5', deviation: 'Split',          normal: 'Stand' },
  { hand: 'T,T',        dealer: '6',  tc: '\u2265 +4', deviation: 'Split',          normal: 'Stand' },
  { hand: 'Hard 15',    dealer: '10', tc: '\u2265 0',  deviation: 'Surrender',      normal: 'Hit' },
  { hand: 'Hard 14',    dealer: '10', tc: '\u2265 +3', deviation: 'Surrender',      normal: 'Hit' },
  { hand: 'Hard 15',    dealer: '9',  tc: '\u2265 +2', deviation: 'Surrender',      normal: 'Hit' },
  { hand: 'Hard 15',    dealer: 'A',  tc: '\u2265 +1', deviation: 'Surrender',      normal: 'Hit' },
];

// Build a lookup: "table:row:dealerIdx" -> deviation action (if TC triggers it)
function getDeviatedAction(
  table: 'hard' | 'soft' | 'pairs',
  row: string,
  dealerIdx: number,
  tc: number | null,
  baseAction: string,
): { action: string; isDeviation: boolean } {
  if (tc === null) return { action: baseAction, isDeviation: false };

  // Find all matching deviations and pick the most relevant one
  // For cells with multiple deviations (e.g. 15 vs 10: stand at TC>=4, surrender at TC>=0),
  // surrender takes priority when applicable
  let bestDeviation: Deviation | null = null;

  for (const dev of COUNT_DEVIATIONS) {
    if (dev.table !== table || dev.row !== row || dev.dealerIdx !== dealerIdx) continue;

    const active = dev.direction === 'gte' ? tc >= dev.threshold : tc <= dev.threshold;
    if (!active) continue;

    // Surrender deviations take priority
    if (!bestDeviation) {
      bestDeviation = dev;
    } else if (dev.action === 'Rh' || dev.action === 'Rs') {
      bestDeviation = dev;
    }
  }

  if (bestDeviation && bestDeviation.action !== baseAction) {
    return { action: bestDeviation.action, isDeviation: true };
  }

  return { action: baseAction, isDeviation: false };
}

function StrategyTable({
  rows,
  label,
  table,
  tc,
}: {
  rows: [string, string[]][];
  label: string;
  table: 'hard' | 'soft' | 'pairs';
  tc: number | null;
}) {
  return (
    <div className="strat-table-wrap">
      <table className="strat-table">
        <thead>
          <tr>
            <th className="strat-table__corner">{label}</th>
            {DEALER_COLS.map(c => (
              <th key={c} className="strat-table__dealer-col">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([rowLabel, cells]) => (
            <tr key={rowLabel}>
              <td className="strat-table__row-label">{rowLabel}</td>
              {cells.map((baseCode, i) => {
                const { action, isDeviation } = getDeviatedAction(table, rowLabel, i, tc, baseCode);
                const info = ACTION_LABELS[action] ?? { label: action, className: '' };
                return (
                  <td
                    key={i}
                    className={`strat-cell ${info.className} ${isDeviation ? 'strat-cell--deviation' : ''}`}
                    title={isDeviation ? `Deviation from ${baseCode} at TC ${tc}` : ''}
                  >
                    {info.label}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StrategyChart() {
  const [tab, setTab] = useState<Tab>('hard');
  const [useCount, setUseCount] = useState(false);
  const [tc, setTc] = useState(0);

  const activeTc = useCount ? tc : null;

  return (
    <div className="strategy-chart">
      <div className="strategy-chart__tc-toggle">
        <label className="strategy-chart__tc-label">
          <input
            type="checkbox"
            checked={useCount}
            onChange={e => setUseCount(e.target.checked)}
          />
          Adjust for True Count
        </label>
        {useCount && (
          <div className="strategy-chart__tc-slider">
            <input
              type="range"
              min={-5}
              max={10}
              value={tc}
              onChange={e => setTc(Number(e.target.value))}
            />
            <span className={`strategy-chart__tc-value ${tc > 0 ? 'strategy-chart__tc-value--positive' : tc < 0 ? 'strategy-chart__tc-value--negative' : ''}`}>
              TC: {tc >= 0 ? '+' : ''}{tc}
            </span>
          </div>
        )}
      </div>

      <div className="strategy-chart__tabs">
        <button className={`strategy-chart__tab ${tab === 'hard' ? 'strategy-chart__tab--active' : ''}`} onClick={() => setTab('hard')}>Hard Totals</button>
        <button className={`strategy-chart__tab ${tab === 'soft' ? 'strategy-chart__tab--active' : ''}`} onClick={() => setTab('soft')}>Soft Totals</button>
        <button className={`strategy-chart__tab ${tab === 'pairs' ? 'strategy-chart__tab--active' : ''}`} onClick={() => setTab('pairs')}>Pairs</button>
        <button className={`strategy-chart__tab ${tab === 'deviations' ? 'strategy-chart__tab--active' : ''}`} onClick={() => setTab('deviations')}>All Deviations</button>
      </div>

      {tab === 'hard' && <StrategyTable rows={HARD} label="Hard" table="hard" tc={activeTc} />}
      {tab === 'soft' && <StrategyTable rows={SOFT} label="Soft" table="soft" tc={activeTc} />}
      {tab === 'pairs' && <StrategyTable rows={PAIRS} label="Pair" table="pairs" tc={activeTc} />}

      {tab === 'deviations' && (
        <div className="strat-table-wrap">
          <table className="strat-table strat-table--deviations">
            <thead>
              <tr>
                <th>Hand</th>
                <th>Dealer</th>
                <th>True Count</th>
                <th>Play</th>
                <th>Normally</th>
              </tr>
            </thead>
            <tbody>
              {DEVIATIONS_LIST.map((d, i) => (
                <tr key={i}>
                  <td className="strat-table__row-label">{d.hand}</td>
                  <td className="strat-table__dealer-col">{d.dealer}</td>
                  <td className="strat-dev__tc">{d.tc}</td>
                  <td className="strat-dev__action">{d.deviation}</td>
                  <td className="strat-dev__normal">{d.normal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="strategy-chart__legend">
        <span className="strat-legend__item strat-cell--hit">H = Hit</span>
        <span className="strat-legend__item strat-cell--stand">S = Stand</span>
        <span className="strat-legend__item strat-cell--double">D = Double</span>
        <span className="strat-legend__item strat-cell--split">P = Split</span>
        <span className="strat-legend__item strat-cell--surrender">R = Surrender</span>
        {useCount && <span className="strat-legend__item strat-cell--deviation-legend">* = Count Deviation</span>}
      </div>
      <p className="strategy-chart__note">Ds = Double (stand if not allowed) | Ph = Split (hit if not allowed) | Rh = Surrender (hit if not allowed)</p>
    </div>
  );
}
