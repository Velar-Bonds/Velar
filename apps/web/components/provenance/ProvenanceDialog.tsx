'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { BondProvenance } from '@velar/types';
import { ProvenanceExplorer } from './ProvenanceExplorer';

export interface ProvenanceDialogProps {
  /** token_id (auth) or token_id/bond_id (public). */
  subjectId: string;
  mode: 'auth' | 'public';
  token?: string;
  ownerName?: (id: string) => string;
  initialProvenance?: BondProvenance;
  onClose: () => void;
}

/**
 * Accessible modal that hosts the {@link ProvenanceExplorer} for a bond (#36).
 * Used across the traceability, negotiation and public verification surfaces so
 * the explorer opens on demand. Closes on Escape or backdrop click, focuses in
 * on open and locks body scroll while open.
 */
export function ProvenanceDialog({
  subjectId,
  mode,
  token,
  ownerName,
  initialProvenance,
  onClose,
}: ProvenanceDialogProps) {
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
        aria-label="Explorador de procedencia"
        className="my-8 w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex justify-end">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar el explorador de procedencia"
            className="rounded-full bg-white p-2 text-gray-600 shadow hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="rounded-3xl bg-[#fafcff] p-5 shadow-xl md:p-6">
          <ProvenanceExplorer
            subjectId={subjectId}
            mode={mode}
            token={token}
            ownerName={ownerName}
            initialProvenance={initialProvenance}
          />
        </div>
      </div>
    </div>
  );
}

export default ProvenanceDialog;
