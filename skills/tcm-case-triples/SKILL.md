---
name: tcm-case-triples
description: 把中医医案/书籍条文/病历文字（或图片）转成「症状 + 证候 + 方剂」三元组，并直接产出本仓库可用的 needs 路径与提交载荷。Triggers on 医案、病历、条文、三元组、整理条文、录入条文、提取证候、上传图片/文字整理成条文。
whenToUse: 当用户贴出一段医案/病例/古籍条文（或图片），并要求「提取三元组 / 整理成条文 / 录入系统 / 拆症状证候方剂 / 丰富条文库」时使用；当用户要求把同一方剂的多条辨证路径整理成 AND/OR 规则时也用。不要用于纯概念问答或方剂背诵。
---

# 医案 → 症状/证候/方剂 三元组

把一段医案变成**本仓库能直接吃下的结构化条文**。
目标产物永远是一份 `needs` 路径（AND 在路径内、OR 在路径间）+ 可提交的 JSON 载荷。

## 0. 先确认工作目录

这些命令全部在仓库根目录执行（`pwd` 应该能看到 `plugins/`、`engine/`、`platform/`）：

```powershell
node -e "const {loadAll}=require('./core/loader');const {registry,byKind}=loadAll(require('path').join(__dirname,'plugins'));console.log(Object.keys(registry).length, JSON.stringify(Object.fromEntries(Object.entries(byKind).map(([k,v])=>[k,v.length]))))"
```

输出形如 `262 {"symptom":123,"pulse":7,"summary":19,"formula":113}`。

## 1. 四步流水线

### 第一步：结构化医案

把原文拆成固定字段，**原文没有的写「未提及」，不要脑补**：

| 字段 | 说明 |
|---|---|
| 患者 | 姓名/性别/年龄（可匿名） |
| 主诉 | 最难受的那一句 + 病程 |
| 阳性症状 | 有明确说「有」的（怕冷✓、无汗✓） |
| 阴性症状 | **医案里最值钱的部分**：无汗、不渴、无腹泻、未见发热、否认腹痛、体力尚可 |
| 舌脉 | 舌质舌苔、脉象 —— **单独记录，见第 4 节：现在基本不进判定** |
| 辨证结论 | 原文给的证名/方名（没有就写「待定」） |
| 出处 | 书名+条号，或「某医生案」 |

### 第二步：拆三元组（这是核心）

三元组 = **一组条件（AND） → 一个证候 → 一个方剂**。
同一个方剂可以有多条三元组，**满足任意一条即可判定（OR）**。

```
三元组1：无汗 + 恶寒 + 不渴            ——太阳伤寒——麻黄汤
三元组2：无汗 + 恶风 + 喘 + 不渴        ——太阳伤寒——麻黄汤
三元组3：无汗 + 恶寒 + 体力尚可         ——太阳伤寒——麻黄汤
```

拆分时守三条：

1. **一条三元组只回答一件事**：这条路径凭什么能定到这个方？说不出来就拆或删。
2. **阴性条件要显式写进去**，且优先选医案里真的说过的那条（「无腹泻」比「大便正常」更贴原文）。
3. **不要为了凑数加弱条件**。加一个可有可无的条件，会让该方在别的病人身上永远不成立。

### 第三步：映射到真实节点名

**只准用 `plugins/` 里已存在的 `name`（英文），不准自造中文标题当条件。**
先查，别猜：

```powershell
node -e "const {loadAll}=require('./core/loader');const {registry}=loadAll(require('path').join(__dirname,'plugins'));for(const n of Object.keys(registry)){const d=registry[n];const t=(d.title||'')+(d.trigger?d.trigger.toString():'');if(/心悸|汗|恶寒|口渴/.test(t))console.log(n,'|',d.title,'|',d.kind)}"
```

- 症状/脉象 → 条件写 `name.yes` / `name.no`
- 找不到对应节点 → 在输出里标 **NEW**，并给出新建模板（见第 5 节），**不要**用标题硬凑
- 同一个意思有多个节点时，先跑 `node platform/checkui.js` 或查 trigger 关键词是否重叠（重叠的重复节点应当合并，不是各写一条）

### 第四步：产出 `needs` 与载荷

路径数组就是三元组列表：

```js
needs: [
  ['no_sweat.yes', 'cold_aversion.yes', 'severe_thirst.no'],   // 三元组1
  ['no_sweat.yes', 'wind_aversion.yes', 'chuan.yes', 'severe_thirst.no'], // 三元组2
]
```

提交给平台的载荷（`platform` 的 `/api/save` 同构，医生账号提交 = 进审核队列）：

```json
{
  "updated": [
    { "name": "mahuang_tang", "needs": [["no_sweat.yes","cold_aversion.yes","severe_thirst.no"]] }
  ],
  "created": [
    { "name": "new_formula_x", "title": "某方", "kind": "formula",
      "needs": [["a.yes","b.no"]], "contraindications": ["…"] }
  ],
  "dryRun": false
}
```

## 2. 引擎语义（照实写，不是美化版）

来自 `engine/engine.js`，判错了就是条文写错了：

1. 一条路径**全部条件满足** → 该节点 `yes`；
2. **任意一条**路径满足 → `yes`；
3. **但**：只要有**任意一条**路径被某个条件**明确否定**（要求 yes 而实际 no，或反之），整个节点直接 `no` —— 即使别的路径只是「还不知道」。这叫 **⚠ 路径冲突**，是三元组最常见的事故源；
4. **空路径 `[[]]` 会永远成立**，所有写入接口都拒绝它；
5. 同一路径里 `x.yes` 和 `x.no` 同时出现 → 自相矛盾，会被拒；
6. 阴性表述（无/没有/不/未见/否认/无明显）由引擎统一识别，**但只认 `plugins` 里的 trigger 关键词**——所以关键词表要写全口语说法。

