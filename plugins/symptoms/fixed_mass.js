module.exports = {
  name: 'fixed_mass',
  title: '固定不移的包块',
  trigger(text) { return ['固定不移的包块', '包块不动', '一直在一个地方不动', '硬块固定在一处', '积块固定', '摸到的块一直在原处', '位置固定不动', '固定不动', '包块位置固定', '块一直在那儿不动', '摸着有个硬块不动', '固定的硬块'].some(k => text.includes(k)) },
  negate(text) { return ['包块会移动'].some(k => text.includes(k)) },
  ask: '是不是能摸到一个包块，位置固定、一直在原处不动？'
}
