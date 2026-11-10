module.exports = {
  name: 'baitong_jia_zhudanzhi_tang',
  title: '白通加猪胆汁汤',
  kind: 'formula',
  // 315条：少阴病，下利，脉微者，与白通汤。利不止，厥逆无脉，干呕烦者，白通加猪胆汁汤主之。服汤，脉暴出者死，微续者生。
  needs: ['diarrhea.yes', 'cold_extremities.yes', 'vomiting.yes', 'restless.yes'],
  contraindications: ['315条：少阴病下利，服白通汤后利不止、厥逆无脉、干呕而烦', '白通汤加人尿、猪胆汁——咸苦反佐，引阳药入阴，防格拒', '原文「服汤，脉暴出者死，微续者生」——脉暴出是阳气外脱，须警惕', '⚠ 阴盛格阳重证，非急危重症不用']
}
