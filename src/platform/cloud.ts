import type { StorageLike } from '../core/save';
import { translateTree } from '../i18n';

export interface CloudPlayer {
  getUniqueID(): string;
  getData(keys: string[]): Promise<Record<string, unknown>>;
  setData(data: Record<string, unknown>, flush: boolean): Promise<void>;
}
export type CloudStatus = 'local' | 'synced' | 'pending' | 'offline' | 'conflict';
export interface CloudSnapshot { version: 1; account: string; stamp: string; data: Record<string, string>; }
interface LocalSnapshot extends CloudSnapshot { syncedStamp: string | null; }
const CLOUD_KEY = 'znamyonaProfile';
const LOCAL_PREFIX = 'znamyona-profile-v1:';
const OWNER_KEY = 'znamyona-local-migration-owner-v1';
const KEYS = ['arena-naemnikov-run-v3', 'arena-naemnikov-run-v3-backup', 'arena-naemnikov-run-v2',
  'arena-naemnikov-run-v2-backup', 'arena-naemnikov-run-v1', 'arena-naemnikov-selected-era-v1',
  'arena-naemnikov-eras-v1', 'arena-naemnikov-talents-v2', 'arena-naemnikov-talents-v1',
  'arena-naemnikov-global-talents-v1', 'arena-naemnikov-records-v1', 'arena-naemnikov-audio-v1',
  'arena-naemnikov-result-v1', 'arena-naemnikov-pending-ad-gold-v1'];
