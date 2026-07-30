'use client';
import { useParams } from 'next/navigation';
import { TraceabilityView } from '../TraceabilityView';
import { ContractReader } from '../../../components/contract-reader/ContractReader';
import { ProvenanceExplorer } from '../../../components/provenance/ProvenanceExplorer';

export default function VerificarDetallePage() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : (raw ?? '');
  const bondId = decodeURIComponent(id);
  return (
    <>
      <TraceabilityView idOrToken={bondId} />
      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Procedencia verificada</h2>
        <ProvenanceExplorer subjectId={bondId} mode="public" />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-12">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Entiende el contrato</h2>
        <ContractReader bondId={bondId} />
      </div>
    </>
  );
}
