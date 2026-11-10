module.exports = {
  name: 'waist_split_sweat',
  title: '腰以上出汗、腰以下不出',
  trigger(text) { return ['腰以上出汗腰以下不出', '上半身出汗下半身没汗', '只有上半身出汗', '腰以下不出汗', '上半身有汗下半身干', '上半身有汗', '下身没汗'].some(k => text.includes(k)) },
  negate(text) { return ['全身出汗均匀'].some(k => text.includes(k)) },
  ask: '是不是只有腰以上出汗，腰以下一点汗都没有？'
}
