module.exports = {
  name: 'mahuang_liangqiao_chixiaodou_tang',
  title: '麻黄连翘赤小豆汤',
  kind: 'formula',
  // 第262条: 伤寒瘀热在里身必黄麻黄连轺赤小豆汤主之。
  // 瘀热在里不得越，身黄。核心=身黄，有表闭(麻黄开表)而无明显小便不利。
  // 与茵陈蒿区别(小便不利)、栀子檗皮区别(发热)。
  needs: [
    ['jaundice.yes', 'no_sweat.yes']
  ],
  contraindications: ['身黄+无汗(瘀热在里表不解)', '表闭瘀热不得越而黄', '清利+开表(麻黄连翘赤小豆)', '小便不利明显宜茵陈蒿']
}