const stamp = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
const equalData = (a: CloudSnapshot, b: CloudSnapshot) => KEYS.every(key => a.data[key] === b.data[key]);
function hasProgress(snapshot: CloudSnapshot): boolean {
  if (snapshot.data['arena-naemnikov-run-v3'] || snapshot.data['arena-naemnikov-result-v1']) return true;
  try {
    const wallets = JSON.parse(snapshot.data['arena-naemnikov-talents-v2'] ?? '{}').eras ?? {};
    const records = JSON.parse(snapshot.data['arena-naemnikov-records-v1'] ?? '{}');
    const global = JSON.parse(snapshot.data['arena-naemnikov-global-talents-v1'] ?? '{}');
    return records.runs > 0 || global.points > 0 || (global.advancedEras?.length ?? 0) > 0
      || Object.values(wallets).some(wallet => {
        const value = wallet as { gold?: number; baseLevel?: number; levels?: Record<string, number> };
        return (value.gold ?? 0) > 0 || (value.baseLevel ?? 0) > 0 || Object.values(value.levels ?? {}).some(level => level > 0);
      });
  } catch { return Object.keys(snapshot.data).length > 0; }
}
const read = (storage: StorageLike | null, key: string) => { try { return storage?.getItem(key) ?? null; } catch { return null; } };
function valid(value: unknown, account: string): value is CloudSnapshot {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<CloudSnapshot>;
  return v.version === 1 && v.account === account && typeof v.stamp === 'string' && !!v.stamp
    && !!v.data && typeof v.data === 'object' && !Array.isArray(v.data)
    && Object.entries(v.data).every(([key, val]) => KEYS.includes(key) && typeof val === 'string')
    && new TextEncoder().encode(JSON.stringify(v)).length < 190_000;
}
export async function bounded<T>(promise: Promise<T>, milliseconds = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Platform request timed out')), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}

/** One complete profile wins a conflict. Currency and reward receipts are never summed. */
export class CloudProfileStorage implements StorageLike {
  private snapshot: LocalSnapshot;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private lastAttempt = 0;
  private busy = false;
  private stopped = false;
  private status: CloudStatus = 'local';
  private listener: (status: CloudStatus) => void = () => {};
  private constructor(private storage: StorageLike | null, private player: CloudPlayer | null, snapshot: LocalSnapshot) {
    this.snapshot = snapshot;
  }

  static async open(storage: StorageLike | null, player: CloudPlayer | null,
    choose: (local: CloudSnapshot, remote: CloudSnapshot) => Promise<'local' | 'cloud'>): Promise<CloudProfileStorage> {
    const account = player?.getUniqueID() || read(storage, OWNER_KEY) || 'local';
    let cached: LocalSnapshot | null = null;
    try {
      const parsed: unknown = JSON.parse(read(storage, LOCAL_PREFIX + account) ?? 'null');
      if (valid(parsed, account)) cached = { ...parsed, syncedStamp: typeof (parsed as LocalSnapshot).syncedStamp === 'string' ? (parsed as LocalSnapshot).syncedStamp : null };
    } catch { /* preserve legacy data */ }
    const data: Record<string, string> = {};
    if (!cached && (!player || !read(storage, OWNER_KEY) || read(storage, OWNER_KEY) === account)) {
      let unbound: CloudSnapshot | null = null;
      try { const raw = JSON.parse(read(storage, LOCAL_PREFIX + 'local') ?? 'null'); if (valid(raw, 'local')) unbound = raw; } catch { /* legacy migration */ }
      for (const key of KEYS) {
        const value = unbound?.data[key] ?? read(storage, key);
        if (value !== null && value !== undefined) data[key] = value;
      }
    }
    const local = cached ?? { version: 1, account, stamp: stamp(), syncedStamp: null, data };
    const store = new CloudProfileStorage(storage, player, local);
    if (player) {
      try {
        const response = await bounded(player.getData([CLOUD_KEY]));
        const raw = response[CLOUD_KEY];
        if (raw !== undefined && raw !== null && !valid(raw, account)) throw new Error('Unsupported cloud profile');
        const remote = valid(raw, account) ? raw : null;
        if (remote) {
          const localChanged = local.stamp !== local.syncedStamp && hasProgress(local);
          const remoteChanged = remote.stamp !== local.syncedStamp;
          if (localChanged && remoteChanged && !equalData(local, remote)) {
            try { storage?.setItem(LOCAL_PREFIX + account + ':conflict-backup', JSON.stringify({ local, remote })); } catch { /* storage unavailable */ }
            const choice = await choose(local, remote);
            store.snapshot = choice === 'cloud' ? { ...remote, syncedStamp: remote.stamp }
              : { ...local, syncedStamp: remote.stamp };
          } else if (!localChanged || equalData(local, remote)) store.snapshot = { ...remote, syncedStamp: remote.stamp };
        }
        store.status = store.snapshot.stamp === store.snapshot.syncedStamp ? 'synced' : 'pending';
        store.persist();
        try { storage?.setItem(OWNER_KEY, account); } catch { /* storage unavailable */ }
        if (store.status === 'pending') store.schedule();
      } catch { store.status = 'offline'; store.persist(); }
    } else store.persist();
    return store;
  }

  getItem(key: string): string | null {
    if (!KEYS.includes(key)) return read(this.storage, key); // Debug stays local.
    return this.snapshot.data[key] ?? null;
  }
  setItem(key: string, value: string): void {
    if (!KEYS.includes(key)) { this.storage?.setItem(key, value); return; }
    if (this.snapshot.data[key] === value) return;
    const next = { ...this.snapshot, stamp: stamp(), data: { ...this.snapshot.data, [key]: value } };
    // Commit before updating memory so SaveService can detect a failed reward write.
    this.storage?.setItem(LOCAL_PREFIX + next.account, JSON.stringify(next));
    this.snapshot = next;
    if (this.player && this.status !== 'conflict') this.setStatus('pending');
    this.schedule();
  }
  removeItem(key: string): void {
    if (!KEYS.includes(key)) { this.storage?.removeItem(key); return; }
    if (!(key in this.snapshot.data)) return;
    const data = { ...this.snapshot.data }; delete data[key];
    const next = { ...this.snapshot, stamp: stamp(), data };
    this.storage?.setItem(LOCAL_PREFIX + next.account, JSON.stringify(next));
    this.snapshot = next;
    if (this.player && this.status !== 'conflict') this.setStatus('pending');
    this.schedule();
  }
  onStatus(listener: (status: CloudStatus) => void): void { this.listener = listener; listener(this.status); }
  private setStatus(status: CloudStatus): void { this.status = status; this.listener(status); }
  private persist(): void {
    try { this.storage?.setItem(LOCAL_PREFIX + this.snapshot.account, JSON.stringify(this.snapshot)); } catch { /* local fallback */ }
  }
  private schedule(): void {
    if (!this.player || this.stopped || this.status === 'conflict' || this.timer || this.busy) return;
    this.timer = setTimeout(() => { this.timer = undefined; void this.flush(); }, Math.max(5000, this.lastAttempt + 5000 - Date.now()));
  }
  async flush(): Promise<void> {
    if (!this.player || this.busy || this.stopped || this.status === 'conflict'
      || this.snapshot.stamp === this.snapshot.syncedStamp) return;
    if (Date.now() < this.lastAttempt + 5000) { this.schedule(); return; }
    this.busy = true; this.lastAttempt = Date.now();
    try {
      const response = await bounded(this.player.getData([CLOUD_KEY]));
      const remote = response[CLOUD_KEY];
      if (remote !== undefined && remote !== null && !valid(remote, this.snapshot.account)) throw new Error('Unsupported cloud profile');
      if (valid(remote, this.snapshot.account) && remote.stamp !== this.snapshot.syncedStamp) {
        // getData can expose SDK-cached setData even after a failed flush.
        // Equal data still needs a successful flush before claiming durability.
        if (!equalData(this.snapshot, remote)) { this.setStatus('conflict'); return; }
      }
      const uploaded: CloudSnapshot = { version: 1, account: this.snapshot.account, stamp: this.snapshot.stamp, data: { ...this.snapshot.data } };
      if (new TextEncoder().encode(JSON.stringify(uploaded)).length >= 190_000) throw new Error('Profile exceeds cloud size budget');
      await bounded(this.player.setData({ [CLOUD_KEY]: uploaded }, true));
      this.snapshot = { ...this.snapshot, syncedStamp: uploaded.stamp };
      this.persist();
      this.setStatus(this.snapshot.stamp === uploaded.stamp ? 'synced' : 'pending');
    } catch { this.setStatus('offline'); }
    finally { this.busy = false; if (this.snapshot.stamp !== this.snapshot.syncedStamp) this.schedule(); }
  }
  dispose(): void { this.stopped = true; clearTimeout(this.timer); }
}

export function chooseCloudProfile(root: HTMLElement, local: CloudSnapshot, remote: CloudSnapshot): Promise<'local' | 'cloud'> {
  // Keep both candidates for manual recovery, including spent currency and receipts.
  const summarize = (snapshot: CloudSnapshot) => {
    try {
      const wallets = JSON.parse(snapshot.data['arena-naemnikov-talents-v2'] ?? '{}').eras ?? {};
      return Object.values(wallets).reduce<number>((sum, wallet) => {
        const gold = (wallet as { gold?: unknown }).gold;
        return sum + (typeof gold === 'number' && Number.isSafeInteger(gold) && gold >= 0 ? gold : 0);
      }, 0);
    } catch { return 0; }
  };
  return new Promise(resolve => {
    root.innerHTML = `<div class="scrim"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="save-title"><h2 id="save-title">Выбери сохранение</h2><p>Прогресс в этом браузере отличается от облачного. Будет использован один профиль целиком.</p><div class="modal-actions"><button class="primary" data-save="cloud">Из облака · ${summarize(remote)} золота</button><button class="secondary" data-save="local">Из этого браузера · ${summarize(local)} золота</button></div></section></div>`;
    translateTree(root);
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-save]')) button.addEventListener('click', () => resolve(button.dataset.save as 'local' | 'cloud'), { once: true });
  });
}
