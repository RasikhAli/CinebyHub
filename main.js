import * as XLSX from 'xlsx';

// ══════════════════════════════════════════════════════════
//  CONSTANTS & CONFIG
// ══════════════════════════════════════════════════════════
const PAGE_SIZE = 60; // items per page

// Tab → sheet name in the Excel file  (matches cineby_links.xlsx)
const TAB_SHEETS = {
  'movies': '🎬 Movies',
  'tvshows': '📺 TV Shows',
  'anime-series': '🎌 Anime (Series)',
  'anime-movies': '🎌 Anime Movies',
  'channels': '📡 Channels',
};

// Accent colours per tab (for hero gradients & UI theming)
const TAB_COLORS = {
  'movies': { accent: '#ef4444', glow: 'rgba(239,68,68,0.18)' },
  'tvshows': { accent: '#38bdf8', glow: 'rgba(56,189,248,0.18)' },
  'anime-series': { accent: '#a855f7', glow: 'rgba(168,85,247,0.18)' },
  'anime-movies': { accent: '#c084fc', glow: 'rgba(192,132,252,0.18)' },
  'channels': { accent: '#10b981', glow: 'rgba(16,185,129,0.18)' },
};

// Hero titles per tab
const TAB_HEROES = {
  'movies': { h: 'Discover Epic Movies', p: 'Thousands of films — action, drama, sci-fi & more. Click to watch instantly.' },
  'tvshows': { h: 'Binge-Worthy TV Shows', p: 'Full seasons, every episode. From thriller dramas to reality hits.' },
  'anime-series': { h: 'Anime Universe', p: 'Explore iconic series and hidden gems from Japan and beyond.' },
  'anime-movies': { h: 'Anime Film Collection', p: 'Beautifully animated feature films from Japan\'s finest studios.' },
  'channels': { h: 'Live Channels & Networks', p: 'TV networks and streaming platforms around the world.' },
};

// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════
let db = {};                // { tabKey: [item, ...] }
let activeTab = 'movies';
let currentFilter = 'all';
let currentSort = 'popularity';
let currentPage = 1;
let isListView = false;
let filteredCache = [];    // cached filtered list for current tab

