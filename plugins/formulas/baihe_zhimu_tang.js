module.exports = {
  name: 'baihe_zhimu_tang',
  title: '百合知母汤',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：百合病发汗后者，百合知母汤主之。
  needs: ['baihe_bing.yes', 'sweat.yes'],
  contraindications: ['本来得的是百合病，结果被误用了发汗药——汗出之后津液更伤，心烦、燥热更明显', '百合养阴、知母清热除烦，重点补回被汗夺走的津液', '以后不能再发汗']
}
