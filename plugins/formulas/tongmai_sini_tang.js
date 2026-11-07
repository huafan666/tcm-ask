module.exports = {
  name: 'tongmai_sini_tang',
  title: '通脉四逆汤',
  kind: 'formula',
  // 第317条: 少阴病下利清谷里寒外热手足厥逆脉微欲绝身反不恶寒其人面色赤。
  // 真寒假热(里寒外热): 下利清谷+身反不恶寒面赤+手足逆冷。与四逆汤区别在里寒外热(面赤)。
  needs: [
    ['clear_grain_diarrhea.yes', 'inner_cold_outer_heat.yes', 'cold_extremities.yes', 'cold_drink_desire.no']
  ],
  contraindications: ['下利清谷+里寒外热(面赤)+手足逆冷(真寒假热)', '回阳通脉(重用干姜附子)', '面色赤真寒假热,非实热禁用寒药', '与四逆汤区别在里寒外热面赤']
}
