# tcm-ask · 中医辨证助手

用《伤寒论》条文做「三态推理」的中医问诊程序：病人用口语描述症状 → 引擎边问边辨证 → 给出方剂/证候结论 + 禁忌，并可由大模型生成通俗解释。

一个**零依赖的可视化插件编辑器**（`dev/`）：像 Blender / n8n 那样在画布上连线编辑「症状 → 证候/方剂」的依赖关系，不必手写 `needs: [[...]]`。

## 目录结构

```
tcm-ask/
├─ server.js            # Web 服务（127.0.0.1:3088）：问诊页面 + 辨证 API + 插件热重载
├─ run-mvp.js           # 命令行版问诊
├─ loadEnv.js           # 极简 .env 加载器
├─ core/
│  ├─ loader.js         # 插件加载器（扫描 plugins/ 四个目录，支持热重载）
│  └─ session.js        # 一次问诊会话：入口整理 → 反问收敛 → 结论 + 解释
├─ engine/
│  ├─ engine.js         # 三态推理引擎（yes / no / unknown + 依赖传播）
│  └─ asker.js          # 问诊器：按「区分度」挑最有价值的症状反问
├─ llm/
│  ├─ llmClient.js      # DeepSeek（OpenAI 兼容）HTTP 客户端
│  ├─ wrap.js           # 三次调用：症状整理 / 结果解释 / 辨证后问答
│  └─ structured.js     # 解析大模型输出的【肯定】/【否定】/【模糊】三态清单
├─ plugins/             # ★ 条文数据：262 个插件
│  ├─ symptoms/         #   症状 123（口语触发词 + 否定词 + 反问话术）
│  ├─ pulses/           #   脉象 7
│  ├─ syndromes/        #   证候 19
│  └─ formulas/         #   方剂 113（依赖条件 + 禁忌）
├─ web/index.html       # 问诊前端（单页，原生 JS）
├─ platform/            # ★ 云平台（本地多用户 demo）：患者端 + 医生录条文 + 审核 + 社区
├─ dev/                 # ★ 开发端：可视化插件画布（不进入发布包）
└─ data/                # 伤寒论原文资料（代码不读取，仅备查）
```

## 插件数据模型

每个插件就是一个文件 `plugins/<目录>/<name>.js`，字段只有 8 个：

| 字段 | 含义 | 用于 |
|---|---|---|
| `name` | 英文唯一标识（= 文件名） | 全部 |
| `title` | 中文名 | 全部 |
| `kind` | `symptom` / `pulse` / `summary` / `formula` | 全部 |
| `trigger(text)` | 口语触发词：命中即判为「有」 | 症状 / 脉象 |
| `negate(text)` | 否定词：命中即判为「没有」 | 症状 / 脉象 |
| `ask` | 反问病人的原话 | 症状 / 脉象 |
| `needs` | 依赖条件，**路径数组** | 证候 / 方剂 |
| `contraindications` | 禁忌 / 注意事项 | 证候 / 方剂 |

`needs` 语法（路径内 AND，路径间 OR）：

```js
needs: [
  ['no_sweat.yes', 'wind_aversion.yes', 'severe_thirst.no'],   // 路径①
  ['no_sweat.yes', 'cold_aversion.yes', 'severe_thirst.no']    // 路径②
]
```

### 引擎语义（照实说明，不做美化）

1. 一条路径里**全部条件满足** → 该节点成立（`yes`）；
2. 多条路径里**任意一条**全部满足 → 成立；
3. **但**：只要**任意一条**路径被某个条件**明确否定**（要求「有」而实际「没有」，或反之），整个节点直接判 `no` —— 即使另一条路径只是「还不知道」。这是 `engine/engine.js` 的真实行为（`evalOne`），开发端会把它标成 **⚠ 路径冲突** 呈现出来，但不替你改数据；
4. **空路径是陷阱**：`[[]]` 会被当成「永远成立」，所有写入路径都会拒绝空路径。

## 快速开始

### 1) 配置密钥（可选）

不配也能用「规则辨证」，只是没有 AI 解释。要启用 AI：

```powershell
Copy-Item env.example .env     # 然后把 LLM_KEY= 后面填上你的 DeepSeek key
```

`.env`（含真实 key）**不会**进入版本库，见 `.gitignore`。

### 2) 跑问诊程序

```powershell
node server.js        # 或双击 start.bat
```

打开 http://127.0.0.1:3088 —— 白色主题的对话式问诊界面：

- **对话流**：助手与病人的消息左右分栏，提问卡片直接出现在对话里（答过的卡片自动置灰）
- **选项竖向排列**：`是 / 否 / 不清楚` 三个整行按钮，每个带一行小字说明
- **结论卡片**：辨证倾向的方剂、完整解释、禁忌与注意事项、免责声明，后面可直接「继续提问」
- **状态可折叠**：已确认 / 已排除的症状收在一个可展开的区块里，不刷屏
- **可读性**：正文 16px/26px，问题 17px/27px，最小字号 12px，关键配色均满足 WCAG AA 对比度
- **回答排版**：模型被要求输出**纯文本**（禁止 `#`、`**`、`- ` 这类 Markdown 记号），
  前端再做一层兜底清洗 + 轻排版 —— 小标题（左侧竖条）、编号项、`·` 列表、段落各就各位
