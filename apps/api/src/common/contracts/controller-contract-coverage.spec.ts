import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { findContract } from '@velar/types';
import { AuthController } from '../../auth/auth.controller';
import { BondsController } from '../../bonds/bonds.controller';
import { NotificationsController } from '../../notifications/notifications.controller';
import { ReportsController } from '../../reports/reports.controller';
import { TransfersController } from '../../transfers/transfers.controller';
import { UsersController } from '../../users/users.controller';

const CONTROLLERS = [AuthController, BondsController, TransfersController, ReportsController, NotificationsController, UsersController];
const METHODS: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
};

function joinPath(...parts: string[]): string {
  return `/${parts.filter(Boolean).map((part) => part.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')}`;
}

describe('controller ⇄ shared contract coverage', () => {
  it.each(CONTROLLERS)('%s has a shared contract for every JSON route', (Controller) => {
    const prefix = Reflect.getMetadata(PATH_METADATA, Controller) ?? '';
    for (const methodName of Object.getOwnPropertyNames(Controller.prototype)) {
      if (methodName === 'constructor') continue;
      const handler = Controller.prototype[methodName as keyof typeof Controller.prototype];
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler as object);
      const method = METHODS[requestMethod];
      if (!method) continue;
      const route = Reflect.getMetadata(PATH_METADATA, handler as object) ?? '';
      const path = joinPath(prefix, route);
      if (method === 'GET' && path === '/bonds/:tokenId/document') continue;
      const match = findContract(method, path);
      if (!match) throw new Error(`Missing shared contract for ${method} ${path}`);
      expect(match).not.toBeNull();
    }
  });
});
