module.exports = {
  name: 'maziren_wan',
  title: '麻子仁丸',
  kind: 'formula',
  // 第247条: 跌阳脉浮而涩浮则胃气强涩则小便数浮涩相搏大便则硬其脾为约麻子仁丸主之。
  // 脾约: 津液偏渗膀胱，小便数而大便硬，无潮热烦渴(非热结)。核心=大便硬+小便数。
  needs: [
    ['constipation.yes', 'frequent_urination.yes']
  ],
  contraindications: ['大便硬+小便数(脾约津亏)', '津液偏渗致便硬而非热结', '润肠通便(麻仁杏仁芍药)', '无潮热烦渴之实热']
}
