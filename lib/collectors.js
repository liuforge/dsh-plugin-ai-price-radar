/**
 * Collectors for the AI price radar plugin: read-only aggregation of public
 * offer feeds. Each collector returns a normalized list of offers:
 *
 *   {
 *     source: 'biwu' | 'aiprice',
 *     platform: string          // 发卡平台（链动小铺 / 自建站 / 云猫寄售 / 独角数卡 / 未知）
 *     store: string             // 店铺展示名
 *     title: string             // 原始商品标题
 *     productType: string       // 商品/交付类型（成品号 / 代充 / 卡密 / 车位 / 订阅 / 未知）
 *     price: number             // CNY
 *     currency: 'CNY'
 *     stock: 'in' | 'out' | 'unknown'
 *     url: string               // 原始报价链接
 *     observedAt: string        // ISO 时间
 *     dedupeKey: string         // 平台+店铺+商品键
 *   }
 *
 * Requests go out from the host process; nothing is written to disk here.
 * The in-memory cache TTL keeps re-fetches polite (BiWu asks pollers to stay
 * at most once per minute for the pointer; snapshots are immutable).
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ai-price-radar-plugin/1.0 (read-only aggregator)'

/**
 * Per-URL conditional-request cache. The price-radar feed family (BiWu,
 * PriceAI, AIFeeRadar) asks consumers to respect ETag / Last-Modified and to
 * poll latest.json no more than once per minute; immutable snapshot URLs are
 * cached indefinitely. 304 responses reuse the cached body.
 */
const feedCache = new Map()
const pointerPollAt = new Map()
const MIN_POINTER_INTERVAL_MS = 60 * 1000

