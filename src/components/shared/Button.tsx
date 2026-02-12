import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gold';
  size?: 'small' | 'normal';
  hint?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'normal',
  hint = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'small' ? 'btn--small' : '',
    hint ? 'btn--hint' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
