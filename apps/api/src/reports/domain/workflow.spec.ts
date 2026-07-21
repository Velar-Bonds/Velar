import {
  assertTransition,
  canTransition,
  isEditable,
  isTerminal,
  nextStatuses,
  resolveSubmit,
  InvalidTransitionError,
} from './workflow';
import { ReportStatus } from '@velar/types';

describe('workflow transitions', () => {
  it('allows the full happy path', () => {
    expect(canTransition(ReportStatus.BORRADOR, ReportStatus.ENVIADO)).toBe(true);
    expect(canTransition(ReportStatus.ENVIADO, ReportStatus.EN_REVISION)).toBe(true);
    expect(canTransition(ReportStatus.EN_REVISION, ReportStatus.APROBADO)).toBe(true);
  });

  it('allows the correction loop', () => {
    expect(canTransition(ReportStatus.EN_REVISION, ReportStatus.OBSERVADO)).toBe(true);
    expect(canTransition(ReportStatus.OBSERVADO, ReportStatus.REENVIADO)).toBe(true);
    expect(canTransition(ReportStatus.REENVIADO, ReportStatus.EN_REVISION)).toBe(true);
  });

  it('rejects illegal jumps', () => {
    expect(canTransition(ReportStatus.BORRADOR, ReportStatus.APROBADO)).toBe(false);
    expect(canTransition(ReportStatus.APROBADO, ReportStatus.ENVIADO)).toBe(false);
    expect(canTransition(ReportStatus.ENVIADO, ReportStatus.APROBADO)).toBe(false);
  });

  it('assertTransition throws InvalidTransitionError on illegal moves', () => {
    expect(() => assertTransition(ReportStatus.BORRADOR, ReportStatus.APROBADO)).toThrow(
      InvalidTransitionError,
    );
    expect(() =>
      assertTransition(ReportStatus.EN_REVISION, ReportStatus.OBSERVADO),
    ).not.toThrow();
  });

  it('aprobado is terminal', () => {
    expect(isTerminal(ReportStatus.APROBADO)).toBe(true);
    expect(nextStatuses(ReportStatus.APROBADO)).toEqual([]);
    expect(isTerminal(ReportStatus.BORRADOR)).toBe(false);
  });

  it('only borrador and observado are editable by the party', () => {
    expect(isEditable(ReportStatus.BORRADOR)).toBe(true);
    expect(isEditable(ReportStatus.OBSERVADO)).toBe(true);
    expect(isEditable(ReportStatus.EN_REVISION)).toBe(false);
    expect(isEditable(ReportStatus.APROBADO)).toBe(false);
  });
});

describe('resolveSubmit', () => {
  it('first submission: borrador → enviado, not a resubmission', () => {
    expect(resolveSubmit(ReportStatus.BORRADOR)).toEqual({
      next: ReportStatus.ENVIADO,
      isResubmission: false,
    });
  });

  it('correction: observado → reenviado, marked as resubmission', () => {
    expect(resolveSubmit(ReportStatus.OBSERVADO)).toEqual({
      next: ReportStatus.REENVIADO,
      isResubmission: true,
    });
  });

  it('cannot submit from a non-editable state', () => {
    expect(() => resolveSubmit(ReportStatus.EN_REVISION)).toThrow();
    expect(() => resolveSubmit(ReportStatus.APROBADO)).toThrow();
  });
});
