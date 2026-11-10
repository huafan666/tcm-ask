module.exports = {
  name: 'genital_ulcer',
  title: '前阴溃烂',
  trigger(text) { return ['前阴溃烂', '阴部溃烂', '外阴溃烂', '下身溃烂', '阴部溃疡', '下面溃烂', '阴部长疮', '前阴长疮', '下身也烂了', '下面也烂了', '阴部也溃烂', '下身破皮'].some(k => text.includes(k)) },
  negate(text) { return ['阴部正常', '下身没事'].some(k => text.includes(k)) },
  ask: '是不是前阴（下身）那里有溃烂、破皮、长疮的地方？'
}
