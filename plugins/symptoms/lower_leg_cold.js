module.exports = {
  name: 'lower_leg_cold',
  title: '小腿发凉',
  trigger(text) { return ['小腿发凉', '胫冷', '小腿冰凉', '脚脖子发凉', '膝盖以下发凉', '小腿老是凉的'].some(k => text.includes(k)) },
  negate(text) { return ['小腿不凉'].some(k => text.includes(k)) },
  ask: '是不是小腿（膝盖以下）老是发凉，摸着比别人冷？'
}
