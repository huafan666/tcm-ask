module.exports = {
  name: 'gancao_ganjiang_tang',
  title: '甘草干姜汤',
  kind: 'formula',
  // 金匮要略·肺痿肺痈咳嗽上气病脉证并治第七：肺痿吐涎沫而不咳者，其人不渴，必遗尿，小便数……此为肺中冷，必眩，多涎唾，甘草干姜汤以温之。
  needs: [
    ['saliva_spit.yes', 'thirsty.no'],
    ['saliva_spit.yes', 'urine_incontinence.yes']
  ],
  contraindications: ['治虚寒型肺痿：吐清稀涎沫、口不渴、遗尿、小便次数多', '只有炙甘草 + 干姜两味，温肺复气——肺中冷了，用干姜温、甘草补', '「其人不渴」是关键鉴别：口渴说明有热，就不能用这个温法', '原文还提醒：吃完药如果反而口渴了，那是转成消渴了，要换方向']
}
