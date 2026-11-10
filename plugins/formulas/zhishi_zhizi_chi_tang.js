module.exports = {
  name: 'zhishi_zhizi_chi_tang',
  title: '枳实栀子豉汤',
  kind: 'formula',
  // 393条：大病差后，劳复者，枳实栀子豉汤主之。
  needs: ['fever.yes', 'vex_insomnia.yes', 'cold_aversion.no'],
  contraindications: ['393条：大病差后，劳复者', '枳实、栀子、豆豉——清热除烦、宽中下气；有宿食者加大黄', '「劳复」指大病初愈因劳累而复发热，不是新感外邪（故不恶寒）', '⚠ 原文症状描述很简略，本方判据的可信度低于其它方']
}
