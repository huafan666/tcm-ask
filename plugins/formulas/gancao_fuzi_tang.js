module.exports = {
  name: 'gancao_fuzi_tang',
  title: '甘草附子汤',
  kind: 'formula',
  // 第175条: 风湿相搏骨节疼烦，掣痛不得屈伸，近之则痛剧，汗出短气，小便不利，恶风不欲去衣，或身微肿者，甘草附子汤主之。
  // 风湿骨节疼不可屈伸。核心=骨节痛不可屈伸。
  needs: [
    ['joint_pain_rigid.yes', 'press_pain_aggravated.yes', 'urination_difficulty.yes', 'wind_aversion.yes'],
    ['joint_pain_rigid.yes', 'urination_difficulty.yes', 'short_breath.yes', 'mild_edema.yes']
  ],
  contraindications: ['风湿最重、表里阳气俱虚：骨节疼烦掣痛不得屈伸', '近之则痛剧（按之痛剧）是本方区别于普通关节痛的关键体征', '小便不利 + 短气 + 身微肿 = 阳虚不能化气行水', '温经散寒、助阳化湿（甘草附子汤）']
}
