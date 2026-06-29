'use client';
import { useParams } from 'next/navigation';
import { TraceabilityView } from '../TraceabilityView';

export default function VerificarDetallePage() {
  const params = useParams();
  const raw = params?.id;
  const id = Array.isArray(raw) ? raw[0] : (raw ?? '');
  return <TraceabilityView idOrToken={decodeURIComponent(id)} />;
}