async function fetchText(url, timeoutMs = 20000, conditional = false) {
  // A pointer we read less than a minute ago is reused verbatim, even on a
  // force refresh — the upstream contract forbids tighter polling.
  const cached = feedCache.get(url)
  if (conditional && cached && Date.now() - (pointerPollAt.get(url) || 0) < MIN_POINTER_INTERVAL_MS) {
    return cached.text
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const headers = { 'User-Agent': UA, 'Accept': 'application/json, text/html;q=0.8, */*;q=0.5' }
    if (conditional && cached?.etag) headers['If-None-Match'] = cached.etag
    else if (conditional && cached?.lastModified) headers['If-Modified-Since'] = cached.lastModified
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' })
    if (conditional && res.status === 304 && cached) {
      pointerPollAt.set(url, Date.now())
      return cached.text
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    if (conditional) {
      feedCache.set(url, {
        text,
        etag: res.headers.get('etag') || undefined,
        lastModified: res.headers.get('last-modified') || undefined,
      })
      pointerPollAt.set(url, Date.now())
    }
    return text
  } finally {
    clearTimeout(timer)
  }
}

function normalizePlatform(name, url) {
  const n = (name || '').toLowerCase()
  const u = (url || '').toLowerCase()
  if (n.includes('链动小铺') || u.includes('wzyp.cn')) return '链动小铺'
  if (n.includes('云猫寄售') || u.includes('catfk.com')) return '云猫寄售'
  if (n.includes('独角数卡') || n.includes('dujiao')) return '独角数卡'
  if (n.includes('16688')) return '16688'
  if (n.includes('自建站') || n.includes('self-hosted')) return '自建站'
  if (n) return n
  return '未知'
}

function normalizeType(label, title) {
  const t = (label || '').toLowerCase()
  const s = (title || '').toLowerCase()
  if (t === 'card') return s.includes('成品') ? '成品号' : s.includes('充值') || s.includes('直充') || s.includes('代充') ? '代充' : '卡密'
  if (t === 'resource' || t === 'equity') return s.includes('成品') || s.includes('账号') || s.includes('独享') ? '成品号' : '服务'
  if (t.includes('account') || t.includes('成品')) return '成品号'
  if (t.includes('topup') || t.includes('代充') || t.includes('充值')) return '代充'
  if (t.includes('cdk') || t.includes('卡密')) return '卡密'
  if (t.includes('seat') || t.includes('车位') || s.includes('车位')) return '车位'
  if (t.includes('warranty') || t.includes('质保')) return '质保'
  if (t) return t
  return '未知'
}

/**
 * Junk filter: storefront notices,引流/spam rows, and non-AI listings pollute the
 * price sort (e.g. ¥111B "交易所教程"). A rule is junk when it is
 *  - priced above any realistic AI card product (max legit observed ≈ ¥3.5k), or
 *  - a tutorial/announcement/exchange/VPN listing rather than a purchasable offer.
 * "招代理/别拍" in legit product titles does NOT match these patterns.
 */
const MAX_PRICE = 50000
const JUNK_TITLE_RE = /教程|币安|欧易|火币|交易所|科学上网|机场|节点|汇率|不要下单|只限拿货|零元购|售前说明|买家须知|给新顾客/

function isJunk(title, price) {
  if (!(price > 0) || price > MAX_PRICE) return true
  return JUNK_TITLE_RE.test(title)
}

/**
 * Unified product category. OpenPrice ships 46 fine-grained category labels;
 * other sources only have titles/delivery labels. Map everything into one of
 * 11 shelf categories so the 分类榜 can aggregate across all seven sources.
 */
const CATEGORY_RULES = [
  ['ChatGPT', /\bchatgpt\b|\bgpt\b|codex|openai|gpt-?plus|gpt-?pro|sora/i],
  ['Claude', /claude|anthropic/i],
  ['Gemini', /gemini|google one|google ai|veo|imagen/i],
  ['Grok', /\bgrok\b|xai|super ?grok/i],
  ['Cursor', /cursor|windsurf|kiro|copilot/i],
  ['DeepSeek', /deepseek/i],
  ['邮箱账号', /邮箱|gmail|outlook|hotmail|icloud|apple ?id|苹果账号|mail\.com|gmx/i],
  ['接码验证', /接码|验证码|phone.?verification|\bsms\b|kyc|实名/i],
  ['API 中转', /中转|\bapi\b|token|gateway|relay|倍率|模型 api/i],
  ['创作工具', /suno|runway|kling|可灵|即梦|seedance|midjourney|tiktok|telegram|公众号|x premium/i],
  ['其它订阅', /会员|订阅|plus|pro|ultra|team|账号|成品号|卡密|车位/i],
]

function normalizeCategory(label, title, platform) {
  const text = `${label || ''} ${title || ''} ${platform || ''}`
  for (const [name, re] of CATEGORY_RULES) if (re.test(text)) return name
  return '其它 AI 服务'
}

/** Parse a public "已售 16w+" / "已售 22000+" sales marker inside a title. */
function parseSoldCount(title) {
  if (!title) return null
  const m = title.match(/已售\s*([\d.]+)\s*([wW万]?)\+?/)
  if (!m) return null
  const n = Number(m[1])
  if (!isFinite(n) || n <= 0) return null
  return Math.round(/[wW万]/.test(m[2]) ? n * 10000 : n)
}

/* ---------------------------------------------------------------- BiWu.Ai */

const BIWU_LATEST = 'https://biwu.ai/price-radar/latest.json'

/**
 * Several aggregation sites publish the same `price-radar.v1` snapshot schema
 * (discovery at /.well-known/price-radar.json → latest.json pointer → immutable
 * snapshot with products[].lowest_offer / top_offers / presets[].top_offers).
 * One generic collector serves them all.
 */
const PRICE_RADAR_SOURCES = [
  { id: 'biwu', label: 'BiWu.Ai（http://BiWu.Ai）', discovery: 'https://biwu.ai/price-radar/latest.json', latestField: 'snapshot_url' },
  { id: 'priceai', label: 'PriceAI（https://priceai.cc）', discovery: 'https://priceai.cc/.well-known/price-radar.json', latestField: 'latest_url' },
  { id: 'aifeeradar', label: 'AIFeeRadar（https://aifeeradar.com）', discovery: 'https://aifeeradar.com/.well-known/price-radar.json', latestField: 'latest_url' },
]

/** Map one price-radar.v1 offer to the normalized shape. Zero-price rows are
 * storefront notices (售前说明 / 买家须知), not purchasable offers — drop them. */
function radarOffer(sourceId, offer, generatedAt, productName) {
  if (!offer || typeof offer.price !== 'number') return null
  const title = offer.title || ''
  if (isJunk(title, offer.price)) return null
  const platform = normalizePlatform(offer.source_store_name || offer.source_name, offer.url)
  const key = [sourceId, platform, offer.source_id || offer.source_store_name || 'shop', offer.id || offer.title].join('|')
  return {
    source: sourceId,
    platform,
    store: offer.source_store_name || offer.source_name || '未知店铺',
    title,
    productType: normalizeType('', title),
    category: normalizeCategory(productName, title, ''),
    subCategory: productName || '',
    soldCount: parseSoldCount(title),
    price: offer.price,
    currency: 'CNY',
    stock: offer.status === 'in_stock' ? 'in' : offer.status === 'out_of_stock' ? 'out' : 'unknown',
    url: offer.url || '',
    observedAt: offer.last_seen_at || offer.captured_at || generatedAt || new Date().toISOString(),
    dedupeKey: key,
  }
}

/** One generic pass over a price-radar.v1 feed family source. */
export async function collectPriceRadarSource(spec) {
  const pointer = JSON.parse(await fetchText(spec.discovery, 20000, true))
  const latestUrl = pointer.snapshot_url || pointer[spec.latestField]
  if (!latestUrl) throw new Error(`${spec.id}: discovery has no snapshot pointer`)
  const latest = JSON.parse(await fetchText(latestUrl, 20000, true))
  const snapUrl = latest.snapshot_url || latestUrl
  const snap = JSON.parse(await fetchText(snapUrl, 30000, true))
  const offers = []
  for (const product of (Array.isArray(snap.products) ? snap.products : [])) {
    const seen = new Set()
    const push = (offer) => {
      const o = radarOffer(spec.id, offer, snap.generated_at, product.name)
      if (!o || seen.has(o.dedupeKey)) return
      seen.add(o.dedupeKey)
      offers.push(o)
    }
    push(product.lowest_offer)
    for (const offer of (Array.isArray(product.top_offers) ? product.top_offers : [])) push(offer)
    for (const preset of (Array.isArray(product.presets) ? product.presets : [])) {
      for (const offer of (Array.isArray(preset.top_offers) ? preset.top_offers : [])) push(offer)
    }
  }
  return {
    source: spec.id,
    label: spec.label,
    generatedAt: snap.generated_at || latest.generated_at,
    offers,
  }
}

/** Pull the latest immutable snapshot through the published pointer. */
export async function collectBiwu() {
  return collectPriceRadarSource(PRICE_RADAR_SOURCES[0])
}

/* -------------------------------------------------------------- AI价网 ---- */

/**
 * aiprice.club publishes server-rendered category tables under
 * /market/category/<slug>; the site states CC BY 4.0 for its aggregated data.
 * We parse a bounded set of category pages with regex tables (no DOM deps).
 */
const AIPRICE_CATEGORIES = [
  'gpt-plus', 'gpt-pro-200', 'gpt-pro-100', 'gpt-pro-500', 'gpt-team', 'gpt-go', 'gpt-free', 'gpt', 'gpt-team-5x',
  'claude-pro', 'claude-max-5x', 'claude-max-20x', 'claude-free', 'claude',
  'gemini-pro', 'gemini-ultra-5x', 'gemini-ultra-20x', 'gemini-plus', 'gemini',
  'grok-premium', 'grok-ultra', 'grok-plus', 'grok-super', 'grok-free', 'grok', 'supergrok-heavy',
  'phone-verification', 'api-gateway', 'gmail', 'outlook', 'icloud', 'cursor', 'kyc', 'vcc', 'tiktok', 'telegram', 'x', 'apple-id',
]

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
}

