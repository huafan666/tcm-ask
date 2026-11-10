module.exports = {
  name: 'bao_zu',
  title: '胞阻',
  kind: 'summary',
  // 金匮要略·妇人妊娠病脉证并治第二十：师曰：妇人有漏下者，有半产后因续下血都不绝者，有妊娠下血者，假令妊娠腹中痛，为胞阻，胶艾汤主之。
  needs: [
    ['pregnancy.yes', 'abdominal_cramp_after_birth.yes', 'vaginal_bleeding.yes'],
    ['pregnancy.yes', 'abdominal_pain.yes', 'vaginal_bleeding.yes'],
    ['pregnancy.yes', 'abdominal_pain.yes']
  ],
  contraindications: ['胞阻是妊娠期间**腹中痛 + 下血**，病机是冲任虚寒、阴血不能养胎、气血阻滞（「胞」指胞宫）', '原文把三种下血并列：平常的漏下、半产后持续下血、妊娠下血；只有「妊娠腹中痛 + 下血」才叫胞阻', '主方胶艾汤（芎归胶艾汤）：阿胶、艾叶养血温经止血，配四物汤养血，甘草缓和', '⚠ **妊娠期阴道出血伴腹痛是危险信号**，要先排除流产、宫外孕、胎盘问题，必须及时就医做超声']
}
