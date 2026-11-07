module.exports = {
  name: 'epigastric_lump_soft',
  title: '心下痞(但满不痛、按之濡)',
  kind: 'symptom',
  trigger(text) { return ['心下痞', '心下满不痛', '但满不痛', '按之濡', '心下堵但不痛', '胃脘胀但不疼'].some(k => text.includes(k)) },
  negate(text) { return ['心下硬痛'].some(k => text.includes(k)) },
  ask: '是不是心口(胃)部位觉得满胀、发堵，但按着不痛、软软的(不是硬痛)？这叫痞证，和结胸不一样。'
}

