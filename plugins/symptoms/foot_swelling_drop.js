module.exports = {
  name: 'foot_swelling_drop',
  title: '脚肿得像要掉下来',
  trigger(text) { return ['脚肿得像要掉', '两脚肿得厉害', '脚肿如脱', '脚背肿得高', '脚肿得发亮', '双脚浮肿得厉害', '脚肿得穿不上鞋'].some(k => text.includes(k)) },
  negate(text) { return ['脚不肿'].some(k => text.includes(k)) },
  ask: '是不是两只脚浮肿得厉害，沉甸甸的像要掉下来？'
}
