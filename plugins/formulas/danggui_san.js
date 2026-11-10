module.exports = {
  name: 'danggui_san',
  title: '当归散',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妇人妊娠，宜常服当归散主之。
  needs: [
    ['pregnancy.yes', 'restless.yes'],
    ['pregnancy.yes', 'low_energy.yes'],
    ['pregnancy.yes']
  ],
  contraindications: ['妊娠「常服」的养胎方，偏**血虚而有热**者', '五味：当归、黄芩、芍药、川芎各一两，白术半斤（白术用量最大）——养血、清热、健脾安胎', '原文说「妊娠常服即易产，胎无疾苦，产后百病悉主之」——古人把它当保健方用', '⚠ 现代观点：**不主张无症状的孕妇长期服药**。「常服」应按个体辨证，不可理解为人人该吃', '黄芩、白术是后世「安胎圣药」的组合，出自此方']
}
