# 中医辨证助手 · 云平台（本地多用户 demo）

把现有的辨证引擎、开发端画布、社区讨论装进一个「平台」里：患者问诊、医生录条文、
管理员审核、条文来源可追溯、社区讨论。**零依赖**（只用 Node 内置模块 + `node:sqlite`），
一条命令起服务，数据全在本机。

```
node platform/seed.js       # 第一次：建演示账号 / 帖子 / 待审草稿
node platform/server.js     # 起服务 → http://127.0.0.1:3095
```

演示账号：

| 账号 | 密码 | 角色 | 说明 |
|---|---|---|---|
| `admin` | `admin123` | 管理员 | 审核条文、开通医生账号 |
| `doctor` | `doctor123` | 医生（已认证） | 可进画布提交条文 |
| `doctor2` | `doctor123` | 医生（待开通） | 演示「管理员开通」 |
| `patient` | `patient123` | 患者 | 问诊、发帖、看记录 |

## 页面

| 路径 | 谁能看 | 内容 |
|---|---|---|
| `/` | 所有人 | 首页：核心功能前置 + 社区最新 + 我的记录 + 条文贡献榜 |
| `/consult` | 所有人（登录才存档） | 问诊：**原 `web/index.html` 的问诊模块整块嵌入**（iframe，一行未改） |
| `/community` | 所有人（登录才能发帖） | 社区：帖子 / 评论 / 点赞 / 医生认证徽标 |
| `/doctor` | 医生、管理员 | 条文工作台：进画布、看自己的提交与审核结果、我提供过的条文 |
| `/canvas` | 医生、管理员 | **就是 `dev/public` 那套画布**，注入了一层平台壳 |
| `/review` | 管理员 | 审核台：待审草稿逐行 diff、通过/驳回、医生账号开通、贡献榜 |
| `/settings` | 登录用户 | 设置：**自己的一套大模型 API 配置**（DeepSeek key / Base URL / 模型 / 开关 / 测试连接） |
| `/me` | 登录用户 | 我的：资料、辨证记录、帖子、条文贡献 |

## 四条主线怎么串起来的
### 1. 患者端：问诊模块搬进患者界面

`platform/server.js` 原样实现了 `web/index.html` 调用的那几个接口
（`/api/new`、`/api/input`、`/api/chat`、`/api/restart/:sid`），
内部直接 `new Session(registry)`——**诊断逻辑一行没改**。

区别只有两点：

- 会话按浏览器隔离，并在收敛出结论时把结果写进 `consults` 表（患者「我的辨证记录」）；
- 登录后匿名会话的存档会自动认领到当前账号名下。

### 2. 医生录入：接口就是 `dev` 那套画布

`/canvas` 直接把 `dev/public` 静态目录端出来（`index.html` 里注入一个 `canvas-bridge.js`），
医生在画布上改条文，点「保存」时**不会写盘**：

```
画布 → POST /api/save (dryRun:true)   → 逐行 diff 预览（和开发端完全一样）
     → POST /api/save (dryRun:false)  → 医生：生成草稿入库；管理员：直接落盘
```

草稿存的是**和开发端 `/api/save` 同构的 payload**（`created/updated/deleted/renamed/layout`），
所以审核通过时直接调 `dev/lib/graph.js` 的 `applySave()`——备份、落盘、编译复核一样不少。

### 3. 谁提供的哪部分条文：字段级归属

审核通过的那一刻，平台按 payload 把「动了哪个节点的哪个字段」逐条写进 `attributions`：

```
node_name | field(title/trigger/negate/ask/needs/contraindications/node) | author_id | draft_id | created_at
```

三个地方能看到：

- **画布右下角面板**：选中一个节点，显示它每个字段最近一次的提供者（谁 + 认证标 + 日期）；
- **医生工作台 / 我的**：列出「我提供过的条文」及具体字段；
- **首页侧栏 / 审核台**：条文贡献榜（多少条条文、多少字段）。

### 4. 病历链路的两层留痕

**录入侧（每次提交都留档）**：医生在画布上点保存 → 草稿表 `drafts.payload` 原样存下整份载荷，
包含 `created / updated / deleted / renamed`（`needs` 就是节点之间的关系，一条不改）。
审核通过时再按字段拆成 `attributions` 行（谁 · 哪个节点 · 哪个字段 · 哪份草稿 · 何时），
同时把「谁录入的」写进 `plugins/provenance.json` 的 `by` —— 所以开发端也能看到录入人。

**诊断侧（结论后附触发链条）**：`platform/chain.js` 把引擎「为什么得出这个结论」摊开：

```
GET /api/consult/chain?sid=…
{ chain: {
    targets: [{ name, title, kind, pathIndex, pathTotal, path:[{name,title,pol,state,satisfied}] }],
    nodes:   { <节点>: { provenance:{sourceId,label,refs,by}, contributors:[{fieldLabel,displayName}] } } } }
```

方剂排在证候前面、最多 8 条。问诊页（`web/index.html`，一行未改）由 `consult-bridge.js` 注入：
包一层 `fetch` 观察 `/api/input` 的 `result`，一收敛就在右下角弹「触发链条 · 谁录入的」面板——
每条三元组列出具**体条件、是否满足、出自哪本书哪一条、谁录入的**。

### 5. 社区

帖子 + 评论 + 点赞，医生带 `✓ 已认证医生` 徽标（管理员在审核台打认证）。
读开放、写要登录。

