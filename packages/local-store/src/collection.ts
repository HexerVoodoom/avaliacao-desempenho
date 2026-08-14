/**
 * Minimal JSON-array-in-localStorage collection. Every repository below is a
 * thin domain-shaped wrapper over one of these. Swapping to a real backend
 * later means replacing this file's callers, not the StudioStore interface
 * consumed by the apps — see packages/domain/src/repository.ts.
 */
export class Collection<T extends { id: string }> {
  constructor(private readonly storageKey: string) {}

  private read(): T[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private write(items: T[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  async all(): Promise<T[]> {
    return this.read();
  }

  async byId(id: string): Promise<T | null> {
    return this.read().find((item) => item.id === id) ?? null;
  }

  async insert(item: T): Promise<T> {
    const items = this.read();
    items.push(item);
    this.write(items);
    return item;
  }

  async patch(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T> {
    const items = this.read();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) throw new Error(`${this.storageKey}: item ${id} not found`);
    const updated = { ...items[index], ...patch } as T;
    items[index] = updated;
    this.write(items);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.write(this.read().filter((item) => item.id !== id));
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
