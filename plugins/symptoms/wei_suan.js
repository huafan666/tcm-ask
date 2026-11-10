module.exports = {
  name: 'wei_suan',
  title: '反酸/烧心',
  trigger(text) { return ['胃酸', '酸水', '反酸', '烧心', '反胃酸', '胸口烧得慌', '胃里往上返酸'].some(k => text.includes(k)) },
  negate(text) { return ['不反酸', '没有烧心'].some(k => text.includes(k)) },
  ask: '是不是会反酸水、烧心？'
}
