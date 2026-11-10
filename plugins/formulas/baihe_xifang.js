module.exports = {
  name: 'baihe_xifang',
  title: '百合洗方',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：百合病一月不解，变成渴者，百合洗方主之。
  needs: ['baihe_bing.yes', 'thirsty.yes'],
  contraindications: ['百合病拖了一个月还没好，反而添了口渴——热邪郁在肌表，津液上不来', '用百合煎水外洗皮肤，从皮毛透邪，配合内服', '洗完吃煮饼（面食），不要吃咸的，以免更伤津']
}
