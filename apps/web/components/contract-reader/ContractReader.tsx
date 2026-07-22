'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { BookOpen, Check, Download, FileText, Printer } from 'lucide-react';
import type {
  ContractReaderResponse,
  GlossaryTerm,
  PlainLanguageClause,
  ReaderLocale,
} from '@velar/types';
import {
  buildExportText,
  computeReadingProgress,
  createContractReaderClient,
  glossaryById,
  highlightSegments,
  plainLanguageText,
} from '../../lib/contract-reader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

type Mode = 'simple' | 'legal';

export interface ContractReaderProps {
  bondId: string;
  locale?: ReaderLocale;
  /** Preloaded response (fixtures/SSR). When provided, no network request is made. */
  initialReader?: ContractReaderResponse;
}

/**
 * Interactive contract reader (issue #39): clause-by-clause plain language with
 * glossary tooltips, key-term highlighting, a summary ⇄ legal toggle, reading
 * progress, comprehension checkpoints and print/export. Localized (es),
 * responsive and keyboard accessible. Complements — never replaces — the legal
 * contract.
 */
export function ContractReader({ bondId, locale = 'es', initialReader }: ContractReaderProps) {
  const [reader, setReader] = useState<ContractReaderResponse | null>(initialReader ?? null);
  const [loading, setLoading] = useState(!initialReader);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('simple');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  const clauseRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (initialReader) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const client = createContractReaderClient({ baseUrl: API_BASE });
        const r = await client.getReader(bondId, locale);
        if (active) setReader(r);
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : 'No se pudo cargar el contrato.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [bondId, locale, initialReader, reloadKey]);

  const glossaryMap = useMemo(() => glossaryById(reader?.glossary ?? []), [reader]);

  const toggleRead = useCallback((clauseId: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(clauseId)) next.delete(clauseId);
      else next.add(clauseId);
      return next;
    });
  }, []);

  const handleExport = useCallback(() => {
    if (!reader) return;
    const blob = new Blob([buildExportText(reader)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${reader.bondId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reader]);

  // Keyboard navigation between clauses (ArrowDown / ArrowUp when a clause is focused).
  const onListKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const items = clauseRefs.current.filter(Boolean) as HTMLElement[];
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    e.preventDefault();
    const nextIdx = e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
    items[nextIdx]?.focus();
  }, []);

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Cargando el contrato…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!reader || reader.clauses.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No hay un contrato disponible para mostrar todavía.
      </div>
    );
  }

  const progress = computeReadingProgress(readIds, reader.clauses.length);

  return (
    <section aria-label="Lector del contrato" className="rounded-2xl border border-gray-200 bg-white">
      {/* Header + toolbar */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{reader.title}</h2>
            <p className="text-xs text-gray-500">
              Esta guía te ayuda a entender el contrato. Complementa el documento legal; no lo reemplaza.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div role="group" aria-label="Modo de lectura" className="flex rounded-lg border border-gray-200 p-0.5">
              <button
                type="button"
                aria-pressed={mode === 'simple'}
                onClick={() => setMode('simple')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${mode === 'simple' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
              >
                <BookOpen size={14} aria-hidden="true" /> Lenguaje simple
              </button>
              <button
                type="button"
                aria-pressed={mode === 'legal'}
                onClick={() => setMode('legal')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${mode === 'legal' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
              >
                <FileText size={14} aria-hidden="true" /> Documento legal
              </button>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer size={14} aria-hidden="true" /> Imprimir
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} aria-hidden="true" /> Exportar
            </button>
          </div>
        </div>

        {/* Reading progress */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Progreso de lectura</span>
            <span>{progress}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de lectura del contrato"
          >
            <div
              className="h-full rounded-full bg-emerald-500 transition-all motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {reader.summary && (
        <div className="border-b border-gray-100 bg-gray-50 p-5">
          <h3 className="mb-1 text-sm font-semibold text-gray-900">Resumen</h3>
          <p className="text-sm leading-relaxed text-gray-700">{reader.summary}</p>
        </div>
      )}

      {/* Clauses */}
      <ol className="divide-y divide-gray-100" onKeyDown={onListKeyDown}>
        {reader.clauses.map((clause, index) => (
          <ClauseItem
            key={clause.clauseId}
            registerRef={(el) => {
              clauseRefs.current[index] = el;
            }}
            clause={clause}
            glossaryMap={glossaryMap}
            mode={mode}
            read={readIds.has(clause.clauseId)}
            onToggleRead={() => toggleRead(clause.clauseId)}
          />
        ))}
      </ol>
    </section>
  );
}

// ─── Clause item ────────────────────────────────────────────────────────────

interface ClauseItemProps {
  clause: PlainLanguageClause;
  glossaryMap: Map<string, GlossaryTerm>;
  mode: Mode;
  read: boolean;
  onToggleRead: () => void;
  registerRef?: (el: HTMLLIElement | null) => void;
}

function ClauseItem({ clause, glossaryMap, mode, read, onToggleRead, registerRef }: ClauseItemProps) {
  const headingId = `${clause.anchor}-title`;
  const legalText = (
    <HighlightedText clause={clause} glossaryMap={glossaryMap} />
  );

  return (
    <li
      id={clause.anchor}
      ref={registerRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      className="scroll-mt-4 p-5 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold text-gray-900">
          {clause.title}
        </h3>
        {read && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check size={14} aria-hidden="true" /> Entendida
          </span>
        )}
      </div>

      {mode === 'simple' ? (
        <>
          <p className="text-sm leading-relaxed text-gray-700">{plainLanguageText(clause)}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
              Ver texto legal original
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{legalText}</p>
          </details>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-gray-800">{legalText}</p>
          <p className="mt-2 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
            <span className="font-medium text-gray-700">En lenguaje simple: </span>
            {plainLanguageText(clause)}
          </p>
        </>
      )}

      {/* Comprehension checkpoint */}
      <button
        type="button"
        onClick={onToggleRead}
        aria-pressed={read}
        className={`mt-3 rounded-lg border px-3 py-1.5 text-xs font-medium print:hidden ${
          read
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
        }`}
      >
        {read ? 'Marcada como entendida' : '¿Entendiste esta cláusula?'}
      </button>
    </li>
  );
}

// ─── Highlighted legal text with glossary tooltips ──────────────────────────

function HighlightedText({
  clause,
  glossaryMap,
}: {
  clause: PlainLanguageClause;
  glossaryMap: Map<string, GlossaryTerm>;
}) {
  const glossary = Array.from(glossaryMap.values());
  const segments = highlightSegments(clause.legalText, clause.keyTerms, glossary);
  return (
    <>
      {segments.map((seg, i) =>
        seg.glossaryId ? (
          <GlossaryMark key={i} text={seg.text} term={glossaryMap.get(seg.glossaryId)} />
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function GlossaryMark({ text, term }: { text: string; term?: GlossaryTerm }) {
  const tooltipId = useId();
  if (!term) return <span>{text}</span>;
  return (
    <span className="group relative inline-block">
      <mark
        tabIndex={0}
        aria-describedby={tooltipId}
        className="cursor-help rounded bg-amber-100 px-0.5 text-gray-900 underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        {text}
      </mark>
      <span
        role="tooltip"
        id={tooltipId}
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 w-56 rounded-lg bg-gray-900 p-2 text-xs leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
      >
        <span className="font-semibold">{term.term}: </span>
        {term.definition}
      </span>
    </span>
  );
}

export default ContractReader;
