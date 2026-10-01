import React from 'react';
import { AlertCircle } from './icons';

// Inline validation message; link it to the input with aria-describedby={id}
export const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-xs text-rose-400">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  ) : null;

// Border classes for an input in its error state
export const errorBorder = (hasError: boolean) => (hasError ? 'border-rose-500 focus:border-rose-500' : 'border-zinc-800 focus:border-cyan-500/50');
