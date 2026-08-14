import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Collection, newId } from './collection';

/** Minimal in-memory localStorage polyfill — Collection only calls
 * getItem/setItem, so that's all this needs to implement. */
class MemoryStorage {
  private store = new Map<string, string>();
  private failNextWrite = false;

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failNextWrite) {
      this.failNextWrite = false;
      const err = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      throw err;
    }
    this.store.set(key, value);
  }
  simulateQuotaExceededOnNextWrite() {
    this.failNextWrite = true;
  }
}

interface Item {
  id: string;
  name: string;
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

describe('Collection CRUD', () => {
  it('starts empty', async () => {
    const col = new Collection<Item>('test:items');
    expect(await col.all()).toEqual([]);
    expect(await col.byId('missing')).toBeNull();
  });

  it('inserts and reads back an item', async () => {
    const col = new Collection<Item>('test:items');
    const item = { id: newId(), name: 'Ana' };
    await col.insert(item);
    expect(await col.all()).toEqual([item]);
    expect(await col.byId(item.id)).toEqual(item);
  });

  it('patches an existing item', async () => {
    const col = new Collection<Item>('test:items');
    const item = { id: newId(), name: 'Ana' };
    await col.insert(item);
    const updated = await col.patch(item.id, { name: 'Ana Paula' });
    expect(updated.name).toBe('Ana Paula');
    expect((await col.byId(item.id))?.name).toBe('Ana Paula');
  });

  it('throws patching a non-existent id, instead of silently no-op-ing', async () => {
    const col = new Collection<Item>('test:items');
    await expect(col.patch('does-not-exist', { name: 'x' })).rejects.toThrow(/not found/);
  });

  it('deletes an item', async () => {
    const col = new Collection<Item>('test:items');
    const item = { id: newId(), name: 'Ana' };
    await col.insert(item);
    await col.delete(item.id);
    expect(await col.all()).toEqual([]);
  });

  it('keeps separate collections separate (different storage keys)', async () => {
    const col1 = new Collection<Item>('test:items-1');
    const col2 = new Collection<Item>('test:items-2');
    await col1.insert({ id: 'a', name: 'A' });
    expect(await col2.all()).toEqual([]);
  });
});

describe('Collection write-failure surfacing', () => {
  // Regression test for the ProdSquad finding (staff-backend + qa-sweeper,
  // corroborated across 4 personas via the downstream NewEvaluationWizard
  // bug): a full localStorage quota must be a loud, catchable error, never
  // a silent no-op that leaves the caller believing the write succeeded.
  it('throws a clear error instead of failing silently when the write fails', async () => {
    const col = new Collection<Item>('test:items');
    storage.simulateQuotaExceededOnNextWrite();
    await expect(col.insert({ id: newId(), name: 'Ana' })).rejects.toThrow(/Não foi possível salvar/);
  });

  it('does not leave a corrupted read after a failed write', async () => {
    const col = new Collection<Item>('test:items');
    const first = { id: newId(), name: 'Ana' };
    await col.insert(first);

    storage.simulateQuotaExceededOnNextWrite();
    await expect(col.insert({ id: newId(), name: 'Bia' })).rejects.toThrow();

    // The failed second insert must not have partially applied.
    expect(await col.all()).toEqual([first]);
  });
});
