# 流量操盘手 · SEO/GEO 双轨内容获客专家

> AI 搜索时代的内容获客外脑——不止抢点击，更让你的内容**被 AI 引用、被记住、能转化**。
> 适用于 WorkBuddy 的两个配套专家：单专家顾问 + 四岗产线团队。

---

## 给谁的？

做**内容获客**的人：公众号 / 小红书 / 知乎 / 官网的运营者、中小企业主、内容团队。

如果你正在焦虑"AI 搜索把点击吃掉了，流量从哪来"——这套专家就是为这个具体问题设计的。

## 为什么这是 2026 年的打法？

搜索范式已经变了，"抢排名拿点击"的游戏在收缩：

| 信号 | 数据 | 来源 |
|---|---|---|
| AI 摘要（AIO）覆盖率 | 48% 的查询（商业意图词 71%） | Semrush / BrightEdge 2026 |
| AIO 下首位 CTR 跌幅 | 从 -34.5% 恶化到 **-58%** | Ahrefs 2026 |
| 零点击搜索占比 | 60–68% | SparkToro / Datos 2026 |
| **被 AI 引用的品牌** | 相邻自然 CTR **反涨 +35%** | BrightEdge 2026 |
| **AI 引荐流量转化率** | 约 **9 倍**于自然搜索（15.9% vs 1.76%） | Seer 2026 |

所以这套专家的靶心不是"抢排名"，而是 **被引用（GEO）+ 品牌词资产 + 高转化残余流量**。

## 两个专家怎么用

| 专家 | 类型 | 定位 | 什么时候用 |
|---|---|---|---|
| **流量操盘手**<br/>`seo-traffic-growth` | Agent 单专家 | 随身流量顾问 | 快速问答、账号诊断、单篇出稿、改标题——快、轻、随叫随到 |
| **流量操盘手产线**<br/>`seo-traffic-pipeline` | Team 四岗团队 | 内容生产队 | 批量产出、矩阵运营、严格合规带货稿、每周复盘——多层把关 |

**产线四岗**：刘量海（产线总控）→ 甄词远（选题策略）→ 文千帆（流量写作）→ 严恪（质量审核，一票否决）→ 舒据明（数据复盘）。

## 核心能力

**地基是第一性原理**（v1.4）：传播力乘法模型（为什么被转发）、GEO 引用概率模型（为什么被 AI 引用）、信息增益（第一性护城河）——所有评分卡都是这三套公式的表层投影。

- **诊断前置**：先定位 `[平台] × [阶段] × [变现]` 业务坐标再给方案，不套万能模板
- **量化决策模型**：选题/标题评分卡（含"被引用潜力"因子），每个因子给取值与理由
- **红队自检 + 合规护栏**：甲方/算法/竞对三视角自检；广告法违禁词命中即自动改写并附改动清单
- **GEO 引用自测**：直接把目标 query 问 Perplexity/元宝/ChatGPT，实测有没有被引用——不只看理论
- **三层嵌套 OODA**：L0 单篇天级迭代 / L1 账号周级归因 / L2 定位月季级战略，胜负手是循环速度
- **活数据协议**：取数顺序 用户提供 > 实时检索 > 库内基准 > 标待核实，按新鲜度 TTL 分级
- **网感雷达 + 每周归因**：写稿前扫当前爆款；对账→三层归因→权重校准写回基线
- **25 个参考库字典**：单一真源 EXECUTION-CORE（概念树/9 步流程/铁律）+ 原理层、行业数据基准、业务路由、合规库、标题钩子库、GEO 自测、回归评测集等按需加载
- **TypeScript 工具层**（`tools/`）：`npm run verify` 审计护栏（禁词/副本同步/版本单轨）· `npm run zip` 重建 zip · `npm run archive` wiki 归档

## 安装到 WorkBuddy

**方式一（本地）**：把需要的专家文件夹放入
```
~/.workbuddy/plugins/marketplaces/my-experts/plugins/
```
然后运行注册脚本（或重启 WorkBuddy 让其扫描「我的专家」市场）。

**方式二（ClawHub 上架后）**：在推荐市场搜索"流量操盘手"一键安装。

## 工具层（TypeScript，运维三命令）

```bash
cd tools
npm install          # 首次（typescript + @types/node）
npm run verify       # 审计护栏：禁词 0 残留 + 副本×3 同步 + 版本单轨 v3.2
npm run zip          # 重建 seo-traffic-growth.zip / seo-traffic-pipeline.zip + 内容禁词检查
npm run archive -- <repo> <page_path> <section_file> [msg]   # 追加 wiki 章节（gh API，自带 409 重试）
```

`verify` 把原来 4 轮人工审计（grep 禁词 → diff 副本 → 版本核对 → 重建 zip）固化为一条命令，全绿（exit 0）才算可交付。

## 目录结构

```
traffic-operator-experts/
├── seo-traffic-growth/          # 流量操盘手（Agent 单专家）
│   ├── .codebuddy-plugin/plugin.json
│   ├── agents/seo-traffic-growth.md
│   ├── skills/seo-framework/    # 参考库字典（25 文件，EXECUTION-CORE 为单一真源）
│   └── avatars/
├── seo-traffic-pipeline/        # 流量操盘手产线（Team 四岗团队）
│   ├── .codebuddy-plugin/plugin.json
│   ├── settings.json
│   ├── agents/                  # 主理人 + 4 团员
│   ├── skills/seo-framework/    # 同一套参考库（verify 保证逐字节一致）
│   └── avatars/
├── tools/                       # TypeScript 工具层（archive / verify / zip）
├── wiki/                        # 知识归档（每日雷达/方法论体系/数据基线等）
└── scripts/                     # 历史脚本（已被 tools/ 取代，保留备查）
```

## 作者

20 年 SEO 与流量广告实战、5 年 AI 从业。不讲玄学，只讲数据和打法。

---

*Both experts follow the WorkBuddy expert-package spec (v2.0). Validated & packaged via the official expert-manager scripts.*
