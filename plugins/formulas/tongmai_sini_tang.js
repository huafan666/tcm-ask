module.exports = {
  name: 'tongmai_sini_tang',
  title: '通脉四逆汤',
  kind: 'formula',
  // 
  needs: [
    ['clear_grain_diarrhea.yes', 'mian_chi.yes', 'cold_extremities.yes', 'cold_aversion.no'],
    ['diarrhea.yes', 'cold_extremities.yes', 'sweat.yes']
  ],
  contraindications: ['下利清谷+里寒外热(面赤)+手足逆冷(真寒假热)', '回阳通脉(重用干姜附子)', '面色赤真寒假热,非实热禁用寒药', '与四逆汤区别在里寒外热面赤']
}
