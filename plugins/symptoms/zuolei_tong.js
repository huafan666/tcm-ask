module.exports = {
  name: 'zuolei_tong',
  title: '左肋痛',
  trigger(text) { return ['左肋痛', '左边肋骨痛', '左边肋骨不舒服'].some(k => text.includes(k)) },
  ask: '是不是左边肋骨不太舒服，有时候还有点痛'
}
