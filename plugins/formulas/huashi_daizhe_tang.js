module.exports = {
  name: 'huashi_daizhe_tang',
  title: '滑石代赭汤',
  kind: 'formula',
  // 金匮要略·百合病狐惑阴阳毒病脉证并治第三：百合病下之后者，滑石代赭汤主之。
  needs: ['baihe_bing.yes', 'diarrhea.yes'],
  contraindications: ['本来是百合病，却被误用了泻药——拉完之后胃气上逆、小便不利', '滑石利尿、代赭石降胃气，把被泻坏的下焦和中焦都理顺', '以后不能再泻下']
}
