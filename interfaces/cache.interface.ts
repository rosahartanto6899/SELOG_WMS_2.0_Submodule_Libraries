export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteKeysByPattern(key: string): Promise<void>;
  selectDb?(dbNumber: number): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}
