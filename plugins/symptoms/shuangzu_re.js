module.exports = {
  name: 'shuangzu_re',
  title: '双足热',
  trigger(text) { return ['两个脚热', '脚热', '脚烫', '足热'].some(k => text.includes(k)) },
  ask: '两个脚感觉是不是热的'
}
