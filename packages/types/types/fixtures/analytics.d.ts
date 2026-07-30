import type { AnalyticsInput } from '../analytics';
export declare const analyticsFixture: AnalyticsInput;
/** Stable identifiers referenced by tests. */
export declare const analyticsFixtureIds: {
    parties: {
        libertad: string;
        renovacion: string;
        avanza: string;
    };
    buyers: {
        buyer1: string;
        buyer2: string;
        buyer3: string;
    };
    tse: string;
};
/**
 * Reference "now" for deterministic compliance/time-series tests. Chosen so
 * `report-libertad-2026-03` (due 2026-04-15, +5 days grace) is clearly past
 * its grace period, i.e. `missing`.
 */
export declare const analyticsFixtureNow = "2026-07-01T00:00:00.000Z";
