module.exports = {
  name: 'guizhi_jia_fuzi',
  title: '桂枝加附子汤',
  kind: 'formula',
  // 第20条: 太阳病发汗遂漏不止，其人恶风，小便难，四肢微急难以屈伸者，桂枝加附子汤主之。
  // 病机: 阳虚漏汗。核心=漏汗+小便难(阳虚水气不归)。恶风/四肢微急为伴随，非必须。
  // 多路径 OR：核心足已成立；或更完整条文路径。
  needs: [
    ['leak_sweat.yes', 'urination_difficulty.yes'],
    ['leak_sweat.yes', 'urination_difficulty.yes', 'wind_aversion.yes', 'limb_spasm.yes']
  ],
  contraindications: ['阳虚漏汗，回阳固表、敛汗', '发汗后漏汗(汗流不止)者用之', '表实有热者不宜']
}

