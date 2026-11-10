module.exports = {
  name: 'zhuling_san',
  title: '猪苓散',
  kind: 'formula',
  // 金匮要略·呕吐哕下利病脉证并治第十七：呕吐而病在膈上，后思水者，解，急与之。思水者，猪苓散主之。
  needs: [
    ['vomiting.yes', 'thirsty.yes'],
    ['vomiting.yes', 'thirsty.yes', 'urination_difficulty.yes']
  ],
  contraindications: ['治呕吐之后口渴想喝水的情况。原文说「后思水者，解，急与之」——吐完想喝水，是想好的征兆，赶紧给他喝', '但如果「思水」而水饮仍未化，就要用猪苓散：猪苓、茯苓、白术，利水健脾', '思路很妙：渴想喝水，可不能一味灌水（水停更吐），要用利水药把水引导下去', '做成散剂「饮服方寸匕，日三服」']
}
