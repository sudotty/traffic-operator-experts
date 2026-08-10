# 9 步执行流程 × LLM 自适应自进化管道（v5.1 架构设计）

> 定位：把「9 步执行流程」（人驱动的 check-list）升级为 **LLM 驱动的自适应自进化管道**——每步有明确模型角色 + 自动化载体 + 自进化反馈环 + 自适应调整点。回答："能否把每一步用配置好的 LLM 最好自进化？"——**能，且 v5.0 起在部分环节自动执行**。
> **定位声明（2026-08-10 审计后）**：本系统为 **harness 级 RSI**——进化发生在提示词/工具/工作流/记忆/评估层（Lilian Weng 2025：近中期 RSI 主战场是 Harness 工程），**不训练模型权重**；权重级进化不在本包范围。
> 现状（2026-08-10）：模型 = `deepseek-v4-flash`（supportsToolCall ✅ / supportsReasoning ✅）；4 个自动化已跑在该模型上（雷达 08:00 / 预警 09:00 / 归因 周一 / 战略 每月 1 号）。
> 理论母体：`rsi-foundations.md`（六原子 / VSV / C-E-M 三 Cell）；执行协议：`rsi-protocol.md`。
> 版本：v5.1（2026-08-10 证据驱动能力进化升级）

---

## 一、核心设计：三环自进化（单任务 / 周度 / 月度）

自进化不是"模型自己改 prompt"，而是**三圈反馈环**，每圈一个时间尺度：

```
┌─ 环1 单任务内（分钟~小时）────────────────────────────┐
│ 执行 → 验证 → REPAIR（先修后写）→ 复测 ✅  ← OODA 快循环  │
├─ 环2 周度（AAR 归因）─────────────────────────────────┤
│ 数据 → 归因 → 权重校准 → 写回基线 ✅  ← attribution     │
├─ 环3 月度（版本迭代）──────────────────────────────────┤
│ evals 回归 → SKILL 更新 → RELEASE → BETTER ✅ ← 进化    │
└────────────────────────────────────────────────────┘
每圈产出喂给下一圈：环1 的 REPAIR 经验 → 环2 的归因样本；环2 的权重 → 环3 的 evals 输入。
```

**关键**：自进化 = 数据闭环 + 人工闸门。LLM 负责**执行与提议**，人负责**验收与放行**（任务式指挥：意图+边界，执行层自主）。

---

## 二、9 步 × LLM 角色 × 自动化载体 映射表

| 步 | 动作 | LLM 角色（用什么模型能力） | 自动化载体 | 自进化点 |
|---|---|---|---|---|
| 1 | 定目标 | 推理（reasoning high）——从北极星拆量化目标 | 每月战略复盘 | 环3：目标达成率进月度复盘 |
| 2 | 判状态 | 推理——读账号基线判五态 | 每周归因 | 环2：状态证据更新进基线 |
| 3 | 看情报 | 工具调用（WebSearch）——PIR 驱动多源扫描 | 每日雷达 08:00 | 环1：雷达命中率反馈 |
| 4 | 选战场 | 推理 + 工具——评分卡因子实时取数 | 人工触发 | 环2：权重校准（因子权重随数据调） |
| 5 | 定打法 | 推理——三档预期生成 | 人工触发 | 环1：预期 vs 实际对比进 AAR |
| 6 | 执行 | 产线各角色（writer/gatekeeper） | pipeline 团队 | 环1：质量门禁拦截 |
| 7 | 验证 | 工具（WebFetch）——GEO 三环自测 | 人工/周归因 | 环1：REPAIR 触发 |
| 8 | 复盘 | 推理——AAR 四问 | 每周归因 09:00 | 环2：权重校准 + 基线写回 |
| 9 | 进化 | 推理——经验提炼 + 版本增量 | 人工 + evals | 环3：evals 回归门禁 |

**当前已自动化 4/9 步**（1 目标/3 情报/8 复盘/2 状态部分）；其余 5 步（2 状态/4 选战场/5 定打法/6 执行/7 验证）为人工触发——建议按优先级逐步自动化。

---

## 三、自进化机制：每步的"进化燃料"

