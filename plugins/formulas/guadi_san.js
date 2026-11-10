module.exports = {
  name: 'guadi_san',
  title: '瓜蒂散',
  kind: 'formula',
  // 第166条: 病如桂枝证头不痛项不强，胸中痞硬气上冲咽喉不得息者，此为胸有寒也，当吐之，宜瓜蒂散。
  // 胸中痰实，当吐。核心=胸中痞硬+气上冲咽喉。
  needs: ['chest_lump_hard.yes', 'qi_surge.yes', 'headache.no', 'neck_stiff_pain.no'],
  contraindications: ['胸中痞硬、气上冲咽喉(痰实)', '涌吐痰实', '特指胸有寒痰当吐']
}
