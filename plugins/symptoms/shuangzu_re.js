module.exports = {
  name: 'shuangzu_re',
  title: '双足热',
  trigger(text) { return ['两个脚热', '脚热', '脚烫', '足热'].some(k => text.includes(k)) },
  ask: '是不是两只脚发热、发烫，想放到被子外面？'
}
