/**
 * Hook de antivirus detrás de una INTERFAZ + STUB. No hay vendor real: todo el
 * flujo de subida corre localmente. En producción se inyecta una implementación
 * concreta (ClamAV, VirusTotal, etc.) sin tocar el resto del módulo.
 */
import { FileScanStatus } from '@velar/types';

/** Token de inyección de Nest para la implementación del scanner. */
export const FILE_SCANNER = Symbol('FILE_SCANNER');

export interface FileScanResult {
  status: FileScanStatus;
  /** Nombre de la amenaza detectada, si la hay. */
  signature: string | null;
}

export interface FileScanner {
  scan(input: { fileName: string; buffer: Buffer }): Promise<FileScanResult>;
}

/**
 * Cadena de prueba estándar EICAR: cualquier antivirus real la marca como
 * infectada. La usamos para ejercitar la rama "infected" sin malware real.
 */
export const EICAR_TEST_SIGNATURE =
  'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/**
 * Stub determinístico: marca 'infected' si el contenido incluye la firma EICAR,
 * de lo contrario 'clean'. Suficiente para probar ambas ramas end-to-end.
 */
export class StubFileScanner implements FileScanner {
  async scan(input: { fileName: string; buffer: Buffer }): Promise<FileScanResult> {
    const text = input.buffer.toString('latin1');
    if (text.includes(EICAR_TEST_SIGNATURE)) {
      return { status: FileScanStatus.INFECTED, signature: 'EICAR-Test-File' };
    }
    return { status: FileScanStatus.CLEAN, signature: null };
  }
}
