module.exports = {
  name: 'banxia_mahuang_wan',
  title: '半夏麻黄丸',
  kind: 'formula',
  // 金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：心下悸者，半夏麻黄丸主之。
  needs: [
    ['heart_palp.yes', 'chest_qi_stuffiness.yes'],
    ['heart_palp.yes', 'tan_yin.yes'],
    ['heart_palp.yes', 'saliva_spit.yes']
  ],
  contraindications: ['治水饮上凌于心导致的心下悸——心口窝那里跳动不安', '只有两味：半夏（化饮降逆）、麻黄（宣肺通阳），等分为末，蜜丸小豆大', '麻黄在这里不是发汗，而是「通阳宣肺」，让水饮有出路；配半夏化饮，阳气一通水饮自散', '做成小丸「饮服三丸，日三服」，取缓图之意', '和苓桂术甘汤区别：那条是气上冲+起则头眩，本方以心下悸为主']
}
