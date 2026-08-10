# RSI 自适应自进化协议（Recursive Self-Improvement × Self-Adaptation）

> 定位：系统「自进化 + 自适应」的安全引擎——**自评估 → 自修正 → 自升级** 三层递归（纵深）+ **五环自适应**（宽度），每层有人工闸门，杜绝黑盒自我修改。
> 与 self-evolving-pipeline.md 的关系：pipeline 定义「三环时间尺度」（单任务/周度/月度）+ 自适应载体，本文件定义「递归纵深 + 自适应机制 + 工程护栏」。
> 理论母体：`rsi-foundations.md`（六原子 / VSV 公式 / C-E-M 三 Cell / 七方法论）——本文件是它的执行协议。
> 版本：v5.2（2026-08-10 证据驱动能力进化升级）

---

## 一、RSI 三层递归（每层都是 OODA 微循环）

```
层1 自评估（SELF-EVAL）   ：产出 vs 标准（evals 10-prompt / 信号卡 / N1-N8）→ 打分
层2 自修正（SELF-REPAIR） ：评估不过 → 诊断最弱环 → 最小改动（≤10%）→ 复测
层3 自升级（SELF-UPGRADE）：修正验证有效 → 沉淀进 SKILL/基线 → 版本增量 → 回归
        ↑________________________ 递归：层3 的输出回到层1 重新评估（改进的改进）
```

**递归关键**：升级后的 SKILL 必须重新过层1（evals 回归）——不是"改了就算好"，是"改了 + 复测通过 + 再跑全量回归"才算好。这防止「修 A 坏 B」。

---

## 二、每层协议

### 层1 自评估（每次产出后）
- **触发**：全轨任务交付前 / 每次 skill 变更后。
- **执行**：跑 evals.md 的 10-prompt 回归（总分 ≥8 且无 critical=0 才通过）+ output-spec 检查单（L1 独立可读/无 N 类噪声/信号卡齐全）。
- **输出**：评估分 + 失败项清单。
- **E-Cell 采集（v5.2）**：每次执行同步沉淀 E-Cell（Task/State/Context/Capability/Actions/Observations/Errors/Corrections/Verifier/Cost/Outcome）——TRACE 是 E-Cell 的最小形态，学习原子不是"结论"而是"带评价的执行轨迹"。

### 层2 自修正（评估不过时）
- **规则**：REPAIR 四步（诊断定位 → 最小改动 ≤10% → 复测 → 记录）；**先修后写**（Tian：修复改 5% 内容 +40%，全量重写改 5 倍更差）。
- **边界**：改动只允许在「内容/权重/参数」层；**禁止**模型直接修改 SKILL.md/prompt 本体（那是层3 + 人工闸门的事）。

### 层3 自升级（验证有效时）
- **触发**：同一模式连续 3 次被验证（或证伪）；月度战略复盘。
- **流程（M-Cell 模板，v5.2）**：每个升级 = 一个 M-Cell：
  ```
  Parent Version → Target Component → Root Cause（证据：失败聚类/频率/影响）
  Proposed Diff → Expected Effect → Eval Dataset
  Held-out Result → Regression Result → Cost Delta → Risk Delta → Rollback Pointer
  ```
  完整动作：提议 → 人工确认 → 写 SKILL/基线 → M-Cell 入 changelog → **全量 evals 回归** → RELEASE。
- **边界**：**人做闸门**——LLM 提议、人放行；一切变更走 TRACE 可审计；可回滚（git/zip）。

---

## 三、RSI 与已有机制的关系

| RSI 层 | 对应机制 | 说明 |
|---|---|---|
| 层1 自评估 | evals.md（10-prompt 回归）+ output-spec 检查单 | 已有，RSI 把它固定为「每产出/每变更必跑」 |
| 层2 自修正 | REPAIR 协议（system-lifecycle §10） | 已有，RSI 限定「不改本体」边界 |
| 层3 自升级 | EXPERIENCE 协议 + SKILL 版本线 | 已有，RSI 加「升级后回归」递归闭环 |

---

## 四、五环自适应（自进化 × 自适应的双引擎）

自进化 = 变强后回写能力（纵深递归）；自适应 = 不等变更，系统自己跟随环境微调（横向跟随）。五环：

