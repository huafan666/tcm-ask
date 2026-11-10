module.exports = {
  name: 'gyneco_any',
  title: '妇科/生殖方面异常',
  kind: 'symptom_group',
  // 症状筛选组（部位）：妇科/生殖方面异常
  trigger(text) { return ['月经', '经水', '白带', '恶露', '下阴', '前阴', '阴部', '精液', '遗精', '生殖'].some(k => text.includes(k)) },
  ask: '是不是月经、白带、下阴、精液或生育方面有问题？',
  children: ['amenorrhea', 'yuejingjianshao', 'vaginal_bleeding', 'vaginal_discharge', 'vulvar_cold', 'yin_chui', 'buyun', 'genital_cold', 'genital_ulcer', 'semen_loss', 'dream_sex', 'testicle_alternating_swelling', 'jingzixishao', 'lochia_retention', 'tongjing', 'anal_ulcer', 'blood_clot_dark'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：部位｜未归入本组的：怀孕/产后的状态本身（是状态不是异常）；阴部水肿（归水肿）']
}
