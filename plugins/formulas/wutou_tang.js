module.exports = {
  name: 'wutou_tang',
  title: '乌头汤',
  kind: 'formula',
  // 金匮要略·中风历节病脉证并治第五：病历节不可屈伸，疼痛，乌头汤主之。乌头汤方：治脚气疼痛，不可屈伸。
  needs: [
    ['joint_pain_rigid.yes', 'joint_pain_severe.yes'],
    ['joint_pain_rigid.yes', 'lower_leg_cold.yes'],
    ['jiao_qi_pain.yes']
  ],
  contraindications: ['治历节病和脚气病，共同点是「疼痛剧烈、关节伸不直弯不下」（不可屈伸）', '乌头（川乌）为主药，散寒止痛力量极猛，配麻黄、黄芪、芍药、甘草、白蜜', '**乌头有大毒**：必须按原法用蜜煎、久煎，绝不能生用或加量；中毒表现是口舌发麻、心慌、心律不齐', '孕妇忌用；服后若唇舌发麻要立即停药就医']
}
