import type {
  BondStatus,
  BondStatusBreakdown,
  BondToken,
  CountryBreakdown,
  CountryCode,
  PartyBreakdown,
  Transfer,
  ValueVolumeAggregate,
} from '@velar/types';
import { DEFAULT_COUNTRY } from '@velar/types';

/**
 * Pure aggregation functions over bonds/transfers (issue #44). No I/O, no
 * Supabase, no Role/RBAC concept — deterministic given the same inputs.
 */

function faceValueOf(bond: BondToken): number {
  return Number(bond.faceValue) || 0;
}

function amountOf(transfer: Transfer): number {
  return Number(transfer.amount) || 0;
}

function liberadas(transfers: Transfer[]): Transfer[] {
  return transfers.filter((t) => t.status === 'liberada');
}

export function aggregateByBondStatus(bonds: BondToken[]): BondStatusBreakdown[] {
  const map = new Map<BondStatus, { count: number; faceValue: number }>();
  for (const bond of bonds) {
    const cur = map.get(bond.status) ?? { count: 0, faceValue: 0 };
    cur.count += 1;
    cur.faceValue += faceValueOf(bond);
    map.set(bond.status, cur);
  }
  return [...map.entries()].map(([status, v]) => ({ status, ...v }));
}

export function aggregateByParty(bonds: BondToken[], transfers: Transfer[]): PartyBreakdown[] {
  const partyIds = [...new Set(bonds.map((b) => b.issuerPartyId))];
  return partyIds
    .map((partyId) => {
      const partyBonds = bonds.filter((b) => b.issuerPartyId === partyId);
      const tokenIds = new Set(partyBonds.map((b) => b.tokenId));
      const sales = liberadas(transfers).filter((t) => tokenIds.has(t.bondTokenId));
      return {
        partyId,
        bondsCount: partyBonds.length,
        emittedValue: partyBonds.reduce((s, b) => s + faceValueOf(b), 0),
        salesCount: sales.length,
        volumeMoved: sales.reduce((s, t) => s + amountOf(t), 0),
      };
    })
    .sort((a, b) => b.volumeMoved - a.volumeMoved);
}

export function aggregateByCountry(bonds: BondToken[], transfers: Transfer[]): CountryBreakdown[] {
  const countries = [...new Set(bonds.map((b) => (b.country as CountryCode) ?? DEFAULT_COUNTRY))];
  return countries
    .map((country) => {
      const countryBonds = bonds.filter((b) => ((b.country as CountryCode) ?? DEFAULT_COUNTRY) === country);
      const tokenIds = new Set(countryBonds.map((b) => b.tokenId));
      const sales = liberadas(transfers).filter((t) => tokenIds.has(t.bondTokenId));
      return {
        country,
        bondsCount: countryBonds.length,
        emittedValue: countryBonds.reduce((s, b) => s + faceValueOf(b), 0),
        salesCount: sales.length,
        volumeMoved: sales.reduce((s, t) => s + amountOf(t), 0),
      };
    })
    .sort((a, b) => b.volumeMoved - a.volumeMoved);
}

export function aggregateValueVolume(bonds: BondToken[], transfers: Transfer[]): ValueVolumeAggregate {
  const sales = liberadas(transfers);
  return {
    totalBonds: bonds.length,
    totalEmittedValue: bonds.reduce((s, b) => s + faceValueOf(b), 0),
    totalTransfers: transfers.length,
    totalSales: sales.length,
    totalVolumeMoved: sales.reduce((s, t) => s + amountOf(t), 0),
  };
}
