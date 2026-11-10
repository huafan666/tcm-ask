module.exports = {
  name: 'jiuni_tang',
  title: '桂枝去芍药加蜀漆牡蛎龙骨救逆汤',
  kind: 'formula',
  // 第112条: 伤寒脉浮医者以火迫劫之亡阳，必惊狂卧起不安者，救逆汤主之。
  // 火逆亡阳、惊狂。核心=惊狂/卧起不安(心阳亡).
  needs: [
    ['manic.yes', 'restless.yes'],
    // 金匮 16.12：火邪者，桂枝去芍药加蜀漆牡蛎龙骨救逆汤主之
    ['manic.yes','heart_palp.yes']
  ],
  contraindications: ['火逆亡阳惊狂卧起不安', '镇惊安神回阳', '灸火误治所致']
}
