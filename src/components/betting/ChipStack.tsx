import { formatCurrency } from '@/utils/formatters.js';

interface ChipStackProps {
  amount: number;
}

function getChipColor(amount: number): string {
  if (amount >= 100) return 'var(--chip-black)';
  if (amount >= 50) return '#ff6600';
  if (amount >= 25) return 'var(--chip-green)';
  if (amount >= 10) return 'var(--chip-blue)';
  return 'var(--chip-red)';
}

export default function ChipStack({ amount }: ChipStackProps) {
  if (amount <= 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: getChipColor(amount),
          border: '3px dashed rgba(255,255,255,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {formatCurrency(amount)}
      </div>
    </div>
  );
}
