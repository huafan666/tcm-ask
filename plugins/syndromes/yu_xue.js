module.exports = {
  name: 'yu_xue',
  title: '瘀血',
  kind: 'summary',
  // 金匮要略·惊悸吐衄下血胸满瘀血病脉证并治第十六：病人胸满，唇痿舌青，口燥，但欲漱水不欲咽，无寒热……为有瘀血……此为阴伏，是瘀血也，当下之。
  needs: [
    ['tongue_blue.yes', 'thirst_rinse_only.yes'],
    ['tongue_blue.yes', 'chest_stuffy.yes', 'black_stool.yes'],
    ['thirst_rinse_only.yes', 'chest_stuffy.yes'],
    ['tongue_blue.yes', 'skin_scaly.yes']
  ],
  contraindications: ['瘀血的辨识要点很特别：**「但欲漱水不欲咽」**——嘴里干、只想含口水漱一下，并不想咽下去。这是因为瘀血内停、津液不能上承，不是真的缺水', '其他表现：胸满、口唇枯萎（唇痿）、**舌质青紫（舌青）**、腹不满但病人自称胀满', '16.11 还说「如热状，烦满，口干燥而渴，其脉反无热，此为阴伏」——**看着像发热、烦躁口渴，但一摸脉并没有热象**，这是瘀血伏在阴分（叫阴伏）', '治法原文明确：「是瘀血也，**当下之**」——瘀血要用下法去', '⚠ 舌质青紫、黑便、肌肤甲错这类表现，现代须排查凝血功能、消化道出血、肿瘤等']
}
