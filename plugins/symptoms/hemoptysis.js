module.exports = {
  name: 'hemoptysis',
  title: '咯血（咳出来的血）',
  trigger(text) { return ['咯血', '咳出血', '咳出血来', '咳嗽带血', '痰里带血', '痰中带血', '咳血', '咳嗽吐血丝', '咳出血丝'].some(k => text.includes(k)) },
  negate(text) { return ['没咯血', '不咳血', '痰里没血'].some(k => text.includes(k)) },
  ask: '是不是咳嗽的时候咳出血来（血是从嗓子里咳出来的，不是呕出来的）？'
}
