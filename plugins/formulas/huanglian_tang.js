module.exports = {
  name: 'huanglian_tang',
  title: '黄连汤',
  kind: 'formula',
  // 第173条: 伤寒胸中有热，胃中有邪气，腹中痛，欲呕吐者，黄连汤主之。
  // 上热下寒(胸热腹寒)。核心=腹中痛+欲呕吐。
  needs: [
    ['abdominal_fullness.yes', 'vomiting.yes'],
    ['abdominal_fullness.yes', 'vomiting.yes', 'restless.yes']
  ],
  contraindications: ['胸中有热胃中有寒', '腹中痛欲呕吐', '清上温下'
]
}
