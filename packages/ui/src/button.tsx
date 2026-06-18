import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

/** Minimal shared button — placeholder for the Fractionax design system. */
export function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button data-variant={variant} {...props} />;
}
