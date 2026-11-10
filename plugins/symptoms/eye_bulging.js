module.exports = {
  name: 'eye_bulging',
  title: '眼睛胀得像要脱出来',
  trigger(text) { return ['眼睛胀得像要脱出来', '眼睛像要掉出来', '目如脱状', '眼睛胀得突出', '咳得眼睛往外鼓', '眼球像要脱出', '眼睛像要脱出来', '眼睛胀得要脱出来', '喘得眼睛往外鼓', '眼睛鼓出来', '眼球突出得要掉'].some(k => text.includes(k)) },
  negate(text) { return ['眼睛正常'].some(k => text.includes(k)) },
  ask: '是不是喘得厉害时，两只眼睛胀得往外鼓、像要脱出来一样？'
}
