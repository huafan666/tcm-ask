module.exports = {
  name: 'baihe_jizi_tang',
  title: '百合鸡子汤',
  kind: 'formula',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：百合病，吐之后者，用后方主之。
  needs: ['baihe_bing.yes', 'vomiting.yes'],
  contraindications: ['本来是百合病，却被误用了催吐法——吐后胃气受损、虚烦不安', '鸡蛋黄补中养血，配合百合安神', '以后不能再催吐']
}
