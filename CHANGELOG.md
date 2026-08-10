# Changelog

> 规范：Keep a Changelog 六类（Added / Changed / Deprecated / Removed / Fixed / Security）。
> 体系版本线（vX.Y）为发布线；文件级修订史由 git 承担。MAJOR 变更（破坏性）必须给出 Migration 说明。

## [v5.1] - 2026-08-10 业界对齐升级（G1-G4 落地）

### Added
- 触发召回测试（G1）：evals.md 新增 T1-T8 四类用例（显式/隐式/上下文扰动/负控制）；judge.ts 新增 `--set trigger` 路由判断器模式，通过线 召回率≥90% 且准确率≥85%。
- 成本分层（G4）：judge.ts 新增 `--tier spot|targeted|full`（spot=前 4 题 / targeted=定向补测 / full=全量）。
- 四维指标（G3）：judge.ts 新增 `--repeat N` 稳定度（均值/方差）+ 报告 risk 维度（critical/空回复/解析失败）。
- 协议层落地：rsi-protocol / self-evolving-pipeline 增加 G5-G8（description A/B、compaction SOP、生产反馈回流、运行时监控）机制说明。

### Changed
- 评估协议 v5.0 → v5.1：触发测试、成本分层、四维指标写入 evals.md 自动化评估协议。
- judge.ts 头部 usage 更新；汇总报告版本号 v5.1。

### Fixed
- （无独立修复项；本版本为能力新增）

### Deprecated
- （无）

### Removed
- （无）

### Security
- （无变更）

## [v5.0] - 2026-08-10 证据驱动能力进化

### Added
- rsi-foundations.md：六原子 ontology / VSV 公式 / C-E-M 三 Cell / 七方法论 / 17 研究锚点。
- tools/evolve.ts 进化提议生成器；verify.ts --release 门禁。
- evals.md 自动评估协议（judge/held-out/自博弈/记录纪律）。

### Changed
- rsi-protocol / self-evolving-pipeline / SKILL / EXECUTION-CORE / agent 注册 v5.0。
- 4 个自动化追加自适应规则段。

### Fixed
- 表达统一收口：全库清零古典军事词汇（含派生单字），BETTER SYSTEM 映射更正 E1→E3。
- release 门禁取表尾最新记录（原误报 v1.2.0）。

## [v4.0] - 2026-08-10 自适应自进化

### Added
- rsi-protocol 五环自适应 + 四工程护栏（judge/held-out/自博弈/防塌缩）。
- self-evolving-pipeline harness 级定位声明；verify.ts --release 门禁。

## [v3.2] - 2026-08-10 表达统一收口 / 工具层 TypeScript 化

### Added
- tools/ TS 工程（verify.ts / archive.ts / zip）；版本单轨化。

### Changed
- 8 文件版本号统一 v3.2；4 自动化归档改调 archive.mjs。

## [v1.5.0] - 2026-08-09

### Added
- L0 预警 OODA 双渠道 24h；trend-radar / live-data-protocol；benchmarks 2026.8 复核增补。
