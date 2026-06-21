/**
 * index.js
 * Client-side script for Search Typeahead Dashboard.
 */

'use strict';

// --- Client State ---
let activePrefix = '';
let suggestions = [];
let activeIndex = -1; // For keyboard navigation
let rankingMode = 'overall'; // 'overall' or 'recency'
let debounceTimeout = null;

// Ring visualization caching
let ringVirtualNodes = []; // Cached array of virtual node hashes
let lastPrefixHash = null;
let lastTargetNode = null;

// --- DOM Elements ---
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const suggestionsDropdown = document.getElementById('suggestions-dropdown');
const responseBody = document.getElementById('response-body');
const responseTime = document.getElementById('response-time');
const routingLabel = document.getElementById('routing-label');
const activeRingRoute = document.getElementById('active-ring-route');
const prefixHashHex = document.getElementById('prefix-hash-hex');

// Stats DOM Elements
const statTotalSubmissions = document.getElementById('stat-total-submissions');
const statWritesSaved = document.getElementById('stat-writes-saved');
const statReductionRate = document.getElementById('stat-reduction-rate');
const statDbOps = document.getElementById('stat-db-ops');

// Cache Node DOM Elements
const nodeAKeys = document.getElementById('node-a-keys');
const nodeARatio = document.getElementById('node-a-ratio');
const nodeBKeys = document.getElementById('node-b-keys');
const nodeBRatio = document.getElementById('node-b-ratio');
const nodeCKeys = document.getElementById('node-c-keys');
const nodeCRatio = document.getElementById('node-c-ratio');

const nodeRowA = document.getElementById('node-row-a');
const nodeRowB = document.getElementById('node-row-b');
const nodeRowC = document.getElementById('node-row-c');

// Queue DOM Elements
const queueOccupancy = document.getElementById('queue-occupancy');
const queueLimit = document.getElementById('queue-limit');
const lastFlushLabel = document.getElementById('last-flush-label');
const queueTableBody = document.getElementById('queue-table-body');
const flushBtn = document.getElementById('flush-btn');

// Trending DOM Elements
const trendingListOl = document.getElementById('trending-list-ol');
const rankingPopularityBtn = document.getElementById('ranking-popularity-btn');
const rankingRecencyBtn = document.getElementById('ranking-recency-btn');

// Config Form
const configForm = document.getElementById('config-form');

// Canvas
const canvas = document.getElementById('ring-canvas');
const ctx = canvas.getContext('2d');
const ringRadius = 110;
const centerX = 160;
const centerY = 160;

// --- 1. Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  fetchRingData();
  fetchStats();
  fetchTrending();
  
  // Poll stats every 1 second
  setInterval(fetchStats, 1000);
  // Poll trending every 3 seconds
  setInterval(fetchTrending, 3000);

  // Setup Event Listeners
  setupEventListeners();
  drawRing(null, null);
});

// Fetch consistent hashing ring structure from debug API once
function fetchRingData() {
  fetch('/api/cache/debug?prefix=')
    .then(res => res.json())
    .then(data => {
      if (data.ring) {
        ringVirtualNodes = data.ring;
        drawRing(lastPrefixHash, lastTargetNode);
      }
    })
    .catch(err => console.error('Error fetching ring data:', err));
}

