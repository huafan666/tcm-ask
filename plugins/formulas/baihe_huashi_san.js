module.exports = {
  name: 'baihe_huashi_san',
  title: '百合滑石散',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：百合病变发热者，百合滑石散主之。
  needs: ['baihe_bing.yes', 'fever.yes'],
  contraindications: ['百合病本来不太发热，后来反而发起热来——是热郁在里、需要从小便引出去', '百合养阴、滑石清热利小便', '热一退就停药，久服伤津']
}
