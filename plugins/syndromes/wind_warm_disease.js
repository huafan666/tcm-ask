module.exports = {
  name: 'wind_warm_disease',
  title: '风温病',
  kind: 'summary',
  // 按原文：伤寒后 发汗/下 之后伤津而见风温。
  // 多路径 OR，每条路径 = 一组津伤表现，见任一路成立即判，不必六证俱全。
  // 暂不做脉，去掉了含脉的路径；具体匹配组合待临床验证。
  needs: [
    // (1) 发汗已 后：身灼热
    ['sweat.yes', 'burning.yes'],
    // (2) 自汗 + 身重（津伤卫表不固、经气不运）
    ['sweat.yes', 'auto_sweat.yes', 'body_heavy.yes'],
    // (3) 多眠睡 + 鼻鼾（津伤神失所养、窍不利）
    ['sweat.yes', 'sleepy.yes', 'snoring.yes'],
    // (4) 自汗 + 语言难出（津亏窍失津润）
    ['sweat.yes', 'auto_sweat.yes', 'speech_difficulty.yes'],
    // (5) 自汗 + 口渴 + 身重（津伤代表形态）
    ['auto_sweat.yes', 'thirsty.yes', 'body_heavy.yes']
  ],
  contraindications: ['忌用下法（被下则小便不利、直视失溲）', '忌用火法（被火则发黄、惊痫、瘈疭）', '慎发汗（风温本因发汗过度）', '不可见下则再逆、易促命期']
}

