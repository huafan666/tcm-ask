module.exports = {
  name: 'yuebi_jia_zhu_tang',
  title: '越婢加术汤',
  kind: 'formula',
  // 金匮要略·水气病脉证并治第十四：里水者，一身面目黄肿，其脉沉，小便不利……越婢加术汤主之。里水，越婢加术汤主之。
  needs: [
    ['pitting_edema.yes', 'urination_difficulty.yes'],
    ['eyelid_puffy.yes', 'urination_difficulty.yes']
  ],
  contraindications: ['治里水（一身面目黄肿、小便不利）', '越婢汤（麻黄、石膏、生姜、大枣、甘草）+ 白术——麻黄宣肺发汗、石膏清郁热、白术健脾除湿', '一面从表散水、一面从里健脾，适合表里同病的水肿', '原文另有一句重要鉴别：「假如小便自利，此亡津液，故令渴也」——小便如果通畅还渴，那是津液已伤，不是水停']
}
