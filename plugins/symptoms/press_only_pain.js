module.exports = {
  name: 'press_only_pain',
  title: '心下按之则痛(仅心下)',
  kind: 'symptom',
  trigger(text) { return ['按之则痛', '按着才痛', '一按就痛', '按到才疼', '按着疼', '手按心口才痛', '仅心下按痛'].some(k => text.includes(k)) },
  negate(text) { return ['按着不痛'].some(k => text.includes(k)) },
  ask: '是不是只有按到心口（胃）才痛，不按就不痛？'
}

