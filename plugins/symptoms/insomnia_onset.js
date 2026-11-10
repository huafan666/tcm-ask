module.exports = {
  name: 'insomnia_onset',
  title: '入睡困难',
  trigger(text) { return ['入睡困难', '躺下好久睡不着', '躺半天睡不着', '迟迟睡不着', '躺下睡不着', '入睡费劲', '一躺下脑子就清醒', '闭眼就是睡不着'].some(k => text.includes(k)) },
  negate(text) { return ['一躺下就睡', '入睡很快'].some(k => text.includes(k)) },
  ask: '是不是躺下以后要很久才睡得着？'
}
