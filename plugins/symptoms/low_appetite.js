module.exports = {
  name: 'low_appetite',
  title: '默默不欲饮食',
  kind: 'symptom',
  trigger(text) { return ['不欲饮食', '不想吃饭', '默默不欲食', '没胃口', '食不下', '恶闻食臭', '闻到饭味就难受'].some(k => text.includes(k)) },
  negate(text) { return ['胃口好', '能吃饭'].some(k => text.includes(k)) },
  ask: '是不是没胃口、不想吃饭，也不太想说话？'
}

