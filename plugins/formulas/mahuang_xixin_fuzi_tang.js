module.exports = {
  name: 'mahuang_xixin_fuzi_tang',
  title: '麻黄细辛附子汤',
  kind: 'formula',
  // 301条：少阴病，始得之，反发热，脉沉者，麻黄细辛附子汤主之。
  needs: ['fever.yes', 'cold_aversion.yes', 'sleepy.yes'],
  contraindications: ['301条：少阴病始得之，反发热，脉沉者', '「反发热」是太阳少阴两感：本应但寒不热，却见发热', '麻黄附子细辛——温经解表，助阳发汗', '与麻黄附子汤的区别：彼为水气（一身悉肿），本方为少阴表证发热', '⚠ 少阴禁汗，本方是温经而非大发汗，用量宜轻']
}
