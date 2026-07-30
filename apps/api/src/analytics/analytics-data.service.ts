import { BadRequestException, Injectable } from '@nestjs/common';
import type { AnalyticsInput, BondToken, MonthlyReport, Transfer } from '@velar/types';
import { SupabaseService } from '../common/supabase/supabase.service';

/**
 * The ONLY place in the analytics module that touches Supabase (issue #44).
 * Maps snake_case rows to the `@velar/types` shapes the pure engine consumes.
 * Mirrors the mapper style of `AuditService`/`ReportLifecycleService` — each
 * module keeps its own small row mapper rather than sharing one.
 */
@Injectable()
export class AnalyticsDataService {
  constructor(private supabase: SupabaseService) {}

  async getAnalyticsInput(): Promise<AnalyticsInput> {
    const [bondsRes, transfersRes, reportsRes] = await Promise.all([
      this.supabase.admin.from('bonds').select('*'),
      this.supabase.admin.from('transfers').select('*'),
      this.supabase.admin.from('reports').select('*'),
    ]);

    if (bondsRes.error) throw new BadRequestException(bondsRes.error.message);
    if (transfersRes.error) throw new BadRequestException(transfersRes.error.message);
    if (reportsRes.error) throw new BadRequestException(reportsRes.error.message);

    return {
      bonds: (bondsRes.data ?? []).map((b: any) => this.mapBond(b)),
      transfers: (transfersRes.data ?? []).map((t: any) => this.mapTransfer(t)),
      // `reports` also holds rows from the legacy free-text model (pre-lifecycle
      // migration) which have no period_year/period_month — those can't feed
      // compliance/period aggregation, so they're excluded here.
      reports: (reportsRes.data ?? [])
        .filter((r: any) => r.period_year != null && r.period_month != null)
        .map((r: any) => this.mapReport(r)),
    };
  }

  private mapBond(bond: any): BondToken {
    return {
      tokenId: bond.token_id,
      bondId: bond.bond_id,
      issuerPartyId: bond.issuer_party_id,
      country: bond.country ?? null,
      currentOwner: bond.current_owner,
      status: bond.status,
      documentHash: bond.document_hash,
      metadataUri: bond.metadata_uri ?? null,
      faceValue: bond.face_value ?? null,
      certificateNumber: bond.certificate_number ?? null,
      currency: bond.currency ?? null,
      interestRate: bond.interest_rate ?? null,
      series: bond.series ?? null,
      issueDate: bond.issue_date ?? null,
      maturityDate: bond.maturity_date ?? null,
      stellarStatus: bond.stellar_status ?? null,
      stellarTransactionHash: bond.stellar_transaction_hash ?? null,
      stellarLedger: bond.stellar_ledger ?? null,
      stellarAssetCode: bond.stellar_asset_code ?? null,
      stellarIssuerPublicKey: bond.stellar_issuer_public_key ?? null,
      stellarOwnerPublicKey: bond.stellar_owner_public_key ?? null,
      stellarRegisteredAt: bond.stellar_registered_at ?? null,
      stellarError: bond.stellar_error ?? null,
      createdAt: bond.created_at,
      updatedAt: bond.updated_at,
    };
  }

  private mapTransfer(transfer: any): Transfer {
    return {
      id: transfer.id,
      bondTokenId: transfer.bond_token_id,
      fromOwner: transfer.from_owner,
      toOwner: transfer.to_owner,
      status: transfer.status,
      escrowContractId: transfer.escrow_contract_id ?? null,
      paymentEvidenceHash: transfer.payment_evidence_hash ?? null,
      validatedBy: transfer.validated_by ?? null,
      amount: transfer.amount ?? null,
      counterOfferAmount: transfer.counter_offer_amount ?? null,
      sellerMessage: transfer.seller_message ?? null,
      buyerMessage: transfer.buyer_message ?? null,
      createdAt: transfer.created_at,
      updatedAt: transfer.updated_at,
    };
  }

  private mapReport(r: any): MonthlyReport {
    return {
      id: r.id,
      partyId: r.party_id,
      periodYear: r.period_year,
      periodMonth: r.period_month,
      status: r.status,
      currentVersion: r.current_version ?? 0,
      title: r.title,
      submittedBy: r.submitted_by ?? null,
      submittedAt: r.submitted_at ?? null,
      reviewedBy: r.reviewed_by ?? null,
      reviewedAt: r.reviewed_at ?? null,
      tseNotes: r.tse_notes ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}
