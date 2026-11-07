module.exports = {
  name: 'fuzi_xiexin_tang',
  title: '附子泻心汤',
  kind: 'formula',
  // 第155条: 心下痞，而复恶寒汗出者，附子泻心汤主之。
  // 热痞兼阳虚(恶寒汗出)。核心=心下痞+恶寒汗出。
  needs: [
    ['epigastric_lump_soft.yes', 'cold_aversion.yes', 'sweat.yes']
  ],
  contraindications: ['心下痞而恶寒汗出(阳虚)', '泄热消痞兼温阳', '与大黄黄连泻心区别在有恶寒汗出']
}
