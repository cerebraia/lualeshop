import { cn } from '@/lib/utils';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const baseInput =
  'w-full bg-white border border-rose/30 rounded-2xl px-4 py-2.5 text-sm text-brown placeholder:text-brown-light/60 focus:outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all disabled:opacity-50';

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-brown">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(baseInput, error && 'border-red-400 focus:border-red-400 focus:ring-red-100', className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-brown-light">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-brown">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={3}
        className={cn(baseInput, 'resize-none', error && 'border-red-400 focus:border-red-400 focus:ring-red-100', className)}
        {...props}
      />
      {hint && !error && <p className="text-xs text-brown-light">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-brown">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(baseInput, 'cursor-pointer', error && 'border-red-400', className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
