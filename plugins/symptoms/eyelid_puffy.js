module.exports = {
  name: 'eyelid_puffy',
  title: '眼泡浮肿像卧蚕',
  trigger(text) { return ['眼泡浮肿', '眼皮肿得像卧蚕', '目下有卧蚕', '早上起来眼泡肿', '眼睛下面肿起来', '眼袋肿得亮', '眼下肿得像蚕'].some(k => text.includes(k)) },
  negate(text) { return ['眼泡不肿'].some(k => text.includes(k)) },
  ask: '是不是眼睛下面（眼泡）浮肿起来，像一条卧着的蚕？'
}
