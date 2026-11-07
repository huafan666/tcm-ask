module.exports = {
  name: 'joint_pain_rigid',
  title: '骨节疼烦不可屈伸',
  kind: 'symptom',
  trigger(text) { return ['骨节疼烦', '骨节痛', '关节痛不能伸', '不可屈伸', '关节僵硬痛', '掣痛不得屈伸'].some(k => text.includes(k)) },
  negate(text) { return ['关节灵活'].some(k => text.includes(k)) },
  ask: '是不是骨节/关节又酸又痛、痛得不能弯曲伸展?'
}

