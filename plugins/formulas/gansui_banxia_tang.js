module.exports = {
  name: 'gansui_banxia_tang',
  title: '甘遂半夏汤',
  kind: 'formula',
  // 金匮要略·痰饮咳嗽病脉证并治第十二：病者脉伏，其人欲自利，利反快，虽利，心下续坚满，此为留饮欲去故也，甘遂半夏汤主之。
  needs: [
    ['diarrhea.yes', 'epigastric_pressing_pain.yes'],
    ['diarrhea.yes', 'chest_qi_stuffiness.yes', 'tan_yin.yes']
  ],
  contraindications: ['治留饮欲去：本来拉肚子，拉完反而觉得舒服，但心口下面又继续硬满——说明水饮想走又走不干净', '甘遂峻下逐水，半夏化痰散结，芍药、甘草、白蜜缓急护正', '**甘遂有毒**，且原文特意注明「以蜜半升和药汁」——用蜜制缓其峻烈', '「利反快」是辨证关键：一般的腹泻拉完是虚，这种拉完却轻松，说明是在排邪', '孕妇、体虚、无实邪者忌用']
}
