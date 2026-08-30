'use client';

import { useCallback, useEffect, useState } from 'react';
import { History, Search, UserCog, Users } from 'lucide-react';
import { TSEShell } from '../../../components/TSEShell';
import { PaginationControls } from '../../../components/PaginationControls';
import { notify } from '../../../components/Toast';
import { apiFetch, useSession } from '../../../lib/api';
import { paginationMeta, unwrapPaginated } from '../../../lib/pagination';

const ROLES = ['comprador', 'recomprador', 'emisor', 'validador', 'tse', 'admin'] as const;
type Role = typeof ROLES[number];
type UserRow = { id: string; full_name: string | null; email: string; role: Role; created_at?: string };
type AuditEvent = { id: string; type: string; actorId: string | null; payload: Record<string, unknown>; createdAt: string };

const formatDate = (value: string) => new Date(value).toLocaleString('es-CR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const errorMessage = (cause: unknown, fallback: string) => cause instanceof Error ? cause.message : fallback;

export default function UsuariosPage() {
  const { token, me, loading, error } = useSession();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<Role>('comprador');
  const [busy, setBusy] = useState(false);
  const [auditFor, setAuditFor] = useState<UserRow | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const limit = 20;
  const canManage = me?.role === 'admin';

  const loadUsers = useCallback(async () => {
    if (!token) return;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.set('role', role);
    if (searchTerm) params.set('search', searchTerm);
    try {
      const result = await apiFetch(token, 'GET', `/users?${params}`);
      const users = unwrapPaginated<UserRow>(result);
      setRows(users);
      setTotal(paginationMeta(result, users.length).total);
      setSelected((current) => current.filter((id) => users.some((user) => user.id === id)));
    } catch (cause: unknown) {
      notify.err(errorMessage(cause, 'No se pudo cargar el directorio de usuarios'));
    }
  }, [page, role, searchTerm, token]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- la actualización ocurre al resolver la petición asíncrona.
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearchTerm(search.trim());
  }

  function toggleUser(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function assignBulkRole() {
    if (!token || selected.length === 0) return;
    setBusy(true);
    try {
      const result = await apiFetch(token, 'POST', '/users/bulk-role', { userIds: selected, role: targetRole }) as { updated: string[] };
      notify.ok(`Rol actualizado para ${result.updated.length} usuario${result.updated.length === 1 ? '' : 's'}`);
      setSelected([]);
      await loadUsers();
    } catch (cause: unknown) {
      notify.err(errorMessage(cause, 'No se pudieron actualizar los roles'));
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(user: UserRow, nextRole: Role) {
    if (!token || nextRole === user.role) return;
    setBusy(true);
    try {
      await apiFetch(token, 'PATCH', `/users/${user.id}/role`, { role: nextRole });
      notify.ok(`Rol de ${user.full_name ?? user.email} actualizado`);
      await loadUsers();
    } catch (cause: unknown) {
      notify.err(errorMessage(cause, 'No se pudo actualizar el rol'));
    } finally {
      setBusy(false);
    }
  }

  async function setAccountActive(user: UserRow, active: boolean) {
    if (!token) return;
    const verb = active ? 'reactivar' : 'desactivar';
    if (!active && !window.confirm(`¿Desactivar la cuenta de ${user.full_name ?? user.email}? Esta persona no podrá iniciar sesión hasta reactivarla.`)) return;
    setBusy(true);
    try {
      await apiFetch(token, 'PATCH', `/users/${user.id}/${active ? 'reactivate' : 'deactivate'}`);
      notify.ok(`Cuenta de ${user.full_name ?? user.email} ${active ? 'reactivada' : 'desactivada'}`);
      await loadUsers();
    } catch (cause: unknown) {
      notify.err(errorMessage(cause, `No se pudo ${verb} la cuenta`));
    } finally {
      setBusy(false);
    }
  }

  async function openAudit(user: UserRow) {
    if (!token) return;
    setAuditFor(user);
    setAuditEvents([]);
    setAuditLoading(true);
    try {
      setAuditEvents(await apiFetch(token, 'GET', `/users/${user.id}/audit`) as AuditEvent[]);
    } catch (cause: unknown) {
      notify.err(errorMessage(cause, 'No se pudo cargar la trazabilidad'));
    } finally {
      setAuditLoading(false);
    }
  }

  if (loading || !token || !me) {
    return <div className="flex min-h-screen items-center justify-center">{error ? <p className="text-sm text-red-600">{error}</p> : <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}</div>;
  }

  return (
    <TSEShell me={me}>
      <header className="sticky top-0 z-30 border-b border-surface-variant/40 bg-[#FAFCFF]/85 px-8 py-5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users size={20} /></span>
          <div><h1 className="text-2xl font-bold" style={{ fontFamily: 'Geist' }}>Administración de usuarios</h1><p className="text-sm text-on-surface-variant">Directorio, roles y trazabilidad de cambios.</p></div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] space-y-5 p-8 pb-16">
        <form onSubmit={submitSearch} className="flex flex-wrap gap-3">
          <label className="relative min-w-[250px] flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o correo" className="w-full rounded-xl border border-outline-variant/40 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary" /></label>
          <select value={role} onChange={(event) => { setRole(event.target.value as Role | ''); setPage(1); }} className="rounded-xl border border-outline-variant/40 bg-white px-3 text-sm"><option value="">Todos los roles</option>{ROLES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Buscar</button>
        </form>

        {canManage && <section className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <UserCog size={18} className="text-primary" /><p className="mr-auto text-sm"><strong>{selected.length}</strong> usuario{selected.length === 1 ? '' : 's'} seleccionado{selected.length === 1 ? '' : 's'}</p>
          <select value={targetRole} onChange={(event) => setTargetRole(event.target.value as Role)} className="rounded-lg border border-outline-variant/40 bg-white px-3 py-2 text-sm">{ROLES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button type="button" onClick={() => void assignBulkRole()} disabled={busy || selected.length === 0} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Asignar rol</button>
        </section>}

        <section className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant"><tr>{canManage && <th className="w-12 px-4 py-3"><input aria-label="Seleccionar todos los usuarios de esta página" type="checkbox" checked={rows.length > 0 && selected.length === rows.length} onChange={(event) => setSelected(event.target.checked ? rows.map((user) => user.id) : [])} /></th>}<th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Registro</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-outline-variant/20">
            {rows.map((user) => <tr key={user.id} className="hover:bg-primary/[0.02]">{canManage && <td className="px-4 py-3"><input aria-label={`Seleccionar ${user.email}`} type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleUser(user.id)} /></td>}<td className="px-4 py-3 font-medium">{user.full_name ?? 'Sin nombre'}</td><td className="px-4 py-3 text-on-surface-variant">{user.email}</td><td className="px-4 py-3">{canManage ? <select aria-label={`Rol de ${user.email}`} value={user.role} disabled={busy} onChange={(event) => void changeRole(user, event.target.value as Role)} className="rounded-lg border border-outline-variant/40 bg-white px-2 py-1 capitalize">{ROLES.map((item) => <option key={item} value={item}>{item}</option>)}</select> : <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs capitalize">{user.role}</span>}</td><td className="px-4 py-3 text-on-surface-variant">{user.created_at ? formatDate(user.created_at) : '—'}</td><td className="px-4 py-3 text-right"><div className="inline-flex flex-wrap justify-end gap-1"><button type="button" onClick={() => void openAudit(user)} className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/40 px-2.5 py-1.5 text-xs font-semibold hover:bg-surface-container-low"><History size={14} /> Auditoría</button>{canManage && <><button type="button" disabled={busy} onClick={() => void setAccountActive(user, false)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">Desactivar</button><button type="button" disabled={busy} onClick={() => void setAccountActive(user, true)} className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50">Reactivar</button></>}</div></td></tr>)}
            {rows.length === 0 && <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-12 text-center text-on-surface-variant">No se encontraron usuarios.</td></tr>}
          </tbody></table></div>
          <PaginationControls page={page} limit={limit} total={total} onPageChange={setPage} disabled={busy} />
        </section>

        {auditFor && <section className="rounded-2xl border border-outline-variant/30 bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-semibold">Auditoría de {auditFor.full_name ?? auditFor.email}</h2><p className="text-sm text-on-surface-variant">Cambios de rol y activación de cuenta.</p></div><button type="button" onClick={() => setAuditFor(null)} className="text-sm font-medium text-primary">Cerrar</button></div>{auditLoading ? <p className="text-sm text-on-surface-variant">Cargando eventos…</p> : <div className="space-y-3">{auditEvents.map((event) => <div key={event.id} className="rounded-xl bg-surface-container-low p-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{event.type.replaceAll('_', ' ')}</strong><span className="text-xs text-on-surface-variant">{formatDate(event.createdAt)}</span></div><p className="mt-1 text-xs text-on-surface-variant">Actor: {event.actorId ?? 'sistema'} · {JSON.stringify(event.payload)}</p></div>)}{auditEvents.length === 0 && <p className="text-sm text-on-surface-variant">No hay eventos de administración para este usuario.</p>}</div>}</section>}
      </div>
    </TSEShell>
  );
}
