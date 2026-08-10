# 海外信源库（论文 / 研究 / 产品 / 方法论 / 工程学）

> 定位：**海外信源为主（约 80%）、国内为辅**的取数弹药库。所有 GEO/SEO/AI Agent 论断优先从本库找证据，找不到再降级国内信源或标【待核实】。
> 使用规则：引用必标来源 + 年份 + 口径；论文一律给出 arXiv 号；产品动态标注日期；方法论标注适用边界。

## 一、GEO 学术论文库（引用时的「正确姿势」）

### 奠基论文
| 论文 | arXiv/会议 | 核心发现 | 引用注意 |
|---|---|---|---|
| Aggarwal et al. "GEO: Generative Engine Optimization" | arXiv:2311.09720 / **KDD 2024** | 引用/统计/权威来源使 AI 可见度最高 +40%（固定上下文实验） | **必须加条件**：「已被检索进上下文的文档，答案内引用份额最多 +40%」，不等于 +40% 曝光/点击 |
| GEO-bench | 同上 | ~10,000 查询的基准 | 引用时说明基准口径 |

### 2026 批判性综述（最重要，校正全行业话术）
| 论文 | arXiv | 核心结论 |
|---|---|---|
| Martinez, "Optimizing Visibility in Generative Engines: A Critical Survey of GEO (2023–2026)" | **arXiv:2607.14035**（2026-07） | 审 45 项研究：①「+40%」是固定上下文内引用份额，非检索增益；②最可复现杠杆=主题相关性+上下文位置；③**无任何技术证明对「有机可发现性」有跨平台纵向因果效应**；④市场宣称 ROI 远超学术证据；⑤测量需四维变化+7-8 次重复 |

### 结构/修复/测量（GEO 实操证据）
| 论文 | arXiv | 关键数据 | 用途 |
|---|---|---|---|
| Tian et al. 修复 vs 重写 | arXiv:2603.09296 | 定向修复改 5% 内容 +40% 引用率；全量重写改 5 倍内容效果更差，可伤长尾 | 「先诊断后修复」 |
| Kim et al. SAGEO Arena | arXiv:2602.12187 | 171,003 文档/2,700 查询；朴素正文优化检索 -9%/-16%/-6%；**结构信息（标题/层级/markup）是安全网** | 「结构 > 正文改写」 |
| Schulte et al. 引用波动 | 2026 | 4 引擎 45 天源级 Jaccard 0.34–0.42，半数引用每日换血 | 「单次测量是噪声」 |
| Zhang, He & Yao 引用测量框架 | arXiv:2604.25707 | ChatGPT 每答案平均引用 <7 源（N=21,143） | 「答案层很小且流动」 |
| Yu et al. 结构特征工程 | arXiv:2603.29979 | 内容结构可定量塑造引用行为 | 结构化写作依据 |
| Xu et al. 测量 Google AI Overviews | arXiv:2605.14021 | 激活/来源质量/claim 保真/发布者影响四维 | 测量框架参考 |
| Yuan et al. AgenticGEO | arXiv:2603.20213 | 自进化 agentic GEO 系统 | GEO 自动化前沿 |
| Zhang et al. Pinterest VLM+agent | arXiv:2602.02961 | VLM+Agent 框架做企业获客 | 企业落地案例 |
| IF-GEO 冲突感知指令融合 | ACL 2026 Findings | 多查询 GEO 指令融合 | 进阶技术参考 |

## 二、AI Agent 工程学论文库（概念解释弹药）

| 论文 | arXiv | 核心概念 | 用途 |
|---|---|---|---|
| Guo et al. "From QA to Task Completion: Survey on Agent System & Harness Design" | **arXiv:2606.20683** | Agent=基座模型×执行 harness；**工程四范式：prompt→workflow/context→harness→agent-native training**；harness 六职责：observation/context/control/action/state/verification | 解释「Agent 系统成败在 harness 不在模型」 |
| Wang et al. "From Agent Traces to Trust" | arXiv:2606.04990 | 执行溯源 typed graph + 证据溯源；归因/可审计/可恢复 | 与 GEO 归因环呼应：「能被溯源才值得引用」 |
| Baloch & Khan "Human-Centered Multi-Agent Systems" | arXiv:2606.08274 | 文化/价值观/协作对齐 | 多 Agent 社会化前瞻 |
| "Agents That Know Too Much"（隐私） | arXiv:2606.26627 | Agent 数据过度暴露、威胁面 | 企业 Agent 合规素材 |
| "Data Agents: Levels, State of the Art" | SIGMOD 2026 Tutorial | 数据 Agent 分层 | 数据 Agent 概念 |

## 三、产业数据源（AI Agent 落地 ROI / 市场格局，海外为主）

