module.exports = {
  name: 'banxia_xiexin_tang',
  title: '半夏泻心汤',
  kind: 'formula',
  // 第149/151条: 若心下满而硬痛者为结胸大陷胸主之；但满而不痛者此为痞，宜半夏泻心汤。
  // 心下痞(但满不痛)。核心=心下痞不痛。
  needs: [
    ['epigastric_lump_soft.yes', 'cold_aversion.no'],
    // 金匮第十七篇 呕吐哕下利 对应条文
    ['vomiting.yes','borborygmus.yes','epigastric_lump_soft.yes']
  ],
  contraindications: ['心下痞(但满不痛、按之不解)', '寒热错杂之痞', '和胃降逆、开结除痞']
}
