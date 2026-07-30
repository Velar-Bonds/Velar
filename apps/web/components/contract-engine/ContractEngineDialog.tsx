'use client';

import { Modal } from '../ui';
import { ContractEngineExplorer } from './ContractEngineExplorer';

export interface ContractEngineDialogProps {
  bondId: string;
  token: string;
  onClose: () => void;
}

/** Accessible modal hosting {@link ContractEngineExplorer} (issue #38). */
export function ContractEngineDialog({ bondId, token, onClose }: ContractEngineDialogProps) {
  return (
    <Modal open onClose={onClose} title="Gestión de contrato" size="lg">
      <ContractEngineExplorer bondId={bondId} token={token} />
    </Modal>
  );
}

export default ContractEngineDialog;