| 环 | 输入（燃料） | 机制 | 输出（沉淀） | 防退化闸门 |
|---|---|---|---|---|
| 环1 | 单篇数据 + 验证结果 | REPAIR 四步（诊断→最小改动→复测→记录） | TRACE 记录 | 修复改动 ≤10%；复测对比 |
| 环2 | 周数据 + AAR 四问 | 权重校准（有数据依据，非拍脑袋） | account-profile-schema 基线 | 校准需标注依据；连续 3 周验证 |
| 环3 | evals 回归 + 使用反馈 | SKILL 版本迭代（验证有效才入） | 版本增量（changelog） | evals 总分 ≥8 且无 critical=0 |

---

## 四、自适应机制（v5.1 五环自适应 + 进化提议自动化）

自适应 = 不等人工变更，系统随环境反馈自动微调；与自进化（三环）正交叠加：

| 自适应环 | 机制 | 载体 | 反馈信号 |
|---|---|---|---|
| A 输入 | 监测源/关键词权重随命中率自动调（2 次零命中降权 / 3 次命中升权） | 雷达/预警自动化 | 命中率/误报率 |
| B 决策 | 评分卡因子权重随账号数据校准写回 `verified_weights` | 归因自动化 | AAR 差距 |
| C 输出 | 交付格式随受众反馈版本化（A/B 生效入 output-spec） | output-spec | 打开率/引用率 |
| D 评估 | 测试集随能力边界扩展 + held-out 30% 季度轮换 | evals.md | 新能力上线 |
| E 进化 | **进化提议自动生成**：`tools/evolve.ts` 扫描 TRACE/经验 → 输出提议清单（改进点+证据+预期收益），人只做闸门 | tools/evolve.ts | 运行沉淀 |

**自动化载体落地**：4 个自动化 prompt 已追加「自适应规则 v5.0」段落（结果自适应 + 进化提议 + 防塌缩），每次运行自动执行。

---

## 五、Fast Execution, Slow Evolution 节奏（v5.1 方法论 5 落地）

| 频率 | 动作 | 载体 | 纪律 |
|---|---|---|---|
| 秒-分钟 | 执行级 REPAIR（最小充分修改，按层优先序） | 环1 REPAIR | 不每失败都改 Skill——先根因，再最低层 |
| 小时-天 | Experience 提取（E-Cell 沉淀） | TRACE / 自动化记忆 | 失败即记录，留痕不决策 |
| 天-周 | Skill Candidate（进化提议） | evolve.ts 自动生成 | 人闸门确认 |
| 周-月 | Harness/权重优化（环2 校准） | 归因自动化 | 证据驱动，写回基线 |
| 月-季 | 架构/版本进化（环3 RELEASE） | evals + verify --release | M-Cell 模板 + 全量回归 |
| 季 | 字典生命周期盘点（选择压力） | verify 使用率提示 | ACTIVE→DEPRECATED→MERGED/DELETED |

**防 policy oscillation**：f_execution ≫ f_evolution——执行层可以快改，能力层必须慢进化。

---

## 六、三 Cell 映射（v5.1：Capability/Experience/Evolution 三分）

| 理论 Cell | 本包落地 | 说明 |
|---|---|---|
| **C-Cell 能力单元** | `references/` 25 字典（Skill+Knowledge）+ `tools/`（Verifier：verify/archive/evolve）+ Policy（人闸门） | CapabilityHub = "组织会什么" |
| **E-Cell 经验单元** | TRACE + 自动化记忆 + 账号基线（Evaluated Trajectory） | ExperienceHub = "组织经历过什么"，外部难复制的私有资产 |
| **M-Cell 进化单元** | git 版本线 + changelog（Parent/Diff/RootCause/Eval/Rollback） | Evolution Engine：evolve.ts 提议 → evals/verify 选择 → git 保留 |

闭环：**Capability → Work → Evidence → Experience → Mutation → Verified Capability'**（能力 → 执行 → 证据 → 经验 → 进化候选 → 独立验证后晋升）。

---

## 七、落地建议（三档，从现状出发）

### P0（本周，零新基建）：环1 单任务内自进化
- 已有：4 自动化在 deepseek-v4-flash 上跑。
- 补：每次雷达/归因产出后，自动追加一行 TRACE（GOAL→决策→验证→REPAIR），存工作区记忆；验证失败自动触发 REPAIR 建议。
- 收益：单任务闭环先转起来。

