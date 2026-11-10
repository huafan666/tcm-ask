'use strict'
// data/symptom-systems.js
// 「系统层」粗筛 —— 按真人看病的习惯顺序（十问歌）组织，不是为了凑而凑。
//
// 用户要求（2026-02）：
//   · 尽早就该定位到关键的地方
//   · 例如大便问题一次性就问清楚，排除掉的就不要再问了
//   · 必须统筹所有症状，按人的习惯方式进行粗筛分类（老中医就是这么问的）
//   · 每一个闸门问题都必须是**能用「是 / 否」回答的问句**，
//     不能是「头和身子怎么样……或者……还是……？」那种没法下口的复合问法
//   · 「头」和「身子」是两件不同的事，硬塞进一个问句，病人根本没法回答
//
// 设计：
//   · 每个系统 = 一大类身体功能（寒热/汗/头面/身体/饮食/胸腹/大便/小便/呼吸/睡眠/情绪/皮肤水肿/妇科）
//   · 顺序照十问歌：寒热 → 汗 → 头面/身体 → 饮食 → 胸腹 → 二便 → 睡眠 → 情绪 → 皮肤 → 妇科
//   · 问诊时**先问这个系统有没有问题**（闸门问题）：
//       答「没有」→ 整个系统所有症状一次性排除，永不再问
//       答「有」  → 进这个系统，把里面的子症状一次问清（问完再走下一个）
//   · 系统里包含哪些症状，由它引用的既有「维度分组」自动汇总（不重复维护）
//
// `rep`：闸门答「有」时要直接点亮的代表症状。
//   闸门「是不是身上会出汗？」答「有」，就等于已经确认了「有汗（sweat）」，
//   不能再拿一句同义的问题重问一遍（用户：出汗的问题同一个就可以了）。
//
// groups 里写的是已有的 symptom_group 名字，生成器会把它们的 children 合并去重。

const SYSTEMS = [
  {
    name: 'sys_cold_heat', order: 1,
    title: '寒热（怕冷、发热）',
    ask: '是不是有怕冷、发热，或者一阵冷一阵热？',
    groups: ['cold_any', 'fever_any'],
    // 似冷非冷似热非热属寒热范畴，但它不是具体的寒/热症状，
    // 故意不进 cold_any/fever_any（否则那两组被污染），用 extra 让「寒热」这一问仍能管住它
    extra: ['pseudo_cold_heat']
  },
  {
    name: 'sys_sweat', order: 2,
    title: '出汗（有没有、什么时候出）',
    // 只问「有没有汗」这一件事——怎么出（自汗/盗汗/冷汗/头汗）留给细化问
    ask: '是不是身上会出汗？',
    // 答「有」就等于确认「有汗」，别再问一遍「是不是身上有汗」
    rep: 'sweat',
    groups: ['sweat_any'],
    extra: ['no_sweat']
  },
  {
    name: 'sys_head', order: 3,
    title: '头面（头痛、头晕、眼睛、气色）',
    // 原来是「头和身子怎么样——头痛、头晕、身上酸重，或者手脚发麻无力、气色变差？」：
    // 一句话里塞了头、身子、手脚、气色四码事，病人没法答是/否。这里拆成两个系统。
    ask: '头或脸有没有不对劲——头痛、头晕、眼睛不舒服，或者脸色变差？',
    groups: ['head_pain_any', 'dizziness_any', 'eye_any', 'complexion_any'],
    extra: ['er_ming']
  },
  {
    name: 'sys_body', order: 4,
    title: '身体四肢（酸痛、麻木、乏力、抽筋、消瘦）',
    ask: '身体和手脚有没有不对劲——酸痛发沉、发麻没劲、抽筋，或者人明显变瘦？',
    groups: ['body_pain_any', 'limb_any', 'lowback_any',
      'energy_any', 'emaciation_any', 'spasm_any']
  },
  {
    name: 'sys_diet', order: 5,
    title: '饮食（胃口、口渴、口味）',
    ask: '吃喝有没有不对劲——吃不下、特别想吃、口渴，或者嘴里发苦发酸？',
    groups: ['appetite_any', 'thirst_any', 'taste_any'],
    // 口干只想漱口不想咽是瘀血特异表现，故意不进口渴族；喜冷饮是饮食偏好。
    // 两者都属「饮食」这一问，用 extra 挂上，答「没有」时能一起判否。
    extra: ['thirst_rinse_only', 'cold_drink_desire']
  },
  {
    name: 'sys_chest_abdomen', order: 6,
    title: '胸腹（胸闷、腹痛、呕吐）',
    ask: '胸口或肚子有没有不对劲——胀、痛、恶心想吐、心慌、打嗝？',
    groups: ['hypochondrium_any', 'abdomen_any', 'palpitation_any',
      'vomit_any', 'belch_any', 'mass_any'],
    extra: ['nausea', 'qi_surge', 'xiazhui']
  },
  {
    name: 'sys_bowel', order: 7,
    title: '大便',
    ask: '大便有没有不对劲——干硬、稀溏、次数多、带血，还是发黑？',
    groups: ['stool_any', 'diarrhea_any']
  },
  {
    name: 'sys_urine', order: 8,
    title: '小便',
    ask: '小便有没有不对劲——次数多、尿不出、颜色很深，或者带血？',
    groups: ['urination_any']
  },
  {
    name: 'sys_resp', order: 9,
    title: '呼吸咽喉（咳嗽、气喘、咽）',
    ask: '呼吸或嗓子有没有不对劲——咳嗽、气喘、痰多、咽痛咽干？',
    groups: ['cough_any', 'dyspnea_any', 'mouth_throat_any']
  },
  {
    name: 'sys_sleep', order: 10,
    title: '睡眠',
    ask: '睡觉有没有不对劲——睡不着、容易醒、睡得浅、多梦，还是白天老想睡？',
    groups: ['sleep_any']
  },
  {
    name: 'sys_mental', order: 11,
    title: '情绪神志',
    ask: '情绪或神志有没有不对劲——烦躁坐不住、想哭，或者说胡话发狂？',
    groups: ['mental_any']
  },
  {
    name: 'sys_skin_water', order: 12,
    title: '皮肤与水肿',
    ask: '皮肤或身上有没有肿——痒、起疹、干燥，或者脸、手脚肿起来？',
    groups: ['skin_any', 'edema_any']
  },
  {
    name: 'sys_gyneco', order: 13,
    title: '妇科/生殖',
    ask: '月经、白带或下阴生殖方面有没有异常？（不相关就说没有）',
    groups: ['gyneco_any', 'reproductive_state_any']
  }
]

module.exports = { SYSTEMS }
