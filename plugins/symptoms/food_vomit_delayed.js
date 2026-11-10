module.exports = {
  name: 'food_vomit_delayed',
  title: '早上吃的晚上吐、晚上吃的早上吐',
  trigger(text) { return ['早上吃的晚上吐', '朝食暮吐', '暮食朝吐', '晚上吃的早上吐出来', '吃下去隔很久才吐', '吐出来的还是没消化的饭', '隔一顿才吐'].some(k => text.includes(k)) },
  negate(text) { return ['吃完不吐'].some(k => text.includes(k)) },
  ask: '是不是早上吃的东西要到晚上才吐出来（或者晚上吃的第二天早上吐），吐出来的还是没消化的？'
}
