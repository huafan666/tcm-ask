module.exports = {
  name: 'epistaxis',
  title: '流鼻血',
  trigger(text) { return ['流鼻血', '鼻出血', '衄血', '鼻子出血', '鼻子常流血', '无缘无故流鼻血'].some(k => text.includes(k)) },
  negate(text) { return ['不流鼻血'].some(k => text.includes(k)) },
  ask: '是不是会流鼻血（鼻子出血）？'
}
