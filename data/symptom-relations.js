'use strict'
// data/symptom-relations.js
// ============================================================
// 症状之间的「关系约束」——让问诊不要问废话，也让推理不会自相矛盾。
//
// 这三条规矩是用户在实跑里一条一条提出来逼出来的（2026-02）：
//
//   1. 「出汗的问题同一个就可以了，有汗不就是无汗 .no 吗」
//      → 有汗答「是」，就不必再问「是不是完全不出汗」
//
//   2. 「便秘和拉肚子也是相对的，一个 yes，另外一个就 no 了」
//      → 一个是「是」，另一个自动「否」，方剂判断里也就不用再摆一条反向路径
//
//   3. 「便血也是，都没有便血了你还在问便血是不是脓血，
//       轻度的没有 ⇒ 重度的一定没有」
//      → 上位症状否掉，它下面的各种具体类型一律否掉，不再挨个问
//
// 另一条是问诊顺序（由 engine/asker.js 执行，不在这里）：
//   「先判断是不是便秘，再判断确实有便秘的情况下，是不是轻度」
//   → 上位还没定的时候，先问上位，别一上来就问「轻度便秘」
//
// ------------------------------------------------------------
// 两类关系
// ------------------------------------------------------------
//   MUTEX（互斥）：A = yes ⇒ B = no，B = yes ⇒ A = no
//   SPECIALIZE（上位 → 下位）：
//       下位 = yes ⇒ 上位 = yes     （说了「便脓血」，那就是「大便带血」）
//       上位 = no  ⇒ 下位全 = no    （没有便血，就不可能有便脓血）
//
// 注意：SPECIALIZE 说的是「同一个症状的粗细」，和 symptom_group 的
//      「任一子成立 ⇒ 族成立」不是一个东西：
//        · 组的子之间是**并列**的（吐血 / 呕吐 / 干呕 都是呕吐族）
//        · SPECIALIZE 的子是**更具体的一种**（便脓血 是 便血 的一种）
//      所以组永远不判 no，而 SPECIALIZE 的上位可以判 no 并向下压。
// ============================================================

// ---------- 互斥（相反的两个症状） ----------
// 只放「临床上真的不能同时成立」的，不要放「一般不同时出现」的。
const MUTEX = [
  // 有汗 / 无汗：同一个问题的正反面
  ['sweat', 'no_sweat'],
  // 便秘 / 下利：一个是「是」，另一个必然是「否」
  ['constipation', 'diarrhea']
]

// ---------- 上位 → 下位（更具体的类型） ----------
const SPECIALIZE = {
  // 出汗：不出汗 ⇒ 自汗 / 盗汗 / 冷汗 / 漏汗 / 黄汗 全都不成立。
  //
  // 刻意**不含**三种「局部汗出」：但头汗出、腰以上出汗、手足濈然汗出。
  // 它们说的是「只有某个部位出汗」，病人完全可能同时说「我平时不太出汗，
  // 就是头上/手老出汗」——所以它们不算「出汗」这一条的下位，
  // 只挂在 sweat_any 这个族里，靠「出汗」那一问管住。
  sweat: ['auto_sweat', 'night_sweat', 'cold_sweat', 'leak_sweat', 'yellow_sweat'],

  // 便秘：不是便秘 ⇒ 也谈不上「轻度便秘」
  constipation: ['qingdubianmi'],

  // 下利：不拉肚子 ⇒ 谈不上久利 / 下利清谷 / 鸭溏 / 气利
  diarrhea: ['chronic_diarrhea', 'clear_grain_diarrhea', 'duck_stool', 'qi_li'],

  // 大便带血：没有便血 ⇒ 便脓血 / 近血 / 远血 一律没有
  // （用户的话：轻度的没有，重度的一定没有）
  stool_blood: ['blood_pus_stool', 'blood_after_stool', 'blood_before_stool'],

  // 吐血：不吐血 ⇒ 谈不上吐脓血
  hematemesis: ['tu_nongxue'],

  // 口渴：不渴 ⇒ 谈不上大渴 / 烦渴
  thirsty: ['severe_thirst'],

  // 咳嗽：不咳嗽 ⇒ 谈不上咳血 / 咳脓痰 / 咳时胁痛 / 喉中痰鸣 / 咳逆上气
  cough: ['qi_upward_cough', 'foul_pus_sputum', 'hemoptysis',
    'throat_rales', 'cough_pleuritic_pain']
}

// 谁是「上位」——由 SPECIALIZE 反推，供问诊器查表
const PARENT_OF = {}
for (const parent of Object.keys(SPECIALIZE)) {
  for (const kid of SPECIALIZE[parent]) PARENT_OF[kid] = parent
}

module.exports = { MUTEX, SPECIALIZE, PARENT_OF }
