import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
};

export function Button({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-white',
        props.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-95 active:brightness-90',
        variant === 'primary' && 'bg-slate-900 text-white',
        variant === 'secondary' && 'bg-slate-100 text-slate-900 border border-slate-200',
        variant === 'ghost' && 'bg-transparent text-slate-900 hover:bg-slate-100',
        variant === 'danger' && 'bg-rose-600 text-white',
        className
      )}
    />
  );
}

