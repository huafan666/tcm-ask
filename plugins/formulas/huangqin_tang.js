module.exports = {
  name: 'huangqin_tang',
  title: '黄芩汤',
  kind: 'formula',
  // 第172条: 太阳与少阳合病，自下利者，与黄芩汤。
  needs: [
    ['diarrhea.yes', 'hypochondriac_fullness.yes', 'cold_aversion.no', 'clear_grain_diarrhea.no'],
    ['diarrhea.yes', 'cold_aversion.no', 'clear_grain_diarrhea.no']
  ],
  contraindications: ['太阳少阳合病自下利', '清热止利']
}
