module.exports = {
  name: 'joint_pain_rigid',
  title: '骨节疼烦不可屈伸',
  kind: 'symptom',
  trigger(text) { return ['骨节疼烦', '骨节痛', '关节痛不能伸', '不可屈伸', '关节僵硬痛', '掣痛不得屈伸', '关节又酸又痛', '关节痛得弯不下去', '关节伸不直', '弯不下去', '关节痛得伸不直', '关节僵', '关节发僵', '关节硬邦邦'].some(k => text.includes(k)) },
  negate(text) { return ['关节灵活'].some(k => text.includes(k)) },
  ask: '是不是关节又酸又痛，弯也弯不下去、伸也伸不直？'
}

