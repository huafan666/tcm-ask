module.exports = {
  name: 'mahuang_lianqiao_chixiaodou_tang',
  title: '麻黄连翘赤小豆汤',
  kind: 'formula',
  // 第262条: 伤寒瘀热在里，身必黄，麻黄连轺赤小豆汤主之。
  // 瘀热在里不得外越而发黄。核心=身黄 + 表闭无汗（麻黄开表）。
  // 与茵陈蒿汤区别：茵陈蒿汤有明显小便不利；与栀子檗皮汤区别：后者有发热。
  needs: [
    ['jaundice.yes', 'no_sweat.yes']
  ],
  contraindications: [
    '身黄 + 无汗（瘀热在里、表气闭住，热散不出去所以发黄）',
    '治法清利湿热 + 开表透邪（麻黄、连翘、赤小豆）',
    '如果小便明显不通畅，更适合茵陈蒿汤',
    '如果有明显发热，更适合栀子檗皮汤'
  ]
}
