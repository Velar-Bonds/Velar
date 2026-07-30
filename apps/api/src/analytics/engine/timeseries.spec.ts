import type { AnalyticsInput, Transfer } from '@velar/types';
import { analyticsFixture } from '@velar/types';
import { bucketByDate, escrowResolutionTimeSeries, issuanceTimeSeries, transferTimeSeries } from './timeseries';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));

describe('bucketByDate', () => {
  const items = [
    { date: '2026-01-01T00:00:00.000Z', value: 10 },
    { date: '2026-01-01T18:00:00.000Z', value: 5 },
    { date: '2026-01-02T00:00:00.000Z', value: 1 },
  ];

  it('day bucket groups by calendar date', () => {
    const points = bucketByDate(items, (i) => i.date, (i) => i.value, 'day');
    expect(points).toEqual([
      { bucketStart: '2026-01-01', value: 15, count: 2 },
      { bucketStart: '2026-01-02', value: 1, count: 1 },
    ]);
  });

  it('week bucket groups nearby dates together and separates a date 10 days later', () => {
    const weekItems = [
      { date: '2026-06-10T00:00:00.000Z', value: 10 }, // Wednesday
      { date: '2026-06-11T00:00:00.000Z', value: 5 }, // Thursday, same week
      { date: '2026-06-21T00:00:00.000Z', value: 7 }, // 10 days later, different week
    ];
    const points = bucketByDate(weekItems, (i) => i.date, (i) => i.value, 'week');
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ value: 15, count: 2 });
    expect(points[1]).toMatchObject({ value: 7, count: 1 });
    expect(points[0].bucketStart).not.toBe(points[1].bucketStart);
  });

  it('month bucket groups the whole month together', () => {
    const points = bucketByDate(
      [{ date: '2026-03-01T00:00:00.000Z', value: 1 }, { date: '2026-03-31T00:00:00.000Z', value: 2 }],
      (i) => i.date,
      (i) => i.value,
      'month',
    );
    expect(points).toEqual([{ bucketStart: '2026-03-01', value: 3, count: 2 }]);
  });

  it('empty input yields no points', () => {
    expect(bucketByDate([], () => '2026-01-01', () => 1)).toEqual([]);
  });
});

describe('issuanceTimeSeries', () => {
  it('buckets bond face value by month over the fixture', () => {
    const { bonds } = clone(analyticsFixture);
    const points = issuanceTimeSeries(bonds, 'month');
    expect(points).toEqual([
      { bucketStart: '2026-01-01', value: 2_200_000, count: 2 },
      { bucketStart: '2026-02-01', value: 800_000, count: 2 },
      { bucketStart: '2026-03-01', value: 750_000, count: 1 },
      { bucketStart: '2026-04-01', value: 13_000_000, count: 2 },
    ]);
  });
});

describe('transferTimeSeries', () => {
  it('buckets only liberada transfer amounts by month', () => {
    const { transfers } = clone(analyticsFixture);
    const points = transferTimeSeries(transfers, 'month');
    expect(points).toEqual([
      { bucketStart: '2026-01-01', value: 2_300_000, count: 2 },
      { bucketStart: '2026-04-01', value: 5_200_000, count: 1 },
    ]);
  });
});

describe('escrowResolutionTimeSeries', () => {
  const makeTransfer = (over: Partial<Transfer>): Transfer => ({
    id: 'synthetic',
    bondTokenId: 'bond-x',
    fromOwner: 'owner-a',
    toOwner: 'owner-b',
    status: 'liberada',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  });

  it('buckets resolution days (createdAt→updatedAt) of terminal transfers only, excluding still-open ones', () => {
    const transfers: Transfer[] = [
      makeTransfer({ id: 't1', status: 'liberada', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-05T00:00:00.000Z' }), // 4 days
      makeTransfer({ id: 't2', status: 'cancelada', createdAt: '2026-01-10T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z' }), // 23 days
      makeTransfer({ id: 't3', status: 'rechazada', createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-10T00:00:00.000Z' }), // 9 days
      makeTransfer({ id: 't4', status: 'en_escrow', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }), // excluded
    ];
    const points = escrowResolutionTimeSeries(transfers, 'month');
    expect(points).toEqual([
      { bucketStart: '2026-01-01', value: 4, count: 1 },
      { bucketStart: '2026-02-01', value: 32, count: 2 },
    ]);
  });
});
