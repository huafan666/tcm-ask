module.exports = {
  name: 'danggui_sini_tang',
  title: '当归四逆汤',
  kind: 'formula',
  // 第351条: 手足厥寒脉细欲绝者当归四逆汤主之。
  // 营血虚寒致手足厥寒(血虚面白,非阳虚亡阳)。核心=手足厥寒+血虚(气色差)。
  // 与阳虚(通脉四逆/四逆散)区别: 本证为营血不足+寒凝,非阳衰。
  needs: [
    ['cold_extremities.yes', 'poor_complexion.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['手足厥寒+面色无华(营血虚寒)', '养血温经通脉(当归桂枝芍药细辛通草)', '非阳虚亡阳(阳虚用附子辈)', '内有久寒者加吴茱萸生姜']
}
