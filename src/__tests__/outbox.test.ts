import {
  enqueueRequest,
  getOutbox,
  removeOutboxItem,
  clearOutbox,
  isQueueableEndpoint,
  getOutboxCount,
} from '../lib/outbox';
import 'fake-indexeddb/auto';

describe('outbox', () => {
  beforeEach(async () => {
    await clearOutbox();
  });

  describe('enqueueRequest', () => {
    it('should enqueue a request', async () => {
      const id = await enqueueRequest({
        endpoint: '/api/contact',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { message: 'test' },
        idempotencyKey: 'test-key',
        type: 'queueable',
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^outbox_/);

      const items = await getOutbox();
      expect(items).toHaveLength(1);
      expect(items[0].endpoint).toBe('/api/contact');
    });
  });

  describe('getOutbox', () => {
    it('should return empty array when no items', async () => {
      const items = await getOutbox();
      expect(items).toEqual([]);
    });

    it('should return all items', async () => {
      await enqueueRequest({
        endpoint: '/api/contact',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key1',
        type: 'queueable',
      });

      await enqueueRequest({
        endpoint: '/api/feedback',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key2',
        type: 'queueable',
      });

      const items = await getOutbox();
      expect(items).toHaveLength(2);
    });
  });

  describe('removeOutboxItem', () => {
    it('should remove an item', async () => {
      const id = await enqueueRequest({
        endpoint: '/api/contact',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key1',
        type: 'queueable',
      });

      await removeOutboxItem(id);

      const items = await getOutbox();
      expect(items).toHaveLength(0);
    });
  });

  describe('clearOutbox', () => {
    it('should remove all items', async () => {
      await enqueueRequest({
        endpoint: '/api/contact',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key1',
        type: 'queueable',
      });

      await enqueueRequest({
        endpoint: '/api/feedback',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key2',
        type: 'queueable',
      });

      await clearOutbox();

      const items = await getOutbox();
      expect(items).toHaveLength(0);
    });
  });

  describe('getOutboxCount', () => {
    it('should return correct count', async () => {
      expect(await getOutboxCount()).toBe(0);

      await enqueueRequest({
        endpoint: '/api/contact',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key1',
        type: 'queueable',
      });

      expect(await getOutboxCount()).toBe(1);

      await enqueueRequest({
        endpoint: '/api/feedback',
        method: 'POST',
        headers: {},
        idempotencyKey: 'key2',
        type: 'queueable',
      });

      expect(await getOutboxCount()).toBe(2);
    });
  });

  describe('isQueueableEndpoint', () => {
    it('should identify queueable endpoints', () => {
      expect(isQueueableEndpoint('/api/contact')).toBe(true);
      expect(isQueueableEndpoint('/api/messages')).toBe(true);
      expect(isQueueableEndpoint('/api/feedback')).toBe(true);
      expect(isQueueableEndpoint('/api/bookings/draft')).toBe(true);
    });

    it('should identify non-queueable endpoints', () => {
      expect(isQueueableEndpoint('/api/payment')).toBe(false);
      expect(isQueueableEndpoint('/api/charge')).toBe(false);
      expect(isQueueableEndpoint('/api/bookings/confirm')).toBe(false);
      expect(isQueueableEndpoint('/api/checkout')).toBe(false);
    });

    it('should prioritize non-queueable patterns', () => {
      // Even though /api might match queueable pattern, payment should be blocked
      expect(isQueueableEndpoint('/api/payment/process')).toBe(false);
    });
  });
});
