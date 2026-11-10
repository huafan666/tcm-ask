module.exports = {
  name: 'weight_loss',
  title: '明显消瘦',
  trigger(text) { return ['明显消瘦', '瘦了很多', '掉秤厉害', '体重下降很多', '肉都掉了', '瘦得厉害', '越来越瘦', '脱肉'].some(k => text.includes(k)) },
  negate(text) { return ['体重没变', '没瘦'].some(k => text.includes(k)) },
  ask: '是不是这阵子瘦得明显，体重掉了很多？'
}
