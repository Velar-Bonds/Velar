import {
  sha256,
  validateUpload,
  reportFilePath,
  FileValidationError,
  REPORT_FILE_MAX_BYTES,
} from './file-validation';
import {
  StubFileScanner,
  EICAR_TEST_SIGNATURE,
} from './file-scanner';
import { FileScanStatus } from '@velar/types';

describe('sha256 checksum', () => {
  it('is stable and matches a known vector', () => {
    // sha256("") = e3b0c442...
    expect(sha256(Buffer.from(''))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    const buf = Buffer.from('velar');
    expect(sha256(buf)).toBe(sha256(buf));
  });
});

describe('validateUpload', () => {
  const ok = { fileName: 'reporte.pdf', mimeType: 'application/pdf', sizeBytes: 1024 };

  it('accepts an allowed pdf under the size cap', () => {
    expect(() => validateUpload(ok)).not.toThrow();
  });

  it('rejects a disallowed mime type', () => {
    expect(() =>
      validateUpload({ ...ok, mimeType: 'application/x-msdownload' }),
    ).toThrow(FileValidationError);
  });

  it('rejects an empty file', () => {
    expect(() => validateUpload({ ...ok, sizeBytes: 0 })).toThrow(FileValidationError);
  });

  it('rejects a file over the size cap', () => {
    expect(() =>
      validateUpload({ ...ok, sizeBytes: REPORT_FILE_MAX_BYTES + 1 }),
    ).toThrow(/máximo/);
  });

  it('rejects a nameless file', () => {
    expect(() => validateUpload({ ...ok, fileName: '  ' })).toThrow(FileValidationError);
  });
});

describe('reportFilePath', () => {
  it('builds <party>/<report>/<name> and sanitizes the name', () => {
    expect(reportFilePath('p1', 'r1', 'mi reporte (final).pdf')).toBe(
      'p1/r1/mi_reporte_final_.pdf',
    );
  });
});

describe('StubFileScanner', () => {
  const scanner = new StubFileScanner();

  it('marks clean content as clean', async () => {
    const res = await scanner.scan({ fileName: 'a.pdf', buffer: Buffer.from('hola') });
    expect(res.status).toBe(FileScanStatus.CLEAN);
    expect(res.signature).toBeNull();
  });

  it('flags EICAR test content as infected', async () => {
    const res = await scanner.scan({
      fileName: 'virus.pdf',
      buffer: Buffer.from(EICAR_TEST_SIGNATURE, 'latin1'),
    });
    expect(res.status).toBe(FileScanStatus.INFECTED);
    expect(res.signature).toBe('EICAR-Test-File');
  });
});
