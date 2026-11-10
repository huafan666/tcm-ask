module.exports = {
  name: 'feng_shui',
  title: '风水',
  kind: 'summary',
  // 金匮要略·水气病脉证并治第十四：风水其脉自浮，外证骨节疼痛，恶风……面目肿大，有热，名曰风水。
  needs: [
    ['pitting_edema.yes', 'wind_aversion.yes'],
    ['eyelid_puffy.yes', 'wind_aversion.yes'],
    ['pitting_edema.yes', 'joint_pain_rigid.yes', 'wind_aversion.yes']
  ],
  contraindications: ['五水之一。风水是风邪袭表、肺气不宣，水湿泛溢到肌表', '原文定义：脉浮、骨节疼痛、**恶风**——「恶风」是风水区别于皮水的关键', '常见起病方式：先有外感，然后突然眼泡肿、脸肿，接着全身肿', '治法「当发其汗」——水在表就从表解', '⚠ 眼泡肿、血尿、血压高的组合要警惕急性肾炎，建议查尿常规']
}