### P1（1 个月）：环2 周度权重自校准
- 已基本具备（attribution-rhythm 有 AAR 四问 + 权重校准）。
- 补：把「校准动作」从"建议"升级为"写入基线"（account-profile-schema `verified_weights` 字段），并在下次输出自动引用校准后的权重。
- 收益：模型决策权重随账号数据持续逼近真实。

### P2（季度）：环3 月度版本进化 + 多模型分工
- 建议配置第二个模型：`deepseek-v4-pro`（若 API 支持）做**推理重活**（定目标/选战场/定打法），`deepseek-v4-flash` 做**执行轻活**（情报/验证/复盘）——马赛克路由思想（碎片化分工，非单一大模型全干）。
- 补：evals 回归自动化（改 skill 后自动跑 10-prompt 回归）。
- 收益：推理质量与成本解耦；系统可测可回滚。

---

## 八、自进化的边界（不越界原则）

1. **人做闸门**：LLM 提议、人放行——权重校准、SKILL 更新、模型配置必须人工确认（任务式指挥：意图+边界）。
2. **验证有效才沉淀**：经验/权重/打法未经验证不入基线（防污染，环3 门禁）。
3. **可回滚**：每次 RELEASE 带版本号，出问题能退（git + zip 已具备）。
4. **不做黑盒自我修改**：不允模型无监督改写自己的 SKILL/prompt（防止漂移）；一切变更走 TRACE 可审计。

---

## 与既有体系的关系

| 文件 | 本文件注入 |
|---|---|
| EXECUTION-CORE.md | 9 步流程从"人执行"升级为"LLM 角色 + 自动化载体 + 自进化点" |
| system-lifecycle.md | 三环自进化 = 19 环中 REPAIR（环1）/OPTIMIZATION（环2）/EVALUATION-RELEASE（环3）的工程化 |
| deep-mapping.md | 控制论反馈环（Wiener）= 三环自进化的理论根基 |
| military-llm-playbook.md | P2 多模型分工 = 马赛克路由（M16）落地 |
| account-profile-schema.md | 环2 权重校准写回 `verified_weights` |
| evals.md | 环3 回归门禁（总分 ≥8 且无 critical=0） |

> 维护说明：本文件是"工程落地层"——9 步 × LLM 角色 × 自动化载体 × 三环自进化，是自进化能力的产品化设计。落地优先级 P0→P1→P2。

## 九、业界对齐机制（v5.1：2026-08-10 调研对齐）

> 依据：Anthropic 官方四条 / OpenAI Eval 方法论 / 自进化可控路线 / SemVer 工程指南（详见仓库根 `CHANGELOG.md` 与调研报告 `agent-skill-upgrade-playbook-2026-08.md`）。

| 机制 | 落地位置 | 触发节奏 |
|---|---|---|
| **G1 触发召回测试**（description 是触发唯一依据） | `judge.ts --set trigger`（T1-T8，通过线 召回≥90%/准确≥85%） | 修改 description/定位后必须跑 |
| **G4 成本分层**（先便宜后贵） | `judge.ts --tier spot`（编辑后首检 4 题）→ targeted（补测失败题）→ full（发布前） | 每次编辑 |
| **G3 四维指标**（效果/稳定/成本/风险） | `judge.ts --repeat N`（稳定度方差）+ 报告 risk 维度 | 发布前 full+repeat |
| **G2 文件级版本纪律**（SemVer + CHANGELOG） | 仓库根 `CHANGELOG.md`（六类规范）+ verify [3.5/6] 契约检查 | 每次发布 |
| **G5 description A/B**（单变量召回对照） | 改 description 前用 trigger 集对 A/B 两版各跑一次，召回更优者胜出 | description 重大修改时 |
| **G6 Compaction SOP**（压缩重构防膨胀） | 月度复盘：合并重复规则 → 下沉细节到 references → 删除长期未触发 → 历史任务验证 vN vs vN+1 | 月度 |
| **G7 生产反馈回流**（生产→结构化信号） | 真实写稿/归因产出（成功+失败）进 ExperienceHub；失败模式供 `--gen-adversarial` 出题 | 持续 |
| **G8 运行时监控**（触发率/误触发/token） | 4 个自动化运行指标（触发、token、失败模式）采集入 TRACE，月度复盘分析 | 持续 |

> 原则（业界共识）：**先评估后升级、最小可验证步进（one hypothesis per edit）、触发质量优先、四维衡量、人闸门在发布边界**。
