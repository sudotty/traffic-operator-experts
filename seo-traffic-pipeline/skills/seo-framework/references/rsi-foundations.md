# RSI 第一性原理底座（Evidence-Driven Capability Evolution）

> 定位：本专家包「自进化」的**理论母体层**——回答三个终极问题：进化是什么、怎么选择、如何持久化。rsi-protocol.md（递归纵深+工程护栏）与本文件互为表里：本文件讲**为什么**，协议讲**怎么做**。
> 核心结论（2026-08 批判性重排）：**Skill 不是唯一原子，真正的 AI 进化原子是「可验证、可继承的能力变化」（Verified Mutation）；RSI 的发动机是 Evidence → Selection → Retention，其中 Selection 比 Variation 更稀缺。**
> 版本：v5.2（2026-08-10，注入 2026 前沿研究体系）

---

## 一、六种原子（按目的分别回答，比"Skill 最大"准确）

| 层级 | 真正原子 | 回答的问题 | 本包对应 |
|---|---|---|---|
| 认知原子 | Evidence / Proposition | 什么是真的 | benchmarks / research-library（数据+来源+口径） |
| 状态原子 | State Delta | 世界发生了什么变化 | account-profile-schema 基线 / lifecycle_state |
| 动作原子 | Tool Invocation | 做一个具体动作 | WebSearch/WebFetch/gh/verify 等工具调用 |
| 行为原子 | Skill | 这种事情应该怎么做 | references 字典（按需加载的程序性知识） |
| 学习原子 | Evaluated Trajectory | 什么行为导致了什么结果 | TRACE / 自动化记忆（E-Cell） |
| 进化原子 | Verified Mutation | 哪个改变经验证值得继承 | git 版本线 / changelog（M-Cell） |

**最小单元速答**：动作 = Tool Call ｜ 程序性知识 = Skill ｜ 学习样本 = Evaluated Trajectory ｜ 进化单位 = **Verified Mutation**（有 Parent、有 Diff、有理由、有 Eval、有 Outcome、可 Rollback 的能力修改）。

---

## 二、RSI 核心公式（不可再缩减的三件事）

```
RSI = Variation × Selection × Retention
      产生改进候选   用真实证据选择   把有效改变持久化
```

- 无 Variation → 系统永不改变
- 无 Selection → 只是在随机修改自己（自我表扬式进化）
- 无 Retention → 这次修好，下次重新犯错

展开式（本包执行版本）：

```
RSI = Trace + RootCause + CandidateMutation + HeldOutEval + VersionedPromotion
      留痕     根因定位     最小候选修改      独立证据选择     版本化晋升
```

**第一优先级原理**：

```
EvolutionRate ≤ SelectionQuality        （进化速率受选择质量约束）
AgentTrust    ≤ VerifierStrength        （可信度受验证强度约束）
```

生成候选正在变便宜，**正确选择是新的稀缺资源**——这就是 v5.0 把 Verifier/Eval 权重提到最高层的原因。

---

## 三、三 Cell 架构（能力/经验/进化三分）

```
C-CELL 能力单元（企业能力原子）          E-CELL 经验单元（学习原子）
├─ Contract 输入/输出/成功标准            ├─ Task / Initial State / Context
├─ Skill 如何做                          ├─ Capability Used
├─ Knowledge 依赖（Schema/规则/文档）      ├─ Actions / Observations
├─ MCP/Tools 手脚                        ├─ Errors / Human Corrections
├─ Verifier 做对了吗（测试/不变量）        ├─ Verifier Results
└─ Policy 什么需要审批                    ├─ Cost / Latency / Final Outcome
                                        └─ E = (s₀, C, a₁:T, o₁:T, V, y, cost)

M-CELL 进化单元（RSI 原子）
├─ Parent Version → Target Component → Root Cause
├─ Proposed Diff → Expected Effect
├─ Eval Dataset → Held-out Result → Regression Result
├─ Cost Delta → Risk Delta → Rollback Pointer
```

**本包映射**：
- CapabilityHub = `references/`（25 字典）+ `tools/`（verify/archive/evolve）
- ExperienceHub = TRACE + 自动化记忆 + 账号基线（E-Cell 采集）
- Evolution Engine = `evolve.ts`（提议生成）→ evals/verify（选择）→ git/SKILL 版本线（保留）

完整闭环：

```
Capability → Work → Evidence → Experience → Mutation → Verified Capability'
能力         执行    证据      经验        进化候选    独立验证后晋升
```

---

## 四、四面体：能力不是某个组件，是四个正交维度的函数

```
                 SKILL
               「如何做」
                /      \
               /        \
    KNOWLEDGE───--------───TOOLS
    「知道什么」           「能做什么」
               \        /
                \      /
              VERIFIER
              「做对了吗」
```

```
Capability = f(Knowledge, Skill, Tools, Verification)
```

配套原则：
- **Stable Procedure + Dynamic Knowledge**：Skill 尽量稳定（如何查/如何判/如何操作），Knowledge 动态（当前实际是什么）——不要把动态事实写死进 Skill。
- **Skill 是知识与行动之间最重要的程序性桥梁**，但不是宇宙唯一原子。

---

## 五、七方法论（v5.0 执行纪律）

