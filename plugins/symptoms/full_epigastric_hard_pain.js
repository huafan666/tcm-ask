module.exports = {
  name: 'full_epigastric_hard_pain',
  title: '心下至少腹硬满痛(不按也痛)',
  kind: 'symptom',
  trigger(text) { return ['心下至少腹硬满', '从心下痛到少腹', '不按也痛', '不碰也痛', '不按也疼', '不碰也疼', '胃到小腹硬痛', '整个肚子硬痛', '整个肚子硬疼', '心口硬到小腹', '心下硬满痛不可近', '胃到小腹都胀硬'].some(k => text.includes(k)) },
  negate(text) { return ['胃不硬也不痛'].some(k => text.includes(k)) },
  ask: '是不是心口(胃)一直到小腹这一片硬、胀、发痛，而且不碰它也痛？(大结胸：从心下到少腹整片硬痛)'
}

