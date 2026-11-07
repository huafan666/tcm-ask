module.exports = {
  name: 'sini_tang',
  title: '四逆汤',
  kind: 'formula',
  // 第91条: 伤寒医下之，续得下利清谷不止，身疼痛者，急当救里，宜四逆汤。
  // 里虚寒(下利清谷)救里。核心=下利清谷。
  needs: [
    ['clear_grain_diarrhea.yes', 'cold_drink_desire.no'],
    ['vomiting.yes', 'xiaobian_fuli.yes', 'cold_extremities.yes']
  ],
  contraindications: ['下利清谷(里虚寒)急当救里', '回阳救逆', '表里同病先救里', '这里如果是小便有问题的类型，是由于中焦的寒湿太多导致热量无法下达下焦，导致小便控制不住自己就流出']
}
