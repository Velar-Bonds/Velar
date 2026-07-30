'use client';
import { useEffect, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import type { AnalyticsQuery, SavedView } from '@velar/types';
import { createSavedView, deleteSavedView, listSavedViews } from '../../lib/analytics/client';

export function SavedViewsMenu({
  token,
  query,
  onApply,
}: {
  token: string;
  query: AnalyticsQuery;
  onApply: (q: AnalyticsQuery) => void;
}) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listSavedViews(token).then(setViews).catch(() => setViews([]));
  }, [token]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const view = await createSavedView(token, { name: name.trim(), query });
      setViews((v) => [view, ...v]);
      setName('');
    } catch {
      // Silently ignored — the input keeps its value so the user can retry.
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setViews((v) => v.filter((x) => x.id !== id));
    await deleteSavedView(token, id).catch(() => {});
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-low"
      >
        <Bookmark size={16} /> Vistas guardadas
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-outline-variant/30 bg-surface p-3 shadow-xl">
          <div className="mb-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre de la vista"
              aria-label="Nombre de la vista"
              className="flex-1 rounded-lg border border-outline-variant/40 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
          {views.length === 0 ? (
            <p className="py-2 text-center text-xs text-on-surface-variant">Sin vistas guardadas.</p>
          ) : (
            <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {views.map((v) => (
                <li key={v.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-surface-container-low">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(v.query);
                      setOpen(false);
                    }}
                    className="flex-1 text-left"
                  >
                    {v.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    aria-label={`Borrar vista ${v.name}`}
                    className="text-on-surface-variant hover:text-error"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
