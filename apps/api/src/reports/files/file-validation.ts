/**
 * Validación de subida + checksum — funciones puras. Sin DB, sin framework.
 */
import { createHash } from 'crypto';

/** SHA-256 en hex del contenido del archivo (integridad). */
export function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export const REPORT_FILE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const REPORT_FILE_ALLOWED_MIME = [
  'application/pdf',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
] as const;

export interface UploadCandidate {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Valida tipo y tamaño. Lanza FileValidationError si algo no cumple; el service
 * lo mapea a BadRequestException.
 */
export function validateUpload(
  file: UploadCandidate,
  opts: { maxBytes?: number; allowedMime?: readonly string[] } = {},
): void {
  const maxBytes = opts.maxBytes ?? REPORT_FILE_MAX_BYTES;
  const allowedMime = opts.allowedMime ?? REPORT_FILE_ALLOWED_MIME;

  if (!file.fileName?.trim()) {
    throw new FileValidationError('El archivo debe tener un nombre');
  }
  if (!allowedMime.includes(file.mimeType)) {
    throw new FileValidationError(`Tipo de archivo no permitido: ${file.mimeType}`);
  }
  if (file.sizeBytes <= 0) {
    throw new FileValidationError('El archivo está vacío');
  }
  if (file.sizeBytes > maxBytes) {
    throw new FileValidationError(
      `El archivo supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB`,
    );
  }
}

/** Ruta canónica dentro del bucket privado: <party_id>/<report_id>/<file_name>. */
export function reportFilePath(partyId: string, reportId: string, fileName: string): string {
  const safeName = fileName.replace(/[^\w.-]+/g, '_');
  return `${partyId}/${reportId}/${safeName}`;
}
