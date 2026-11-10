module.exports = {
  name: 'vex_insomnia',
  title: '虚烦不得眠',
  kind: 'symptom',
  trigger(text) { return ['虚烦', '烦不得眠', '心中懊恼', '反复颠倒', '烦闷失眠', '心里烦躁睡不着', '烦躁睡不着', '躺不住睡不着', '心里烦得睡不着', '翻来覆去睡不着', '烦得睡不下'].some(k => text.includes(k)) },
  negate(text) { return ['能睡', '不烦'].some(k => text.includes(k)) },
  ask: '是不是心里烦得慌、翻来覆去睡不着（虚烦不得眠）？'
}