/** Parse one category page into rows. Sighted structure: tbody[data-cx-channel] rows. */
function parseAipriceCategory(html, categoryLabel) {
  const rows = []
  const shopSales = []
  const buyRe = /<a class="cx-buy" href="([^"]+)"/
  const priceRe = /class="cx-price">\s*¥([\d.,]+)/
  const timeRe = /<time[^>]*datetime="([^"]+)"/
  const nameRe = /<em class="cx-term">([^<]*)<\/em>([\s\S]*?)<\/span>/
  const shopRe = /<a class="cx-shop-name" href="[^"]*">([^<]+)<\/a>/
  const platformRe = /<small class="cx-platform">([\s\S]*?)<\/small>/
  const stockRe = /<small class="cx-stock">库存\s*([\d,]+)/
  // Public cumulative shop sales published in the channel chips (e.g. 店铺销量 69,339).
  const salesRe = /店铺销量\s*([\d,]+)/g

  // Stock/standard flags live on the channel <tbody>; rows are plain <tr> inside.
  const tbodyRe = /<tbody[^>]*data-in-stock="([01])"[^>]*data-standard="([01])"[^>]*>([\s\S]*?)<\/tbody>/g
  let tb
  while ((tb = tbodyRe.exec(html)) !== null) {
    const inStock = tb[1] === '1'
    const section = tb[3]
    // One channel block = one shop; pair shop names with their sales labels.
    const shopNames = [...section.matchAll(/<a class="cx-shop-name" href="[^"]*">([^<]+)<\/a>/g)].map(m => decodeEntities(m[1]).trim())
    const salesNums = [...section.matchAll(salesRe)].map(m => Number(m[1].replace(/,/g, '')))
    for (let i = 0; i < shopNames.length && i < salesNums.length; i++) {
      const platformHtml = /<small class="cx-platform">([\s\S]*?)<\/small>/.exec(section)
      shopSales.push({
        shop: shopNames[i],
        platform: platformHtml ? normalizePlatform(stripTags(platformHtml[1]), '') : '未知',
        sales: salesNums[i],
        source: 'aiprice',
      })
    }
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g
    let tr
    while ((tr = trRe.exec(section)) !== null) {
      const body = tr[1]
      const buy = buyRe.exec(body)
      const price = priceRe.exec(body)
      const time = timeRe.exec(body)
      const name = nameRe.exec(body)
      const shop = shopRe.exec(body)
      const platformHtml = platformRe.exec(body)
      const stock = stockRe.exec(body)
      if (!buy || !price) continue
      const priceValue = Number(price[1].replace(/,/g, ''))
      if (!(priceValue > 0)) continue
      const title = name ? (stripTags(name[1]) + ' ' + stripTags(name[2])).trim() : ''
      if (!title) continue
      if (isJunk(title, priceValue)) continue
      const platformText = platformHtml ? stripTags(platformHtml[1]) : ''
      rows.push({
        source: 'aiprice',
        platform: normalizePlatform(platformText, buy[1]),
        store: shop ? decodeEntities(shop[1]).trim() : '未知店铺',
        title,
        productType: name ? normalizeType(stripTags(name[1]), title) : '未知',
        category: normalizeCategory(categoryLabel, title, ''),
        subCategory: categoryLabel || '',
        soldCount: parseSoldCount(title),
        price: priceValue,
        currency: 'CNY',
        stock: inStock ? 'in' : 'out',
        url: buy[1],
        observedAt: time ? time[1] : new Date().toISOString(),
        dedupeKey: ['aiprice', buy[1]].join('|'),
        stockCount: stock ? Number(stock[1].replace(/,/g, '')) : null,
      })
    }
  }
  return { rows, shopSales }
}

