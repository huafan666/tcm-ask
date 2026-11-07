module.exports = {
  name: 'wei_tong',
  title: '胃痛（胃出血）',
  trigger(text) { return ['胃痛', '胃出血'].some(k => text.includes(k)) },
  negate(text) { return ['胃挺舒服的', '胃没事', '胃舒服'].some(k => text.includes(k)) },
  ask: '是不是胃痛或者胃出血'
}
