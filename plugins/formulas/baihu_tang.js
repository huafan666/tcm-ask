module.exports = {
  name: 'baihu_tang',
  title: '白虎汤',
  kind: 'formula',
  // 第176条: 伤寒脉浮滑，此表有热里有寒，白虎汤主之。
  // 阳明气分热盛。核心=大热、大渴、汗出(一般)。用大烦渴判。
  needs: [
    ['severe_thirst.yes', 'cold_aversion.no'],
    ['zijue_shenre.yes', 'shuangzu_re.yes', 'shouhan.yes', 'dark_urine.yes', 'cold_aversion.no']
  ],
  contraindications: ['热盛津伤(大热大渴)', '表未解无汗者忌', '清热生津']
}