/** Fetch all configured category pages with bounded concurrency. */
export async function collectAiprice(categoryLimit = AIPRICE_CATEGORIES.length) {
  const offers = []
  const shopSales = []
  const failures = []
  const queue = AIPRICE_CATEGORIES.slice(0, categoryLimit)
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length > 0) {
      const slug = queue.shift()
      try {
        const html = await fetchText(`https://aiprice.club/market/category/${encodeURIComponent(slug)}`, 15000)
        const parsed = parseAipriceCategory(html, slug)
        offers.push(...parsed.rows)
        shopSales.push(...parsed.shopSales)
      } catch (error) {
        failures.push(`${slug}: ${error.message}`)
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  })
  await Promise.all(workers)
  return {
    source: 'aiprice',
    label: 'AI价网（http://aiprice.club）',
    generatedAt: new Date().toISOString(),
    offers,
    shopSales,
    failures,
  }
}

/* ------------------------------------------------------------ 云猫寄售 --- */

/**
 * catfk.com (云猫寄售) exposes an unauthenticated per-shop JSON API:
 *   POST /shopApi/Shop/categoryList { token, goods_type, category_key }
 *   POST /shopApi/Shop/goodsList   { token, goods_type, category_id, current, pageSize }
 * Shop tokens are discovered from aiprice.club market pages (/market/shop/catfk-<token>).
 * Item shape: { link, goods_key, name, price, goods_type, extend.stock_count, user.nickname, user.token }.
 */
const CATFK_BASE = 'https://catfk.com'
const CATFK_GOODS_TYPES = ['card', 'resource', 'equity']
// Source-level cooldown after a gateway throttle; checked by collectCatfk.
let catfkCooldownUntil = 0