// --- 2. Event Listeners Setup ---
function setupEventListeners() {
  // Input keystrokes
  searchInput.addEventListener('input', () => {
    activeIndex = -1;
    const value = searchInput.value;
    
    if (debounceTimeout) clearTimeout(debounceTimeout);
    
    if (!value.trim()) {
      hideSuggestions();
      resetRoutingVisuals();
      return;
    }

    debounceTimeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 150);
  });

  // Keyboard navigation inside input
  searchInput.addEventListener('keydown', (e) => {
    const listItems = suggestionsDropdown.querySelectorAll('.suggestion-item');
    if (listItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % listItems.length;
      updateActiveSuggestion(listItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + listItems.length) % listItems.length;
      updateActiveSuggestion(listItems);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < listItems.length) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex].query);
      } else {
        // Submit search directly
        submitSearch(searchInput.value);
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box-wrapper')) {
      hideSuggestions();
    }
  });

  // Search button click
  searchBtn.addEventListener('click', () => {
    submitSearch(searchInput.value);
  });

  // Force Flush Queue
  flushBtn.addEventListener('click', () => {
    fetch('/api/flush', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        showSuccessMessage(data.message || 'Flushed batch manually.');
        fetchStats();
      });
  });

  // Toggle trending ranking buttons
  rankingPopularityBtn.addEventListener('click', () => {
    rankingMode = 'overall';
    rankingPopularityBtn.classList.add('active');
    rankingRecencyBtn.classList.remove('active');
    fetchTrending();
    // Refresh active suggestions search with new ranking
    if (searchInput.value.trim()) {
      fetchSuggestions(searchInput.value);
    }
  });

  rankingRecencyBtn.addEventListener('click', () => {
    rankingMode = 'recency';
    rankingRecencyBtn.classList.add('active');
    rankingPopularityBtn.classList.remove('active');
    fetchTrending();
    // Refresh active suggestions search with new ranking
    if (searchInput.value.trim()) {
      fetchSuggestions(searchInput.value);
    }
  });

  // Config Form Submission
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      cacheTtlMs: parseFloat(document.getElementById('cfg-cache-ttl').value) * 1000,
      batchSizeLimit: parseInt(document.getElementById('cfg-batch-size').value),
      batchFlushIntervalMs: parseFloat(document.getElementById('cfg-flush-interval').value) * 1000,
      recencyWindowMs: parseFloat(document.getElementById('cfg-recency-window').value) * 1000,
      recencyMultiplier: parseInt(document.getElementById('cfg-recency-mult').value)
    };

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        showSuccessMessage(data.message || 'Settings updated successfully.');
        fetchStats();
      })
      .catch(err => alert('Failed to update config.'));
  });
}

// --- 3. Suggestions Core ---
function fetchSuggestions(query) {
  const startTime = performance.now();
  fetch(`/api/suggest?q=${encodeURIComponent(query)}&ranking=${rankingMode}`)
    .then(res => res.json())
    .then(data => {
      const duration = (performance.now() - startTime).toFixed(1);
      suggestions = data.suggestions || [];
      
      // Update UI dropdown
      renderSuggestionsDropdown(suggestions);
      
      // Show stats route & debug label
      if (data.node) {
        routingLabel.textContent = data.node;
        routingLabel.className = 'badge';
        if (data.node.includes('Node-A')) {
          routingLabel.classList.add('badge-indigo');
        } else if (data.node.includes('Node-B')) {
          routingLabel.classList.add('badge-emerald');
        } else {
          routingLabel.classList.add('badge-rose');
        }
        activeRingRoute.textContent = `${data.node} (${data.source.toUpperCase()})`;
      } else {
        resetRoutingVisuals();
      }

      // Draw Prefix Hash ring visualizer
      if (data.prefixHash !== undefined) {
        lastPrefixHash = data.prefixHash;
        lastTargetNode = data.node;
        prefixHashHex.textContent = '0x' + data.prefixHash.toString(16).padStart(8, '0').toUpperCase();
        drawRing(data.prefixHash, data.node);
      }

      // Highlight active node row in visualizer box
      highlightNodeRow(data.node);
    })
    .catch(err => console.error('Error fetching suggestions:', err));
}

function renderSuggestionsDropdown(items) {
  suggestionsDropdown.innerHTML = '';
  
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'no-suggestions-item';
    li.textContent = 'No suggestions found (Press Enter to search new word)';
    suggestionsDropdown.appendChild(li);
    suggestionsDropdown.classList.remove('hidden');
    return;
  }

  items.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'suggestion-item';
    li.dataset.index = idx;
    
    // Create text area
    const spanText = document.createElement('span');
    spanText.className = 'item-text';
    spanText.textContent = item.query;
    li.appendChild(spanText);
    
    // Create metadata count label area
    const divMeta = document.createElement('div');
    divMeta.className = 'item-meta';
    
    const spanCount = document.createElement('span');
    spanCount.className = 'item-count';
    spanCount.textContent = `c: ${item.count.toLocaleString()}`;
    divMeta.appendChild(spanCount);

    if (rankingMode === 'recency' && item.recent > 0) {
      const spanRecency = document.createElement('span');
      spanRecency.className = 'item-recency';
      spanRecency.textContent = `+${item.recent}`;
      divMeta.appendChild(spanRecency);
    }
    
    li.appendChild(divMeta);

    li.addEventListener('click', () => {
      selectSuggestion(item.query);
    });

    suggestionsDropdown.appendChild(li);
  });

  suggestionsDropdown.classList.remove('hidden');
}

function updateActiveSuggestion(listItems) {
  listItems.forEach(item => item.classList.remove('active'));
  if (activeIndex >= 0 && activeIndex < listItems.length) {
    const activeItem = listItems[activeIndex];
    activeItem.classList.add('active');
    activeItem.scrollIntoView({ block: 'nearest' });
    // Mirror in input box
    searchInput.value = suggestions[activeIndex].query;
  }
}

