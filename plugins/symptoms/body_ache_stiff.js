module.exports = {
  name: 'body_ache_stiff',
  title: '身体疼烦不能转侧',
  kind: 'symptom',
  trigger(text) { return ['身体疼烦', '浑身酸痛不能翻身', '不能转侧', '身体疼得不能动'].some(k => text.includes(k)) },
  negate(text) { return ['身体灵活'].some(k => text.includes(k)) },
  ask: '是不是浑身又酸又痛、翻个身都困难，心里还烦？'
}