async function postJson(url, body, timeoutMs = 20000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'User-Agent': UA, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

/** Harvest catfk shop tokens from aiprice market pages (the public shop directory). */
export async function discoverCatfkTokens(extraPages = []) {
  const pages = [
    ...AIPRICE_CATEGORIES.slice(0, 12).map(slug => `https://aiprice.club/market/category/${slug}`),
    ...extraPages,
  ]
  const tokens = new Set()
  for (const page of pages) {
    try {
      const html = await fetchText(page, 15000)
      for (const m of html.matchAll(/market\/shop\/catfk-([A-Za-z0-9]+)/g)) tokens.add(m[1])
    } catch { /* a dead discovery page only shrinks coverage */ }
  }
  return [...tokens]
}

/** Collect one shop's card/resource/equity goods across up to `pageDepth` pages per type. */
export async function collectCatfkShop(token, pageDepth = 3) {
  const offers = []
  for (const goodsType of CATFK_GOODS_TYPES) {
    for (let current = 1; current <= pageDepth; current++) {
      let json
      try {
        json = await postJson(`${CATFK_BASE}/shopApi/Shop/goodsList`, {
          token, keywords: '', category_id: 0, goods_type: goodsType, current, pageSize: 100,
        })
      } catch {
        // A 502/429 usually surfaces as a transport error rather than a JSON
        // envelope; back off just the same so we stop hammering the gateway.
        catfkCooldownUntil = Date.now() + 10 * 60 * 1000
        break // shop endpoint down or rate-limited; stop paging this type
      }
      if (json?.code !== 1) {
        // Gateway throttle (code!==1): back off for the whole source this round.
        catfkCooldownUntil = Date.now() + 10 * 60 * 1000
        break
      }
      const list = Array.isArray(json?.data?.list) ? json.data.list : []
      if (list.length === 0) break
      for (const item of list) {
        const price = typeof item.price === 'number' ? item.price : Number(item.price)
        if (!item.name || !isFinite(price) || price <= 0) continue
        const cleanTitle = String(item.name).replace(/<[^>]*>/g, '').trim()
        if (isJunk(cleanTitle, price)) continue
        const categoryLabel = item.category?.name || ''
        const stockCount = item.extend?.stock_count
        const stockType = item.extend?.show_stock_type
        offers.push({
          source: 'catfk',
          platform: '云猫寄售',
          store: item.user?.nickname || `云猫寄售 · ${token}`,
          title: cleanTitle,
          productType: normalizeType(goodsType, item.name),
          category: normalizeCategory(categoryLabel, cleanTitle, ''),
          subCategory: categoryLabel,
          soldCount: parseSoldCount(cleanTitle),
          price,
          currency: 'CNY',
          stock: stockType === 0 ? (stockCount > 0 ? 'in' : 'out') : 'unknown',
          url: item.link || `${CATFK_BASE}/item/${item.goods_key}`,
          observedAt: new Date().toISOString(),
          dedupeKey: ['catfk', item.user?.token || token, item.goods_key || item.link].join('|'),
          stockCount: typeof stockCount === 'number' ? stockCount : null,
        })
      }
      if (list.length < 100) break
    }
  }
  return offers
}

/** Full catfk pass: discover shop tokens, then collect each shop (bounded concurrency 4). */
export async function collectCatfk(tokenLimit = 40) {
  if (Date.now() < catfkCooldownUntil) {
    const minutes = Math.ceil((catfkCooldownUntil - Date.now()) / 60000)
    return {
      source: 'catfk',
      label: '云猫寄售（https://catfk.com，经公开店铺接口）',
      generatedAt: new Date().toISOString(),
      offers: [],
      shopSales: [],
      failures: [`冷却中（上次网关限流，约 ${minutes} 分钟后重试）`],
    }
  }
  const tokens = (await discoverCatfkTokens()).slice(0, tokenLimit)
  const offers = []
  const shopSales = []
  const failures = []
  const queue = [...tokens]
  const workers = Array.from({ length: 2 }, async () => {
    while (queue.length > 0) {
      // A peer worker may have tripped the cooldown; stop immediately instead
      // of hammering the remaining shops for a round that is already lost.
      if (Date.now() < catfkCooldownUntil) break
      const token = queue.shift()
      try {
        offers.push(...await collectCatfkShop(token))
      } catch (error) {
        failures.push(`${token}: ${error.message}`)
      }
      // Shop/info publishes the shop's cumulative sell_count — real sales data.
      try {
        const info = await postJson(`${CATFK_BASE}/shopApi/Shop/info`, { token })
        if (info?.code === 1 && typeof info.data?.sell_count === 'number') {
          shopSales.push({
            shop: info.data.nickname || `云猫寄售 · ${token}`,
            platform: '云猫寄售',
            sales: info.data.sell_count,
            goodsCount: info.data.goods_count || 0,
            source: 'catfk',
          })
        }
      } catch { /* sales endpoint down only shrinks the ranking */ }
      await new Promise(resolve => setTimeout(resolve, 150))
    }
  })
  await Promise.all(workers)
  // A round with zero offers is never a silent success: surface why.
  if (offers.length === 0 && failures.length === 0) {
    failures.push(tokens.length === 0
      ? '本轮未发现店铺（店铺目录页不可达）'
      : `本轮 ${tokens.length} 家店铺均未返回报价（网关限流或店铺已下架）`)
  }
  return {
    source: 'catfk',
    label: '云猫寄售（https://catfk.com，经公开店铺接口）',
    generatedAt: new Date().toISOString(),
    offers,
    shopSales,
    failures,
  }
}

/* ------------------------------------------------------- 知途·拾价 ------ */

/**
 * price.yufu.pub (知途·拾价) whitelists a public JSON catalog in robots.txt:
 *   /api/catalog?limit=100&offset=N → { items: [{ name, offers: [...] }] }
 * Offer shape: { name, shop, shopId, price, inStock, currency, productUrl,
 *                capturedAt, stockQuantity, priceStatus, stale }.
 */
const ZHITU_BASE = 'https://price.yufu.pub'

export async function collectZhitu(maxProducts = 1200) {
  const offers = []
  let offset = 0
  while (offset < maxProducts) {
    let json
    try {
      json = JSON.parse(await fetchText(`${ZHITU_BASE}/api/catalog?limit=100&offset=${offset}`, 30000))
    } catch (error) {
      if (offset === 0) throw error
      break // later page failed after some data: keep what we have
    }
    const items = Array.isArray(json.items) ? json.items : []
    if (items.length === 0) break
    for (const product of items) {
      for (const o of (Array.isArray(product.offers) ? product.offers : [])) {
        const price = Number(o.price)
        if (!o.name || !isFinite(price) || price <= 0) continue
        const rowTitle = o.name + (o.spec ? `（${o.spec}）` : '')
        if (isJunk(rowTitle, price)) continue
        offers.push({
          source: 'zhitu',
          platform: normalizePlatform('', o.productUrl),
          store: o.shop || '未知店铺',
          title: rowTitle,
          productType: normalizeType('', o.name),
          category: normalizeCategory(product.name, rowTitle, ''),
          subCategory: product.name || '',
          soldCount: parseSoldCount(rowTitle),
          price,
          currency: o.currency === 'CNY' || !o.currency ? 'CNY' : 'CNY',
          stock: o.stale === true ? 'unknown' : o.inStock === true ? 'in' : o.inStock === false ? 'out' : 'unknown',
          url: o.productUrl || '',
          observedAt: o.capturedAt || new Date().toISOString(),
          dedupeKey: ['zhitu', o.shopId || o.shop || 'shop', o.productId || (o.productUrl + o.name), o.name, price].join('|'),
          stockCount: typeof o.stockQuantity === 'number' ? o.stockQuantity : null,
        })
      }
    }
    offset += items.length
  }
  return {
    source: 'zhitu',
    label: '知途·拾价（https://price.yufu.pub，公开 catalog API）',
    generatedAt: new Date().toISOString(),
    offers,
  }
}

/* ---------------------------------------------------------- OpenPrice --- */

/**
 * 2026-11 改版适配。旧版：`/card-products/all` 一页 SSR 全量 initialItems。
 * 现在 `/card-products/all` 只回 `initialCategories`（分类目录，无报价），
 * 报价挪到每个分类页 `/card-products/<slug>`，字段同时更名：
 *   initialProduct: { id, slug, name, platform, lowestPrice, channelCount, updatedAt }
 *   initialDetails: [{ id, typeId, status, channel, channelType, originalName,
 *                      price, url, updateTime, includedTime, operateTime, risk, inventory }]
 * 每页固定最多 100 条；limit/offset/page/per_page 等查询参数实测均被忽略，没有服务端分页。
 * 所以按分类并发抓取再合并去重；分类清单取自 sitemap.xml（2026-11-20 快照）。
 */
const OPENPRICE_BASE = 'https://www.openprice.cc'
const OPENPRICE_CATEGORIES = [
  // ChatGPT
  'chatgpt-free', 'chatgpt-go-finished-product', 'chatgpt-plus-finished-product',
  'chatgpt-plus-recharge', 'chatgpt-pro-5x-finished-product', 'chatgpt-pro-5x-recharge',
  'chatgpt-pro-20x-finished-product', 'chatgpt-pro-20x-recharge', 'chatgpt-team', 'chatgpt-other',
  // Claude
  'claude-free', 'claude-pro-finished-product', 'claude-pro-recharge',
  'claude-max-5x-finished-product', 'claude-max-5x-recharge', 'claude-other',
  // Gemini / Grok
  'gemini-pro-finished-product', 'gemini-pro-recharge', 'gemini-ultra', 'gemini-other',
  'grok-free', 'grok-super', 'grok-heavy', 'grok-other',
  // 其它 AI 货架
  'cursor', 'kiro-pro', 'api-all', 'other-other',
]
const OPENPRICE_CONCURRENCY = 6
const OPENPRICE_PAGE_TIMEOUT_MS = 25000

/** 限制并发数，不引入依赖。 */
async function mapLimit(items, limit, worker) {
  const out = new Array(items.length)
  let cursor = 0
  const runners = new Array(Math.max(1, Math.min(limit, items.length))).fill(0).map(async () => {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      out[index] = await worker(items[index], index)
    }
  })
  await Promise.all(runners)
  return out
}