function selectSuggestion(query) {
  searchInput.value = query;
  hideSuggestions();
  submitSearch(query);
}

function hideSuggestions() {
  suggestionsDropdown.classList.add('hidden');
  activeIndex = -1;
}

function resetRoutingVisuals() {
  routingLabel.textContent = 'Select Node';
  routingLabel.className = 'badge badge-indigo';
  activeRingRoute.textContent = 'Hash Pointer';
  prefixHashHex.textContent = '0x00000000';
  highlightNodeRow(null);
}

// --- 4. Submit Search submissions ---
function submitSearch(query) {
  if (!query || !query.trim()) return;

  const trimmed = query.trim();
  const startTime = performance.now();

  fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: trimmed })
  })
    .then(res => res.json())
    .then(data => {
      const duration = (performance.now() - startTime).toFixed(1);
      responseTime.textContent = `${duration} ms`;
      
      // Render response
      responseBody.textContent = JSON.stringify(data, null, 2);
      responseBody.className = 'text-emerald';

      // Clear suggestions dropdown
      hideSuggestions();
      
      // Update statistics instantly
      fetchStats();
      fetchTrending();
    })
    .catch(err => {
      responseBody.textContent = `Error: ${err.message}`;
      responseBody.className = 'text-rose';
    });
}

// --- 5. Fetch Stats & Queue Dashboard ---
function fetchStats() {
  fetch('/api/stats')
    .then(res => res.json())
    .then(data => {
      // Update stats cards
      statTotalSubmissions.textContent = data.totalSubmissions.toLocaleString();
      statWritesSaved.textContent = data.dbWritesSaved.toLocaleString();
      statReductionRate.textContent = `${data.writeReductionPercent}%`;
      statDbOps.textContent = data.dbWriteOperations.toLocaleString();

      // Buffer state
      queueOccupancy.textContent = data.activeQueueSize;
      
      // Update limit dynamically in UI
      const seconds = ((Date.now() - data.lastFlushTime) / 1000).toFixed(0);
      lastFlushLabel.textContent = `Last flush: ${seconds}s ago`;

      // Update Queue list items
      renderQueueTable(data.activeQueue);

      // Node Stats
      if (data.cacheStats) {
        data.cacheStats.forEach(node => {
          if (node.name.includes('Node-A')) {
            nodeAKeys.textContent = `${node.keysCount} keys`;
            nodeARatio.textContent = `Hit: ${node.hits} / Miss: ${node.misses}`;
          } else if (node.name.includes('Node-B')) {
            nodeBKeys.textContent = `${node.keysCount} keys`;
            nodeBRatio.textContent = `Hit: ${node.hits} / Miss: ${node.misses}`;
          } else if (node.name.includes('Node-C')) {
            nodeCKeys.textContent = `${node.keysCount} keys`;
            nodeCRatio.textContent = `Hit: ${node.hits} / Miss: ${node.misses}`;
          }
        });
      }
    })
    .catch(err => console.error('Error fetching stats:', err));
}

function renderQueueTable(queue) {
  queueTableBody.innerHTML = '';
  
  if (queue.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'Queue is empty. Type in search to queue queries.';
    tr.appendChild(td);
    queueTableBody.appendChild(tr);
    return;
  }

  queue.forEach(item => {
    const tr = document.createElement('tr');
    
    const tdQuery = document.createElement('td');
    tdQuery.textContent = item.query;
    tr.appendChild(tdQuery);
    
    const tdCount = document.createElement('td');
    tdCount.className = 'text-right font-semibold text-emerald';
    tdCount.textContent = `+${item.count}`;
    tr.appendChild(tdCount);

    queueTableBody.appendChild(tr);
  });
}

// --- 6. Fetch & Render Trending Panel ---
function fetchTrending() {
  fetch(`/api/trending?ranking=${rankingMode}`)
    .then(res => res.json())
    .then(data => {
      trendingListOl.innerHTML = '';
      
      data.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'trending-item';
        
        const spanText = document.createElement('span');
        spanText.className = 'trend-word';
        spanText.textContent = `${idx + 1}. ${item.query}`;
        li.appendChild(spanText);

        const spanCount = document.createElement('span');
        spanCount.className = 'trend-count';
        if (rankingMode === 'recency' && item.recent !== undefined) {
          spanCount.textContent = `recent: +${item.recent}`;
          spanCount.style.color = '#34d399';
        } else {
          spanCount.textContent = `${item.count.toLocaleString()}`;
        }
        li.appendChild(spanCount);

        // Click trending item to search
        li.addEventListener('click', () => {
          selectSuggestion(item.query);
        });

        trendingListOl.appendChild(li);
      });
    })
    .catch(err => console.error('Error fetching trending:', err));
}

