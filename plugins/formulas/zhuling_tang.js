module.exports = {
  name: 'zhuling_tang',
  title: '猪苓汤',
  kind: 'formula',
  // 第223条: 若脉浮发热渴欲饮水小便不利者猪苓汤主之。
  // 阳明/少阴水热互结。核心=渴欲饮水+小便不利。
  // 与五苓散区别: 本证口渴明显(水热伤阴)，小便不利+渴;五苓散表不解水蓄。
  needs: [
    ['severe_thirst.yes', 'urination_difficulty.yes'],
    // 金匮 13.14：脉浮发热，渴欲饮水，小便不利者，猪苓汤主之
    ['urination_difficulty.yes','thirsty.yes','fever.yes']
  ],
  contraindications: ['渴欲饮水+小便不利(水热互结)', '汗多胃中燥者不可用(第224)', '育阴清热利水(阿胶)', '里热伤阴者宜']
}
