# 流量操盘手（SEO与流量增长专家）

20 年 SEO 与流量广告实战、5 年 AI 从业经验的流量操盘手。擅长网感化流量文、SEO/GEO 双轨优化、中长周期关键词布局，以及定位明确的账号运营设计，并将「事实数据 + 流量钩子 + 突兀与冲突」融入标题与正文。

## 类型

Agent 型（单个 AI 专家）

## 功能

- 高转化流量文章编写（公众号 / 网站 / 自媒体），数据驱动 + 网感化表达
- SEO 与 GEO（生成式引擎优化）双轨优化，覆盖传统搜索与 AI 答案引擎
- 中长周期关键词矩阵与内容簇（Content Cluster / Pillar Page）布局
- 账号定位诊断与产线化内容运营 SOP 设计
- 流量获取 → 分发 → 引导（私域 / 转化）闭环设计
- 认知协议：诊断前置、量化决策模型（选题/标题评分卡）、红队自检、不确定性校准、三档预期与二阶后果
- 响应分级：微任务走轻轨（合规+打分），战略任务走全轨（四协议），治流程过载
- 2026 靶心校准：选题评分卡含「被引用潜力」因子；北极星 = AI 引用率/品牌词增量 > 转化 > 阅读量
- 活数据协议：取数顺序 用户提供 > 实时检索 > 库内基准 > 待核实，禁止凭印象报数
- 网感雷达：写稿前扫描当前爆款提取活模式，静态库保结构、活扫描保新鲜（国内外双渠道：Reddit/HN/X 等外网社区 + 微博/知乎/百度热搜等国内热榜）
- AI 热点突变预警（L0 观察层）：24h 双渠道条件触发式监测（国外 Reddit/HN/X/Product Hunt/数据研究站 + 国内微博/知乎/百度/抖音/行业媒体），异常才告警，宁可漏报不可滥报
- 每周归因节奏：对账 → 三层归因 → 校准写回基线（配套每周一定时提醒）
- 规则优先级：`合规 > 真实 > 用户目标 > 网感风格`
- 业务路由矩阵：平台（公众号/小红书/知乎/官网/头条）× 阶段（0-1/1-10/10-100）× 变现（私域/流量主/带货/ToB）
- 广告法合规护栏：违禁词自动扫描 + 行为化改写 + 改动清单
- 标题与钩子库：公式变体、数据钩子类型、网感化规则、平台字数速查
- 跨会话账号记忆：JSON Schema 基线（定位/历史指标/已验证选题与标题/校准权重），越用越准且指令不稀释
- 内置 `seo-framework` 参考库：行业数据基准（含来源口径）+ 决策模型 + 范例 + 回归测试集，引用可溯源

## 目录结构

```
seo-traffic-growth/
├── .codebuddy-plugin/plugin.json   # 专家元信息（v1.5.0）
├── agents/seo-traffic-growth.md    # 专家角色与认知协议
├── skills/seo-framework/
│   ├── SKILL.md
│   └── references/
│       ├── benchmarks.md           # 行业数据基准 + 2026.8 最新锚点 + 学术锚点
│       ├── decision-models.md      # 选题/标题评分卡（含引用潜力因子）、三档预期、红队清单
│       ├── playbooks.md            # 业务路由矩阵 + 北极星优先级
│       ├── compliance.md           # 广告法合规护栏
│       ├── title-hook-library.md   # 标题公式与钩子库
│       ├── examples.md             # 完整输出范例
│       ├── evals.md                # 14-prompt 回归测试集 + 实测记录
│       ├── account-profile-schema.md # 账号基线 JSON Schema
│       ├── live-data-protocol.md   # 活数据获取协议
│       ├── trend-radar.md          # 网感雷达（写稿前扫描活模式）
│       ├── attribution-rhythm.md   # 每周归因节奏
│       └── style-anchors.md        # 用户风格锚点库（待投喂代表作）
├── avatars/expert.png
└── README.md
```

## 使用示例

- 帮我围绕【关键词】写一篇公众号流量文，要有数据钩子和冲突感，并把 SEO 关键词埋进去。
- 给我一套面向【行业/账号】的中长周期 SEO 关键词布局方案。
- 诊断我的账号定位，并设计一套产线化的内容运营 SOP。

## 头像

头像已自动生成在 `avatars/` 目录下。如需替换为自定义头像，要求：
- 格式：PNG（推荐）或 JPG
- 尺寸：512×512 px
- 大小：单张不超过 500KB

## 安装

将专家包目录放到专家目录下：

```
/Users/sudotty/.workbuddy/plugins/marketplaces/my-experts/plugins/seo-traffic-growth/
```

然后运行注册命令使其可见：

```bash
python3 scripts/register_expert.py <expert-dir>
```

## 打包分享

```bash
zip -r seo-traffic-growth.zip seo-traffic-growth/
```
