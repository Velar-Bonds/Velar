import type { AnalyticsInput } from '@velar/types';
import { analyticsFixture, analyticsFixtureIds } from '@velar/types';
import { aggregateByBondStatus, aggregateByCountry, aggregateByParty, aggregateValueVolume } from './aggregations';

const clone = (input: AnalyticsInput): AnalyticsInput => JSON.parse(JSON.stringify(input));
const ids = analyticsFixtureIds;

describe('aggregateByBondStatus', () => {
  it('groups bonds by status with count and summed face value', () => {
    const result = aggregateByBondStatus(clone(analyticsFixture).bonds);
    const byStatus = Object.fromEntries(result.map((r) => [r.status, r]));
    expect(byStatus['transferido']).toEqual({ status: 'transferido', count: 3, faceValue: 7_200_000 });
    expect(byStatus['activo']).toEqual({ status: 'activo', count: 1, faceValue: 500_000 });
    expect(byStatus['en_escrow']).toEqual({ status: 'en_escrow', count: 1, faceValue: 750_000 });
    expect(byStatus['cancelado']).toEqual({ status: 'cancelado', count: 1, faceValue: 300_000 });
    expect(byStatus['emitido']).toEqual({ status: 'emitido', count: 1, faceValue: 8_000_000 });
  });

  it('returns an empty array for no bonds', () => {
    expect(aggregateByBondStatus([])).toEqual([]);
  });
});

describe('aggregateByParty', () => {
  it('sums emitted value and sales volume per party, sorted by volume desc', () => {
    const { bonds, transfers } = clone(analyticsFixture);
    const result = aggregateByParty(bonds, transfers);
    expect(result.map((r) => r.partyId)).toEqual([ids.parties.avanza, ids.parties.renovacion, ids.parties.libertad]);

    const libertad = result.find((r) => r.partyId === ids.parties.libertad)!;
    expect(libertad).toMatchObject({ bondsCount: 3, emittedValue: 2_250_000, salesCount: 1, volumeMoved: 1_050_000 });

    const renovacion = result.find((r) => r.partyId === ids.parties.renovacion)!;
    expect(renovacion).toMatchObject({ bondsCount: 2, emittedValue: 1_500_000, salesCount: 1, volumeMoved: 1_250_000 });

    const avanza = result.find((r) => r.partyId === ids.parties.avanza)!;
    expect(avanza).toMatchObject({ bondsCount: 2, emittedValue: 13_000_000, salesCount: 1, volumeMoved: 5_200_000 });
  });

  it('single-party dataset produces one entry', () => {
    const { bonds, transfers } = clone(analyticsFixture);
    const onlyLibertad = bonds.filter((b) => b.issuerPartyId === ids.parties.libertad);
    const result = aggregateByParty(onlyLibertad, transfers);
    expect(result).toHaveLength(1);
  });
});

describe('aggregateByCountry', () => {
  it('sums per country, sorted by volume desc', () => {
    const { bonds, transfers } = clone(analyticsFixture);
    const result = aggregateByCountry(bonds, transfers);
    expect(result.map((r) => r.country)).toEqual(['CO', 'CR']);

    const cr = result.find((r) => r.country === 'CR')!;
    expect(cr).toMatchObject({ bondsCount: 5, emittedValue: 3_750_000, salesCount: 2, volumeMoved: 2_300_000 });

    const co = result.find((r) => r.country === 'CO')!;
    expect(co).toMatchObject({ bondsCount: 2, emittedValue: 13_000_000, salesCount: 1, volumeMoved: 5_200_000 });
  });
});

describe('aggregateValueVolume', () => {
  it('computes totals across all bonds and transfers', () => {
    const { bonds, transfers } = clone(analyticsFixture);
    expect(aggregateValueVolume(bonds, transfers)).toEqual({
      totalBonds: 7,
      totalEmittedValue: 16_750_000,
      totalTransfers: 9,
      totalSales: 3,
      totalVolumeMoved: 7_500_000,
    });
  });

  it('empty dataset yields all-zero totals', () => {
    expect(aggregateValueVolume([], [])).toEqual({
      totalBonds: 0,
      totalEmittedValue: 0,
      totalTransfers: 0,
      totalSales: 0,
      totalVolumeMoved: 0,
    });
  });
});
