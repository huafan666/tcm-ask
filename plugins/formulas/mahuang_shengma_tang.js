module.exports = {
  name: 'mahuang_shengma_tang',
  title: '麻黄升麻汤',
  kind: 'formula',
  // 357条：伤寒六七日，大下后，寸脉沉而迟，手足厥逆，下部脉不至，喉咽不利，唾脓血，泄利不止者，为难治。麻黄升麻汤主之。
  needs: ['cold_extremities.yes', 'tu_nongxue.yes', 'diarrhea.yes'],
  contraindications: ['357条：大下后，手足厥逆、喉咽不利、唾脓血、泄利不止——上热下寒、虚实夹杂', '原文自注「为难治」——这是仲景书里少数明说难治的方证', '麻黄升麻汤药味最多（14 味），清上温下、发越郁阳', '⚠ 必须在「唾脓血 + 泄利不止 + 手足厥逆」同时出现时才考虑']
}
