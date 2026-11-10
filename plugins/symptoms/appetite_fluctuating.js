module.exports = {
  name: 'appetite_fluctuating',
  title: '食欲时好时坏',
  trigger(text) { return ['食欲时好时坏', '想吃又吃不下', '胃口时好时坏', '有时想吃有时不想吃', '不想闻饭味', '想吃吃不下', '想吃东西又吃不下', '想吃东西可又吃不下', '吃不下饭又想吃'].some(k => text.includes(k)) },
  negate(text) { return ['胃口很好', '一直吃得下'].some(k => text.includes(k)) },
  ask: '是不是想吃东西，可真到吃的时候又吃不下？胃口一会儿好一会儿坏。'
}
