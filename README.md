# AI 比价雷达 · DSH 插件

> 本仓库是 [gaoren7716-lab/dsh-plugin-ai-price-radar](https://github.com/gaoren7716-lab/dsh-plugin-ai-price-radar) 的 fork（v1.6.1）。
> 相对上游只有两处改动，见下方「本 fork 的改动」。

## 本 fork 的改动

### v1.6.1

**1. OpenPrice 采集器适配 2026-11 改版（上游此处返回 0 条）**

openprice.cc 改版后，`/card-products/all` 只返回 `initialCategories`（分类目录，不含报价），
报价移到各分类页 `/card-products/<slug>`，字段同时更名：

| 上游代码假设 | 站点现状 |
| --- | --- |
| `/card-products/all` 一页全量 | 报价在 `/card-products/<slug>` 分类页 |
| `initialItems` | `initialDetails` |
| `title` / `shopName` / `updatedAt` | `originalName` / `channel` / `updateTime` |
| 全量输出 | 每页固定 100 条，`limit`/`offset`/`page`/`per_page` 等参数实测均无效 |

新实现：从 `sitemap.xml` 取 28 个 AI 相关分类 → 6 并发抓分类页 → 解析 Next.js RSC flight 流
（`self.__next_f.push` 拼接后按括号配对 `JSON.parse`，不再用正则硬匹配转义 JSON）→ 合并去重。
实测单源 2518 条，全站总报价 4417 → 6934。交付类型按 slug 后缀推断（`*-finished-product` = 成品号，`*-recharge` = 代充），
避免出现「chatgpt 普通号」这类原样标签污染类型筛选。

**2. 面板改为固定浅色主题**

原来所有颜色都写成 `var(--dsw-alias-*,<深色回退值>)`，宿主不提供这些变量（或宿主是深色主题）时整块面板是黑的。
现在在 `.radar-page` 上定义一组本地浅色变量（白底 `#ffffff`、浅灰卡片 `#f7f8fa`、深灰字 `#1f2328`），
所有 `--dsw-alias-*` 引用改为本地变量，并加 `color-scheme: light` 让原生控件也跟着变浅；
强调色在白底上加深一档（绿 `#15803d`、橙 `#ea580c`、红 `#dc2626`）。

[![Install with DSH](https://img.shields.io/badge/DeepSeek_Harness-plugin-4D6BFE)](https://github.com/deepseek-ai/deepseek-harness)

卡网 AI 订阅**只读比价**面板：把多个公开报价源聚合到 DeepSeek Harness 的一个本地面板里，搜索、四路筛选、直达原始购买链接。**本地运行、只读采集、不参与任何交易。**

![icon](icon.svg)

## 预览

![AI 比价雷达面板](docs/preview.png)

## 功能

- **全网报价搜索**：按关键词（如 `gpt`、`claude 质保`）过滤聚合报价。
- **四路筛选**：数据来源 / 库存口径（有货·缺货·未知）/ 发卡平台 / 商品交付类型（成品号·代充·卡密·车位·质保）。
- **统计栏**：主要报价数、来源标记有货数、当前结果最低价、数据源成功数。
- **报价卡片**：平台徽标、来源、标题、价格、店铺、观察时间、「查看原始报价」直链。
- **排序与分页**：价格升降序、观察时间序；每次 100 条加载更多。
- **数据来源与口径**：面板内置说明页，写明每个源的抓取方式、授权与局限。

## 7 项体验补齐（v1.6.0）

- **价格走势**：每日快照本机持久化（90 天）+ SVG 折线（全站/品类、最低价/中位价/报价数）。
- **URL 状态**：筛选/排序/搜索/Tab/详情写入 hash，可分享、刷新恢复、浏览器后退。
- **二次筛选**：详情页内独立搜索/排序/库存筛选。
- **收藏对比**：localStorage 清单 + 横向对比表。
- **搜索别名**：gpt↔ChatGPT/Codex/OpenAI，多关键词 AND + 联想。
- **新鲜度**：24h/7天/30天筛选。
- **效率**：CSV 导出、5 分钟自动刷新、窄屏适配。

## 榜单下钻（v1.5.0）

榜单每一项都可点进去看：店铺详情（销量/报价表/主营类目）、商品详情（各来源报价对比/交叉导航）、品类详情（价格带/活跃店铺/低价商品）。带面包屑与返回，全局 Tab 栏常驻；借鉴 BiWu / AI价网 / 知途详情页的交互习惯。

## 质量与性能（v1.4.0）

- **更全**：AI价网 38 类目、知途 1200 商品、云猫 12 个店铺发现页，去重后约 2.1 万条报价、788 家公开销量店铺。
- **更准**：新增「同款比价」Tab（按购买链接归并、每源取最低价、排除疑似引流价，888 款真实跨源价差）；来源状态真实化（失败/冷却不再显示全绿）。
- **更礼貌**：price-radar feed 支持 ETag / 304 与 latest 指针每分钟节流。
- **更快**：gzip 响应压缩，10.86 MB → 1.98 MB。

## 榜单视图（v1.3.0）

面板顶部三个 Tab：**报价卡片 / 分类榜单 / 销售热榜**。

- **分类榜单**：七源细分类目统一归入 12 个 AI 货架，展示报价数、有货数、最低价、中位价、活跃店铺数、占比条与供给最多店铺；点「查看该类报价」自动套用类目筛选。
- **销售热榜**：① 店铺累计销量榜（AI价网公开「店铺销量」+ 云猫寄售 Shop/info.sell_count，约 450 家去重）② 商品「已售」标记榜（标题解析）③ 供给热度榜（按收录报价数，明确非销量）。所有数字均为商家公开的历史累计口径，非本插件成交数据。

## 安装

### 方式一：DSH 会话里让 AI 装（推荐）

在 DeepSeek Harness 的会话里对 AI 说：

```text
请用 plugin_manager 的 install_bundle 安装这个 DSH 插件包，target 传这个仓库的本地克隆路径：
git clone https://github.com/gaoren7716-lab/dsh-plugin-ai-price-radar.git 然后安装其中的目录。
```

或者一步到位（AI 会自己 clone 并安装）：

```text
帮我安装 GitHub 上的 DSH 插件：https://github.com/gaoren7716-lab/dsh-plugin-ai-price-radar
```

### 方式二：命令行

```sh
git clone https://github.com/gaoren7716-lab/dsh-plugin-ai-price-radar.git
dsh plugin --profile <你的profile名> add ./dsh-plugin-ai-price-radar
```

### 方式三：Harness 界面

**插件** → **添加插件** → 选择克隆下来的目录 → 启用。

装好后左侧栏出现「AI 比价雷达」图标，点开即用。

## 数据来源

| 来源 | 方式 | 授权 |
|---|---|---|
| [BiWu.Ai](https://biwu.ai) | 官方只读快照 feed `/price-radar/latest.json` → 不可变快照，约 5 分钟一版 | 无需鉴权；官方 [API 文档](https://biwu.ai/price-radar-api.md) 明确供 agent / 脚本读取，支持 ETag |
| [AI价网](http://aiprice.club) | 解析公开类目报价表 | 数据遵循 [CC BY 4.0](http://aiprice.club)，署名「AI价网 (http://aiprice.club)」 |
| 链动小铺（wzyp.cn） | 经上述聚合源覆盖 | 不直接抓取（直抓被其 ESA 人机验证拦截） |
| 水獭（shuifa.xyz） | 未并入 | 2026-11-13 起实测域名不可达；恢复后可按同架构接入 |
| 云猫寄售（catfk.com） | 公开店铺接口直连（POST /shopApi/Shop/goodsList，逐店实时抓取） | 店铺清单发现自 AI价网公开店铺目录；接口无需鉴权 |

## 隐私与边界

- 采集请求从**本机宿主进程**发出，不经过任何第三方服务器；结果只保存在内存缓存（5 分钟 TTL）。
- 面板不写入会话日志，不影响模型上下文；不发送任何遥测。
- 所有价格与库存以商家页面为准；本插件只做信息聚合与导航，**不参与任何交易**。

## 架构

```
宿主端 index.js ── webServer 注册 /leida/api/* 路由
  └─ lib/collectors.js ── BiWu 快照 feed + AI价网 HTML 解析（Node 内置 fetch，无依赖）
浏览器端 client.js ── 注册根级 main 键控插槽（整页面板）+ sidebar.panellist（侧栏入口）
```

纯 Node 内置模块，无构建步骤、无运行时依赖。

## 环境要求

- DeepSeek Harness 0.2.x（在 0.2.2-rc.3 实测通过）
- 能访问 `biwu.ai` 与 `aiprice.club`

## License

MIT
