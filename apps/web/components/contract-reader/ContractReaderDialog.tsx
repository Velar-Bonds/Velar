'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ReaderLocale } from '@velar/types';
import { ContractReader } from './ContractReader';

export interface ContractReaderDialogProps {
  bondId: string;
  locale?: ReaderLocale;
  onClose: () => void;
}

/**
 * Accessible modal that hosts the {@link ContractReader} for a bond. Used on the
 * bond list/detail surfaces so the reader can be opened on demand (#39).
 * Closes on Escape or backdrop click, moves focus in on open and locks body
 * scroll while open.
 */
export function ContractReaderDialog({ bondId, locale = 'es', onClose }: ContractReaderDialogProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lector del contrato"
        className="my-8 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar el lector del contrato"
            className="rounded-full bg-white p-2 text-gray-600 shadow hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <ContractReader bondId={bondId} locale={locale} />
      </div>
    </div>
  );
}

export default ContractReaderDialog;
