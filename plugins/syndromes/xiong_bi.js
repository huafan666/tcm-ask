module.exports = {
  name: 'xiong_bi',
  title: '胸痹',
  kind: 'summary',
  // 金匮要略·胸痹心痛短气病脉证并治第九：胸痹之病，喘息咳唾，胸背痛，短气……胸痹不得卧，心痛彻背……胸痹，胸中气塞，短气。
  needs: [
    ['chest_back_pain.yes'],
    ['chest_back_pain.yes', 'short_breath.yes'],
    ['chest_back_pain.yes', 'cough.yes'],
    ['chest_stuffy.yes', 'short_breath.yes'],
    ['heart_pain_radiate.yes']
  ],
  contraindications: ['胸痹是胸中阳气不通、痰浊瘀血痹阻，表现为胸背痛、胸闷、气短、喘咳', '病机原文叫「阳微阴弦」——上焦阳气太虚（阳微），下焦阴寒之邪反而上乘（阴弦）', '轻重分层：轻的只是胸中气塞短气（茯苓杏仁甘草汤/橘枳姜汤）；重的躺不平、心痛透到后背（栝蒌薤白半夏汤）', '《金匮》的胸痹包含现代的冠心病心绞痛、部分食管与胸壁疾患', '胸闷痛持续不缓解、伴大汗出、面唇发紫的，要立刻急诊，别在家里辨证']
}
