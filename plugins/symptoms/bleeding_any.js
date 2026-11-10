module.exports = {
  name: 'bleeding_any',
  title: '出血（血从身体里流出来）',
  kind: 'symptom_group',
  // 症状筛选组（物质）：出血（血从身体里流出来）
  trigger(text) { return ['出血', '流血', '见血', '带血', '下血', '血不'].some(k => text.includes(k)) },
  ask: '是不是有出血——不管是从嘴里、鼻子、大便、小便还是阴道？',
  children: ['hematemesis', 'epistaxis', 'stool_blood', 'hematuria', 'blood_pus_stool', 'vaginal_bleeding', 'blood_after_stool', 'blood_before_stool', 'tu_nongxue', 'lochia_retention', 'blood_clot_dark', 'hemoptysis'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：物质｜未归入本组的：月经不来/月经减少（那是没有血，不是出血）；血虚、贫血']
}
