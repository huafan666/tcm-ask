module.exports = {
  name: 'shaokun_san',
  title: '烧裈散',
  kind: 'formula',
  // 392条：伤寒阴阳易之为病，其人身体重，少气，少腹里急，或引阴中拘挛，热上冲胸，头重不欲举，眼中生花，膝胫拘急者，烧裈散主之。
  needs: ['body_heavy.yes', 'lower_abdomen_cramp.yes', 'qi_surge.yes'],
  contraindications: ['392条：阴阳易——身体重、少气、少腹里急、或引阴中拘挛、热上冲胸、头重不欲举、眼中生花、膝胫拘急', '「阴阳易」指大病初愈或房事后出现的一组证候，古今认识分歧很大', '⚠ 方为「烧裈散」（取妇人中裈近隐处烧灰），属古代治法，现代不主张使用；此处收录是为了条文完整']
}
