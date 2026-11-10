module.exports = {
  name: 'spreading_skin_sore',
  title: '皮肤疮疡四处蔓延',
  trigger(text) { return ['皮肤疮疡四处蔓延', '浸淫疮', '疮面越来越大', '皮肤溃烂往周围扩', '黄水疮四处串', '疮蔓延到别处'].some(k => text.includes(k)) },
  negate(text) { return ['疮不蔓延'].some(k => text.includes(k)) },
  ask: '是不是皮肤上有一片疮疡，还不断往周围蔓延扩大？'
}
