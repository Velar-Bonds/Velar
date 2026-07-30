import type { AnalyticsInput } from '@velar/types';
import { analyticsFixture } from '@velar/types';
import { computeTransferFunnel } from './funnel';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));

describe('computeTransferFunnel', () => {
  it('counts totals, stages, conversion and drop-off over the fixture', () => {
    const { transfers } = clone(analyticsFixture);
    const funnel = computeTransferFunnel(transfers);

    expect(funnel.totalStarted).toBe(9);
    expect(funnel.rejectedCount).toBe(1);
    expect(funnel.cancelledCount).toBe(1);
    expect(funnel.completedCount).toBe(3);

    expect(funnel.stages.map((s) => s.step)).toEqual([
      'solicitada',
      'aceptada',
      'en_escrow',
      'pago_registrado',
      'pago_validado',
      'liberada',
    ]);

    const byStep = Object.fromEntries(funnel.stages.map((s) => [s.step, s]));
    expect(byStep['solicitada']).toMatchObject({ reachedCount: 6, conversionFromStartPct: 66.67, dropOffPct: 0 });
    expect(byStep['aceptada']).toMatchObject({ reachedCount: 5, conversionFromStartPct: 55.56, dropOffPct: 16.67 });
    expect(byStep['en_escrow']).toMatchObject({ reachedCount: 5, conversionFromStartPct: 55.56, dropOffPct: 0 });
    expect(byStep['pago_registrado']).toMatchObject({ reachedCount: 4, conversionFromStartPct: 44.44, dropOffPct: 20 });
    expect(byStep['pago_validado']).toMatchObject({ reachedCount: 3, conversionFromStartPct: 33.33, dropOffPct: 25 });
    expect(byStep['liberada']).toMatchObject({ reachedCount: 3, conversionFromStartPct: 33.33, dropOffPct: 0 });
  });

  it('empty transfer list yields zeroed funnel with no drop-off', () => {
    const funnel = computeTransferFunnel([]);
    expect(funnel.totalStarted).toBe(0);
    expect(funnel.rejectedCount).toBe(0);
    expect(funnel.cancelledCount).toBe(0);
    expect(funnel.completedCount).toBe(0);
    for (const stage of funnel.stages) {
      expect(stage.reachedCount).toBe(0);
      expect(stage.conversionFromStartPct).toBe(0);
      expect(stage.dropOffPct).toBe(0);
    }
  });

  it('a single completed transfer reaches every stage with no drop-off', () => {
    const { transfers } = clone(analyticsFixture);
    const single = transfers.filter((t) => t.id === 'transfer-a1-1');
    const funnel = computeTransferFunnel(single);
    expect(funnel.totalStarted).toBe(1);
    expect(funnel.completedCount).toBe(1);
    for (const stage of funnel.stages) {
      expect(stage.reachedCount).toBe(1);
      expect(stage.conversionFromStartPct).toBe(100);
      expect(stage.dropOffPct).toBe(0);
    }
  });

  it('off-path statuses (contraoferta) never count toward any stage', () => {
    const { transfers } = clone(analyticsFixture);
    const single = transfers.filter((t) => t.id === 'transfer-a2-2'); // status: contraoferta
    const funnel = computeTransferFunnel(single);
    expect(funnel.totalStarted).toBe(1);
    expect(funnel.rejectedCount).toBe(0);
    expect(funnel.cancelledCount).toBe(0);
    for (const stage of funnel.stages) {
      expect(stage.reachedCount).toBe(0);
    }
  });
});