| 环 | 自适应内容 | 载体 | 反馈信号 |
|---|---|---|---|
| A 输入 | 情报源/关键词权重随命中率自动调（连续 2 次零命中降权、3 次命中升权） | 雷达/预警自动化 | 命中率/误报率 |
| B 决策 | 评分卡因子权重随账号数据自动校准并写回基线 | 归因自动化 `verified_weights` | AAR 差距 |
| C 输出 | 交付格式随受众反馈版本化（A/B 生效后入 output-spec） | output-spec | 打开率/引用率 |
| D 评估 | 测试集随能力边界扩展 + held-out 30% 季度轮换 | evals.md | 新能力上线 |
| E 进化 | 进化提议由工具自动生成（evolve.ts），人只做闸门 | tools/evolve.ts | TRACE/经验沉淀 |

**自适应纪律**：任何自适应调整必须记录「信号 → 调整 → 依据」（TRACE 可审计），禁止无证据拍脑袋调参；自适应与人闸门不冲突——参数层可自主，SKILL/prompt/模型配置仍须人工确认。

---

## 五、工程机制（2025-2026 研究补齐的四个护栏）

| 机制 | 研究出处 | 协议 |
|---|---|---|
| **自动评估 LLM-as-judge** | Self-Rewarding LM 2024 / Agent-as-a-Judge 2024 | evals 由双模型互评自动打分 + 人工抽检 20%；judge 定期校准（防 judge 漂移）；judge 与产出模型不同（防自我表扬） |
| **held-out 防污染门禁** | RSEA 2026（严格 held-out 防退化） | 测试集拆 70% 可见 + 30% held-out（季度轮换）；升级必须同时过可见集与 held-out，防「改分不改能」过拟合 |
| **自博弈对抗** | Self-Challenging Agents NeurIPS 2025 / AlphaEvolve 2025 | 每周生成 1 个对抗 case（出题-解题-筛选）进回归；红队从「单次三视角」升级为「持续对抗迭代」 |
| **防塌缩闸门** | Model Collapse Nature 2024（Shumailov）/ Weng 多样性坍缩 | 经验入基线前做多样性检查（信息增益度量）；同质经验合并去重；自产出数据不直接回流为训练输入 |

**共性问题**：四机制都服务于同一目标——**进化要可测量、防作弊、防退化**。缺一即回到「自我表扬式进化」。

---

## 六、七方法论速查（v5.0 执行纪律，详见 rsi-foundations.md 第五节）

| # | 方法论 | 一句话执行 |
|---|---|---|
| 1 | Minimal Sufficient Mutation | 失败后先根因，再按层优先序（Knowledge→Memory→Skill→Tool→Context→Verifier→Harness→Model）只改最低够用层；Δ* = Smallest Change s.t. Problem Solved |
| 2 | Evidence Before Evolution | NoEvidence ⇒ NoMutation；"我觉得不好"必须变成失败聚类+频率+根因 |
| 3 | Verifier Before Optimizer | 先 SPEC→VERIFIER→TRACE→BASELINE，再 OPTIMIZER；Measure → ThenOptimize |
| 4 | Skill First, Harness Later | 进化从 Skill 层改起（面小/易解释/易 Eval/易回滚），Harness 留待成熟 |
| 5 | Fast Execution, Slow Evolution | 执行修复秒-分钟级，进化周-月级；f_execution ≫ f_evolution，防 policy oscillation |
| 6 | Skill 选择压力 | 字典文件生命周期 ACTIVE→LOW-USE→DEPRECATED→MERGED/DELETED；能力库必须会忘 |
| 7 | Capability Composition | Thin Agent + 厚 Capability Cells；组合能力，不无限造 Agent |

**总公式**：RSI = Trace + RootCause + CandidateMutation + HeldOutEval + VersionedPromotion；**EvolutionRate ≤ SelectionQuality**（选择比变异更稀缺，Verifier 战略权重最高）。

---

## 七、RSI 决策原则（有疑问时的自决策规则）

1. **证据优先**：数据能判的，用数据判（A/B 对比/回归分），不靠感觉。
2. **最小改动**：能改 5% 不重写 100%；能改参数不改结构。
3. **可回滚**：任何变更留版本号，出问题立即退回。
4. **闸门在人在**：涉及 SKILL/prompt/模型配置的变更必须人工确认；内容层/权重层 LLM 可自主。
5. **递归验证**：每次升级后跑全量回归——「改进的改进」也要被评估。

---

## 八、一句话

> RSI = 让系统「每次任务都变聪明一点」，且聪明得有证据、有闸门、可回滚——不是黑盒进化，是**受控递归 + 环境跟随**：感知自己 → 评估自己 → 修正自己 → 升级自己 → 再评估。真正的进化原子不是 Skill 本身，而是**可验证、可继承的能力变化**（Verified Mutation）。

