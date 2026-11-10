module.exports = {
  name: 'baihu_tang',
  title: '白虎汤',
  kind: 'formula',
  // 第176条: 伤寒脉浮滑，此表有热里有寒，白虎汤主之。
  // 阳明气分热盛。核心=大热、大渴、汗出(一般)。用大烦渴判。
  needs: [
    // 第 1 条加了 mouth_dry.no：口干舌燥是「津气两伤」的标志，
    // 那是白虎**加人参**汤的指征（金匮 13.12「渴欲饮水，口干舌燥者，白虎加人参汤主之」）。
    // 不加这一条的话，两个方的第一条路径一模一样，永远分不开。
    // 问「口干舌燥」时如果病人答不知道，这条路径不阻断，白虎汤照样留在候选里。
    ['severe_thirst.yes', 'cold_aversion.no', 'mouth_dry.no'],
    ['zijue_shenre.yes', 'shuangzu_re.yes', 'shouhan.yes', 'dark_urine.yes', 'cold_aversion.no']
  ],
  contraindications: ['热盛津伤(大热大渴)', '表未解无汗者忌', '清热生津',
    '与白虎加人参汤的鉴别：兼口干舌燥 / 时时恶风 / 背微恶寒（津气两伤）者用加人参汤，本方不加']
}
