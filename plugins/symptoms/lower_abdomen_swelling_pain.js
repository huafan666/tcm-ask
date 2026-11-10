module.exports = {
  name: 'lower_abdomen_swelling_pain',
  title: '小肚子肿起一块、一按就痛',
  trigger(text) { return ['小肚子肿起一块', '少腹肿痞', '小肚子一按就痛', '下腹有肿块按着痛', '小腹肿起按之痛', '右下腹按着疼', '肚脐下右侧按着痛'].some(k => text.includes(k)) },
  negate(text) { return ['小肚子按着不痛'].some(k => text.includes(k)) },
  ask: '是不是小肚子肿起一块、一按就明显疼（但小便还正常）？'
}
