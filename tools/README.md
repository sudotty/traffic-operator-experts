# tools/ — 生产级运维工具层（TypeScript，v5.0）

专家包的全部运维/评估能力，Node 22 + 原生 API，零运行时依赖。

## 快速开始

```bash
npm install            # 首次（typescript + @types/node）
npm run build          # tsc 编译 → dist/
```

## 命令一览

| 命令 | 等价 | 用途 | 退出码 |
|---|---|---|---|
| `npm run verify` | `node dist/verify.js` | 审计护栏（5 项） | 0 通过 / 1 失败 |
| `npm run zip` | `node dist/verify.js --build` | 审计 + 重建两个 zip + 内容禁词 | 0/1 |
| `npm run release` | `node dist/verify.js --release` | 发布门禁（含 evals 记录检查） | 0/1 |
| `npm run judge` | `node dist/judge.js` | LLM-as-judge 自动评估（可见集） | 0 通过 / 1 未过 / 4 配额 |
| `npm run archive -- <repo> <page> <section> [msg]` | `node dist/archive.js …` | wiki 归档（gh API，409 重试） | 0/2-5 |

## verify.js — 审计护栏（5 项，CI 用）

```bash
node dist/verify.js [--build] [--release]
```

1. **禁词检查**：全库（源 + 已安装 ×2）无古典军事词汇残留（复合词+派生单字，行级白名单过滤误报）
2. **副本同步**：growth == pipeline == 已安装 ×2 的 `skills/seo-framework` 逐字节一致
3. **版本单轨**：references 版本行必须 v5.0（修订史在 git）
4. **契约测试**：SKILL/EXECUTION-CORE 索引 ↔ 磁盘文件双向一致（断链 + 孤儿）
5. **字典生命周期**：非索引引用 <2 次 → LOW-USE 提示（不阻断，季度走淘汰流程）

`--release`：evals 实测记录必须覆盖当前体系版本（防"无记录发布"）。
`--build`：ditto 重建 zip + unzip 内容禁词检查。

## judge.js — LLM-as-judge 自动评估（Selection 机制）

```bash
node dist/judge.js [--set visible|heldout|adversarial] [--dry-run] [--json] [--budget N] [--judge pro|flash]
node dist/judge.js --gen-adversarial [--dry-run]
```

- **双模型互评**：flash 产出回答 → pro 独立评分（judge ≠ 产出，防自我表扬）；`--judge flash` 切换做 judge 校准
- **16 分 rubric**：诊断/路由/数据/合规(critical)/红队/三档/结构/分流/活数据/引用潜力；通过线 ≥13 且 critical 非 0
- **三套题集**：visible（14 题）/ heldout（H1-H5，防污染）/ adversarial（A1-A2+轮换）
- **--dry-run**：只出计划与成本估算，不调 API（CI 预检用）
- **--budget**：成本上限（USD）超限停止；报告 token 消耗（价格按官方价表换算）
- **--gen-adversarial**：从失败 TRACE 自动出题（自博弈出题步骤，人确认后入 evals.md）
- **报告**：`~/WorkBuddy/<ws>/tmp/eval-report-<set>-<ts>.json`（结构化，供记录表回填）

**配额处理**：API 402 → 退出码 4 + 明确提示，评分可稍后重跑（不掩盖、不误报通过）。

## archive.js — wiki 归档

```bash
node dist/archive.js sudotty/traffic-operator-experts wiki/每日AI网感雷达.md /tmp/section.md "wiki(每日雷达): 2026-08-10"
```

gh API GET→base64→追加→PUT；409/422 并发冲突自动重试 ×3；404 自动创建页面。自动化稳定路径：`node /Users/sudotty/.workbuddy/scripts/archive.mjs`（编译产物副本）。

## evolve.js — 进化提议生成器

```bash
node dist/evolve.js [--ws <path>] [--json]
```

扫描自动化记忆 + 工作区日志 → 提取「进化提议/建议」→ 去重排序（含证据者优先）→ 输出清单。**人做闸门**：只提议，不自动应用。

## CI / 商业级使用建议

```bash
# 发布流水线（改动后必跑）
npm run verify -- --release   # 结构 + 记录门禁
npm run judge -- --set visible --budget 2.0   # 能力回归（自动评分）
npm run judge -- --set heldout                # 防污染验证
npm run zip                                   # 产物重建
npm run archive -- ...                        # 归档 changelog
```

**成本纪律**：judge 每次全量 ≈ 28 次 API 调用（14 题 × 产出+评审）；`--dry-run` 先行估算，`--budget` 兜底。

**退出码约定**：0 成功 / 1 检查未过 / 2 用法错 / 3 配置缺失 / 4 API 配额或网络 / 5 运行时错误——所有工具统一，CI 可直接消费。
