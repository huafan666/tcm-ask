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

### 4. 社区

帖子 + 评论 + 点赞，医生带 `✓ 已认证医生` 徽标（管理员在审核台打认证）。
读开放、写要登录。

## 目录

```
platform/
├─ server.js          # 一个进程：静态页面 + 问诊 API + 画布 API + 审核 + 社区
├─ db.js              # node:sqlite 建库建表（users/sessions/consults/drafts/attributions/posts/comments/likes）
├─ auth.js            # scrypt 口令 + HttpOnly Cookie 会话 + 角色/状态
├─ consult.js         # 问诊会话（复用 core/session.js）+ 结论存档
├─ review.js          # 草稿提交 / diff / 通过落盘 / 字段级归属
├─ community.js       # 帖子 / 评论 / 点赞
├─ seed.js            # 演示数据
├─ selftest.js        # 端到端自测（57 项断言，需先起服务）
├─ checkui.js         # 前端静态体检（import / 资源 / DOM id / 接口覆盖 / 画布注入）
└─ public/            # 前端（原生 ES module，无构建）
   ├─ css/app.css     # 浅色 Instagram 风设计系统
   └─ js/             # api / shell / home / auth / consult / community / doctor / review / profile / canvas-bridge
```

## 验证

```powershell
node platform\checkui.js     # 静态体检（0 错误）
node platform\server.js      # 另开一个窗口
node platform\selftest.js    # 端到端：账号 → 问诊 → 提交 → 审核落盘 → 归属 → 社区（57 通过）
```

`selftest.js` 每轮会用一个临时触发词提交、审核、再还原，可重复执行。

## 这是 demo，不是生产环境

- 只监听 `127.0.0.1`，没有 HTTPS、没有 CSRF token、没有限流、没有邮件找回密码；
- 口令用 scrypt 加盐存储，会话是 HttpOnly Cookie，但**没有做更细的权限模型**；
- 问诊模块用 iframe 嵌入（保留原页面一行未改的代价），不是同页组件；
- SQLite 单文件在 `platform/data/`（已 `.gitignore`），删掉就等于清空平台数据。

要真上公网，至少还需要：反代 + HTTPS、CSRF/限流、备份策略、审计日志。
