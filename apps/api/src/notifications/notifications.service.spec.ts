import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { NotificationType } from '@velar/types';

type QueryResult = { data?: unknown; count?: number | null; error?: unknown };

/** Postgrest-style builder: cada método encadenable devuelve la misma promesa. */
function makeChain(result: QueryResult = { data: [], error: null }) {
  const q: any = Promise.resolve(result);
  q.select = jest.fn(() => q);
  q.insert = jest.fn(() => q);
  q.update = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.order = jest.fn(() => q);
  q.limit = jest.fn(() => q);
  return q;
}

/** Builder que rechaza, para simular errores de red/BD en la consulta. */
function makeRejectedChain(error: Error) {
  const q: any = Promise.reject(error);
  q.catch(() => {}); // evita unhandled rejection antes de que el servicio la espere
  q.select = jest.fn(() => q);
  q.insert = jest.fn(() => q);
  q.update = jest.fn(() => q);
  q.eq = jest.fn(() => q);
  q.order = jest.fn(() => q);
  q.limit = jest.fn(() => q);
  return q;
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let fromMock: jest.Mock;
  let warnSpy: jest.SpyInstance;

  beforeEach(async () => {
    fromMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: SupabaseService, useValue: { admin: { from: fromMock } } },
      ],
    }).compile();

    service = module.get(NotificationsService);
    warnSpy = jest.spyOn(service['logger'], 'warn').mockImplementation(() => undefined);
  });

  describe('emit', () => {
    it('inserts the notification with the given type and payload', async () => {
      const chain = makeChain({ data: null, error: null });
      fromMock.mockReturnValueOnce(chain);

      await service.emit('user-1', NotificationType.OFFER_RECEIVED, { bond: 'bond-1' });

      expect(fromMock).toHaveBeenCalledWith('notifications');
      expect(chain.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        type: NotificationType.OFFER_RECEIVED,
        payload: { bond: 'bond-1' },
      });
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('defaults the payload to an empty object', async () => {
      const chain = makeChain({ data: null, error: null });
      fromMock.mockReturnValueOnce(chain);

      await service.emit('user-1', NotificationType.PAYMENT_CONFIRMED);

      expect(chain.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        type: NotificationType.PAYMENT_CONFIRMED,
        payload: {},
      });
    });

    it('skips the query entirely when userId is missing', async () => {
      await service.emit('', NotificationType.OFFER_ACCEPTED);

      expect(fromMock).not.toHaveBeenCalled();
    });

    it('never throws when the insert fails: logs a warning and resolves', async () => {
      fromMock.mockReturnValueOnce(makeRejectedChain(new Error('db down')));

      await expect(
        service.emit('user-1', NotificationType.OFFER_REJECTED),
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith('emit notification falló: db down');
    });
  });

  describe('list', () => {
    it('returns the latest notifications plus the unread count', async () => {
      const rows = [
        { id: 'n-1', type: 'offer_received', read: false },
        { id: 'n-2', type: 'payment_confirmed', read: true },
      ];
      const listChain = makeChain({ data: rows, error: null });
      const countChain = makeChain({ data: null, count: 1, error: null });
      fromMock.mockReturnValueOnce(listChain).mockReturnValueOnce(countChain);

      const result = await service.list('user-1');

      expect(result).toEqual({ notifications: rows, unreadCount: 1 });
      expect(listChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(listChain.limit).toHaveBeenCalledWith(20);
      expect(countChain.eq).toHaveBeenCalledWith('read', false);
    });

    it('honors a custom limit', async () => {
      const listChain = makeChain({ data: [], error: null });
      const countChain = makeChain({ data: null, count: 0, error: null });
      fromMock.mockReturnValueOnce(listChain).mockReturnValueOnce(countChain);

      await service.list('user-1', 5);

      expect(listChain.limit).toHaveBeenCalledWith(5);
    });

    it('falls back to empty values when the queries return no data', async () => {
      const listChain = makeChain({ data: null, error: { message: 'boom' } });
      const countChain = makeChain({ data: null, count: null, error: { message: 'boom' } });
      fromMock.mockReturnValueOnce(listChain).mockReturnValueOnce(countChain);

      const result = await service.list('user-1');

      expect(result).toEqual({ notifications: [], unreadCount: 0 });
    });
  });

  describe('markRead', () => {
    it('updates only the given notification of the given user', async () => {
      const chain = makeChain({ data: null, error: null });
      fromMock.mockReturnValueOnce(chain);

      const result = await service.markRead('n-1', 'user-1');

      expect(result).toEqual({ ok: true });
      expect(chain.update).toHaveBeenCalledWith({ read: true });
      expect(chain.eq).toHaveBeenCalledWith('id', 'n-1');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('propagates the error when the query rejects', async () => {
      fromMock.mockReturnValueOnce(makeRejectedChain(new Error('db down')));

      await expect(service.markRead('n-1', 'user-1')).rejects.toThrow('db down');
    });
  });

  describe('markAllRead', () => {
    it('updates every unread notification of the user', async () => {
      const chain = makeChain({ data: null, error: null });
      fromMock.mockReturnValueOnce(chain);

      const result = await service.markAllRead('user-1');

      expect(result).toEqual({ ok: true });
      expect(chain.update).toHaveBeenCalledWith({ read: true });
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(chain.eq).toHaveBeenCalledWith('read', false);
    });

    it('propagates the error when the query rejects', async () => {
      fromMock.mockReturnValueOnce(makeRejectedChain(new Error('db down')));

      await expect(service.markAllRead('user-1')).rejects.toThrow('db down');
    });
  });
});
