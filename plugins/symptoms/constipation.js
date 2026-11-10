module.exports = {
  name: 'constipation',
  title: '便秘',
  kind: 'symptom',
  trigger(text) { return ['大便硬', '不大便', '便秘', '大便难', '拉不出来', '大便干结', '数日不大便', '大便几日一行', '燥屎', '大便干硬', '大便坚硬', '排便困难', '大便不通', '大便解不出', '解不出大便', '几天没大便', '大便秘结'].some(k => text.includes(k)) },
  negate(text) { return ['大便通', '大便正常', '能大便', '大便软', '大便溏'].some(k => text.includes(k)) },
  // 「便秘」是上位（笼统）问句，必须宽——重点在「拉得不痛快」，
  // 不能只描述重度那一头，否则轻度便秘（qingdubianmi）的病人会把上位答成「否」，
  // 然后被上下位约束连带否掉。具体轻重留给 qingdubianmi 去问。
  ask: '是不是大便不通畅——干硬难解、几天才一次，或者想拉又拉不出来？'
}
