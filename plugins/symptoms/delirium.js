module.exports = {
  name: 'delirium',
  title: '譫语',
  kind: 'symptom',
  trigger(text) { return ['譫语', '谵语', '说胡话', '胡言乱语', '神昏说胡话'].some(k => text.includes(k)) },
  negate(text) { return ['神志清', '不说胡话'].some(k => text.includes(k)) },
  ask: '是不是会说胡话、胡言乱语，叫他也不太清醒？'
}