---

## 九、研究锚点（2025-2026，升级依据）

- **Harness 级定位**：Lilian Weng《Harness 工程与自我改进》（Thinking Machines 2025）——近中期 RSI 主战场是围绕模型的 Harness（工作流/工具/上下文/状态/评估），非模型自改权重；本系统即 harness 级 RSI。
- **闭环框架**：Fang et al.《A Comprehensive Survey of Self-Evolving AI Agents》（arXiv:2508.07407, 2025）——输入/智能体/环境/优化器四模块；安全=沙箱+可追溯+回滚+风险比例监督。
- **进化维度**：《A Survey of Self-Evolving Agents: What, When, How, Where》（arXiv:2507.21046）——对象（权重→策略→经验→工具）× 时机（测试内/在线）× 机制（反思/自博弈/多智能体）。
- **测试门禁**：Gödel Agent（Yin 2024）——提议修改必须通过预定义改进测试（本协议层3）。
- **反思与沉淀**：Reflexion（Shinn 2023，文本反思+情景记忆）；Voyager（Wang 2023，技能库沉淀）。
- **评估器风险**：Self-Rewarding LM（Yuan 2024，judge 漂移/奖励作弊）；RSEA 2026（held-out 门禁）。
- **防退化**：Shumailov et al., Nature 2024（模型塌缩）。

## 十、业界对齐补充（v5.2：升级节奏纪律）

- **G1 触发测试**：每次修改 SKILL/agent 的定位或 description，先跑 `judge.ts --set trigger`（T1-T8）——**触发召回率 <90% 或准确率 <85% 即阻断发布**。理由（Anthropic/OpenAI 共识）：description 是模型决定"是否加载"的唯一依据，触发不了内容再好也白搭。
- **G4 成本分层**：层3 自升级的 evals 回归按 `--tier spot → targeted → full` 分层执行，先便宜后贵；每次编辑后跑 spot（4 题）首检，发布前才跑 full。
- **G3 四维评估**：回归记录必须含四维——效果（得分）、稳定（--repeat N 方差）、成本（token）、风险（critical/空回复/解析失败）；"只报得分"视为不完整记录。
- **G5 A/B 纪律**：description 重大修改 = 单变量实验：A/B 两版各跑 trigger 集，数据决定去留，禁止凭感觉改触发描述。
- **G6 Compaction**：月度复盘执行压缩重构（合并重复/下沉细节/删除未触发/历史任务验证），防止字典膨胀（业界实测 5KB → 50KB 风险）。
- **G7/G8 生产闭环**：真实产出（写稿/归因）失败模式进 ExperienceHub 供出题；自动化运行指标（触发/token/失败）入 TRACE 月度分析。

## 十一、交互模式协议（v5.2：Ask-vs-Act 落地，用户在场度切换）

> 设计原则（2026-08-10 用户确认）：**问的代价 < 不问的代价 才问**；按「风险 × 可逆性 × 用户在场度」分档。无差别提问 = 决策疲劳（打断心流），全自主 = 方向跑偏，正确解是分级。

| 决策点 | 风险/可逆性 | 定时任务（用户不在场） | 主动会话（用户在场） |
|---|---|---|---|
| 目标歧义（9 步步1） | 低/可逆 | 自主：按默认假设执行 + TRACE 标注假设 | **问**：1 个选项卡片确认方向 |
| 方案分叉（9 步步4 选战场） | 中/可逆 | 自主：选默认档 + 记录理由 | **问**：选项卡片，各带后果说明 |
| 发布/写回/改配置（9 步步8） | 高/不可逆 | **必问**：或默认只存档不发布 | **必问** |
| 执行细节（格式/参数） | 低/可逆 | 自主 | 自主（不打断） |

- **提问形式**：结构化选项卡片（AskUserQuestion 式）——每个选项带 label + 后果说明，一次点选，决策损耗最低；复杂问题可文字补充。
- **提问预算**：单次任务 ≤3 个问题；超预算自动转自主并记录（TRACE 注明"预算耗尽转自主"）。
- **例外上报（Manage-by-Exception，定时任务补位）**：自动化运行结果偏离预期 >30%（引用率/命中率/成本）时，才触发上报通知；正常结果只留 TRACE 不打扰。
- **与层3 人闸门的关系**：交互模式管"执行过程"（目标/方案/发布），层3 人闸门管"能力升级"（SKILL/prompt/配置变更）——两层独立，互不替代。
