module.exports = {
  name: 'zhigancao_tang',
  title: '炙甘草汤',
  kind: 'formula',
  // 第177条: 伤寒脉结代，心动悸，炙甘草汤主之。
  // 心阴阳两虚(脉结代、心动悸)。核心=心动悸。
  needs: [
    ['heart_palpitation.yes']
  ],
  contraindications: ['脉结代、心动悸(心阴阳两虚)', '益气养血通脉复脉', '脉结代心悸为主']
}
