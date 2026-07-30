import { Injectable, ForbiddenException } from '@nestjs/common';
import { AbacAction, AbacAttributes } from '@velar/types';
import { evaluateAbac } from './abac';

@Injectable()
export class AbacService {
  evaluate(attrs: AbacAttributes, action: AbacAction) {
    return evaluateAbac(attrs, action);
  }

  assertAllowed(attrs: AbacAttributes, action: AbacAction): void {
    const decision = evaluateAbac(attrs, action);
    if (!decision.allowed) {
      throw new ForbiddenException(`Acción no autorizada (${decision.reason})`);
    }
  }
}
