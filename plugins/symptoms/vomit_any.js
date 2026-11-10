module.exports = {
  name: 'vomit_any',
  title: '呕吐（胃里的东西经口吐出来）',
  kind: 'symptom_group',
  // 症状筛选组（动作）：呕吐（胃里的东西经口吐出来）
  trigger(text) { return ['呕', '呕吐', '干呕', '反胃', '吐了', '吐得'].some(k => text.includes(k)) },
  ask: '是不是会吐——把胃里的东西从嘴里吐出来？（不管吐的是水、食物、血还是别的）',
  children: ['vomiting', 'vomit_saliva', 'vomit_on_food', 'vomit_on_intake', 'vomit_right_after_eating', 'food_vomit_delayed', 'water_reflux', 'hematemesis', 'tu_nongxue', 'round_worm_vomit', 'saliva_spit', 'pregnancy_vomit', 'vex_like_vomit', 'saliva_heart_pain_paroxysmal'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：动作｜未归入本组的：咯血（咳出来的血）、恶心（想吐但没吐）、吞咽困难、咳痰、咽喉异物感 —— 这些都不是「吐」']
}
