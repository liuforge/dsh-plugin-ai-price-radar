/**
 * Client half of the AI price radar: registers one global main panel (the
 * comparison page) plus its sidebar entry, mirroring how the shipped Plugins
 * page mounts into the root `main` keyed slot.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-ai-price-radar',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const PANEL_ID = 'ai-price-radar'

    /* ---------------------------------------------------------- styles ---- */
    // Scoped class prefix `radar-`. The panel owns a fixed light palette
    // (white canvas, grey cards, dark text) so it stays readable regardless of
    // the host theme; accent colors are darkened for white backgrounds.
    const cssText = `
.radar-page{
  /* 固定浅色主题：面板不再吃宿主的深色变量，白底 + 深灰字（2026-11-21） */
  --radar-bg:#ffffff;--radar-surface:#f7f8fa;--radar-field:#ffffff;--radar-hover:#eef1f5;
  --radar-border:#e5e8ec;--radar-border-strong:#cfd6de;
  --radar-text:#1f2328;--radar-text-2:#57606a;--radar-text-3:#7d8590;
  --radar-accent:#4d6bfe;color-scheme:light;}
.radar-page{display:flex;flex-direction:column;min-height:0;height:100%;overflow-y:auto;
  padding:calc(var(--dsh-frame-top-clearance,0px) + 16px) 24px 32px;
  background:var(--radar-bg);color:var(--radar-text);
  font-size:var(--dsh-content-font-size,14px);box-sizing:border-box;}
.radar-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;}
.radar-title-row{display:flex;align-items:center;gap:10px;}
.radar-dot{width:10px;height:10px;border-radius:50%;background:#15803d;box-shadow:0 0 0 3px rgba(34,197,94,.15);}
.radar-title{font-size:20px;font-weight:700;letter-spacing:.2px;}
.radar-badge{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid var(--radar-border);color:var(--radar-text-2);}
.radar-sub{margin-top:6px;font-size:12px;color:var(--radar-text-3);}
.radar-mode{font-size:12px;color:var(--radar-text-2);border:1px solid var(--radar-border);border-radius:999px;padding:4px 12px;white-space:nowrap;}
.radar-search{margin-top:16px;background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:12px;padding:16px;}
.radar-search-row{display:flex;gap:10px;}
.radar-input{flex:1;min-width:160px;background:var(--radar-field);border:1px solid var(--radar-border);border-radius:8px;
  padding:9px 12px;color:inherit;font-size:14px;outline:none;}
.radar-input:focus{border-color:var(--radar-accent);}
.radar-btn{background:var(--radar-accent);color:#fff;border:none;border-radius:8px;padding:9px 18px;
  font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;}
.radar-btn:hover{filter:brightness(1.1);}
.radar-btn[disabled]{opacity:.5;cursor:default;}
.radar-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:14px;}
.radar-field{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--radar-text-3);}
.radar-select{background:var(--radar-field);border:1px solid var(--radar-border);border-radius:8px;
  padding:8px 10px;color:var(--radar-text);font-size:13px;outline:none;cursor:pointer;}
.radar-stats{display:flex;gap:28px;margin-top:18px;align-items:flex-end;flex-wrap:wrap;}
.radar-stat{display:flex;flex-direction:column;gap:2px;}
.radar-stat b{font-size:22px;font-weight:700;color:var(--radar-text);}
.radar-stat span{font-size:11px;color:var(--radar-text-3);}
.radar-stat .price{color:#ea580c;}
.radar-meta{margin-left:auto;font-size:11px;color:var(--radar-text-3);text-align:right;}
.radar-warn{margin-top:10px;font-size:12px;color:#b45309;}
.radar-section{margin-top:26px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.radar-section h3{margin:0;font-size:15px;font-weight:700;}
.radar-sort{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--radar-text-3);}
.radar-grid{margin-top:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(430px,1fr));gap:12px;}
@media (max-width:520px){.radar-grid{grid-template-columns:1fr;}}
.radar-card{background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:12px;padding:14px 16px;
  display:flex;flex-direction:column;gap:8px;transition:border-color .15s;}
.radar-card:hover{border-color:var(--radar-border-strong);}
.radar-chips{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
.radar-chip{font-size:11px;padding:2px 8px;border-radius:6px;background:var(--radar-hover);color:var(--radar-text-2);}
.radar-chip.ok{color:#15803d;background:rgba(34,197,94,.1);}
.radar-chip.out{color:#dc2626;background:rgba(239,68,68,.1);}
.radar-chip.src{color:#4d6bfe;background:rgba(77,107,254,.1);}
.radar-card-title{font-size:13px;font-weight:600;color:var(--radar-text);line-height:1.45;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.radar-price{font-size:24px;font-weight:800;color:#ea580c;}
.radar-price small{font-size:13px;font-weight:600;margin-right:2px;}
.radar-store{font-size:12px;color:var(--radar-text-2);}
.radar-card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:2px;}
.radar-obs{font-size:11px;color:var(--radar-text-3);}
.radar-link{background:rgba(34,197,94,.12);color:#15803d;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;}
.radar-link:hover{background:rgba(34,197,94,.2);}
.radar-empty{margin-top:40px;text-align:center;color:var(--radar-text-3);font-size:13px;}
.radar-doc{margin-top:34px;background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:12px;padding:16px 18px;}
.radar-doc h4{margin:0 0 10px;font-size:14px;}
.radar-doc ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;font-size:12px;line-height:1.6;color:var(--radar-text-2);}
.radar-doc a{color:var(--radar-accent);text-decoration:none;}
.radar-loading{margin-top:40px;text-align:center;color:var(--radar-text-3);font-size:13px;}
.radar-tabs{display:flex;gap:6px;margin-top:18px;border-bottom:1px solid var(--radar-border);}
.radar-tab{background:none;border:none;border-bottom:2px solid transparent;padding:9px 16px;font-size:13px;font-weight:600;
  color:var(--radar-text-3);cursor:pointer;white-space:nowrap;}
.radar-tab:hover{color:var(--radar-text);}
.radar-tab.active{color:var(--radar-accent);border-bottom-color:var(--radar-accent);}
.radar-board{margin-top:14px;display:flex;flex-direction:column;gap:10px;}
.radar-rank{background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:10px;
  padding:12px 14px;display:flex;align-items:center;gap:14px;}
.radar-rank-no{width:30px;min-width:30px;text-align:center;font-size:16px;font-weight:800;color:var(--radar-text-3);}
.radar-rank-no.top{color:#b45309;}
.radar-rank-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;}
.radar-rank-name{font-size:13px;font-weight:600;color:var(--radar-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.radar-rank-sub{font-size:11px;color:var(--radar-text-3);display:flex;gap:10px;flex-wrap:wrap;}
.radar-rank-num{text-align:right;min-width:96px;display:flex;flex-direction:column;gap:2px;}
.radar-rank-num b{font-size:17px;font-weight:800;color:#ea580c;}
.radar-rank-num span{font-size:10px;color:var(--radar-text-3);}
.radar-bar{height:5px;border-radius:3px;background:var(--radar-hover);overflow:hidden;}
.radar-bar > i{display:block;height:100%;background:linear-gradient(90deg,#4d6bfe,#16a34a);border-radius:3px;}
.radar-rank-actions{display:flex;gap:6px;align-items:center;}
.radar-mini{background:rgba(77,107,254,.12);color:var(--radar-accent);border:none;border-radius:6px;
  padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;}
.radar-mini:hover{background:rgba(77,107,254,.22);}
.radar-board-title{margin:0 0 4px;font-size:14px;font-weight:700;}
.radar-board-note{font-size:11px;color:var(--radar-text-3);line-height:1.6;margin:0 0 8px;}
.radar-subhead{margin:18px 0 8px;font-size:13px;font-weight:700;color:var(--radar-text-2);}
.radar-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;}
.radar-cat{background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:12px;padding:14px;}
.radar-cat h5{margin:0 0 8px;font-size:14px;font-weight:700;display:flex;justify-content:space-between;align-items:center;}
.radar-cat h5 em{font-style:normal;font-size:11px;color:var(--radar-text-3);font-weight:500;}
.radar-cat-metrics{display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:var(--radar-text-3);}
.radar-cat-metrics b{display:block;font-size:16px;color:var(--radar-text);font-weight:700;}
.radar-cat-metrics b.orange{color:#ea580c;}
.radar-cat-bar{margin-top:10px;}
.radar-cat-foot{margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;}
.radar-cat-shop{font-size:11px;color:var(--radar-text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.radar-clickable{cursor:pointer;transition:border-color .15s,transform .1s;}
.radar-clickable:hover{border-color:var(--radar-accent);transform:translateY(-1px);}
.radar-crumb{display:flex;align-items:center;gap:8px;margin-top:16px;padding:10px 14px;background:var(--radar-surface);
  border:1px solid var(--radar-border);border-radius:10px;font-size:12px;flex-wrap:wrap;}
.radar-crumb button{background:none;border:none;color:var(--radar-accent);font-size:12px;cursor:pointer;padding:2px 4px;}
.radar-crumb button:hover{text-decoration:underline;}
.radar-crumb span.sep{color:var(--radar-text-3);}
.radar-crumb span.cur{color:var(--radar-text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:420px;}
.radar-detail-head{margin-top:14px;background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:12px;padding:16px;}
.radar-detail-head h3{margin:0 0 4px;font-size:18px;font-weight:700;}
.radar-detail-head p{margin:0;font-size:12px;color:var(--radar-text-3);}
.radar-detail-metrics{display:flex;gap:24px;margin-top:14px;flex-wrap:wrap;}
.radar-detail-metrics div{font-size:11px;color:var(--radar-text-3);}
.radar-detail-metrics b{display:block;font-size:20px;font-weight:800;color:var(--radar-text);}
.radar-detail-metrics b.orange{color:#ea580c;}
.radar-detail-list{margin-top:12px;display:flex;flex-direction:column;gap:8px;}
.radar-detail-row{background:var(--radar-surface);border:1px solid var(--radar-border);border-radius:10px;
  padding:11px 13px;display:flex;align-items:center;gap:12px;}
.radar-detail-row .rd-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.radar-detail-row .rd-title{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.radar-detail-row .rd-sub{font-size:11px;color:var(--radar-text-3);display:flex;gap:10px;flex-wrap:wrap;}
.radar-detail-row .rd-price{font-size:16px;font-weight:800;color:#ea580c;white-space:nowrap;min-width:78px;text-align:right;}
.radar-detail-row .rd-price.best{color:#15803d;}
.radar-rel{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;}
.radar-rel button{background:var(--radar-hover);border:1px solid var(--radar-border);
  color:var(--radar-text-2);border-radius:999px;padding:5px 12px;font-size:11px;cursor:pointer;}
.radar-rel button:hover{color:var(--radar-accent);border-color:var(--radar-accent);}
.radar-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px;}
.radar-tool-btn{background:var(--radar-surface);border:1px solid var(--radar-border);
  color:var(--radar-text-2);border-radius:8px;padding:7px 12px;font-size:12px;cursor:pointer;white-space:nowrap;}
.radar-tool-btn:hover{color:var(--radar-accent);border-color:var(--radar-accent);}
.radar-tool-btn.on{color:#15803d;border-color:#15803d;}
.radar-tool-sep{flex:1;}
.radar-detail-filter{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px;}
.radar-detail-filter input{background:var(--radar-field);border:1px solid var(--radar-border);
  border-radius:8px;padding:7px 10px;color:inherit;font-size:12px;outline:none;min-width:180px;}
.radar-detail-filter select{background:var(--radar-field);border:1px solid var(--radar-border);
  border-radius:8px;padding:7px 10px;color:inherit;font-size:12px;cursor:pointer;}
.radar-trend-wrap{margin-top:12px;background:var(--radar-surface);border:1px solid var(--radar-border);
  border-radius:12px;padding:16px;}
.radar-trend-svg{width:100%;height:220px;display:block;}
.radar-trend-legend{display:flex;gap:16px;font-size:11px;color:var(--radar-text-3);margin-top:8px;flex-wrap:wrap;}
.radar-trend-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:middle;}
.radar-compare-scroll{overflow-x:auto;margin-top:12px;}
.radar-compare-table{border-collapse:collapse;width:100%;font-size:12px;min-width:700px;}
.radar-compare-table th,.radar-compare-table td{border:1px solid var(--radar-border);padding:8px 10px;text-align:left;vertical-align:top;}
.radar-compare-table th{background:var(--radar-hover);color:var(--radar-text-2);font-weight:600;white-space:nowrap;}
.radar-compare-table td.best{color:#15803d;font-weight:700;}
.radar-compare-table a{color:var(--radar-accent);text-decoration:none;}
.radar-chip-btn{background:rgba(77,107,254,.12);color:var(--radar-accent);border:none;border-radius:6px;
  padding:3px 8px;font-size:11px;cursor:pointer;}
.radar-chip-btn.on{background:rgba(34,197,94,.15);color:#15803d;}
@media (max-width:760px){
  .radar-page{padding:16px 12px 28px;}
  .radar-stats{gap:14px;}
  .radar-stat b{font-size:17px;}
  .radar-meta{margin-left:0;text-align:left;width:100%;}
  .radar-filters{grid-template-columns:repeat(auto-fit,minmax(130px,1fr));}
  .radar-tabs{overflow-x:auto;}
  .radar-tab{padding:8px 10px;font-size:12px;}
  .radar-rank{gap:8px;padding:10px;}
  .radar-rank-num{min-width:70px;}
  .radar-detail-row{flex-wrap:wrap;}
  .radar-crumb span.cur{max-width:180px;}
  .radar-tool-btn{font-size:11px;padding:6px 9px;}
}
`
    // Inject one stylesheet; removed with the plugin.
    let styleEl = null
    function ensureStyles() {
      if (styleEl || typeof document === 'undefined') return
      styleEl = document.createElement('style')
      styleEl.setAttribute('data-ai-price-radar', '')
      styleEl.textContent = cssText
      document.head.appendChild(styleEl)
    }
    function removeStyles() {
      if (styleEl) { styleEl.remove(); styleEl = null }
    }

    /* ----------------------------------------------------------- state ---- */
    const SOURCES = [
      { id: 'biwu', label: 'BiWu.Ai（http://BiWu.Ai）' },
      { id: 'aiprice', label: 'AI价网（http://aiprice.club）' },
      { id: 'catfk', label: '云猫寄售（catfk.com）' },
      { id: 'openprice', label: 'OpenPrice（openprice.cc）' },
      { id: 'zhitu', label: '知途·拾价（price.yufu.pub）' },
      { id: 'priceai', label: 'PriceAI（priceai.cc）' },
      { id: 'aifeeradar', label: 'AIFeeRadar（aifeeradar.com）' },
    ]
    const SOURCE_NAMES = Object.fromEntries(SOURCES.map(s => [s.id, s.label.replace(/（.*$/, '').trim()]))
    const PLATFORMS = ['全部平台', '链动小铺', '自建站', '云猫寄售', '16688', '独角数卡', '未知']
    const TYPES = ['全部类型', '成品号', '代充', '卡密', '车位', '质保', '未知']
    const SORTS = [
      { id: 'price-asc', label: '价格从低到高' },
      { id: 'price-desc', label: '价格从高到低' },
      { id: 'time-desc', label: '观察时间从新到旧' },
    ]
    const FRESHNESS = [
      { id: 'all', label: '全部时间' },
      { id: '24h', label: '24 小时内' },
      { id: '7d', label: '7 天内' },
      { id: '30d', label: '30 天内' },
    ]
    /** Search aliases: an OR group per token, AND between tokens. */
    const ALIASES = {
      gpt: ['gpt', 'chatgpt', 'codex', 'openai', 'sora', 'plus', 'pro'],
      chatgpt: ['chatgpt', 'gpt', 'codex', 'openai'],
      codex: ['codex', 'gpt', 'chatgpt'],
      claude: ['claude', 'anthropic', '克劳德'],
      gemini: ['gemini', 'google', 'veo', '谷歌'],
      grok: ['grok', 'xai'],
      cursor: ['cursor', 'windsurf', 'kiro'],
      deepseek: ['deepseek', '深度求索'],
      邮箱: ['邮箱', 'gmail', 'outlook', 'hotmail', 'icloud', 'mail'],
      接码: ['接码', '验证码', 'sms', 'kyc'],
      中转: ['中转', 'api', 'token', 'gateway'],
      成品号: ['成品号', '账号', '普号', '白号'],
      代充: ['代充', '充值', '直充'],
      卡密: ['卡密', 'cdk', '兑换码'],
    }
    const SUGGESTIONS = ['gpt', 'chatgpt plus', 'claude pro', 'gemini', 'grok', 'cursor', 'deepseek', '邮箱', '接码', '中转 API', '成品号', '代充', '卡密', '车位']

    function expandQuery(q) {
      const tokens = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean)
      return tokens.map(t => {
        const direct = ALIASES[t]
        if (direct) return direct
        for (const [key, vals] of Object.entries(ALIASES)) if (t.includes(key) || key.includes(t)) return vals
        return [t]
      })
    }
    function matchesQuery(row, groups) {
      if (groups.length === 0) return true
      const hay = `${row.title} ${row.store} ${row.category || ''} ${row.subCategory || ''} ${row.productType || ''}`.toLowerCase()
      return groups.every(g => g.some(term => hay.includes(term)))
    }
    function withinFreshness(row, freshness) {
      if (freshness === 'all') return true
      const t = Date.parse(row.observedAt)
      if (!isFinite(t)) return false
      const days = freshness === '24h' ? 1 : freshness === '7d' ? 7 : 30
      return Date.now() - t <= days * 86400000
    }
    function readUrlState() {
      try {
        const p = new URLSearchParams(String(location.hash || '').replace(/^#/, ''))
        const d = p.get('detail')
        return {
          tab: p.get('tab') || 'offers',
          category: p.get('cat') || '全部类目',
          source: p.get('src') || 'all',
          stock: p.get('stock') || 'all',
          platform: p.get('pf') || '全部平台',
          type: p.get('type') || '全部类型',
          freshness: p.get('fresh') || 'all',
          sort: p.get('sort') || 'price-asc',
          query: p.get('q') || '',
          detail: d ? { type: d.split(':')[0], key: d.slice(d.indexOf(':') + 1), label: p.get('label') || '', fromTab: p.get('tab') || 'offers' } : null,
        }
      } catch { return null }
    }
    function writeUrlState(s) {
      try {
        const p = new URLSearchParams()
        if (s.tab !== 'offers') p.set('tab', s.tab)
        if (s.category !== '全部类目') p.set('cat', s.category)
        if (s.source !== 'all') p.set('src', s.source)
        if (s.stock !== 'all') p.set('stock', s.stock)
        if (s.platform !== '全部平台') p.set('pf', s.platform)
        if (s.type !== '全部类型') p.set('type', s.type)
        if (s.freshness !== 'all') p.set('fresh', s.freshness)
        if (s.sort !== 'price-asc') p.set('sort', s.sort)
        if (s.query) p.set('q', s.query)
        if (s.detail) { p.set('detail', `${s.detail.type}:${s.detail.key}`); p.set('label', s.detail.label) }
        const hash = p.toString()
        const next = hash ? '#' + hash : location.pathname + location.search
        history.replaceState(null, '', next)
      } catch { /* host may own location; state still works in memory */ }
    }
    function loadFavorites() {
      try { const v = JSON.parse(localStorage.getItem('ai-price-radar:favorites') || '[]'); return Array.isArray(v) ? v : [] }
      catch { return [] }
    }

    function Panel() {
      const initial = React.useMemo(() => readUrlState() || {}, [])
      const [state, setState] = React.useState({
        loading: true, error: null, snapshot: null,
        query: initial.query || '',
        source: initial.source || 'all', stock: initial.stock || 'all',
        platform: initial.platform || '全部平台', type: initial.type || '全部类型',
        category: initial.category || '全部类目', freshness: initial.freshness || 'all',
        tab: initial.tab || 'offers', sort: initial.sort || 'price-asc', page: 1,
        detail: initial.detail || null,
        autoRefresh: false,
        favorites: typeof localStorage !== 'undefined' ? loadFavorites() : [],
      })
      const inputRef = React.useRef(null)
      const PAGE_SIZE = 100

      const load = React.useCallback((force) => {
        setState(s => ({ ...s, loading: true, error: null }))
        fetch(`/leida/api/offers${force ? '?force=1' : ''}`)
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
          .then(snapshot => setState(s => ({ ...s, loading: false, snapshot })))
          .catch(error => setState(s => ({ ...s, loading: false, error: String(error.message || error) })))
      }, [])
      React.useEffect(() => { load(false) }, [load])
      // URL state: shareable + refresh-safe; popstate restores browser Back.
      React.useEffect(() => { writeUrlState(state) }, [state.tab, state.category, state.source, state.stock, state.platform, state.type, state.freshness, state.sort, state.query, state.detail])
      React.useEffect(() => {
        const onPop = () => { const u = readUrlState(); if (u) setState(s => ({ ...s, ...u, page: 1, detail: u.detail || null })) }
        window.addEventListener('popstate', onPop)
        return () => window.removeEventListener('popstate', onPop)
      }, [])
      // Silent auto-refresh every 5 minutes, opt-in.
      React.useEffect(() => {
        if (!state.autoRefresh) return undefined
        const id = setInterval(() => load(false), 5 * 60 * 1000)
        return () => clearInterval(id)
      }, [state.autoRefresh, load])

      const snapshot = state.snapshot
      const rows = snapshot ? snapshot.rows : []
      const categories = React.useMemo(() => {
        const names = [...new Set(rows.map(r => r.category).filter(Boolean))].sort()
        return ['全部类目', ...names]
      }, [rows])
      const filtered = React.useMemo(() => {
        const groups = expandQuery(state.query)
        const out = rows.filter(r => {
          if (state.source !== 'all' && r.source !== state.source) return false
          if (state.stock === 'in' && r.stock !== 'in') return false
          if (state.stock === 'out' && r.stock !== 'out') return false
          if (state.platform !== '全部平台' && r.platform !== state.platform) return false
          if (state.type !== '全部类型' && r.productType !== state.type) return false
          if (state.category !== '全部类目' && r.category !== state.category) return false
          if (!withinFreshness(r, state.freshness)) return false
          if (!matchesQuery(r, groups)) return false
          return true
        })
        out.sort((a, b) => {
          if (state.sort === 'price-asc') return a.price - b.price
          if (state.sort === 'price-desc') return b.price - a.price
          return String(b.observedAt).localeCompare(String(a.observedAt))
        })
        return out
      }, [rows, state.query, state.source, state.stock, state.platform, state.type, state.category, state.freshness, state.sort])

      const pageRows = filtered.slice(0, state.page * PAGE_SIZE)
      const lowest = filtered.length ? Math.min(...filtered.map(r => r.price)) : null
      const markedCount = filtered.filter(r => r.stock === 'in').length
      const okSources = snapshot ? snapshot.sources.filter(s => !s.failed).length : 0
      const totalSources = snapshot ? snapshot.sources.length : 0
      const sourceFailures = snapshot ? snapshot.sources.flatMap(s => (s.failures || []).map(f => `${s.label || s.source}：${f}`)) : []

      const onSubmit = (e) => {
        e.preventDefault()
        setState(s => ({ ...s, query: inputRef.current ? inputRef.current.value : '', page: 1 }))
      }
      const setField = (key) => (e) => setState(s => ({ ...s, [key]: e.target.value, page: 1 }))
      const setTab = (tab) => setState(s => ({ ...s, tab, detail: null }))
      const pickCategory = (name) => setState(s => ({ ...s, category: name, tab: 'offers', page: 1, query: '', detail: null }))
      const openDetail = (type, key, label, fromTab) => setState(s => ({ ...s, detail: { type, key, label, fromTab: fromTab || s.tab } }))
      const closeDetail = () => setState(s => ({ ...s, detail: null }))
      const toggleFavorite = (key) => setState(s => {
        const has = s.favorites.includes(key)
        const favorites = has ? s.favorites.filter(k => k !== key) : [...s.favorites, key]
        try { localStorage.setItem('ai-price-radar:favorites', JSON.stringify(favorites)) } catch { /* storage optional */ }
        return { ...s, favorites }
      })
      const clearFavorites = () => setState(s => {
        try { localStorage.setItem('ai-price-radar:favorites', '[]') } catch { /* storage optional */ }
        return { ...s, favorites: [], detail: null }
      })
      const exportCsv = () => {
        const cols = ['title', 'price', 'currency', 'store', 'platform', 'source', 'category', 'productType', 'stock', 'observedAt', 'url']
        const head = ['商品', '价格', '币种', '店铺', '平台', '来源', '类目', '交付类型', '库存', '观察时间', '原始链接']
        const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`
        const lines = [head.map(esc).join(','), ...filtered.map(r => cols.map(c => esc(r[c])).join(','))]
        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `ai-price-radar-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }

      return h('div', { className: 'radar-page' },
        h('style', null, cssText),
        h('div', { className: 'radar-header' },
          h('div', null,
            h('div', { className: 'radar-title-row' },
              h('span', { className: 'radar-dot' }),
              h('span', { className: 'radar-title' }, 'AI 比价雷达'),
              h('span', { className: 'radar-badge' }, 'DSH 插件'),
            ),
            h('div', { className: 'radar-sub' }, '多源采集 · 同商品筛选 · 原始购买链接 · 独立数据缓存'),
          ),
          h('span', { className: 'radar-mode' }, '本地运行 / 只读采集'),
        ),
        h('form', { className: 'radar-search', onSubmit },
          h('div', { className: 'radar-search-row' },
            h('input', {
              ref: inputRef, className: 'radar-input', placeholder: '搜索商品关键词，如 gpt、claude 质保…（空格分隔多条件，支持同义词）',
              defaultValue: state.query, list: 'radar-suggestions',
            }),
            h('datalist', { id: 'radar-suggestions' }, SUGGESTIONS.map(s => h('option', { key: s, value: s }))),
            h('button', { className: 'radar-btn', type: 'submit' }, '搜索全网报价'),
          ),
          h('div', { className: 'radar-filters' },
            h('label', { className: 'radar-field' }, '数据来源',
              h('select', { className: 'radar-select', value: state.source, onChange: setField('source') },
                h('option', { value: 'all' }, '全部可用来源'),
                SOURCES.map(s => h('option', { key: s.id, value: s.id }, s.label)),
              ),
            ),
            h('label', { className: 'radar-field' }, '库存口径',
              h('select', { className: 'radar-select', value: state.stock, onChange: setField('stock') },
                h('option', { value: 'all' }, '全部（含未知）'),
                h('option', { value: 'in' }, '标记有货'),
                h('option', { value: 'out' }, '标记缺货'),
              ),
            ),
            h('label', { className: 'radar-field' }, '发卡平台',
              h('select', { className: 'radar-select', value: state.platform, onChange: setField('platform') },
                PLATFORMS.map(p => h('option', { key: p, value: p }, p)),
              ),
            ),
            h('label', { className: 'radar-field' }, '商品/交付类型',
              h('select', { className: 'radar-select', value: state.type, onChange: setField('type') },
                TYPES.map(t => h('option', { key: t, value: t }, t)),
              ),
            ),
            h('label', { className: 'radar-field' }, '观察时间',
              h('select', { className: 'radar-select', value: state.freshness, onChange: setField('freshness') },
                FRESHNESS.map(f => h('option', { key: f.id, value: f.id }, f.label)),
              ),
            ),
            h('label', { className: 'radar-field' }, '商品类目',
              h('select', { className: 'radar-select', value: state.category, onChange: setField('category') },
                categories.map(c => h('option', { key: c, value: c }, c)),
              ),
            ),
          ),
        ),
        h('div', { className: 'radar-stats' },
          h('div', { className: 'radar-stat' }, h('b', null, String(filtered.length)), h('span', null, '主要报价')),
          h('div', { className: 'radar-stat' }, h('b', null, String(markedCount)), h('span', null, '来源标记有货')),
          h('div', { className: 'radar-stat' },
            h('b', { className: 'price' }, lowest !== null ? `¥${formatPrice(lowest)}` : '—'),
            h('span', null, '当前结果最低价'),
          ),
          h('div', { className: 'radar-stat' }, h('b', null, `${okSources}/${totalSources}`), h('span', null, '成功/部分数据源')),
          h('div', { className: 'radar-meta' },
            snapshot ? `查询于 ${new Date(snapshot.fetchedAt || snapshot.cachedAt || Date.now()).toLocaleTimeString()} · 当前页面展示 ${pageRows.length} / ${filtered.length} 条${snapshot.cached ? `（缓存于 ${new Date(snapshot.cachedAt).toLocaleTimeString()}）` : '（来源实时聚合）'}` : '正在加载…',
          ),
        ),
        ((snapshot && snapshot.errors && snapshot.errors.length > 0) || sourceFailures.length > 0) && h('div', { className: 'radar-warn' },
          '部分来源受限：' + [
            ...(snapshot ? snapshot.errors.map(e => e.source + ' ' + e.message) : []),
            ...sourceFailures,
          ].join('；'),
        ),
        h('div', { className: 'radar-toolbar' },
          h('button', { className: 'radar-tool-btn', type: 'button', onClick: exportCsv }, `导出当前结果 CSV（${filtered.length} 条）`),
          h('button', { className: `radar-tool-btn${state.autoRefresh ? ' on' : ''}`, type: 'button',
            onClick: () => setState(s => ({ ...s, autoRefresh: !s.autoRefresh })) }, state.autoRefresh ? '自动刷新：开（5 分钟）' : '自动刷新：关'),
          h('button', { className: 'radar-tool-btn', type: 'button', onClick: () => load(true) }, '立即刷新数据'),
          h('span', { className: 'radar-tool-sep' }),
          h('button', { className: `radar-tool-btn${state.favorites.length ? ' on' : ''}`, type: 'button',
            onClick: () => openDetail('compare', 'favorites', `对比清单 · ${state.favorites.length} 款`, state.tab) },
            `对比清单（${state.favorites.length}）`),
          state.favorites.length > 0 && h('button', { className: 'radar-tool-btn', type: 'button', onClick: clearFavorites }, '清空'),
        ),
        state.detail && (state.detail.type === 'compare'
          ? h(CompareView, {
            favorites: state.favorites, rows, onBack: closeDetail,
            toggleFavorite, clearFavorites, openDetail,
          })
          : h(DetailView, {
            detail: state.detail, rows, groups: snapshot ? (snapshot.groups || []) : [],
            shopSales: snapshot ? (snapshot.shopSales || []) : [],
            favorites: state.favorites, toggleFavorite,
            onBack: closeDetail, openDetail, pickCategory, onTab: setTab,
          })),
        // TOP sites keep global navigation visible on detail pages: the tab bar
        // stays mounted, and picking any tab closes the current detail view.
        h('div', { className: 'radar-tabs' },
          [['offers', '报价卡片'], ['categories', '分类榜单'], ['hot', '销售热榜'], ['same', '同款比价'], ['trend', '价格走势']].map(([id, label]) =>
            h('button', {
              key: id, type: 'button',
              className: `radar-tab${!state.detail && state.tab === id ? ' active' : ''}${state.detail && state.detail.fromTab === id ? ' active' : ''}`,
              onClick: () => setTab(id),
            }, label),
          ),
        ),
        !state.detail && state.tab === 'offers' && h(OffersView, {
          state, filtered, pageRows, setField, openDetail,
          favorites: state.favorites, toggleFavorite,
          onLoadMore: () => setState(s => ({ ...s, page: s.page + 1 })),
        }),
        !state.detail && state.tab === 'categories' && h(CategoryBoard, { rows, onPick: pickCategory, openDetail }),
        !state.detail && state.tab === 'hot' && h(HotBoard, { rows, shopSales: snapshot ? (snapshot.shopSales || []) : [], openDetail }),
        !state.detail && state.tab === 'same' && h(SameItemBoard, { groups: snapshot ? (snapshot.groups || []) : [], openDetail }),
        !state.detail && state.tab === 'trend' && h(PriceTrendBoard, { history: snapshot ? (snapshot.history || []) : [] }),
        h('div', { className: 'radar-doc' },
          h('h4', null, '数据来源与口径'),
          h('ul', null,
            h('li', null, 'BiWu.Ai（http://BiWu.Ai） ——主源。官方只读快照 feed（/price-radar/latest.json → 不可变快照），无需鉴权，按其公开 API 约定带缓存拉取，约 5 分钟一版；本页报价大多覆盖链动小铺（wzyp.cn）发布的实时数据。'),
            h('li', null, 'AI价网（http://aiprice.club） ——补漏源。解析其公开类目报价表；数据遵循 CC BY 4.0，署名「AI价网 (http://aiprice.club)」。'),
            h('li', null, '云猫寄售（catfk.com） ——直连源。经其公开店铺接口（/shopApi/Shop/goodsList，逐店实时抓取）；店铺清单发现自 AI价网的公开店铺目录。'),
            h('li', null, 'OpenPrice（https://www.openprice.cc） ——量最大源（1.8 万+ 条）。读取其全量商品页内嵌的公开数据（initialItems），含 344 家店铺、18 个类目；站点 robots 全站开放。'),
            h('li', null, '知途·拾价（https://price.yufu.pub） ——公开 catalog API（robots.txt 明确白名单 /api/catalog），1100+ 商品 3700+ 报价，含店铺评分与验价状态。'),
            h('li', null, 'PriceAI（https://priceai.cc） 与 AIFeeRadar（https://aifeeradar.com） ——与 BiWu.Ai 同一 price-radar.v1 官方快照 feed 家族（各自 /.well-known/price-radar.json 发现，按其 API 约定带缓存拉取）。'),
            h('li', null, '链动小铺（wzyp.cn） ——数据主源之一，但直抓被其 ESA 人机验证拦截；其报价由 BiWu、AI价网、知途、OpenPrice 四路覆盖，实时性以聚合源为准。'),
            h('li', null, '水獭（shuifa.xyz） ——本轮未并入：2026-11-13 起实测域名不可达（恢复后可按同架构接入）.'),
            h('li', null, '榜单下钻：分类卡片、店铺销量行、商品已售行、同款比价行、报价卡片均可点击进去查看详情（面包屑 + 返回 + 各来源报价表 + 去原站直链 + 类目/店铺交叉导航），交互参照 BiWu、AI价网、知途的详情页习惯。详情页内可再搜索、排序、按库存筛选。'),
            h('li', null, '价格走势：宿主每天记录一次全站与各品类的最低价/中位价/报价数快照（本机持久化、最多 90 天），从第 2 天起可看折线；数据自本功能上线后开始积累。'),
            h('li', null, '效率工具：搜索支持同义词（gpt↔ChatGPT/Codex/OpenAI 等）与多关键词 AND、输入联想；观察时间可筛 24h/7天/30天；结果可导出 CSV；可开 5 分钟自动刷新；点「+ 对比」把商品加入本机清单横向比较。筛选/排序/详情状态写入 URL hash，可分享、刷新可恢复。'),
            h('li', null, '同款比价：按商家原始购买链接归并，同一链接被多个来源收录时每个来源只取最低价（避免同店不同规格误判），展示真实跨源价差与可省金额；疑似引流价（¥1 以下对 ¥20 以上）单独排除。'),
            h('li', null, '分类榜单：把七源的细分类目统一归入 12 个 AI 货架（ChatGPT / Claude / Gemini / Grok / 邮箱账号 / 接码验证 / API 中转 等）；报价数=供给规模，最低/中位价=当前结果价格带，店铺数=活跃店铺。'),
            h('li', null, '销售热榜：店铺累计销量取自 AI价网公开「店铺销量」标签与云猫寄售 Shop/info 的 sell_count（已按店铺去重、冲突取较大值）；商品「已售」取自标题标注；供给热度按店铺收录报价数排序，明确非销量。均为商家公开的历史累计口径，非本插件成交数据。'),
            h('li', null, '库存口径：数字 = 库存件数；未知 = 来源未公开库存。同一商品以「平台 + 店铺标识 + 商品标识」为键去重；同一商品同时有直抓与聚合报价时保留直抓行。报价行不重复计数。'),
            h('li', null, '本页只做信息聚合与导航，不参与任何交易；付款前请以商家页面为准。'),
          ),
        ),
      )
    }

    /** Tab 4: same-item cross-source comparison — the real "比价" view. */
    function SameItemBoard({ groups, openDetail }) {
      const withSpread = groups.filter(g => g.spread > 0 && !g.suspicious)
      const suspiciousCount = groups.filter(g => g.spread > 0 && g.suspicious).length
      const maxSpread = withSpread.reduce((m, g) => Math.max(m, g.spread), 1)
      const totalSave = withSpread.reduce((n, g) => n + g.spread, 0)
      return h('div', null,
        h('div', { className: 'radar-board' },
          h('h4', { className: 'radar-board-title' }, '同款比价 · 同一商品在不同来源的价差'),
          h('p', { className: 'radar-board-note' },
            `按商家原始购买链接归并：${groups.length} 款商品被 2 个以上来源收录，其中 ${withSpread.length} 款存在真实价差，合计可省 ¥${formatPrice(totalSave)}。每个来源只取该链接的最低价（避免同店不同规格误判）；另排除 ${suspiciousCount} 款疑似引流价（¥1 以下对 ¥20 以上）。价格为各来源采集时的公开报价，付款前请回原站核对。`),
        ),
        withSpread.length === 0 && h('div', { className: 'radar-empty' }, '本轮没有发现跨来源有价差的同款商品。'),
        withSpread.slice(0, 60).map((g, i) => h('div', { className: 'radar-rank radar-clickable', key: g.url + i,
          onClick: () => openDetail('item', g.url, g.title, 'same') },
          h('span', { className: `radar-rank-no${i < 3 ? ' top' : ''}` }, String(i + 1)),
          h('div', { className: 'radar-rank-main' },
            h('span', { className: 'radar-rank-name', title: g.title }, g.title),
            h('span', { className: 'radar-rank-sub' },
              h('span', null, `${g.sources.length} 个来源`),
              h('span', null, `最低 ${SOURCE_NAMES[g.bestSource] || g.bestSource} · ${g.bestStore}`),
              h('span', null, `¥${formatPrice(g.min)} → ¥${formatPrice(g.max)}`),
            ),
            h('div', { className: 'radar-bar' }, h('i', { style: { width: `${Math.max(2, (g.spread / maxSpread) * 100)}%` } })),
          ),
          h('div', { className: 'radar-rank-num' },
            h('b', null, `¥${formatPrice(g.spread)}`),
            h('span', null, `可省 ${g.savePct}%`),
          ),
          h('div', { className: 'radar-rank-actions' },
            g.url && h('a', { className: 'radar-link', href: g.url, target: '_blank', rel: 'noopener noreferrer nofollow',
              onClick: (e) => e.stopPropagation() }, '去原站'),
          ),
        )),
      )
    }

    function formatPrice(value) {
      if (typeof value !== 'number' || !isFinite(value)) return '—'
      if (Number.isInteger(value)) return String(value)
      return String(Number(value.toFixed(2)))
    }

    function compactNumber(n) {
      if (!isFinite(n)) return '—'
      if (n >= 10000) return `${Number((n / 10000).toFixed(1))} 万`
      return String(n)
    }

    /**
     * Drill-down detail view. Borrows the TOP sites' shared pattern:
     * breadcrumb + back, headline metrics, a price/comparison table with stock
     * badges and outbound buy links, and cross-navigation to related
     * categories/shops. Rendered in-page (not a modal) so the host theme,
     * scrolling and focus behaviour stay intact.
     */
    function DetailView({ detail, rows, groups, shopSales, favorites, toggleFavorite, onBack, openDetail, pickCategory, onTab }) {
      const { type, key, label } = detail
      const [filterQuery, setFilterQuery] = React.useState('')
      const [filterSort, setFilterSort] = React.useState('price-asc')
      const [filterStock, setFilterStock] = React.useState('all')
      React.useEffect(() => { setFilterQuery(''); setFilterSort('price-asc'); setFilterStock('all') }, [type, key])
      const content = React.useMemo(() => {
        if (type === 'shop') {
          const shopRows = rows.filter(r => (r.store || '').trim().toLowerCase() === key.trim().toLowerCase()
            || (r.store || '').toLowerCase().includes(key.toLowerCase()))
          const sales = shopSales.find(s => (s.shop || '').trim().toLowerCase() === key.trim().toLowerCase())
          const cats = [...new Set(shopRows.map(r => r.category).filter(Boolean))]
          return { kind: 'shop', shopRows, sales, cats }
        }
        if (type === 'item') {
          const g = groups.find(x => x.url === key)
          const itemRows = g ? rows.filter(r => groupKeyOf(r.url) === key) : rows.filter(r => r.dedupeKey === key || r.url === key)
          return { kind: 'item', group: g, itemRows }
        }
        const catRows = rows.filter(r => r.category === key)
        const byShop = new Map()
        for (const r of catRows) byShop.set(r.store, (byShop.get(r.store) || 0) + 1)
        return { kind: 'category', catRows, topShops: [...byShop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10) }
      }, [type, key, rows, groups, shopSales])

      const allRows = content.shopRows || content.itemRows || content.catRows || []
      const prices = allRows.map(r => r.price).sort((a, b) => a - b)
      const min = prices[0]
      const median = prices[Math.floor(prices.length / 2)]
      const inStock = allRows.filter(r => r.stock === 'in').length
      const title = type === 'category' ? `${key} · 品类详情` : label
      const subtitle = type === 'shop'
        ? '该店铺在七源的公开报价、销量与品类分布'
        : type === 'item'
          ? '同一商品在各来源的公开报价对比'
          : '该品类的价格带、活跃店铺与最低价商品'

      const filteredRows = React.useMemo(() => {
        const gs = expandQuery(filterQuery)
        const out = allRows.filter(r => matchesQuery(r, gs) && (filterStock === 'all' || (filterStock === 'in' ? r.stock === 'in' : r.stock === 'out')))
        out.sort((a, b) => filterSort === 'price-desc' ? b.price - a.price
          : filterSort === 'time-desc' ? String(b.observedAt).localeCompare(String(a.observedAt))
            : a.price - b.price)
        return out
      }, [allRows, filterQuery, filterSort, filterStock])
      const listRows = filteredRows.slice(0, 40)
      const bestPrice = allRows.length ? allRows.reduce((m, r) => Math.min(m, r.price), Infinity) : null

      return h('div', null,
        h('div', { className: 'radar-crumb' },
          h('button', { type: 'button', onClick: onBack }, '← 返回榜单'),
          h('span', { className: 'sep' }, '/'),
          h('button', { type: 'button', onClick: () => onTab(detail.fromTab || 'hot') },
            ({ offers: '报价卡片', categories: '分类榜单', hot: '销售热榜', same: '同款比价', trend: '价格走势' })[detail.fromTab] || '销售热榜'),
          h('span', { className: 'sep' }, '/'),
          h('span', { className: 'cur', title: label }, label),
        ),
        h('div', { className: 'radar-detail-head' },
          h('h3', null, title),
          h('p', null, subtitle),
          h('div', { className: 'radar-detail-metrics' },
            h('div', null, h('b', null, String(allRows.length)), '收录报价'),
            h('div', null, h('b', null, String(inStock)), '标记有货'),
            h('div', null, h('b', { className: 'orange' }, min !== undefined ? `¥${formatPrice(min)}` : '—'), '最低价'),
            h('div', null, h('b', null, median !== undefined ? `¥${formatPrice(median)}` : '—'), '中位价'),
            content.kind === 'shop' && content.sales && h('div', null, h('b', null, compactNumber(content.sales.sales)), '累计销量(公开)'),
            content.kind === 'item' && content.group && h('div', null, h('b', { className: 'orange' }, `¥${formatPrice(content.group.spread)}`), '跨源价差'),
          ),
        ),
        content.kind === 'item' && content.group && h('div', { className: 'radar-board', style: { marginTop: '12px' } },
          h('h4', { className: 'radar-board-title' }, '各来源报价（每源取最低）'),
          h('div', { className: 'radar-detail-list' },
            content.group.quotes.map((q, i) => h('div', { className: 'radar-detail-row', key: q.source + i },
              h('div', { className: 'rd-main' },
                h('span', { className: 'rd-title' }, SOURCE_NAMES[q.source] || q.source),
                h('span', { className: 'rd-sub' }, h('span', null, q.store), h('span', null, q.stock === 'in' ? '有货' : q.stock === 'out' ? '缺货' : '库存未知')),
              ),
              h('span', { className: `rd-price${q.price === bestPrice ? ' best' : ''}` }, `¥${formatPrice(q.price)}`),
              q.url && h('a', { className: 'radar-link', href: q.url, target: '_blank', rel: 'noopener noreferrer nofollow' }, '去原站'),
            )),
          ),
        ),
        h('h4', { className: 'radar-subhead' }, content.kind === 'shop' ? '该店报价' : content.kind === 'item' ? '该商品在全部来源的报价明细' : '该类目商品'),
        h('div', { className: 'radar-detail-filter' },
          h('input', { placeholder: '在此结果内搜索（支持同义词）', value: filterQuery, list: 'radar-suggestions',
            onChange: (e) => setFilterQuery(e.target.value) }),
          h('select', { value: filterSort, onChange: (e) => setFilterSort(e.target.value) },
            SORTS.map(s => h('option', { key: s.id, value: s.id }, s.label)),
          ),
          h('select', { value: filterStock, onChange: (e) => setFilterStock(e.target.value) },
            h('option', { value: 'all' }, '全部库存'), h('option', { value: 'in' }, '仅看有货'), h('option', { value: 'out' }, '仅看缺货'),
          ),
          h('span', { style: { fontSize: '11px', color: 'var(--radar-text-3)' } }, `筛出 ${filteredRows.length} 条`),
        ),
        listRows.length < filteredRows.length && h('p', { className: 'radar-board-note' }, `共 ${filteredRows.length} 条，下列展示前 ${listRows.length} 条；可用上方排序/筛选继续缩小。`),
        h('div', { className: 'radar-detail-list' },
          listRows.map((r, i) => h('div', { className: 'radar-detail-row radar-clickable', key: r.dedupeKey + i,
            onClick: () => openDetail('item', r.url || r.dedupeKey, r.title, 'offers') },
            h('div', { className: 'rd-main' },
              h('span', { className: 'rd-title', title: r.title }, r.title),
              h('span', { className: 'rd-sub' },
                h('span', null, r.store),
                h('span', null, SOURCE_NAMES[r.source] || r.source),
                h('span', null, r.category || ''),
                h('span', null, r.stock === 'in' ? '有货' : r.stock === 'out' ? '缺货' : '库存未知'),
                r.observedAt && h('span', null, relTime(r.observedAt)),
              ),
            ),
            h('span', { className: `rd-price${r.price === bestPrice ? ' best' : ''}` }, `¥${formatPrice(r.price)}`),
            h('button', { className: `radar-chip-btn${favorites.includes(r.dedupeKey) ? ' on' : ''}`, type: 'button',
              onClick: (e) => { e.stopPropagation(); toggleFavorite(r.dedupeKey) } },
              favorites.includes(r.dedupeKey) ? '✓ 已对比' : '+ 对比'),
            r.url && h('a', { className: 'radar-link', href: r.url, target: '_blank', rel: 'noopener noreferrer nofollow',
              onClick: (e) => e.stopPropagation() }, '去原站'),
          )),
        ),
        // Cross-navigation: TOP sites always link category <-> shop both ways.
        h('h4', { className: 'radar-subhead' }, content.kind === 'category' ? '该类目活跃店铺（点击查看店铺详情）' : '相关导航'),
        h('div', { className: 'radar-rel' },
          content.kind === 'shop' && (content.cats || []).map(c => h('button', { key: c, type: 'button', onClick: () => pickCategory(c) }, `类目：${c}`)),
          content.kind === 'shop' && h('button', { type: 'button', onClick: () => openDetail('category', (content.cats || [])[0] || '其它 AI 服务', (content.cats || [])[0] || '其它 AI 服务', 'hot') }, '查看主营类目'),
          content.kind === 'category' && (content.topShops || []).map(([s, n]) => h('button', { key: s, type: 'button', onClick: () => openDetail('shop', s, s, 'categories') }, `${s} · ${n} 条`)),
          content.kind === 'item' && h('button', { type: 'button', onClick: () => { const r = (content.itemRows || [])[0]; if (r) openDetail('shop', r.store, r.store, 'offers') } }, '查看该店铺其它商品'),
          content.kind === 'item' && h('button', { type: 'button', onClick: () => { const r = (content.itemRows || [])[0]; if (r) pickCategory(r.category) } }, '查看同类目全部报价'),
        ),
      )
    }

    /** Tab 5: price history. One snapshot per UTC day, pure SVG (no deps). */
    function PriceTrendBoard({ history }) {
      const [metric, setMetric] = React.useState('lowest')
      const [cat, setCat] = React.useState('全站')
      const cats = React.useMemo(() => {
        const set = new Set()
        for (const h of history) for (const k of Object.keys(h.byCategory || {})) set.add(k)
        return ['全站', ...[...set].sort()]
      }, [history])
      const series = React.useMemo(() => history.map(h => {
        if (cat === '全站') return { day: h.day, value: metric === 'total' ? h.total : metric === 'median' ? h.median : h.lowest }
        return { day: h.day, value: h.byCategory?.[cat] }
      }).filter(p => typeof p.value === 'number' && isFinite(p.value)), [history, metric, cat])
      const W = 900, H = 220, P = 34
      const values = series.map(p => p.value)
      const min = values.length ? Math.min(...values) : 0
      const max = values.length ? Math.max(...values) : 1
      const span = max - min || 1
      const x = (i) => P + (series.length <= 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (series.length - 1))
      const y = (v) => H - P - (v - min) / span * (H - 2 * P)
      const path = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
      const area = series.length > 1 ? `${path} L${x(series.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z` : ''
      const label = metric === 'total' ? '收录报价数' : metric === 'median' ? '中位价' : '最低价'
      return h('div', null,
        h('div', { className: 'radar-board' },
          h('h4', { className: 'radar-board-title' }, '价格走势 · 每日快照'),
          h('p', { className: 'radar-board-note' },
            `宿主每天记录一次聚合快照（全站与各类目最低价、中位价、报价数），保存在本机，重启不丢，最多保留 90 天。当前已积累 ${history.length} 天。数据从本功能上线后开始积累，天数不足 2 天时画不出折线属正常。`),
          h('div', { className: 'radar-detail-filter' },
            h('select', { value: metric, onChange: (e) => setMetric(e.target.value) },
              h('option', { value: 'lowest' }, '最低价'),
              h('option', { value: 'median' }, '中位价'),
              h('option', { value: 'total' }, '收录报价数'),
            ),
            h('select', { value: cat, onChange: (e) => setCat(e.target.value) },
              cats.map(c => h('option', { key: c, value: c }, c)),
            ),
          ),
        ),
        history.length < 2
          ? h('div', { className: 'radar-empty' }, '历史快照不足 2 天，明天再来看趋势。当前：' + (history[0] ? `${history[0].day} · 最低 ¥${formatPrice(history[0].lowest)} · ${history[0].total} 条` : '暂无'))
          : h('div', { className: 'radar-trend-wrap' },
            h('svg', { className: 'radar-trend-svg', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' },
              h('line', { x1: P, y1: H - P, x2: W - P, y2: H - P, stroke: 'var(--radar-border)', 'stroke-width': 1 }),
              h('line', { x1: P, y1: P, x2: P, y2: H - P, stroke: 'var(--radar-border)', 'stroke-width': 1 }),
              area && h('path', { d: area, fill: 'rgba(77,107,254,.12)' }),
              h('path', { d: path, fill: 'none', stroke: '#4d6bfe', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }),
              series.map((p, i) => h('circle', { key: p.day, cx: x(i), cy: y(p.value), r: 3.5, fill: '#15803d' })),
              h('text', { x: P, y: 16, fill: 'var(--radar-text-3)', 'font-size': 11 }, `${label}：${formatPrice(max)}`),
              h('text', { x: P, y: H - 8, fill: 'var(--radar-text-3)', 'font-size': 11 }, series[0].day + ' → ' + series[series.length - 1].day + `（最低 ${formatPrice(min)}）`),
            ),
            h('div', { className: 'radar-trend-legend' },
              h('span', null, h('i', { style: { background: '#4d6bfe' } }), `${label}（${cat}）`),
              h('span', null, `共 ${series.length} 个数据点`),
              h('span', null, `区间 ¥${formatPrice(min)} ~ ¥${formatPrice(max)}`),
            ),
          ),
      )
    }

    /** Comparison list: localStorage-backed favorites shown as a side-by-side table. */
    function CompareView({ favorites, rows, onBack, toggleFavorite, clearFavorites, openDetail }) {
      const picked = React.useMemo(() => rows.filter(r => favorites.includes(r.dedupeKey)), [rows, favorites])
      const best = picked.length ? Math.min(...picked.map(r => r.price)) : null
      return h('div', null,
        h('div', { className: 'radar-crumb' },
          h('button', { type: 'button', onClick: onBack }, '← 返回榜单'),
          h('span', { className: 'sep' }, '/'),
          h('span', { className: 'cur' }, `对比清单 · ${picked.length} 款`),
        ),
        h('div', { className: 'radar-board' },
          h('h4', { className: 'radar-board-title' }, '收藏 / 对比清单'),
          h('p', { className: 'radar-board-note' }, '在报价卡片点「+ 对比」把商品加入这里，跨商品横向比价格、库存、质保与来源。清单保存在本机浏览器，刷新不丢。'),
          picked.length > 0 && h('button', { className: 'radar-tool-btn', type: 'button', onClick: clearFavorites }, '清空清单'),
        ),
        picked.length === 0
          ? h('div', { className: 'radar-empty' }, '清单还是空的。去「报价卡片」点几款商品的「+ 对比」吧。')
          : h('div', { className: 'radar-compare-scroll' },
            h('table', { className: 'radar-compare-table' },
              h('thead', null, h('tr', null,
                ['商品', '价格', '店铺', '来源', '平台', '类目', '交付类型', '库存', '观察', '原始链接', ''].map(t => h('th', { key: t }, t)),
              )),
              h('tbody', null, picked.map(r => h('tr', { key: r.dedupeKey },
                h('td', null, h('a', { href: '#', onClick: (e) => { e.preventDefault(); openDetail('item', r.url || r.dedupeKey, r.title, 'offers') } }, r.title.slice(0, 40))),
                h('td', { className: r.price === best ? 'best' : '' }, `¥${formatPrice(r.price)}`),
                h('td', null, r.store),
                h('td', null, SOURCE_NAMES[r.source] || r.source),
                h('td', null, r.platform),
                h('td', null, r.category || ''),
                h('td', null, r.productType || ''),
                h('td', null, r.stock === 'in' ? '有货' : r.stock === 'out' ? '缺货' : '未知'),
                h('td', null, relTime(r.observedAt)),
                h('td', null, r.url && h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer nofollow' }, '去原站')),
                h('td', null, h('button', { className: 'radar-chip-btn', type: 'button', onClick: () => toggleFavorite(r.dedupeKey) }, '移除')),
              ))),
            ),
          ),
      )
    }

    function groupKeyOf(url) {
      return String(url || '').replace(/[?#].*$/, '').replace(/\/$/, '').toLowerCase()
    }

    /** Tab 1: the original offer grid. */
    function OffersView({ state, filtered, pageRows, setField, onLoadMore, openDetail, favorites, toggleFavorite }) {
      return h('div', null,
        h('div', { className: 'radar-section' },
          h('h3', null, `商品报价 · ${filtered.length} 条（按不同交付类型核对后再比价）`),
          h('label', { className: 'radar-sort' }, '排序：',
            h('select', { className: 'radar-select', value: state.sort, onChange: setField('sort') },
              SORTS.map(s => h('option', { key: s.id, value: s.id }, s.label)),
            ),
          ),
        ),
        state.loading && h('div', { className: 'radar-loading' }, '正在采集多源报价…'),
        state.error && h('div', { className: 'radar-empty' }, `采集失败：${state.error}（稍后刷新重试）`),
        !state.loading && !state.error && pageRows.length === 0 && h('div', { className: 'radar-empty' }, '没有符合筛选条件的报价；放宽筛选或换个关键词试试。'),
        h('div', { className: 'radar-grid' },
          pageRows.map(r => h(OfferCard, { key: r.dedupeKey, offer: r,
            onOpen: () => openDetail('item', r.url || r.dedupeKey, r.title, 'offers'),
            favorite: favorites.includes(r.dedupeKey),
            onFavorite: () => toggleFavorite(r.dedupeKey) })),
        ),
        pageRows.length < filtered.length && h('div', { style: { marginTop: '16px', textAlign: 'center' } },
          h('button', { className: 'radar-btn', onClick: onLoadMore },
            `加载更多（还有 ${filtered.length - pageRows.length} 条）`),
        ),
      )
    }

    /** Tab 2: category board — supply, stock, price band and top shop per shelf. */
    function CategoryBoard({ rows, onPick, openDetail }) {
      const groups = React.useMemo(() => {
        const map = new Map()
        for (const r of rows) {
          const name = r.category || '其它 AI 服务'
          let g = map.get(name)
          if (!g) { g = { name, rows: [] }; map.set(name, g) }
          g.rows.push(r)
        }
        const total = rows.length || 1
        return [...map.values()].map(g => {
          const prices = g.rows.map(r => r.price).sort((a, b) => a - b)
          const shops = new Set(g.rows.map(r => r.store))
          const inStock = g.rows.filter(r => r.stock === 'in').length
          // Top shop = most offers in this category (supply leader, not sales).
          const byShop = new Map()
          for (const r of g.rows) byShop.set(r.store, (byShop.get(r.store) || 0) + 1)
          const topShop = [...byShop.entries()].sort((a, b) => b[1] - a[1])[0]
          return {
            name: g.name,
            count: g.rows.length,
            share: g.rows.length / total,
            inStock,
            lowest: prices[0],
            median: prices[Math.floor(prices.length / 2)],
            shops: shops.size,
            topShop: topShop ? topShop[0] : '—',
          }
        }).sort((a, b) => b.count - a.count)
      }, [rows])
      const maxCount = groups.reduce((m, g) => Math.max(m, g.count), 1)

      return h('div', null,
        h('div', { className: 'radar-board' },
          h('h4', { className: 'radar-board-title' }, '分类榜单 · 按 AI 品类聚合全部来源'),
          h('p', { className: 'radar-board-note' },
            '统一把七源的细分类目归入 12 个货架：报价数反映该品类的供给规模，最低/中位价是当前结果的价格带，店铺数为活跃店铺数。点「查看该类报价」切回报价卡片并自动套用类目筛选。'),
        ),
        h('div', { className: 'radar-cat-grid' },
          groups.map(g => h('div', { className: 'radar-cat radar-clickable', key: g.name,
            onClick: () => openDetail('category', g.name, g.name, 'categories') },
            h('h5', null, g.name, h('em', null, `${(g.share * 100).toFixed(1)}% 的报价`)),
            h('div', { className: 'radar-cat-metrics' },
              h('div', null, h('b', null, String(g.count)), '报价数'),
              h('div', null, h('b', null, String(g.inStock)), '标记有货'),
              h('div', null, h('b', { className: 'orange' }, `¥${formatPrice(g.lowest)}`), '最低价'),
              h('div', null, h('b', null, `¥${formatPrice(g.median)}`), '中位价'),
              h('div', null, h('b', null, String(g.shops)), '店铺数'),
            ),
            h('div', { className: 'radar-bar radar-cat-bar' },
              h('i', { style: { width: `${Math.max(3, (g.count / maxCount) * 100)}%` } }),
            ),
            h('div', { className: 'radar-cat-foot' },
              h('span', { className: 'radar-cat-shop', title: g.topShop }, `供给最多：${g.topShop}`),
              h('button', { className: 'radar-mini', type: 'button',
                onClick: (e) => { e.stopPropagation(); onPick(g.name) } }, '查看该类报价'),
            ),
          )),
        ),
      )
    }

    /** Tab 3: sales leaderboard — real published shop sales + product sold markers. */
    function HotBoard({ rows, shopSales, openDetail }) {
      const topShops = React.useMemo(() => shopSales.slice(0, 30), [shopSales])
      const maxSales = topShops.reduce((m, s) => Math.max(m, s.sales), 1)
      const offerCountByShop = React.useMemo(() => {
        const map = new Map()
        for (const r of rows) {
          const key = (r.store || '').trim().toLowerCase()
          map.set(key, (map.get(key) || 0) + 1)
        }
        return map
      }, [rows])
      const offersForShop = (name) => {
        const key = name.trim().toLowerCase()
        let count = offerCountByShop.get(key) || 0
        // Aggregator shop names often carry a platform prefix/suffix
        // (e.g. "链动小铺 · 牟利ai · 2VWX76A4"), so fall back to a contained match.
        if (count === 0 && key.length >= 3) {
          for (const [store, n] of offerCountByShop) {
            if (store.includes(key) || key.includes(store)) count += n
          }
        }
        return count
      }
      const soldProducts = React.useMemo(() => rows
        .filter(r => r.soldCount > 0)
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 20), [rows])
      const maxSold = soldProducts.reduce((m, s) => Math.max(m, s.soldCount), 1)
      // Supply leaderboard: shops by number of live offers (NOT sales).
      const supply = React.useMemo(() => {
        const map = new Map()
        for (const r of rows) {
          const key = r.store || '未知店铺'
          const cur = map.get(key) || { store: key, count: 0, platform: r.platform, inStock: 0 }
          cur.count++
          if (r.stock === 'in') cur.inStock++
          map.set(key, cur)
        }
        return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 15)
      }, [rows])
      const maxSupply = supply.reduce((m, s) => Math.max(m, s.count), 1)

      return h('div', null,
        h('div', { className: 'radar-board' },
          h('h4', { className: 'radar-board-title' }, '销售热榜 · 哪些店铺 / 商品好卖'),
          h('p', { className: 'radar-board-note' },
            '销量数字来自来源站点公开的店铺累计销量（AI价网「店铺销量」标签、云猫寄售 Shop/info 的 sell_count）与商品标题里的「已售 X」标记，是商家自行公开的历史累计口径，不是本插件的成交数据，也不代表当下实时销量；仅供选品参考，付款前请回原站核对。'),
        ),
        h('h4', { className: 'radar-subhead' }, `① 店铺累计销量榜 · ${shopSales.length} 家有公开销量数据`),
        topShops.length === 0 && h('div', { className: 'radar-empty' }, '本轮未取到公开销量数据（来源可能限流），稍后刷新。'),
        topShops.map((s, i) => h('div', { className: 'radar-rank radar-clickable', key: s.shop + i,
          onClick: () => openDetail('shop', s.shop, s.shop, 'hot') },
          h('span', { className: `radar-rank-no${i < 3 ? ' top' : ''}` }, String(i + 1)),
          h('div', { className: 'radar-rank-main' },
            h('span', { className: 'radar-rank-name', title: s.shop }, s.shop),
            h('span', { className: 'radar-rank-sub' },
              h('span', null, s.platform),
              h('span', null, `来源：${(s.sources || [s.source]).map(x => SOURCE_NAMES[x] || x).join(' + ')}`),
              h('span', null, `在售报价 ${offersForShop(s.shop)} 条`),
            ),
            h('div', { className: 'radar-bar' }, h('i', { style: { width: `${Math.max(2, (s.sales / maxSales) * 100)}%` } })),
          ),
          h('div', { className: 'radar-rank-num' },
            h('b', null, compactNumber(s.sales)),
            h('span', null, '累计销量（公开）'),
          ),
        )),
        h('h4', { className: 'radar-subhead' }, `② 商品「已售」标记榜 · ${soldProducts.length} 条`),
        soldProducts.length === 0 && h('div', { className: 'radar-empty' }, '本轮报价标题中没有「已售」标记。'),
        soldProducts.map((r, i) => h('div', { className: 'radar-rank radar-clickable', key: r.dedupeKey + i,
          onClick: () => openDetail('item', r.url || r.dedupeKey, r.title, 'hot') },
          h('span', { className: `radar-rank-no${i < 3 ? ' top' : ''}` }, String(i + 1)),
          h('div', { className: 'radar-rank-main' },
            h('span', { className: 'radar-rank-name', title: r.title }, r.title),
            h('span', { className: 'radar-rank-sub' },
              h('span', null, r.store),
              h('span', null, `¥${formatPrice(r.price)}`),
              h('span', null, SOURCE_NAMES[r.source] || r.source),
            ),
            h('div', { className: 'radar-bar' }, h('i', { style: { width: `${Math.max(2, (r.soldCount / maxSold) * 100)}%` } })),
          ),
          h('div', { className: 'radar-rank-num' },
            h('b', null, compactNumber(r.soldCount)),
            h('span', null, '标题标注已售'),
          ),
        )),
        h('h4', { className: 'radar-subhead' }, '③ 供给热度榜 · 按店铺在售报价数（非销量）'),
        h('p', { className: 'radar-board-note' }, '报价条数只反映该店被各来源收录的供给规模，不等同于销量，用于发现铺货量大的店铺。'),
        supply.map((s, i) => h('div', { className: 'radar-rank radar-clickable', key: 'supply' + i,
          onClick: () => openDetail('shop', s.store, s.store, 'hot') },
          h('span', { className: `radar-rank-no${i < 3 ? ' top' : ''}` }, String(i + 1)),
          h('div', { className: 'radar-rank-main' },
            h('span', { className: 'radar-rank-name', title: s.store }, s.store),
            h('span', { className: 'radar-rank-sub' }, h('span', null, s.platform), h('span', null, `有货 ${s.inStock} 条`)),
            h('div', { className: 'radar-bar' }, h('i', { style: { width: `${Math.max(2, (s.count / maxSupply) * 100)}%` } })),
          ),
          h('div', { className: 'radar-rank-num' },
            h('b', null, String(s.count)),
            h('span', null, '收录报价数'),
          ),
        )),
      )
    }

    function relTime(iso) {
      const t = Date.parse(iso)
      if (!isFinite(t)) return ''
      const diff = Date.now() - t
      const m = Math.round(diff / 60000)
      if (m < 1) return '刚刚'
      if (m < 60) return `${m} 分钟前`
      const hr = Math.round(m / 60)
      if (hr < 24) return `${hr} 小时前`
      return `${Math.round(hr / 24)} 天前`
    }

    function OfferCard({ offer, onOpen, favorite, onFavorite }) {
      const stockChip = offer.stock === 'in'
        ? h('span', { className: 'radar-chip ok' }, offer.stockCount ? `标记有货 · 库存 ${offer.stockCount}` : '标记有货')
        : offer.stock === 'out'
          ? h('span', { className: 'radar-chip out' }, '缺货')
          : h('span', { className: 'radar-chip' }, '库存未知')
      return h('div', { className: 'radar-card radar-clickable', onClick: onOpen },
        h('div', { className: 'radar-chips' },
          h('span', { className: 'radar-chip' }, offer.platform),
          h('span', { className: 'radar-chip src' }, `来源：${SOURCE_NAMES[offer.source] || offer.source}`),
          h('span', { className: 'radar-chip' }, offer.productType),
          stockChip,
          offer.groupCount > 1 && h('span', { className: 'radar-chip src' }, `${offer.groupCount} 源同款`),
          h('button', { className: `radar-chip-btn${favorite ? ' on' : ''}`, type: 'button',
            onClick: (e) => { e.stopPropagation(); onFavorite() } }, favorite ? '✓ 已对比' : '+ 对比'),
        ),
        h('div', { className: 'radar-card-title', title: offer.title }, offer.title),
        h('div', { className: 'radar-price' }, h('small', null, offer.currency), formatPrice(offer.price)),
        h('div', { className: 'radar-store' }, offer.store.startsWith(offer.platform) ? offer.store : `${offer.platform} · ${offer.store}`),
        h('div', { className: 'radar-card-foot' },
          h('span', { className: 'radar-obs' }, offer.observedAt ? `观察：${relTime(offer.observedAt)}` : ''),
          offer.url
            ? h('a', { className: 'radar-link', href: offer.url, target: '_blank', rel: 'noopener noreferrer nofollow',
              onClick: (e) => e.stopPropagation() }, '查看原始报价')
            : h('span', { className: 'radar-chip' }, '无直链'),
        ),
      )
    }

    /* -------------------------------------------------------- icon component ---- */
    function PanelIcon() {
      return h('svg', { viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': true },
        h('circle', { cx: 10.5, cy: 10.5, r: 6.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8 }),
        h('line', { x1: 15.5, y1: 15.5, x2: 20.5, y2: 20.5, stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }),
        h('circle', { cx: 10.5, cy: 10.5, r: 2, fill: 'currentColor' }),
        h('path', { d: 'M15 3.5 A 8.5 8.5 0 0 1 20.5 9', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
      )
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.effect(() => { ensureStyles(); return removeStyles }, 'ai-price-radar: styles')
        // Dictionaries for the sidebar label through the shared locale service.
        ctx.effect(() => ctx.locale.register('aiPriceRadar', {
          zh: { panel: 'AI 比价雷达' },
          en: { panel: 'AI price radar' },
        }), 'ai-price-radar: dictionaries')
        const t = ctx.locale.bind('aiPriceRadar')
        const label = () => { try { return t('panel') } catch { return 'AI 比价雷达' } }
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: 'aiPriceRadar',
          label,
        }, Panel))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 60,
          label,
          locale: 'aiPriceRadar',
        }, PanelIcon))
      },
    }
  },
})
