module.exports = {
  name: 'qi_li',
  title: '拉肚子还不停放屁',
  trigger(text) { return ['拉肚子还不停放屁', '气利', '大便跟着屁出来', '一放屁就带出大便', '拉稀还排气多', '放屁带屎'].some(k => text.includes(k)) },
  negate(text) { return ['不放屁'].some(k => text.includes(k)) },
  ask: '是不是拉肚子的同时还不停放屁，大便跟着气一起出来？'
}