/** Next.js 把 RSC flight 流拆成若干 self.__next_f.push([1,"..."])，拼回整串。 */
function flightText(html) {
  const parts = []
  const re = /self\.__next_f\.push\(\[1,\s*("(?:[^"\\]|\\.)*")\]/g
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      parts.push(JSON.parse(m[1]))
    } catch {
      /* 半截 chunk 直接跳过 */
    }
  }
  return parts.join('')
}

/** 取 flight 文本里 `"key":` 之后的那个 JSON 值（括号配对 + JSON.parse）。 */
function flightJson(text, key) {
  const at = text.indexOf(`"${key}":`)
  if (at < 0) return null
  let p = at + key.length + 3
  while (p < text.length && text[p] !== '{' && text[p] !== '[') p += 1
  if (p >= text.length) return null
  const open = text[p]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = p; i < text.length; i += 1) {
    const c = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (c === '\\') escaped = true
      else if (c === '"') inString = false
      continue
    }
    if (c === '"') {
      inString = true
      continue
    }
    if (c === open) depth += 1
    else if (c === close) {
      depth -= 1
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(p, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/** 分类 slug 本身就说明了交付方式：*-finished-product = 成品号，*-recharge = 代充。 */
function openpriceTypeHint(slug) {
  if (slug.endsWith('-finished-product')) return '成品号'
  if (slug.endsWith('-recharge')) return '代充'
  if (slug.endsWith('-free')) return '成品号'
  if (slug === 'cursor' || slug === 'kiro-pro') return '成品号'
  return ''
}

async function fetchOpenpriceCategory(slug) {
  const html = await fetchText(`${OPENPRICE_BASE}/card-products/${slug}`, OPENPRICE_PAGE_TIMEOUT_MS)
  const text = flightText(html)
  return {
    slug,
    product: flightJson(text, 'initialProduct'),
    details: flightJson(text, 'initialDetails') || [],
  }
}

export async function collectOpenprice() {
  const pages = await mapLimit(OPENPRICE_CATEGORIES, OPENPRICE_CONCURRENCY, async (slug) => {
    try {
      return await fetchOpenpriceCategory(slug)
    } catch {
      return { slug, product: null, details: [] }
    }
  })

  const offers = []
  const seen = new Set()
  let loadedPages = 0
  for (const page of pages) {
    const label = (page.product && page.product.name) || page.slug
    const platformLabel = (page.product && page.product.platform) || ''
    if (page.details.length) loadedPages += 1
    for (const it of page.details) {
      if (!it || !it.id || seen.has(it.id)) continue
      seen.add(it.id)
      const title = String(it.originalName || '')
      const price = Number(it.price)
      if (!title || !isFinite(price) || price <= 0) continue
      if (isJunk(title, price)) continue
      offers.push({
        source: 'openprice',
        platform: normalizePlatform(it.channelType, it.url),
        store: it.channel || '未知店铺',
        title,
        productType: openpriceTypeHint(page.slug) || normalizeType(label, title),
        category: normalizeCategory(label, title, platformLabel),
        subCategory: label,
        soldCount: parseSoldCount(title),
        price,
        currency: 'CNY',
        stock: it.status === 'in_stock' ? 'in' : it.status === 'out_of_stock' ? 'out' : 'unknown',
        url: it.url || '',
        observedAt: it.updateTime || it.includedTime || new Date().toISOString(),
        dedupeKey: ['openprice', it.id].join('|'),
      })
    }
  }

  return {
    source: 'openprice',
    label: `OpenPrice（https://www.openprice.cc，分类页 SSR · ${loadedPages}/${OPENPRICE_CATEGORIES.length} 页 · ${offers.length} 条）`,
    generatedAt: new Date().toISOString(),
    offers,
  }
}

/* -------------------------------------------------------------- Cache ---- */

const TTL_MS = 5 * 60 * 1000
let cache = { at: 0, snapshot: null, promise: null }

/** Aggregate all sources with per-source error isolation.
 * shuifa.xyz（水獭）自 2026-11-13 起不可达（域名 NXDOMAIN；shuifa.cn 301 跳转至无关站点），
 * 链动小铺（wzyp.cn）直抓被 ESA 人机验证拦截 —— 两者不作为直连源，其报价由
 * biwu / aiprice / catfk / openprice / zhitu 聚合覆盖，与原版口径一致。 */
async function aggregate() {
  const sources = []
  const errors = []
  const jobs = []
  // price-radar.v1 feed family (biwu + priceai + aifeeradar) share one collector.
  for (const spec of PRICE_RADAR_SOURCES) {
    jobs.push(
      collectPriceRadarSource(spec).then(
        (r) => sources.push(r),
        (e) => errors.push({ source: spec.id, message: String(e.message || e) }),
      ),
    )
  }
  jobs.push(
    collectAiprice().then(
      (r) => sources.push(r),
      (e) => errors.push({ source: 'aiprice', message: String(e.message || e) }),
    ),
    collectCatfk().then(
      (r) => sources.push(r),
      (e) => errors.push({ source: 'catfk', message: String(e.message || e) }),
    ),
    collectZhitu().then(
      (r) => sources.push(r),
      (e) => errors.push({ source: 'zhitu', message: String(e.message || e) }),
    ),
    collectOpenprice().then(
      (r) => sources.push(r),
      (e) => errors.push({ source: 'openprice', message: String(e.message || e) }),
    ),
  )
  await Promise.all(jobs)
  // Merge public shop-sales figures from every source into one deduplicated
  // leaderboard. Same shop on two sources keeps the larger published number
  // and records both sources, so a shop is never double-counted.
  const salesByShop = new Map()
  for (const source of sources) {
    for (const row of (source.shopSales || [])) {
      if (!row.shop || !(row.sales > 0)) continue
      const key = row.shop.trim().toLowerCase()
      const prev = salesByShop.get(key)
      if (prev === undefined) {
        salesByShop.set(key, { ...row, sources: [row.source] })
      } else {
        if (row.sales > prev.sales) { prev.sales = row.sales; prev.platform = row.platform }
        if (!prev.sources.includes(row.source)) prev.sources.push(row.source)
      }
    }
  }
  const shopSales = [...salesByShop.values()].sort((a, b) => b.sales - a.sales)
  return { sources, errors, shopSales }
}

/**
 * Cached aggregate. `force` bypasses the TTL (the panel's refresh button).
 * Concurrent callers share one in-flight promise.
 */
export async function getAggregate(force = false) {
  const now = Date.now()
  if (!force && cache.snapshot && now - cache.at < TTL_MS) {
    return { ...cache.snapshot, cached: true, cachedAt: new Date(cache.at).toISOString() }
  }
  if (cache.promise) return cache.promise
  const promise = aggregate().then((snapshot) => {
    cache = { at: Date.now(), snapshot, promise: null }
    return { ...snapshot, cached: false, cachedAt: new Date(cache.at).toISOString() }
  }, (error) => {
    cache = { at: 0, snapshot: null, promise: null }
    throw error
  })
  cache.promise = promise
  return promise
}

