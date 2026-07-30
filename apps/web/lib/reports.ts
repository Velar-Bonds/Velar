'use client';
/**
 * Helpers de UI para el ciclo de vida del reporte mensual del partido.
 * La lógica dura vive en el backend; acá solo hay formato, etiquetas y una
 * copia mínima del cálculo de vencimiento para pintar badges sin ida al server.
 */
import { API_URL } from './api';
import type {
  ComplianceStatus,
  ReportStatus,
  ReportLineCategory,
} from '@velar/types';

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  en_revision: 'En revisión',
  revisado: 'Revisado',
  observado: 'Observado',
  reenviado: 'Reenviado',
  aprobado: 'Aprobado',
};

export const STATUS_STYLE: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600 border-gray-200',
  enviado: 'bg-blue-50 text-primary border-blue-200',
  en_revision: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  revisado: 'bg-amber-50 text-amber-700 border-amber-200',
  observado: 'bg-red-50 text-red-600 border-red-200',
  reenviado: 'bg-blue-50 text-primary border-blue-200',
  aprobado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const CATEGORY_LABEL: Record<ReportLineCategory, string> = {
  ingreso: 'Ingreso',
  egreso: 'Egreso',
  donacion: 'Donación',
  bono: 'Bono',
  otro: 'Otro',
};

export const COMPLIANCE_LABEL: Record<ComplianceStatus, string> = {
  not_due: 'A tiempo',
  on_time: 'Enviado a tiempo',
  late: 'Enviado tarde',
  overdue: 'Vencido',
  missing: 'Sin enviar',
};

export const COMPLIANCE_STYLE: Record<ComplianceStatus, string> = {
  not_due: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_time: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  late: 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-red-50 text-red-600 border-red-200',
  missing: 'bg-red-50 text-red-600 border-red-200',
};

export const fmtCRC = (n?: number | null) =>
  n == null
    ? 'Sin dato'
    : new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
        maximumFractionDigits: 0,
      }).format(n);

export const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

export function periodLabel(year: number, month: number) {
  return `${MONTHS_ES[(month - 1) % 12]} ${year}`;
}

/**
 * Copia mínima del cálculo de cumplimiento (default: vence el 15 del mes
 * siguiente, 5 días de gracia). Espejo de la lógica pura del backend para
 * pintar badges en el cliente.
 */
export function clientCompliance(
  periodYear: number,
  periodMonth: number,
  submittedAt: string | null,
  now: Date = new Date(),
): { status: ComplianceStatus; dueDate: string; daysRemaining: number | null } {
  const dueYear = periodMonth === 12 ? periodYear + 1 : periodYear;
  const dueMonth = periodMonth === 12 ? 1 : periodMonth + 1;
  const due = new Date(Date.UTC(dueYear, dueMonth - 1, 15));
  const graceEnd = new Date(due.getTime() + 5 * 86_400_000);
  const dueDate = due.toISOString().slice(0, 10);
  const dayMs = 86_400_000;
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  if (submittedAt) {
    const sub = new Date(submittedAt);
    const subUtc = Date.UTC(sub.getUTCFullYear(), sub.getUTCMonth(), sub.getUTCDate());
    return {
      status: subUtc <= due.getTime() ? 'on_time' : 'late',
      dueDate,
      daysRemaining: null,
    };
  }
  const daysRemaining = Math.round((due.getTime() - nowUtc) / dayMs);
  let status: ComplianceStatus;
  if (daysRemaining >= 0) status = 'not_due';
  else if (nowUtc <= graceEnd.getTime()) status = 'overdue';
  else status = 'missing';
  return { status, dueDate, daysRemaining };
}

/** Subida multipart de un archivo del reporte (apiFetch usa JSON; esto usa FormData). */
export async function uploadReportFile(token: string, reportId: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(
    `${API_URL.replace(/\/$/, '')}/reports/lifecycle/${reportId}/files`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const msg =
      (json?.error?.message as string) ??
      (json?.message as string) ??
      `Error ${res.status} al subir el archivo`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return res.json();
}

export type { ReportStatus };
