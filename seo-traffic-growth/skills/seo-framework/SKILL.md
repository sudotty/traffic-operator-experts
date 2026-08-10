---
name: seo-framework
description: SEO/GEO 流量增长的量化基准数据库与决策模型库。当需要引用行业数据（CTR 基准、零点击比例、GEO 研究结论）、使用选题/标题评分模型、或需要学术理论锚点（STP、长尾理论、好奇心缺口、E-E-A-T、AARRR 归因）时使用。
---

# SEO 量化框架与基准库

为「流量操盘手」提供可溯源的数据弹药与可复算的决策模型，让输出"有据可查"而非"凭印象编数"。

## 何时使用

- 输出中需要引用任何行业数据、研究结论、CTR/转化基准时
- 做选题评估、标题评估、关键词分层等需要量化打分时
- 需要为策略提供学术理论支撑时

## 包含内容

| 文件 | 内容 |
|---|---|
| `references/first-principles.md` | **原理层**：传播力乘法模型、GEO引用概率模型、SEO排名模型、信息增益护城河（所有评分卡的"为什么"） |
| `references/geo-monitoring.md` | GEO引用自测SOP：query集×多引擎×四维记录、计分卡、冷启动反向拆解 |
| `references/benchmarks.md` | 行业数据基准表（含来源、年份、口径）+ 2026.8锚点 + 七环节学术锚点 |
| `references/decision-models.md` | 选题评分卡、标题打分卡、传播力打分、三档预期模板、红队自检清单、输出结构模板 |
| `references/playbooks.md` | 业务路由矩阵：平台 × 阶段 × 变现三维，含组合打法示例与平台红线 |
| `references/compliance.md` | 广告法违禁词库 + 行为化改写规则 + 版权/平台红线 + 护栏执行流程（优先级 合规>真实>用户目标>网感风格） |
| `references/title-hook-library.md` | 标题公式与变体、数据钩子类型、网感化表达规则、平台字数速查 |
| `references/examples.md` | 完整输出范例：选题评估 + 合规护栏触发，供少样本对齐 |
| `references/evals.md` | 14-prompt 回归测试集 + 评分 Rubric（含 critical 项）+ v1.2/v1.3 实测记录 |
| `references/account-profile-schema.md` | 账号基线 JSON Schema，约束跨会话记忆写什么、怎么校准 |
| `references/live-data-protocol.md` | 活数据获取顺序（用户提供>实时检索>库内基准>待核实）+ 双渠道扫描源清单（**v1.6：海外为主、国内为辅**）+ 各平台取数字段清单 |
| `references/research-library.md` | **v1.6 新增**：海外信源库——GEO 学术论文（含 2026 批判综述校正）、AI Agent 工程学论文、产业 ROI 数据、AI 搜索市场格局、方法论（Context/Harness/Graph Engineering）、产品/论坛扫描源 |
| `references/output-spec.md` | **v1.7 新增**：专业决策者输出规格 v2——三层阅读架构、信噪比去噪清单（N1-N8）、信号卡五字段格式、表达规则、So What/Now What/What If 三问、专业化×落地×通俗化三层表达、同构骨架模板（雷达/方案类产出默认遵守） |
| `references/trend-radar.md` | 网感雷达：写稿前扫描当前爆款提取活模式的流程与纪律 |
| `references/attribution-rhythm.md` | 每周归因仪式：数据对账→三层归因→权重校准写回基线 |
| `references/style-anchors.md` | 用户风格锚点库（few-shot 之源），等待用户投喂代表作后生效 |

## 使用规则（铁律）

0. **受众视角分级（v1.7）**：默认按「专业决策者视角」产出——受众画像 = 重视数据 / 重视 AI / 重视学术化 / 重视海外资讯的专业人士（AI PM、增长负责人、ToB 售前、研究者）。**可执行细则见 output-spec.md（v1.7）**：三层阅读架构（L1 摘要 30 秒可读 / L2 信号卡 / L3 深度）、信噪比去噪清单 N1-N8、信号卡五字段、So What/Now What/What If 三问、专业化×落地×通俗化三层表达。若用户明确要大众化表达，再降级为网感版。

1. **引用必标注**：引用库内数据必须给出来源与年份/口径（如"Pew 2025，会话级面板"）。
2. **库外必标记**：库内没有的数据标【待核实】；涉时效数据先检索核实再引用。
3. **模型可校准**：评分卡的权重与阈值是默认值，应随用户账号的历史数据校准，并在输出中说明当前使用的权重（校准纪律见 account-profile-schema.md）。
4. **口径不混淆**：不同研究方法论不同（会话面板 vs 关键词快照 vs 曝光日志），引用降幅类数据时必须注明口径，禁止跨口径直接比较数值大小。
5. **规则优先级**：任何输出冲突时按 `合规 > 真实 > 用户目标 > 网感风格` 裁决（详见 compliance.md 第五节）。
6. **诊断先路由**：输出方案前先定位 `[平台] × [阶段] × [变现]` 业务坐标，缺维先问清（详见 playbooks.md）。
7. **响应分级**：微任务走轻轨（合规+打分），战略任务走全轨（四协议+六段结构），禁止流程过载。
8. **活数据取数**：按 live-data-protocol.md 顺序取数，禁止凭训练记忆报具体搜索量/指数。
9. **信源策略**：**海外为主（约 80%）、国内为辅**——学术/产业/产品论断优先引海外一手源（arXiv、Gartner/McKinsey/Forrester、SE Ranking、Product Hunt、海外媒体）；国内源仅用于国内事件验证。论文引用必带 arXiv 号（见 research-library.md）。
10. **GEO 论断校正**：引用「+40%」类 GEO 效果数据前，必须过 research-library.md 批判综述关——区分「检索」与「答案内引用份额」两个环节，条件效应不得表述为无条件（见 benchmarks.md 〇-补2）。
11. **数字化/学术化/产业化**：SEO/GEO 内容建议拒绝大众化叙述——给量化锚点（回本周期、份额、成本、论文结论），给产业落地视角（产品/ROI/工程学概念），涉及 AI Agent 概念时给出可解释的定义卡。
12. **北极星对齐**：AI 引用率/品牌词增量 > 转化 > 打开率/完读率（2026 校准，依据 benchmarks.md 第〇节）。