// ══════════════════════════════════════════════════════════
//  DOM
// ══════════════════════════════════════════════════════════
const grid = document.getElementById('movieGrid');
const loader = document.getElementById('loader');
const loaderSub = document.getElementById('loaderSub');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');
const genreFilters = document.getElementById('genreFilters');
const sortSelect = document.getElementById('sortSelect');
const resultCount = document.getElementById('resultCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const backToTop = document.getElementById('backToTop');
const themeToggle = document.getElementById('themeToggle');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const heroTitle = document.getElementById('heroTitle');
const heroSubtitle = document.getElementById('heroSubtitle');
const paginationWrap = document.getElementById('paginationWrap');
const paginationPrev = document.getElementById('paginationPrev');
const paginationNext = document.getElementById('paginationNext');
const paginationInfo = document.getElementById('paginationInfo');

// ══════════════════════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════════════════════
const savedTheme = localStorage.getItem('cinebyhub-theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggle.onclick = () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('cinebyhub-theme', next);
};

// ══════════════════════════════════════════════════════════
//  VIEW TOGGLE
// ══════════════════════════════════════════════════════════
gridViewBtn.onclick = () => {
  isListView = false;
  grid.classList.remove('list-view');
  gridViewBtn.classList.add('active');
  listViewBtn.classList.remove('active');
  renderPage();
};
listViewBtn.onclick = () => {
  isListView = true;
  grid.classList.add('list-view');
  listViewBtn.classList.add('active');
  gridViewBtn.classList.remove('active');
  renderPage();
};

// ══════════════════════════════════════════════════════════
//  LOAD DATA
// ══════════════════════════════════════════════════════════
async function loadData() {
  // Primary file: cineby_content.xlsx (linkvertise_api_lite.py writes LV links into it)
  const files = ['cineby_content.xlsx'];
  let buf = null;
  let usedFile = '';

  for (const file of files) {
    try {
      loaderSub.textContent = `Trying ${file}…`;
      const res = await fetch(file);
      if (!res.ok) continue;
      buf = await res.arrayBuffer();
      usedFile = file;
      break;
    } catch (_) { }
  }

  if (!buf) {
    loader.innerHTML = `
      <div class="loader-error">
        <div style="font-size:3rem">📂</div>
        <h3>No Data File Found</h3>
        <p>Place <code>cineby_content.xlsx</code> in the <code>public/</code> folder.</p>
        <ol style="text-align:left;margin-top:1rem;line-height:2">
          <li>Run <code>python run_all.py</code> from the project folder</li>
          <li>— or — run <code>cineby_scraper.py</code> then <code>linkvertise_api_lite.py</code></li>
          <li>The file is auto-saved to <code>public/cineby_content.xlsx</code></li>
        </ol>
      </div>`;
    return;
  }

  loaderSub.textContent = `Parsing ${usedFile}…`;
  const wb = XLSX.read(buf, { type: 'array' });

  // Parse each tab's sheet
  for (const [tabKey, sheetName] of Object.entries(TAB_SHEETS)) {
    loaderSub.textContent = `Loading ${sheetName}…`;
    if (!wb.SheetNames.includes(sheetName)) { db[tabKey] = []; continue; }

    const ws = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

    db[tabKey] = raw.map((row, idx) => normalizeRow(row, idx, tabKey));

    // Count badge
    const cnt = document.getElementById(`cnt-${tabKey}`);
    if (cnt) cnt.textContent = db[tabKey].length.toLocaleString();
  }

  // Update hero stats
  document.getElementById('statMovies').textContent = (db['movies']?.length || 0).toLocaleString();
  document.getElementById('statTV').textContent = (db['tvshows']?.length || 0).toLocaleString();
  const animeTotal = (db['anime-series']?.length || 0) + (db['anime-movies']?.length || 0);
  document.getElementById('statAnime').textContent = animeTotal.toLocaleString();
  document.getElementById('statChannels').textContent = (db['channels']?.length || 0).toLocaleString();

  loader.style.display = 'none';
  switchTab('movies');
}

// ══════════════════════════════════════════════════════════
//  NORMALIZE ROW
// ══════════════════════════════════════════════════════════
function normalizeRow(row, idx, tabKey) {
  const isChannel = tabKey === 'channels';

  const title = str(row['Title'] || row['Name']) || 'Unknown';
  const tmdbId = row['TMDB ID'] || row['Network ID'] || '';
  const poster = str(row['Poster'] || row['Logo'] || '');
  const rating = parseFloat(row['Rating (TMDB)'] || 0);
  const votes = parseInt(row['Vote Count'] || 0, 10);
  const pop = parseFloat(row['Popularity'] || 0);
  const date = str(row['Release Date'] || row['First Air Date'] || '');
  const genres = str(row['Genres'] || '');
  const lang = str(row['Language'] || row['Country'] || '');
  const overview = str(row['Overview'] || row['Headquarters'] || '');
  const cinebyUrl = str(row['Cineby URL'] || row['Cineby Ep1 URL'] || '');
  const vidkingUrl = str(row['Vidking Embed'] || '');
  const homepage = str(row['Homepage'] || '');
  const lvLink = str(row['Linkvertise_Link'] || '');

  // The watch URL: prefer LV link → Vidking embed → homepage
  const watchUrl = lvLink || (isChannel ? homepage : vidkingUrl) || homepage;

  return {
    id: idx,
    title,
    tmdbId,
    poster,
    rating,
    votes,
    popularity: pop,
    date,
    genres: genres.split(',').map(g => g.trim()).filter(Boolean),
    lang,
    overview,
    cinebyUrl,
    vidkingUrl,
    homepage,
    lvLink,
    watchUrl,
    isChannel,
    tabKey,
  };
}

// ══════════════════════════════════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════════════════════════════════
function switchTab(tabKey) {
  activeTab = tabKey;
  currentFilter = 'all';
  currentPage = 1;
  sortSelect.value = 'popularity';
  currentSort = 'popularity';
  searchInput.value = '';
  searchClear.classList.remove('visible');

  // Update tab UI
  document.querySelectorAll('.content-tab').forEach(t => {
    const active = t.dataset.tab === tabKey;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active);
  });

  // Update hero
  const hero = TAB_HEROES[tabKey] || {};
  heroTitle.textContent = hero.h || '';
  heroSubtitle.textContent = hero.p || '';

  // Update CSS accent
  const colors = TAB_COLORS[tabKey] || TAB_COLORS['movies'];
  document.documentElement.style.setProperty('--accent', colors.accent);
  document.documentElement.style.setProperty('--accent-glow', colors.glow);

  // Rebuild genre tabs
  buildGenreTabs();
  applyFilter();
}

