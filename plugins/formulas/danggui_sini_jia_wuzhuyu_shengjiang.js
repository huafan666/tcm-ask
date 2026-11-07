module.exports = {
  name: 'danggui_sini_jia_wuzhuyu_shengjiang',
  title: '当归四逆加吴茱萸生姜汤',
  kind: 'formula',
  // 第352条: 手足厥寒脉细欲绝者当归四逆汤主之;若其人内有久寒者宜当归四逆加吴茱萸生姜汤。
  // 当归四逆证兼内久寒(干呕吐涎沫/腹中冷痛)。核心=手足厥寒+血虚+久寒(呕吐涎沫/腹痛)。
  needs: [
    ['cold_extremities.yes', 'poor_complexion.yes', 'vomit_saliva.yes', 'cold_drink_desire.no'],
    ['cold_extremities.yes', 'poor_complexion.yes', 'abdominal_pain.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['手足厥寒+血虚+内久寒(呕吐涎沫/腹痛)', '温经散寒降逆(加吴茱萸生姜)', '无久寒者用当归四逆即可', '兼寒兼补(清酒煎)']
}