// --- 7. Consistent Hash Ring Visualization drawing ---
function drawRing(activeHash, targetNodeName) {
  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw outer circle ring path
  ctx.beginPath();
  ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Draw node region slices boundary guidelines (optional, thin dashed)
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]); // Reset

  if (ringVirtualNodes.length === 0) return;

  // Colors dictionary mapping
  const nodeColors = {
    'Cache-Node-A': '#6366f1', // indigo
    'Cache-Node-B': '#10b981', // emerald
    'Cache-Node-C': '#a78bfa'  // violet
  };

  // 2. Draw all Virtual replicas dots on the ring
  ringVirtualNodes.forEach(item => {
    // Math: angle theta corresponding to the hashVal
    // Convert 32-bit unsigned to double fraction [0, 1]
    const fraction = item.hashVal / 0xffffffff;
    const theta = fraction * 2 * Math.PI - Math.PI / 2; // Subtract PI/2 to start 0 at top (12 o'clock)

    const x = centerX + ringRadius * Math.cos(theta);
    const y = centerY + ringRadius * Math.sin(theta);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = nodeColors[item.nodeName] || '#94a3b8';
    ctx.fill();
  });

  // 3. Draw pointer line & landing arc for active query prefix
  if (activeHash !== null) {
    const fraction = activeHash / 0xffffffff;
    const activeTheta = fraction * 2 * Math.PI - Math.PI / 2;

    const pointerX = centerX + ringRadius * Math.cos(activeTheta);
    const pointerY = centerY + ringRadius * Math.sin(activeTheta);

    // Draw connecting line from center to ring boundary pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pointerX, pointerY);
    ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)'; // glowing orange path
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw active key hash pointer dot (large glowing circle)
    ctx.beginPath();
    ctx.arc(pointerX, pointerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#fb923c'; // Orange
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fb923c';
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Find the next replica clockwise on ring to highlight routing traversal
    const nextReplica = findClockwiseReplica(activeHash);
    if (nextReplica) {
      const destFraction = nextReplica.hashVal / 0xffffffff;
      let destTheta = destFraction * 2 * Math.PI - Math.PI / 2;

      // Draw clockwise routing highlight arc on ring
      ctx.beginPath();
      // Ensure we draw clockwise arc
      let startAng = activeTheta;
      let endAng = destTheta;
      if (endAng < startAng) {
        endAng += 2 * Math.PI; // Correct wrap-around
      }
      ctx.arc(centerX, centerY, ringRadius, startAng, endAng, false);
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Highlight the targeted virtual node replica dot
      const destX = centerX + ringRadius * Math.cos(destTheta);
      const destY = centerY + ringRadius * Math.sin(destTheta);
      ctx.beginPath();
      ctx.arc(destX, destY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = nodeColors[nextReplica.nodeName];
      ctx.fill();
      ctx.shadowBlur = 0; // Reset
    }
  }
}

// Find clockwise next replica (first replica hash >= activeHash, wrapping if needed)
function findClockwiseReplica(activeHash) {
  if (ringVirtualNodes.length === 0) return null;
  
  // Find first replica where replica.hashVal >= activeHash
  const next = ringVirtualNodes.find(item => item.hashVal >= activeHash);
  if (next) return next;
  
  // Otherwise wrap around to the first element
  return ringVirtualNodes[0];
}

// Helper to highlight targeted Cache Node list row in sidebar
function highlightNodeRow(nodeName) {
  nodeRowA.classList.remove('active-route');
  nodeRowB.classList.remove('active-route');
  nodeRowC.classList.remove('active-route');

  if (nodeName === 'Cache-Node-A') nodeRowA.classList.add('active-route');
  if (nodeName === 'Cache-Node-B') nodeRowB.classList.add('active-route');
  if (nodeName === 'Cache-Node-C') nodeRowC.classList.add('active-route');
}

// Help banner message
function showSuccessMessage(msg) {
  responseBody.textContent = JSON.stringify({ status: "Success", details: msg }, null, 2);
  responseBody.className = 'text-indigo';
  setTimeout(() => {
    if (responseBody.className === 'text-indigo') {
      responseBody.textContent = '{ "message": "Idle - Awaiting search" }';
      responseBody.className = 'text-muted';
    }
  }, 3500);
}