## 3. 质检（每次整理完必须跑）

```powershell
node test-negate.js          # 阴性表述不被误判成阳性（30 项）
node test-mvp.js             # 引擎回归
node dev\selftest.js         # 插件解析/回写字节级一致（557 项）
node platform\checkui.js     # 平台前端静态体检
```

整理完的清单式自检：

- [ ] 每条三元组都能用一句大白话说清「凭什么定到这个方」
- [ ] 用到的每个节点名都在 `plugins/` 里真实存在（或已标 NEW 并给模板）
- [ ] 阴性条件用的是 `xxx.no`，且该节点确实能识别医案里的那种说法（「无腹泻」已验证可识别）
- [ ] 没有 `[[]]`、没有同路径 yes+no、没有自己引用自己
- [ ] `ask` 是「是不是」开头的一句话（病人只需答 是/否/不清楚）
- [ ] 新增的 trigger 关键词不会和别的症状重叠（会互相抢触发）

## 4. 这个仓库目前的三个已知短板（整理时要绕开或顺手补）

1. **舌脉基本不参与判定**：`plugins/pulses/` 里只有 7 个脉象节点，绝大多数方剂 `needs` 不引用它们。
   医案里的「脉浮紧」「舌淡红苔薄白」**先记录在医案表里，不要硬塞进 needs**，否则等于给方剂加了一条谁都满足不了的条件。
   想让它参与，得先补脉象节点 + 明确哪些方剂依赖脉（历史上刻意没做，见 `mahuang_tang.js` 注释）。
2. **路径偏松的既有条目**：例如 `xiaoqinglong_tang` 第三条路径是「咳 + 无汗」，任何感冒咳嗽无汗的人都会点亮它。
   整理同类方剂时**不要照抄这种松路径**；遇到旧的松路径可以在输出里单列「建议收紧」。
3. **缺「状态类」节点**：医案常写「体力尚可/精神好/纳寐可」这类整体状态，现在只有 `tili_cha`（体力很差）。
   阴性写不出来就只能靠 `xxx.no` 的近似词，遇到这种情况标 NEW 并建议补节点。

## 5. 新建节点模板

症状（`plugins/symptoms/<name>.js`）：

```js
module.exports = {
  name: 'xxx',
  title: '中文名',
  kind: 'symptom',
  trigger(text) { return ['口语说法1', '口语说法2'].some(k => text.includes(k)) },
  negate(text) { return ['不xx', '没xx'].some(k => text.includes(k)) },
  ask: '是不是……？'
}
```

方剂（`plugins/formulas/<name>.js`）：`kind: 'formula'`，`needs: [[...]]`，`contraindications: [...]`，
条文出处写成 `// 第35条: …` 的注释放在 `needs` 上方（开发端回写会保留注释）。

## 6. 走哪条路入库

| 角色 | 做法 |
|---|---|
| 医生 | 平台 `/canvas` 改条文 → 点保存 → 先看逐行 diff → 确认 = **提交审核**（不直接改盘） |
| 管理员 | `/review` 审 diff → 通过 → 自动写盘 + 引擎热重载 + 登记**字段级归属**（谁提供了哪个字段） |
| 本地直接改 | 直接编辑 `plugins/*.js`，然后 `node dev\selftest.js` 确认回写无损、`node test-*.js` 确认回归 |

## 7. 输出模板（照这个结构回答）

```
【医案】患者/主诉/阳性/阴性/舌脉/结论/出处

【三元组】
1. 条件A + 条件B + 条件C(no) —— 证候 —— 方剂
2. …
判定规则：满足任意一条全部条件 → 该方证成立（OR of AND）

【节点映射】中文条件 → plugins 里的 name（NEW 的单独列出并给模板）

【载荷】
```json
{ "updated": [...], "created": [...] }
```

【自检】冲突/空路径/悬空引用逐条过一遍

【发现】这次整理暴露的数据问题（松路径、缺节点、舌脉未参与…）
```

## 8. 范例（已用真实引擎验证）

输入：

> 患者王某，男，35岁。昨日受凉后出现恶寒发热，全身疼痛，无汗，咳嗽，无腹泻，精神体力尚可，舌淡红，苔薄白，脉浮紧。

结构化：阳性 = 恶寒/发热/体痛/无汗/咳嗽；阴性 = 无腹泻、体力尚可；舌脉 = 舌淡红苔薄白、脉浮紧。

映射：恶寒→`cold_aversion`、发热→`fever`、体痛→`body_pain`、无汗→`no_sweat`、咳→`cough`、
无腹泻→`diarrhea.no`、脉浮→`floating_pulse`、脉紧→`tight_pulse`。

三元组（麻黄汤）：

```
1. no_sweat.yes + cold_aversion.yes + severe_thirst.no
2. no_sweat.yes + wind_aversion.yes + severe_thirst.no
3. no_sweat.yes + wind_aversion.yes + chuan.yes + severe_thirst.no
```

引擎实跑结果（`node run-case.js "<医案>" -f mahuang_tang`）：`下利=no`（「无腹泻」被正确识别）、`葛根汤` 不再被误点亮、
`桂枝汤=no`（无汗挡掉）、`麻黄汤` 三条路径都还差 `severe_thirst.no`（医案没提口渴）→ 仍需反问「是不是不渴」。
**结论：这条医案本身不写「不渴」，就不该硬判麻黄汤——这正是三元组里阴性条件必须来自原文的原因。**
