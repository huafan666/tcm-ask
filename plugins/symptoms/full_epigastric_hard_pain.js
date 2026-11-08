module.exports = {
  name: 'full_epigastric_hard_pain',
  title: '心下至少腹硬满痛(不按也痛)',
  kind: 'symptom',
  trigger(text) { return ['心下至少腹硬满', '从心下痛到少腹', '不按也痛', '不碰也痛', '不按也疼', '不碰也疼', '胃到小腹硬痛', '整个肚子硬痛', '整个肚子硬疼', '心口硬到小腹', '心下硬满痛不可近', '胃到小腹都胀硬'].some(k => text.includes(k)) },
  negate(text) { return ['胃不硬也不痛'].some(k => text.includes(k)) },
  ask: '是不是从心口一直到小腹这一大片又硬又胀，不碰它也痛？'
}

