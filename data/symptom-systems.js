'use strict'
// data/symptom-systems.js
// 「系统层」粗筛 —— 按真人看病的习惯顺序（十问歌）组织，不是为了凑而凑。
//
// 用户要求（2026-02）：
//   · 尽早就该定位到关键的地方
//   · 例如大便问题一次性就问清楚，排除掉的就不要再问了
//   · 必须统筹所有症状，按人的习惯方式进行粗筛分类（老中医就是这么问的）
//
// 设计：
//   · 每个系统 = 一大类身体功能（寒热/汗/头身/饮食/胸腹/大便/小便/呼吸/睡眠/情绪/皮肤水肿/妇科）
//   · 顺序照十问歌：寒热 → 汗 → 头身 → 饮食 → 二便 → 睡眠 → 胸腹 → 呼吸 → 情绪 → 皮肤 → 妇科
//   · 问诊时**先问这个系统有没有问题**（闸门问题）：
//       答「没有」→ 整个系统所有症状一次性排除，永不再问
//       答「有」  → 进这个系统，把里面的子症状一次问清（问完再走下一个）
//   · 系统里包含哪些症状，由它引用的既有「维度分组」自动汇总（不重复维护）
//
// groups 里写的是已有的 symptom_group 名字，生成器会把它们的 children 合并去重。

const SYSTEMS = [
  {
    name: 'sys_cold_heat', order: 1,
    title: '寒热（怕冷、发热）',
    ask: '先说寒热——有没有怕冷、发热，或者一阵冷一阵热？',
    groups: ['cold_any', 'fever_any'],
    // 似冷非冷似热非热属寒热范畴，但它不是具体的寒/热症状，
    // 故意不进 cold_any/fever_any（否则那两组被污染），用 extra 让「寒热」这一问仍能管住它
    extra: ['pseudo_cold_heat']
  },
  {
    name: 'sys_sweat', order: 2,
    title: '出汗（有没有、什么时候出）',
    ask: '出汗怎么样——是完全不出汗、还是稍一活动就出汗、还是睡着以后出汗？',
    groups: ['sweat_any'],
    extra: ['no_sweat']
  },
  {
    name: 'sys_head_body', order: 3,
    title: '头身（头痛、头晕、身上）',
    ask: '头和身子怎么样——头痛、头晕、身上酸重，或者手脚发麻无力、气色变差？',
    groups: ['complexion_any', 'eye_any', 'head_body_pain_any', 'limb_any', 'lowback_any',
      'dizziness_any', 'energy_any', 'emaciation_any', 'spasm_any'],
    extra: ['er_ming']
  },
  {
    name: 'sys_diet', order: 4,
    title: '饮食（胃口、口渴、口味）',
    ask: '吃喝怎么样——胃口好不好？渴不渴、想喝热的还是凉的？嘴里发苦、发酸还是有异味？',
    groups: ['appetite_any', 'thirst_any', 'taste_any'],
    // 口干只想漱口不想咽是瘀血特异表现，故意不进口渴族；喜冷饮是饮食偏好。
    // 两者都属「饮食」这一问，用 extra 挂上，答「没有」时能一起判否。
    extra: ['thirst_rinse_only', 'cold_drink_desire']
  },
  {
    name: 'sys_chest_abdomen', order: 5,
    title: '胸腹（胸闷、腹痛、呕吐）',
    ask: '胸口和肚子怎么样——胸闷心慌、肚子胀或痛、恶心想吐、打嗝嗳气、摸到包块？',
    groups: ['hypochondrium_any', 'abdomen_any', 'palpitation_any',
      'vomit_any', 'belch_any', 'mass_any'],
    extra: ['nausea', 'qi_surge', 'xiazhui']
  },
  {
    name: 'sys_bowel', order: 6,
    title: '大便',
    ask: '大便怎么样——干硬难解、稀溏不成形、一天几次、带血或发黑，还是正常？',
    groups: ['stool_any', 'diarrhea_any']
  },
  {
    name: 'sys_urine', order: 7,
    title: '小便',
    ask: '小便怎么样——次数多、尿不出、尿色很黄、带血、有砂石，还是正常？',
    groups: ['urination_any']
  },
  {
    name: 'sys_resp', order: 8,
    title: '呼吸咽喉（咳嗽、气喘、咽）',
    ask: '呼吸和嗓子怎么样——咳嗽、气喘、痰多、咽痛咽干、喉咙堵？',
    groups: ['cough_any', 'dyspnea_any', 'mouth_throat_any']
  },
  {
    name: 'sys_sleep', order: 9,
    title: '睡眠',
    ask: '睡觉怎么样——躺下好久睡不着、睡着了容易醒、睡得浅、多梦，还是白天老想睡？',
    groups: ['sleep_any']
  },
  {
    name: 'sys_mental', order: 10,
    title: '情绪神志',
    ask: '情绪和神志怎么样——心里烦躁坐不住、莫名难过想哭、说胡话或发狂？',
    groups: ['mental_any']
  },
  {
    name: 'sys_skin_water', order: 11,
    title: '皮肤与水肿',
    ask: '皮肤和水肿怎么样——身上痒起疹、皮肤干燥粗糙，或者脸、手脚哪里肿起来？',
    groups: ['skin_any', 'edema_any']
  },
  {
    name: 'sys_gyneco', order: 12,
    title: '妇科/生殖',
    ask: '月经、白带、下阴或生殖方面有没有异常？（不相关就说没有）',
    groups: ['gyneco_any', 'reproductive_state_any']
  }
]

module.exports = { SYSTEMS }
