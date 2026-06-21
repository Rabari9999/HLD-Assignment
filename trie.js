/**
 * trie.js — Trie + CountStore
 *
 * Trie: prefix tree where each node stores the top-10 matching queries
 *       pre-computed at insert time (O(1) lookup after O(M) traversal).
 *
 * CountStore: wraps the Trie, persists all counts to localStorage,
 *             supports adding new queries and incrementing existing ones.
 *
 * Per spec: suggestions MUST START WITH the typed prefix.
 */

'use strict';

/* ── TrieNode ──────────────────────────────────────────────── */
class TrieNode {
  constructor() {
    this.children = {}; // char → TrieNode
    this.topK     = []; // [{ query, count }] sorted desc by count, max 10
  }
}

/* ── Trie ──────────────────────────────────────────────────── */
class Trie {
  constructor(k = 10) {
    this.root = new TrieNode();
    this.K    = k;
  }

  /**
   * Insert or update a query in the Trie.
   * Updates topK lists at every ancestor node along the prefix path.
   * O(M * K) where M = query length, K = 10
   */
  insert(query, count) {
    const lower = query.toLowerCase();
    const entry = { query: lower, count };

    let node = this.root;
    this._updateTopK(node, entry);

    for (const ch of lower) {
      if (!node.children[ch]) node.children[ch] = new TrieNode();
      node = node.children[ch];
      this._updateTopK(node, entry);
    }
  }

  _updateTopK(node, entry) {
    const idx = node.topK.findIndex(e => e.query === entry.query);
    if (idx !== -1) {
      node.topK[idx] = entry; // update existing
    } else {
      node.topK.push(entry);
    }
    // Keep sorted top-K by count descending
    node.topK.sort((a, b) => b.count - a.count);
    if (node.topK.length > this.K) node.topK.length = this.K;
  }

  /**
   * Return top-10 suggestions for the given prefix.
   * O(M) traversal + O(1) topK read.
   */
  search(prefix) {
    if (!prefix) return [];
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      if (!node.children[ch]) return [];
      node = node.children[ch];
    }
    return [...node.topK]; // return a copy
  }

  /**
   * Rebuild the entire Trie from a Map of query→count.
   * Used after a batch flush.
   */
  rebuild(countMap) {
    this.root = new TrieNode();
    for (const [q, c] of countMap.entries()) {
      this.insert(q, c);
    }
  }
}

/* ── CountStore ────────────────────────────────────────────── */
class CountStore {
  static STORAGE_KEY = 'typeahead_counts';

  constructor() {
    this.trie   = new Trie(10);
    this.counts = new Map(); // query (lowercase) → count
    this._load();
  }

  /** Load base dataset + persisted user counts, build Trie */
  _load() {
    // 1. Seed from global DATASET
    for (const { query, count } of (window.DATASET || [])) {
      const q = query.toLowerCase().trim();
      this.counts.set(q, count);
    }

    // 2. Merge persisted user counts (from localStorage)
    try {
      const saved = JSON.parse(localStorage.getItem(CountStore.STORAGE_KEY) || '{}');
      for (const [q, delta] of Object.entries(saved)) {
        this.counts.set(q, (this.counts.get(q) || 0) + delta);
      }
    } catch (_) { /* ignore corrupt storage */ }

    // 3. Build Trie
    for (const [q, c] of this.counts.entries()) {
      this.trie.insert(q, c);
    }

    console.log(`[CountStore] Loaded ${this.counts.size} queries into Trie.`);
  }

  /** Get top-10 suggestions for prefix */
  suggest(prefix) {
    return this.trie.search(prefix.trim());
  }

  /** Get count for a specific query */
  getCount(query) {
    return this.counts.get(query.toLowerCase().trim()) || 0;
  }

  /**
   * Apply a batch of count increments.
   * queryDeltas: Map of query → delta count to add.
   * After applying, rebuild affected Trie paths.
   */
  applyBatch(queryDeltas) {
    for (const [q, delta] of queryDeltas.entries()) {
      const key = q.toLowerCase().trim();
      const newCount = (this.counts.get(key) || 0) + delta;
      this.counts.set(key, newCount);
      this.trie.insert(key, newCount); // re-insert updates topK everywhere
    }
    this._persistDeltas(queryDeltas);
  }

  /** Persist only the user-generated deltas (not the entire dataset) */
  _persistDeltas(queryDeltas) {
    try {
      const existing = JSON.parse(localStorage.getItem(CountStore.STORAGE_KEY) || '{}');
      for (const [q, delta] of queryDeltas.entries()) {
        const key = q.toLowerCase().trim();
        existing[key] = (existing[key] || 0) + delta;
      }
      localStorage.setItem(CountStore.STORAGE_KEY, JSON.stringify(existing));
    } catch (_) { /* storage quota exceeded — ignore */ }
  }
}

/* ── Exports ───────────────────────────────────────────────── */
window.CountStore = CountStore;
