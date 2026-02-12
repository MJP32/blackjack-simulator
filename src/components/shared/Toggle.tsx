interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="toggle">
      <div
        className={`toggle__track ${checked ? 'toggle__track--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className="toggle__thumb" />
      </div>
      <span className="toggle__label">{label}</span>
    </label>
  );
}
