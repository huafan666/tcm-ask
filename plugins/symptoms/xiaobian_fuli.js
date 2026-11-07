module.exports = {
  name: 'xiaobian_fuli',
  title: '小便复利',
  trigger(text) { return ['小便控制不住'].some(k => text.includes(k)) },
  negate(text) { return ['小便挺舒服的 小便正常'].some(k => text.includes(k)) },
  ask: '小便是不是控制不住的想流出来'
}
