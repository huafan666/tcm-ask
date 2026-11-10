module.exports = {
  name: 'zhuye_tang',
  title: '竹叶汤',
  kind: 'formula',
  // 金匮要略·妇人产后病脉证治第二十一：产后中风，发热，面正赤，喘而头痛，竹叶汤主之。
  needs: [
    ['postpartum.yes', 'fever.yes', 'face_red_patches.yes'],
    ['postpartum.yes', 'fever.yes', 'orthopnea.yes'],
    ['postpartum.yes', 'sweat.yes', 'wind_aversion.yes']
  ],
  contraindications: ['治产后外感风邪而**正虚邪实**：发热、脸红、气喘、头痛', '组成：竹叶、葛根、防风、桔梗、桂枝、人参、甘草、附子、生姜、大枣——**既有解表散邪，又有人参附子扶正**，是「扶正祛邪」并用', '为什么面红还用温药：产后多虚，脸红是「虚阳上浮」而非实热，所以要温阳益气、同时轻宣表邪', '⚠ 产后发热首先要排除**产褥感染**（恶露臭、子宫压痛、高热），那是急症，须立即就医', '⚠ 方中有附子，有毒须炮制久煎']
}