// Wire up tab buttons
document.querySelectorAll('.content-tab').forEach(btn => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

// ══════════════════════════════════════════════════════════
//  GENRE TABS
// ══════════════════════════════════════════════════════════
function buildGenreTabs() {
  genreFilters.innerHTML = '';

  // All button
  const allBtn = document.createElement('button');
  allBtn.className = 'genre-btn active';
  allBtn.dataset.genre = 'all';
  allBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> All`;
  allBtn.onclick = () => { currentFilter = 'all'; setActiveGenre(allBtn); applyFilter(); };
  genreFilters.appendChild(allBtn);

  if (activeTab === 'channels') return; // channels don't have genres

  const items = db[activeTab] || [];
  const genreSet = new Set(items.flatMap(m => m.genres));
  const sorted = [...genreSet].sort();

  sorted.forEach(genre => {
    const btn = document.createElement('button');
    btn.className = 'genre-btn';
    btn.dataset.genre = genre;
    btn.textContent = genre;
    btn.onclick = () => { currentFilter = genre; currentPage = 1; setActiveGenre(btn); applyFilter(); };
    genreFilters.appendChild(btn);
  });
}

function setActiveGenre(activeBtn) {
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

// ══════════════════════════════════════════════════════════
//  FILTER + SORT
// ══════════════════════════════════════════════════════════
function applyFilter() {
  const items = db[activeTab] || [];
  const q = searchInput.value.trim().toLowerCase();

  let list = items.filter(m => {
    const matchQ = !q || m.title.toLowerCase().includes(q)
      || m.genres.some(g => g.toLowerCase().includes(q))
      || m.overview.toLowerCase().includes(q);
    const matchG = currentFilter === 'all'
      || m.genres.map(g => g.toLowerCase()).includes(currentFilter.toLowerCase());
    return matchQ && matchG;
  });

  // Sort
  if (currentSort === 'default') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentSort === 'az') {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (currentSort === 'za') {
    list.sort((a, b) => b.title.localeCompare(a.title));
  } else if (currentSort === 'popularity') {
    list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } else if (currentSort === 'newest') {
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  filteredCache = list;
  currentPage = 1;
  renderPage();
}

window.resetFilters = function () {
  currentFilter = 'all';
  currentPage = 1;
  currentSort = 'popularity';
  sortSelect.value = 'popularity';
  searchInput.value = '';
  searchClear.classList.remove('visible');
  document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
  const allBtn = genreFilters.querySelector('[data-genre="all"]');
  if (allBtn) allBtn.classList.add('active');
  applyFilter();
};

// ══════════════════════════════════════════════════════════
//  RENDER PAGE
// ══════════════════════════════════════════════════════════
function renderPage() {
  grid.innerHTML = '';
  emptyState.style.display = 'none';

  const total = filteredCache.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (total === 0) {
    emptyState.style.display = 'block';
    resultCount.textContent = '';
    paginationWrap.style.display = 'none';
    return;
  }

  // Clamp page
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filteredCache.slice(start, start + PAGE_SIZE);

  resultCount.textContent = `${total.toLocaleString()} title${total !== 1 ? 's' : ''}`;

  slice.forEach((item, i) => {
    const card = buildCard(item, i);
    grid.appendChild(card);
  });

  // Pagination
  if (totalPages > 1) {
    paginationWrap.style.display = 'flex';
    paginationPrev.disabled = currentPage <= 1;
    paginationNext.disabled = currentPage >= totalPages;
    paginationInfo.textContent = `Page ${currentPage} / ${totalPages}`;
  } else {
    paginationWrap.style.display = 'none';
  }
}

paginationPrev.onclick = () => { currentPage--; renderPage(); window.scrollTo({ top: document.getElementById('toolbar').offsetTop - 70, behavior: 'smooth' }); };
paginationNext.onclick = () => { currentPage++; renderPage(); window.scrollTo({ top: document.getElementById('toolbar').offsetTop - 70, behavior: 'smooth' }); };

// ══════════════════════════════════════════════════════════
//  CARD BUILDER
// ══════════════════════════════════════════════════════════
const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=60';

function buildCard(item, i) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${Math.min(i, 30) * 25}ms`;

  const poster = item.poster || FALLBACK;
  const ratingHtml = item.rating > 0
    ? `<span class="card-rating">⭐ ${item.rating.toFixed(1)}</span>`
    : '';
  const badgeLabel = item.isChannel ? 'Live' : (item.tabKey === 'anime-series' || item.tabKey === 'anime-movies' ? 'Anime' : item.tabKey === 'tvshows' ? 'TV' : 'Film');
  const yearStr = item.date ? item.date.slice(0, 4) : '';

  if (isListView) {
    card.innerHTML = `
      <div class="card-poster-list">
        <img class="card-img" src="${esc(poster)}" alt="${esc(item.title)}" loading="lazy" onerror="this.src='${FALLBACK}'">
        <span class="card-badge card-badge-${item.tabKey}">${badgeLabel}</span>
      </div>
      <div class="card-body">
        <div class="card-meta-row">
          ${ratingHtml}
          ${yearStr ? `<span class="card-year">${yearStr}</span>` : ''}
          <span class="card-lang">${esc(item.lang.toUpperCase())}</span>
        </div>
        <h2 class="card-title">${esc(item.title)}</h2>
        <p class="card-genre-text">${esc(item.genres.slice(0, 4).join(' · '))}</p>
        ${item.overview ? `<p class="card-overview">${esc(item.overview.slice(0, 140))}…</p>` : ''}
        <div class="card-actions">
          ${item.watchUrl ? `<a href="${esc(item.watchUrl)}" target="_blank" rel="noopener" class="card-btn-watch" onclick="event.stopPropagation()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Now
          </a>` : ''}
          <button class="card-btn-info">Details</button>
        </div>
      </div>`;
  } else {
    card.innerHTML = `
      <div class="card-poster">
        <img class="card-img" src="${esc(poster)}" alt="${esc(item.title)}" loading="lazy" onerror="this.src='${FALLBACK}'">
        <span class="card-badge card-badge-${item.tabKey}">${badgeLabel}</span>
        ${ratingHtml ? `<div class="card-rating-badge">${ratingHtml}</div>` : ''}
        <div class="card-overlay">
          <div class="card-overlay-content">
            <div class="card-play-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            <span class="card-overlay-label">${item.watchUrl ? 'Watch Now' : 'View Details'}</span>
          </div>
        </div>
      </div>
      <div class="card-body">
        <h2 class="card-title">${esc(item.title)}</h2>
        <div class="card-footer">
          <span class="card-genre-text">${esc(item.genres.slice(0, 2).join(' · ') || (yearStr || ''))}</span>
          ${yearStr && item.genres.length > 0 ? `<span class="card-year-sm">${yearStr}</span>` : ''}
        </div>
      </div>`;
  }

  card.onclick = () => openModal(item);
  return card;
}

// ══════════════════════════════════════════════════════════
//  MODAL
// ══════════════════════════════════════════════════════════
function openModal(item) {
  const poster = item.poster || FALLBACK;
  const yearStr = item.date ? item.date.slice(0, 4) : '';
  const colors = TAB_COLORS[item.tabKey] || TAB_COLORS['movies'];

  const watchBtnHtml = item.watchUrl
    ? `<a href="${esc(item.watchUrl)}" target="_blank" rel="noopener" class="modal-watch-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Watch Now
       </a>`
    : `<span class="modal-no-link">No stream link yet</span>`;

  const cinebyBtnHtml = item.cinebyUrl
    ? `<a href="${esc(item.cinebyUrl)}" target="_blank" rel="noopener" class="modal-cineby-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open on Cineby
       </a>`
    : '';

  modalBody.innerHTML = `
    <div class="m-hero">
      <img class="m-hero-img" src="${esc(poster)}" alt="${esc(item.title)}" onerror="this.src='${FALLBACK}'">
      <div class="m-hero-grad"></div>
      <div class="m-hero-info">
        <div class="m-badges">
          <span class="m-badge m-badge-tab">${item.isChannel ? '📡 Channel' : item.tabKey === 'anime-series' ? '🎌 Anime Series' : item.tabKey === 'anime-movies' ? '✨ Anime Film' : item.tabKey === 'tvshows' ? '📺 TV Show' : '🎬 Movie'}</span>
          ${item.lang ? `<span class="m-badge">${item.lang.toUpperCase()}</span>` : ''}
          ${yearStr ? `<span class="m-badge">${yearStr}</span>` : ''}
          ${item.rating > 0 ? `<span class="m-badge m-badge-rating">⭐ ${item.rating.toFixed(1)}</span>` : ''}
        </div>
        <h2 class="m-title">${esc(item.title)}</h2>
        <div class="m-genre-chips">
          ${item.genres.slice(0, 6).map(g => `<span class="m-chip">${esc(g)}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="m-body">
      ${item.overview ? `<p class="m-overview">${esc(item.overview)}</p>` : ''}

      <div class="m-stats-row">
        ${item.rating > 0 ? `<div class="m-stat"><div class="m-stat-val">⭐ ${item.rating.toFixed(1)}</div><div class="m-stat-lbl">TMDB Rating</div></div>` : ''}
        ${item.votes > 0 ? `<div class="m-stat"><div class="m-stat-val">${item.votes.toLocaleString()}</div><div class="m-stat-lbl">Votes</div></div>` : ''}
        ${item.popularity > 0 ? `<div class="m-stat"><div class="m-stat-val">${Math.round(item.popularity).toLocaleString()}</div><div class="m-stat-lbl">Popularity</div></div>` : ''}
        ${item.date ? `<div class="m-stat"><div class="m-stat-val">${item.date}</div><div class="m-stat-lbl">Release</div></div>` : ''}
      </div>

      <div class="m-actions">
        ${watchBtnHtml}
        ${cinebyBtnHtml}
        ${item.homepage && !item.isChannel ? `<a href="${esc(item.homepage)}" target="_blank" rel="noopener" class="modal-secondary-btn">🌐 Website</a>` : ''}
        ${item.isChannel && item.homepage ? `<a href="${esc(item.homepage)}" target="_blank" rel="noopener" class="modal-cineby-btn">🌐 Visit Channel</a>` : ''}
      </div>

      ${item.tmdbId ? `<div class="m-tmdb-id">TMDB ID: <code>${item.tmdbId}</code></div>` : ''}
    </div>`;

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

closeModal.onclick = closeModalFn;
modalOverlay.onclick = e => { if (e.target === modalOverlay) closeModalFn(); };
document.onkeydown = e => { if (e.key === 'Escape') closeModalFn(); };

function closeModalFn() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ══════════════════════════════════════════════════════════
//  SEARCH & SORT
// ══════════════════════════════════════════════════════════
let searchTimer;
searchInput.oninput = () => {
  const q = searchInput.value;
  searchClear.classList.toggle('visible', q.length > 0);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; applyFilter(); }, 200);
};
searchClear.onclick = () => {
  searchInput.value = '';
  searchClear.classList.remove('visible');
  currentPage = 1;
  applyFilter();
};
sortSelect.onchange = () => { currentSort = sortSelect.value; currentPage = 1; applyFilter(); };

// ══════════════════════════════════════════════════════════
//  SCROLL BEHAVIOURS
// ══════════════════════════════════════════════════════════
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 500);
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
});
backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

// ══════════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════════
function esc(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function str(v) {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
loadData();
