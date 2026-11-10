module.exports = {
  name: 'jishibai_san',
  title: '鸡屎白散',
  kind: 'formula',
  // 金匮要略·趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治第十九：转筋入腹者，鸡屎白散主之。鸡屎白。
  needs: [
    ['limb_straight_spasm.yes', 'abdominal_tension.yes'],
    ['limb_straight_spasm.yes', 'severe_abdominal_pain.yes'],
    ['zhuan_jin.yes', 'abdominal_tension.yes']
  ],
  contraindications: ['治「转筋入腹」——抽筋从四肢蔓延到腹部，腹部抽紧，是转筋的重证', '只有一味：鸡屎白（鸡粪上的白色部分，晒干炒用），「为散，取方寸匕，以水六合，和，温服」', '鸡屎白古法用于转筋、淋病、腹胀，现代已极少使用', '⚠ 现代观点：抽筋入腹要考虑严重电解质紊乱、破伤风、低钙抽搐等，**必须立即就医**，不可依赖此类古方']
}