| # | 方法论 | 一句话 | 本包落地 |
|---|---|---|---|
| 1 | **Minimal Sufficient Mutation** | 失败后先找 Root Cause，再找最低可修改层，只改足够解决问题的那一层 | REPAIR 升级：按层优先序（见下） |
| 2 | **Evidence Before Evolution** | NoEvidence ⇒ NoMutation；"我觉得不好"没有意义，必须变成失败聚类+频率+根因 | 铁律 2（引用必带来源）+ 环3 门禁 |
| 3 | **Verifier Before Optimizer** | 先有 SPEC→VERIFIER→TRACE→BASELINE，再上 OPTIMIZER（Measure→ThenOptimize） | 四护栏（v4.0 引入，v5.2 沿用）+ verify --release 门禁 |
| 4 | **Skill First, Harness Later** | 企业初期 RSI 从 Skill 改起（面小/易解释/易 Eval/易回滚），Harness 是异构优化问题 | 本包即 Skill-first 实践 |
| 5 | **Fast Execution, Slow Evolution** | 执行级修复秒-分钟级，进化周-月级；f_execution ≫ f_evolution，防 policy oscillation | 三环节奏（单任务/周/月） |
| 6 | **Skill 需要选择压力** | 长期无人调用/成功率低/被取代 → Deprecate/Delete；能力库必须会忘 | **新增**：字典生命周期（见六） |
| 7 | **Capability Composition，不是 Agent Inflation** | Thin Agent（Plan+Discover+Compose+Escalate）+ 厚 Capability Cells；别无限造 Agent | 产线 5 角色 = 能力组合雏形，方向保持 |

**层优先序（Minimal Sufficient Mutation 用）**：

```
Knowledge entry → Memory rule → Skill → Tool description/interface → Context policy → Verifier → Harness → Model
```

原则：Δ* = Smallest Change s.t. Problem Solved——减少回归、容易归因、更便宜、容易回滚。

---

## 六、字典文件生命周期（v5.2：选择压力落地）

每个 references 字典文件遵循生命周期：

```
ACTIVE（被引用/被调用）→ LOW-USE（连续 N 月零命中/低使用率）→ DEPRECATED（标注待合并/待删）→ MERGED/DELETED
```

- **触发检查**：verify.ts 增加"字典使用率"提示（引用计数），季度盘点执行淘汰。
- **防囤积**：新增文件必须回答"它解决哪个原子问题、挂在概念树哪层、与现有哪文件重叠"（防重复堆叠，铁律 6 精神）。
- **反向**：被淘汰文件的内容沉淀进幸存文件（E-Cell 经验 → 保留层），不丢历史。

---

## 七、2026 前沿研究锚点（来源全部标【事实】）

| 研究方向 | 关键结论 | 来源 |
|---|---|---|
| Skill 可训练化 | Microsoft SkillOpt 把 Skill 视为 frozen agent 外部的可训练参数 | microsoft.com research blog（SkillOpt） |
| Skill 生命周期 | Dynamic Agent Skills survey：可验证、可演化、具生命周期的 artifact store（repair/pruning/provenance/rollback） | arXiv:2607.10113 |
| Skill 综述 | Agent Skills：协调 tools/memory/runtime context 的 reusable procedural artifacts（representation/acquisition/retrieval/evolution） | arXiv:2605.07358 |
| 进化+验证共演化 | EvoSkills：Skill Generator + co-evolving Surrogate Verifier | arXiv:2604.01687 |
| Harness 工程 | OpenAI：agent-first engineering 环境；NVIDIA：同一模型 harness design 可致双位数 benchmark 波动（model-specific harness profiles） | openai.com/harness-engineering；developer.nvidia.com |
| 经验数据基建 | Trellis/Data Foundation：evaluated trajectories 是 self-improving agent 的独立基础设施 | arXiv:2606.29823 |
| 记忆结构化 | Microsoft PlugMem：raw interaction → 可复用结构化知识（非全塞 context） | microsoft.com research blog（PlugMem） |
| 自优化记忆 | SelfMem：从"存下来再召回"转向"哪些经验值得保留、如何结构化" | arXiv:2607.03726 |
| 统一优化层 | Microsoft Agent Lightning：从 experience 学习、优化所有 agent 的通用层 | microsoft.com research（Agent Lightning） |
| 能力发现 | GitHub Agent Finder：动态发现 MCP servers/Skills/Agents/Tools，替代 hand-wire | github.blog（Agent Finder） |
| 协议分层 | Google：MCP（工具）/A2A（Agent 间）/A2UI（Agent-driven UI）职责分离 | developers.googleblog.com |
| 长程 Agent 失败 | OSWorld 2.0：108 个长程任务——约束遗失/漏信息/猜测不询问/跳过验证（非"不会点鼠标"） | arXiv:2606.29537 |
| 进化评估警示 | Harness Evolution 重评估：优化与报告用同一 benchmark 会把过拟合误认为学习 → held-out 至关重要 | arXiv:2604.25850 |

**MCP 定位修正**：不是"不重要的基础设施"，而是 **Capability Fabric（能力连接织网）**——Agent 从模型世界进入企业真实世界的基础连接层（100 Agents × 1000 Tools 时代的统一发现/授权/描述/调用/审计）。
**Knowledge 定位修正**：不是 Skill 的附属品，而是 Skill 正确执行的 epistemic substrate（认知基底）。
**Memory 定位**：Historical Evidence 原料，按 Root Cause 决定更新哪一层（Experience → Memory/Knowledge/Skill/Harness），不是能力本身。

---

## 八、最终一句话

> **不要问"我们有多少 Skill、多少 MCP、多少知识库"。问四个问题：①我们有多少种经过验证的能力？②这些能力用了多少真实生产经验训练？③失败以后系统会修改哪一个最小组件？④修改以后有没有独立证据证明下一次真的更好？**

> 这套系统的最终形态 = **Evidence-Driven Capability Evolution Architecture**：Knowledge 给世界模型，Experience 给历史，Skill 给方法，Tool 给手脚，Context 决定看什么，Harness 决定怎么组织，Verifier 决定现实认不认，RSI 决定哪些经验改变下一代。
