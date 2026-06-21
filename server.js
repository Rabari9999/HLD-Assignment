/**
 * server.js
 * Backend server for the Search Typeahead System.
 * Zero-dependency implementation using native Node.js libraries.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const url = require('url');

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// --- Global Configuration ---
let config = {
  cacheTtlMs: 15000,          // 15 seconds TTL
  batchSizeLimit: 10,         // Flush if queue has >= 10 items
  batchFlushIntervalMs: 5000, // Flush every 5 seconds
  recencyWindowMs: 120000,    // 2 minutes window for recency
  recencyMultiplier: 100000   // Multiplier for recent searches in ranking
};

// --- Statistics ---
let stats = {
  totalSubmissions: 0,
  dbWriteOperations: 0,
  dbWritesSaved: 0,
};

// --- In-Memory State ---
const batchBuffer = new Map(); // query -> count increment
let recentSearchesLog = [];    // Array of { query, timestamp }
let lastFlushTime = Date.now();

// --- 1. Load data.js and trie.js into Node VM Sandbox ---
let countStoreInstance;

function loadCountStore() {
  console.log('[VM] Initializing CountStore sandbox...');
  const sandbox = {
    window: {},
    console: console,
    localStorage: {
      getItem(key) {
        if (fs.existsSync(DB_FILE)) {
          try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            console.log(`[VM Storage] Loaded persisted queries from ${DB_FILE}`);
            return data;
          } catch (e) {
            console.error('[VM Storage] Error reading DB file:', e);
          }
        }
        return null;
      },
      setItem(key, value) {
        try {
          fs.writeFileSync(DB_FILE, value, 'utf8');
          console.log(`[VM Storage] Saved persisted queries to ${DB_FILE}`);
        } catch (e) {
          console.error('[VM Storage] Error writing DB file:', e);
        }
      }
    }
  };

  vm.createContext(sandbox);

  // Load data.js
  const dataCode = fs.readFileSync(path.join(__dirname, 'data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);

  // Load trie.js
  const trieCode = fs.readFileSync(path.join(__dirname, 'trie.js'), 'utf8');
  vm.runInContext(trieCode, sandbox);

  const CountStore = sandbox.window.CountStore;
  countStoreInstance = new CountStore();
}

loadCountStore();

// --- 2. Consistent Hashing Ring ---
function getHash(str) {
  const md5 = crypto.createHash('md5').update(str).digest();
  return md5.readUInt32BE(0);
}

class ConsistentHashRing {
  constructor(replicas = 40) {
    this.replicas = replicas;
    this.ring = []; // sorted array of { hashVal, nodeName }
    this.nodes = new Set();
  }

  addNode(node) {
    this.nodes.add(node);
    for (let i = 0; i < this.replicas; i++) {
      const replicaKey = `${node}#${i}`;
      const hashVal = getHash(replicaKey);
      this.ring.push({ hashVal, nodeName: node });
    }
    this.ring.sort((a, b) => a.hashVal - b.hashVal);
  }

  getNode(key) {
    if (this.ring.length === 0) return null;
    const hashVal = getHash(key);
    
    // Binary search
    let low = 0;
    let high = this.ring.length - 1;
    let idx = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hashVal >= hashVal) {
        idx = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    if (low > this.ring.length - 1) {
      idx = 0; // Wrap around
    }

    return this.ring[idx].nodeName;
  }
}

const ring = new ConsistentHashRing(40);
ring.addNode('Cache-Node-A');
ring.addNode('Cache-Node-B');
ring.addNode('Cache-Node-C');

// --- 3. Cache Nodes ---
class CacheNode {
  constructor(name) {
    this.name = name;
    this.store = new Map(); // key -> { suggestions, expiresAt }
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.suggestions;
  }

  set(key, suggestions, ttlMs) {
    this.store.set(key, {
      suggestions,
      expiresAt: Date.now() + ttlMs
    });
  }

  invalidate(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    return {
      name: this.name,
      keysCount: this.store.size,
      hits: this.hits,
      misses: this.misses,
      keys: Array.from(this.store.keys())
    };
  }
}

const cacheNodes = {
  'Cache-Node-A': new CacheNode('Cache-Node-A'),
  'Cache-Node-B': new CacheNode('Cache-Node-B'),
  'Cache-Node-C': new CacheNode('Cache-Node-C')
};

// --- 4. Caching Suggester Flow ---
function getSuggestions(prefix, rankingMode) {
  const normPrefix = prefix.toLowerCase().trim();
  if (!normPrefix) return { suggestions: [], source: 'database', node: null, prefixHash: 0 };

  const prefixHash = getHash(normPrefix);
  // Compute consistent hash cache key (e.g. "iphone:recency")
  const cacheKey = `${normPrefix}:${rankingMode}`;
  const targetNodeName = ring.getNode(normPrefix);
  const cacheNode = cacheNodes[targetNodeName];

  // Try cache lookup
  const cached = cacheNode.get(cacheKey);
  if (cached) {
    return { suggestions: cached, source: 'cache', node: targetNodeName, prefixHash };
  }

  // Cache Miss -> Retrieve from backend database / Trie
  let results = [];
  if (rankingMode === 'recency') {
    // Recency-Aware Ranking
    results = getRecencyRankedSuggestions(normPrefix);
  } else {
    // Popularity Ranking (standard Trie TopK)
    results = countStoreInstance.suggest(normPrefix);
  }

  // Save to the cache node
  cacheNode.set(cacheKey, results, config.cacheTtlMs);

  return { suggestions: results, source: 'database', node: targetNodeName, prefixHash };
}

// Calculate recency searches inside sliding window
function getRecencyRankedSuggestions(prefix) {
  const now = Date.now();
  const windowStart = now - config.recencyWindowMs;
  
  // Clean up old searches from sliding window log while we are here
  recentSearchesLog = recentSearchesLog.filter(s => s.timestamp >= windowStart);

  // Count recent searches per query
  const recentCounts = new Map();
  for (const item of recentSearchesLog) {
    recentCounts.set(item.query, (recentCounts.get(item.query) || 0) + 1);
  }

  // Filter all queries starting with prefix
  const matches = [];
  for (const [query, count] of countStoreInstance.counts.entries()) {
    if (query.startsWith(prefix)) {
      const recent = recentCounts.get(query) || 0;
      // Recency Score = historical_count + (recent_searches * multiplier)
      const score = count + (recent * config.recencyMultiplier);
      matches.push({ query, count, score, recent });
    }
  }

  // Sort by score descending, return top 10
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 10).map(m => ({ query: m.query, count: m.count, score: m.score, recent: m.recent }));
}

// --- 5. Batch Writer & Flushing Logic ---
function queueSearchSubmission(query) {
  const normQuery = query.toLowerCase().trim();
  if (normQuery.length < 2) return;

  stats.totalSubmissions++;

  // Add to batch buffer
  batchBuffer.set(normQuery, (batchBuffer.get(normQuery) || 0) + 1);

  // Push to recent searches log (for recency score calculations)
  recentSearchesLog.push({ query: normQuery, timestamp: Date.now() });

  // If buffer is too large, trigger immediate synchronous flush
  if (batchBuffer.size >= config.batchSizeLimit) {
    console.log(`[Batch Writer] Buffer size limit (${config.batchSizeLimit}) reached. Flushing...`);
    flushBatch();
  }
}

function flushBatch() {
  if (batchBuffer.size === 0) return;

  const currentBuffer = new Map(batchBuffer);
  batchBuffer.clear();

  // Apply delta writes in bulk to the database countStore
  countStoreInstance.applyBatch(currentBuffer);

  // Invalidate cache for prefixes of modified queries across all nodes
  for (const query of currentBuffer.keys()) {
    // Generate prefixes of length 1 to 15, invalidating them in their hash-assigned node
    for (let len = 1; len <= Math.min(query.length, 15); len++) {
      const prefix = query.slice(0, len);
      const targetNodeName = ring.getNode(prefix);
      const cacheNode = cacheNodes[targetNodeName];
      
      // Invalidate both overall and recency cache entries for this prefix
      cacheNode.invalidate(`${prefix}:overall`);
      cacheNode.invalidate(`${prefix}:recency`);
    }
  }

  // Record stats
  stats.dbWriteOperations++;
  
  // Reduction Calculation: submissions saved
  let totalDeltas = 0;
  for (const delta of currentBuffer.values()) {
    totalDeltas += delta;
  }
  // We saved (totalDeltas - 1) database file writes, and consolidated into 1 batch operation
  stats.dbWritesSaved += (totalDeltas - 1);
  
  lastFlushTime = Date.now();
  console.log(`[Batch Writer] Flushed batch. Saved ${totalDeltas - 1} database write logs.`);
}

// Set up periodic flush interval timer
let flushInterval = setInterval(flushBatch, config.batchFlushIntervalMs);

function updateFlushInterval() {
  clearInterval(flushInterval);
  flushInterval = setInterval(flushBatch, config.batchFlushIntervalMs);
}

// --- 6. Helper to serve Static Files ---
function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// --- 7. Server Router ---
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- REST API Endpoints ---

  // 1. GET /api/suggest
  if (pathname === '/api/suggest' && req.method === 'GET') {
    const q = parsedUrl.query.q || '';
    const ranking = parsedUrl.query.ranking || 'overall';
    const result = getSuggestions(q, ranking);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // 2. POST /api/search
  if (pathname === '/api/search' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (!data.query || typeof data.query !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid query payload' }));
          return;
        }

        queueSearchSubmission(data.query);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Searched', query: data.query.toLowerCase().trim() }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to parse JSON body' }));
      }
    });
    return;
  }

  // 3. GET /api/cache/debug
  if (pathname === '/api/cache/debug' && req.method === 'GET') {
    const prefix = (parsedUrl.query.prefix || '').toLowerCase().trim();
    const nodeName = ring.getNode(prefix);
    const node = cacheNodes[nodeName];

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      prefix,
      prefixHash: getHash(prefix),
      assignedNode: nodeName,
      ring: ring.ring,
      nodeStats: node ? node.getStats() : null,
      allCacheNodes: Object.values(cacheNodes).map(n => n.getStats())
    }));
    return;
  }

  // 4. GET /api/trending
  if (pathname === '/api/trending' && req.method === 'GET') {
    const ranking = parsedUrl.query.ranking || 'overall';
    let trending = [];

    if (ranking === 'recency') {
      // Find matches for empty prefix (e.g. all queries) sorted by recency score
      trending = getRecencyRankedSuggestions('').slice(0, 10);
    } else {
      // Popularity (highest count queries in the whole countStore)
      const sorted = Array.from(countStoreInstance.counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      trending = sorted.map(([query, count]) => ({ query, count }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(trending));
    return;
  }

  // 5. GET /api/stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    const activeQueue = Array.from(batchBuffer.entries()).map(([query, count]) => ({ query, count }));
    const writeReduction = stats.totalSubmissions > 0
      ? ((stats.dbWritesSaved) / stats.totalSubmissions * 100).toFixed(2)
      : '0.00';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalSubmissions: stats.totalSubmissions,
      dbWritesSaved: stats.dbWritesSaved,
      dbWriteOperations: stats.dbWriteOperations,
      writeReductionPercent: writeReduction,
      activeQueue,
      activeQueueSize: batchBuffer.size,
      lastFlushTime,
      recentSearchesInWindow: recentSearchesLog.length,
      cacheStats: Object.values(cacheNodes).map(n => n.getStats())
    }));
    return;
  }

  // 6. POST /api/config
  if (pathname === '/api/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        if (data.cacheTtlMs !== undefined) config.cacheTtlMs = parseInt(data.cacheTtlMs);
        if (data.batchSizeLimit !== undefined) config.batchSizeLimit = parseInt(data.batchSizeLimit);
        if (data.batchFlushIntervalMs !== undefined) {
          config.batchFlushIntervalMs = parseInt(data.batchFlushIntervalMs);
          updateFlushInterval();
        }
        if (data.recencyWindowMs !== undefined) config.recencyWindowMs = parseInt(data.recencyWindowMs);
        if (data.recencyMultiplier !== undefined) config.recencyMultiplier = parseInt(data.recencyMultiplier);

        // Clear all caches when config changes to prevent stale data format issues
        Object.values(cacheNodes).forEach(n => n.clear());

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Configuration updated successfully', config }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update configuration' }));
      }
    });
    return;
  }

  // 7. POST /api/flush
  if (pathname === '/api/flush' && req.method === 'POST') {
    flushBatch();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Batch flushed manually' }));
    return;
  }

  // --- Serve Frontend Static Files ---
  const publicDir = path.join(__dirname, 'public');

  if (pathname === '/' || pathname === '/index.html') {
    serveStaticFile(res, path.join(publicDir, 'index.html'), 'text/html');
    return;
  }
  if (pathname === '/index.css') {
    serveStaticFile(res, path.join(publicDir, 'index.css'), 'text/css');
    return;
  }
  if (pathname === '/index.js') {
    serveStaticFile(res, path.join(publicDir, 'index.js'), 'application/javascript');
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
});

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Typeahead Backend Server listening on http://localhost:${PORT}`);
  console.log(`📁 Loaded database query system in background VM.`);
  console.log(`🔥 Consistent hashing active with Nodes: A, B, C`);
  console.log(`====================================================`);
});
