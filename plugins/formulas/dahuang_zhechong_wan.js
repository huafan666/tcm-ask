module.exports = {
  name: 'dahuang_zhechong_wan',
  title: '大黄䗪虫丸',
  kind: 'formula',
  // 金匮要略·血痹虚劳病脉证并治第六：五劳虚极羸瘦，腹满不能饮食……内有干血，肌肤甲错，两目黯黑，缓中补虚，大黄䗪虫丸主之。
  needs: [
    ['weight_loss.yes', 'skin_scaly.yes'],
    ['skin_scaly.yes', 'eyes_dark_rims.yes'],
    ['weight_loss.yes', 'skin_scaly.yes', 'abdominal_fullness.yes']
  ],
  contraindications: ['治「干血劳」：瘦得厉害、肚子胀吃不下，皮肤干得像鱼鳞、眼睛周围发暗', '病机是瘀血干结在里（原文「内有干血」），新血生不出来，所以人越来越瘦', '方中大黄、䗪虫（土元）、水蛭、虻虫、蛴螬、干漆破血逐瘀，配地黄、芍药、甘草养正', '治法是「缓中补虚」——用丸药小量缓攻，寓补于攻，不能峻下', '孕妇绝对忌用（破血药极猛）']
}
