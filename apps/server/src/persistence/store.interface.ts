/**
 * Abstract persistence store interface.
 *
 * Implementations can be swapped (JSON file, SQLite, Postgres, etc.)
 * by providing a different class for the PERSISTENCE_STORE token.
 */
export interface StoreData {
  company: Record<string, unknown> | null;
  agents: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  squads: Record<string, unknown>[];
  llmProviders: Record<string, unknown>[];
  projects: Record<string, unknown>[];
}

export interface PersistenceStore {
  /** Load all persisted data (returns null fields if nothing saved yet) */
  load(): Promise<StoreData | null>;

  /** Save a full snapshot of all data */
  save(data: StoreData): Promise<void>;
}

/** Injection token for the persistence store */
export const PERSISTENCE_STORE = Symbol('PERSISTENCE_STORE');