### 5. 每个账号自己的大模型 API（默认 DeepSeek）

`/settings` 里每个登录用户填**自己的** key，互不相干：

```
浏览器 → POST /api/llm/config {apiKey, baseUrl, model, enabled}
       → secretstore.encrypt()  AES-256-GCM
       → user_api_keys 表（一个 user_id 一行，存密文）

问诊时 → llmconfig.resolve(userId)
       → {apiKey, baseUrl, model}  → new Session(registry, { llm })
       → 没有就返回 false → Session 明确不用大模型（纯规则辨证）
```

要点：

- **明文永远不出服务器**：所有接口只回掩码 `sk-abc••••wxyz`，管理员也看不到；
- **绝对隔离**：A 账号配了 key，B 账号的问诊不会用到它（`/api/new` 返回的 `hasLLM` 按账号算）；
- **不偷偷借用**：没配 key 的账号（含未登录访客）走纯规则辨证——问题照问、结论照出，只是没有 AI 解释；
- 主密钥在 `platform/data/master.key`（首次自动生成，gitignore），也可以用环境变量
  `PLATFORM_SECRET`（64 位十六进制）指定；换掉主密钥后旧密文解不开，会提示用户重填；
- 想让服务器 `.env` 的 key 给没配的人兜底：启动时加 `PLATFORM_ALLOW_ENV_LLM=1`（默认关闭）。

改动落在 `llm/` 和 `core/session.js` 上是向后兼容的：`Session` 的 `opts.llm` 不传时
（命令行 `run-mvp.js`、独立 `server.js`）仍然读环境变量，行为一点没变。

## 目录

```
platform/
├─ server.js          # 一个进程：静态页面 + 问诊 API + 画布 API + 审核 + 社区 + API 配置
├─ db.js              # node:sqlite 建库建表（users/sessions/user_api_keys/consults/drafts/attributions/posts/comments/likes）
├─ auth.js            # scrypt 口令 + HttpOnly Cookie 会话 + 角色/状态
├─ secretstore.js     # AES-256-GCM：加密用户自己的 API Key（主密钥在本机）
├─ llmconfig.js       # 每个账号一套 LLM 配置：保存 / 掩码 / 解析 / 连通性测试
├─ consult.js         # 问诊会话（复用 core/session.js）+ 结论存档
├─ review.js          # 草稿提交 / diff / 通过落盘 / 字段级归属
├─ community.js       # 帖子 / 评论 / 点赞
├─ seed.js            # 演示数据
├─ selftest.js        # 端到端自测（89 项断言，需先起服务）
├─ checkui.js         # 前端静态体检（import / 资源 / DOM id / 接口覆盖 / 画布注入）
└─ public/            # 前端（原生 ES module，无构建）
   ├─ css/app.css     # 浅色 Instagram 风设计系统
   └─ js/             # api / shell / home / auth / consult / community / doctor / review / settings / profile / canvas-bridge
```

## 验证

```powershell
node platform\checkui.js     # 静态体检（0 错误）
node platform\server.js      # 另开一个窗口
node platform\selftest.js    # 端到端：账号 → 问诊 → 提交 → 审核落盘 → 归属 → 社区 → API 配置隔离（89 通过）
```

`selftest.js` 每轮会用一个临时触发词提交、审核、再还原，可重复执行。
它会往本地库里留下测试账号 / 草稿 / 帖子；想要干净的演示数据，删掉 `platform/data/` 再跑一次 `seed.js` 即可。

> **改 `启动平台.bat` 请存成 GBK + CRLF**（和根目录的 `start.bat` 一致）。
> 存成 UTF-8 的话 `cmd.exe` 会按 GBK 解析：中文全变乱码，连 `cd /d "%~dp0.."` 那行都会一起坏掉，
> 结果就是在 `platform\` 里找 `platform\seed.js`。

### 双击启动时的三种情况

| 情况 | bat 的行为 |
|---|---|
| 端口 3095 空闲 | 正常起服务（首次会自动 `seed.js`），关闭黑窗口即停止 |
| 端口 3095 已被占用 | **不再报“启动失败”**，而是提示「平台已经在运行」并直接打开浏览器，退出码 0 |
| 没装 node | 提示去 nodejs.org 装 Node 24（平台要用内置 `node:sqlite`） |

端口被占用的判断是 `netstat -ano | findstr :3095 | findstr LISTENING`；
想换端口就 `set PLATFORM_PORT=3096` 再双击（bat 会跟着用这个端口做检测和提示）。

如果确实要重启：先关掉原来那个黑窗口（或任务管理器结束那个 `node.exe`），再双击一次。

## 这是 demo，不是生产环境

- 只监听 `127.0.0.1`，没有 HTTPS、没有 CSRF token、没有限流、没有邮件找回密码；
- 口令用 scrypt 加盐存储，会话是 HttpOnly Cookie，但**没有做更细的权限模型**；
- 用户的 API Key 在库里是 AES-256-GCM 密文，但**传输走 HTTP 明文**——本机 demo 无所谓，
  真上线必须上 HTTPS，否则 key 在网线上是裸的；
- 问诊模块用 iframe 嵌入（保留原页面一行未改的代价），不是同页组件；
- SQLite 单文件在 `platform/data/`（已 `.gitignore`），删掉就等于清空平台数据。

要真上公网，至少还需要：反代 + HTTPS、CSRF/限流、备份策略、审计日志。
