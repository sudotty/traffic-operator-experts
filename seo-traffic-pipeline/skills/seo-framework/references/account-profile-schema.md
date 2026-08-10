# 账号基线 Schema（跨会话记忆交接）

> 用途：每次为具体账号/项目服务后，将基线写入工作区记忆文件（建议路径见下），下次服务同一账号时**先读取**再校准模型权重。本文件是记忆的「契约」，约束写什么、怎么写，防止记忆漂移导致指令稀释。
>
> 字段命名与 decision-models.md（权重）、playbooks.md（平台/阶段/变现维度）严格对齐，避免二次映射。

## 一、存储位置与格式

- 每个账号一个独立 JSON，存放于工作区记忆目录：`{workspace}/.workbuddy/memory/accounts/<account_id>.json`
- `account_id` = 与用户确认的账号简称（英文/拼音，无空格），如 `gzh-0to1-private`、`zhihu-tob-brand`
- 文件首行可加 `// 注释` 由宿主环境忽略；正文须为标准 JSON
- 版本号随 seo-framework 升级递增，旧版本读取时按 `schema_version` 做兼容提示

## 二、Schema 定义

```json
{
  "schema_version": "1.3",
  "account_id": "gzh-0to1-private",
  "updated_at": "2026-08-03",
  "lifecycle_state": {
    "state": "S1 冷启动",
    "state_evidence": "发布 6 篇无稳定数据；无重复模式",
    "state_updated_at": "2026-08-03"
  },
  "baseline": {
    "positioning": {
      "platform": "公众号",
      "stage": "0-1",
      "monetization": "私域引流",
      "persona": "20年SEO操盘手人设",
      "audience": "小微企业主/运营",
      "convert_goal": "企微加微"
    },
    "metrics_history": {
      "open_rate_avg": 0.045,
      "finish_rate_avg": 0.38,
      "share_rate_avg": 0.012,
      "addwechat_rate": 0.021,
      "brandkw_monthly_search": 120,
      "sample_size_notes": "近 30 天 18 篇样本，方差较大"
    },
    "validated_topics": [
      {
        "topic": "长尾痛点型：中小企业 SEO 误区",
        "topic_score": 5.4,
        "why_works": "长尾竞争度 2 分，私域钩子强相关",
        "evidence": "连续 3 篇打开率 6%+ 超均值"
      }
    ],
    "validated_title_patterns": [
      {
        "pattern": "实测 N 款 X：得分最高的反而最便宜",
        "avg_open_rate": 0.072,
        "note": "数字+反差组合在私域引流场景打开率最优"
      }
    ],
    "verified_weights": {
      "search_volume": 1.0,
      "intent_weight": {"transactional": 1.5, "navigational": 1.2, "informational": 0.5},
      "commercial_value": 1.0,
      "competition": 1.0,
      "production_cost": 1.0,
      "thresholds": {"pillar": 7, "satellite": 4},
      "calibration_note": "泛信息权重从 0.6 下调到 0.5，因该账号 AIO 覆盖命中率偏高"
    },
    "content_matrix": {
      "cadence": "每周 2-3 篇",
      "pillars": 1,
      "satellites_per_pillar": 5,
      "cta_path": "文末资料包→企微"
    },
    "dashboard": {
      "north_star": "加微率",
      "guardrails": ["打开率不低于均值 80%", "标题合规零命中"]
    }
  },
  "open_questions": [
    "私域卖什么产品尚未确认，影响商业价值得分校准"
  ]
}
```

## 三、字段与上游模型映射

| Schema 字段 | 上游来源 | 用途 |
|---|---|---|
| `positioning.{platform,stage,monetization}` | playbooks.md 三维路由 | 决定打法、CTA、验收指标，缺位则先诊断提问 |
| `metrics_history.*` | 第 8 环「数据回流」回收数据 | 校准决策模型阈值与权重 |
| `validated_topics[].topic_score` | decision-models.md 选题评分卡 | 复用已验证选题，避免重复试错 |
| `validated_title_patterns[]` | title-hook-library.md + 标题打分卡 | 沉淀高打开率标题公式 |
| `verified_weights.intent_weight` | decision-models.md 意图权重表 | 按账号实际 AIO 命中率校准泛信息权重 |
| `content_matrix` | 工作流程第 3 环「内容簇搭建」 | 固化栏目化产出节奏 |
| `dashboard` | 输出规范「指标看板」四件套之一 | 北极星指标与护栏线 |

## 四、读写纪律（铁律）

1. **先读后写**：服务已有 `account_id` 时，第一步读取该 JSON；不存在才新建。
2. **仅写已验证**：`validated_*` 只放有数据支撑的结论，推测量写入 `open_questions`，不混入基线。
3. **权重漂移警示**：`verified_weights` 与 decision-models.md 默认值差异 >20% 时，输出必须显式说明「基于你账号的 XX 数据，已将泛信息权重从 0.6 调至 0.5」。
4. **证伪即更新**：历史结论被新数据推翻，更新基线并在对话中告知用户「上次说 X，这次数据 Y 证伪了，已修正」。
5. **不污染通用指令**：账号个性化数据只存本文件，绝不回写进 SKILL.md / Agent MD，确保通用专家能力不被稀释。
6. **隐私**：记忆文件存于用户工作区本地，不外传；不写账号主体未授权的敏感商业数据。

## 五、读取后的输出约定

读取记忆后，在【诊断与关键假设】段落显式标注：

> 「已读取你账号 gzh-0to1-private 的基线：当前阶段 0-1、私域引流、泛信息意图权重已校准为 0.5（原 0.6，因 AIO 命中率偏高）。本次评估沿用该权重。」

让校准「可见、可追溯」，符合认知协议 2「不确定性校准」与输出规范「推理可见」。
