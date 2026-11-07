module.exports = {
  name: 'gancao_fuzi_tang',
  title: '甘草附子汤',
  kind: 'formula',
  // 第175条: 风湿相搏骨节疼烦，掣痛不得屈伸，近之则痛剧，汗出短气，小便不利，恶风不欲去衣，或身微肿者，甘草附子汤主之。
  // 风湿骨节疼不可屈伸。核心=骨节痛不可屈伸。
  needs: [
    ['joint_pain_rigid.yes'],
    ['urination_difficulty.yes', 'joint_pain_rigid.yes']
  ],
  contraindications: ['骨节疼烦不可屈伸(风湿)', '掣痛近之则剧', '温经散寒除湿']
}