### Agent ROI 全谱系
| 指标 | 数值 | 来源 |
|---|---|---|
| 2026 底企业应用嵌入任务 Agent | 40%（2025 <5%） | Gartner 2026 |
| 12 个月内 ROI 转正 | 41%；中位回本 5.1 月；19% 永不回本 | Gartner Agentic AI Pulse 2026 |
| 回本周期按负载 | SDR 3.4 / 客服 4.1 / 市场 6.7 / 财务 8.9 / 工程 9.3（月） | Gartner 2026 |
| 生产级 Agent ROI | 171%（美国 192%） | OneReach / Forrester 2026 |
| 每 $1 GenAI 回报 | 3.7x | Forrester 2026 |
| 失败根因中模型能力占比 | <8%；92% 治理/评估/集成 | Gartner 2026（Forrester：41% 目标不清/33% 工具数据不足/26% 评估漂移） |
| 有自动评估的 Agent 回滚率 | 9% vs 无评估 47% | Gartner 2026 |
| 全任务移交型 API 流量 | 77%（Anthropic 遥测）；93% 权限弹窗未读即批；主动澄清仅 16.4% | Anthropic State of AI Agents 2026 |
| Agent 市场体量 | 2026 年 109–120 亿美元，CAGR 44–46% | Grand View / MarketsandMarkets |
| 垂直行业 Agent 增速 | CAGR 62.7%，最快细分 | 2026 多源 |

### AI 搜索市场格局
| 指标 | 数值 | 来源 |
|---|---|---|
| AI 平台引荐流量份额 | ChatGPT 74.78%（-5pt）/ Gemini 11.56%（+231%）/ Perplexity 7.23%（-13%）/ Copilot 3.51%（+31%）/ Claude 2.62%（+320%） | SE Ranking（101,574 站点/250 市场，2025.1–2026.1） |
| ChatGPT 周搜索查询 | >10 亿次 | 2026 |
| AI 助手 MAU 份额 | ChatGPT 46.4%（11 亿）/ Gemini 27.7%（6.62 亿）/ Claude 10.3%（2.45 亿） | Sensor Tower 2026 |
| AI 搜索占全球流量 | 绝对值 0.32%，两年 +16 倍 | SE Ranking / 行业 |
| AI 引荐转化 | ChatGPT 15.9% vs 自然 1.76%（≈9 倍） | Conductor 2026 |
| 系统追踪 AI 搜索表现的品牌 | 仅 16% | 行业调研 2026 |

## 四、方法论与工程学（可产业化落地）

| 方法论 | 一句话 | 适用 |
|---|---|---|
| **Context Engineering（上下文工程）** | 选择性构造模型看到的上下文（检索/压缩/时序编排），非堆 token | 任何 Agent/内容技术选题；例：蚂蚁 Ling-3.0-flash 分层缓存降首 token 时延 60-80% |
| **Harness Engineering（执行框架工程）** | 模型外运行时（工具/状态/验证/回滚）决定 Agent 可用性 | Agent 平台选型；GitHub stacked PRs、评估基建都是 harness 证据 |
| **Graph Engineering（图工程）** | 把 agentic 网络构造成持久执行图（长期记忆+自纠错） | 2026 新词，多 Agent 系统设计 |
| **RAG / Grounding** | 检索增强 + 事实锚定 | 内容被 AI 引用的技术底座 |
| **Schema / 结构化** | 标题/层级/markup 是检索安全网（SAGEO Arena） | GEO 内容结构铁律 |

## 五、海外产品/论坛/社区扫描源（高频，周级）

| 类别 | 源 | 看什么 |
|---|---|---|
| 产品 | Product Hunt 每日热榜、Hacker News 首页、X 趋势 | Agent 基建新产品（IDE/浏览器/搜索/支付/采购） |
| 社区 | Reddit r/artificial、r/LocalLLaMA、r/singularity、HN | 模型口碑、爆点酝酿地（AI 偏爱社区内容：OpenAI-Reddit 年授权 6000 万美元） |
| 数据研究站 | Artificial Analysis、Semrush/BrightEdge/SparkToro、SE Ranking、Sensor Tower | SEO/GEO 基准、AI 搜索份额、模型评分 |
| 海外媒体 | TechCrunch、The Verge、Bloomberg、WSJ、dev.to AI Daily Digest | 融资/美股/产品周报 |
| 学术 | arXiv cs.IR / cs.AI / cs.CL 每周新提交、ACL/EMNLP/KDD 论文集 | GEO/Agent 论文前沿 |
| 国内（辅助验证） | 量子位、机器之心、晚点、36氪、新浪科技 | 国内事件一手验证（海外为主、国内为辅） |

## 六、纪律
1. **海外为主**：优先引海外一手源（论文/机构报告/官方）；国内源仅用于国内事件验证，不用于学术论断。
2. **GEO 论断必须过批判综述关**：说「+40%」必带条件；引用前自问「这是固定上下文内还是检索增益？」。
3. **论文必带 arXiv 号**：无号不引或标【待核实】。
4. **测量重复**：AI 答案时效性强，引用份额类数据必须标引擎+日期+次数。
