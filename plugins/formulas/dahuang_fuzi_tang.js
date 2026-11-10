module.exports = {
  name: 'dahuang_fuzi_tang',
  title: '大黄附子汤',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：胁下偏痛，发热，其脉紧弦，此寒也，以温药下之，宜大黄附子汤。
  needs: [
    ['hypochondriac_side_pain.yes', 'constipation.yes'],
    ['hypochondriac_side_pain.yes', 'abdominal_pain.yes', 'cold_aversion.yes']
  ],
  contraindications: ['治「寒实内结」：一侧胁下痛、发热、大便秘结，但病性是**寒**不是热', '关键在「以温药下之」——用大黄泻下，同时配附子、细辛温散寒邪，这叫「温下法」', '和承气汤类（寒下）的区别：那种是热结（喜冷饮、舌黄），本方是寒结（怕冷、脉紧弦）', '附子有毒须久煎；服后大便通即停']
}