- 输入框可一次说多个症状；`Enter` 发送、`Shift+Enter` 换行；空状态给了 4 个可点示例

### 3) 用画布改条文（开发端）

```powershell
node dev/server.js    # 或双击 dev\启动开发端.bat
```

打开 http://127.0.0.1:3090 ，详见 [`dev/README.md`](dev/README.md)。

- 画布：分层 DAG（症状 → 证候 → 方剂），拖拽/框选/缩放/小地图，从节点右侧圆点拖到目标即新增依赖条件（`Alt` 落下 = 「非」）
- 检视器：改标题、触发词、否定词、反问话术、依赖条件、禁忌
- 三大面板：**实时模拟**（调用真实引擎推演）、**条文反向**（依赖树 + 医生该怎么问）、**问诊回放**（真实 Asker 逐步收敛）
- 保存：两阶段（先看逐行 diff 再写盘），自动备份、临时目录编译验证、**保留插件里的手写条文注释**

### 4) 打包成免安装版给别人

```powershell
.\打包.ps1
```

输出 `dist\`（含便携 `node.exe`，对方双击 `启动中医辨证.bat` 即可，无需装 Node）。`dist/` 不进版本库。

### 5) 云平台（患者端 + 医生录条文 + 审核 + 社区）

```powershell
node platform\seed.js      # 首次：建演示账号 / 帖子 / 待审草稿
node platform\server.js    # 或双击 platform\启动平台.bat
```

打开 http://127.0.0.1:3095 —— 浅色 Instagram 风的平台首页，核心功能前置：

- **患者端**：`/consult` 把上面那个问诊模块整块嵌进患者界面（`web/index.html` 一行未改），
  结论自动进「我的辨证记录」
- **医生端**：`/doctor` → `/canvas` 就是 `dev` 那套可视化画布；画布上点「保存」＝**提交审核**，
  不直接改盘
- **管理端**：`/review` 逐行 diff 审草稿，通过后自动写盘 + 引擎热重载，并登记**字段级归属**
  （哪个节点的 `trigger`/`ask`/`needs` 是谁提供的，画布右下角实时可见）
- **社区**：`/community` 帖子 / 评论 / 点赞，医生带「✓ 已认证医生」徽标
- **每人一套 API Key**：`/settings` 里每个账号填自己的 DeepSeek key——AES-256-GCM 加密存库、
  接口只回掩码、账号之间互不可见；没配的账号走纯规则辨证，不会借用别人的 key

演示账号：`admin/admin123`、`doctor/doctor123`、`doctor2/doctor123`（待开通）、`patient/patient123`。
详见 [`platform/README.md`](platform/README.md)。数据在 `platform/data/`（SQLite，已 gitignore）。

## 验证脚本

```powershell
node dev\selftest.js        # 插件解析/改写地基：262 个文件「解析→原值回灌」字节级一致（557 项断言）
node dev\checkui.js         # 开发端前端静态体检：import/export、DOM id、资源引用
node dev\uisimtest.js       # 开发端集成测试：DOM 仿真真跑渲染路径 + 载荷过服务端校验
node dev\webui-contract.js  # 问诊界面接口契约：把页面发的每个请求走一遍，断言字段齐全（需先启动 server.js）
node dev\webui-render-test.js # 问诊界面渲染：直接执行页面脚本，验证对话流/竖排选项/结论卡片
node platform\checkui.js    # 云平台前端静态体检：import/资源/DOM id/接口覆盖/画布注入
node platform\selftest.js   # 云平台端到端：账号→问诊→医生提交→审核落盘→归属→社区（需先起 platform\server.js）
```

另有引擎回归测试：`test-mvp.js`、`test-yangming.js`、`test-jueyin.js`、`test-taiyin-shaoyin.js`、`test-undo.js`、`test-asker.js`、`test-hotreload.js`、`test-negate.js`（阴性表述不被误判，30 项）。

### 整理条文用的小工具

```powershell
node run-case.js "患者王某，男，35岁。恶寒发热，全身疼痛，无汗，咳嗽，无腹泻，脉浮紧。"
node run-case.js "无汗，怕冷，口不渴" -f mahuang_tang   # 只看某个方剂的三元组逐条判定
```

把一段医案直接喂进引擎，打印：命中 yes / 明确 no / 候选方剂数 / 下一个反问 / 目标方剂每条三元组的满足情况。
配合 [`skills/tcm-case-triples/SKILL.md`](skills/tcm-case-triples/SKILL.md) 使用——那份 skill 规定了
「医案 → 结构化 → 三元组 → 真实节点名 → 提交载荷」的完整流程与自检清单。

## 安全提示

- `.env` 里有你的 API key，**已被 `.gitignore` 排除**；提交前请自行确认 `git status` 里没有它。
- 主服务与开发端都**只监听 127.0.0.1**，局域网/公网访问不到。
- 本项目仅用于学习《伤寒论》条文推演与软件工程实践，**任何辨证结果都不能替代执业医师**。

## 许可

仅供学习研究使用；条文与方剂知识来自《伤寒论》公有领域内容。
