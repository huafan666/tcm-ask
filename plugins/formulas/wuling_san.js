module.exports = {
  name: 'wuling_san',
  title: '五苓散',
  kind: 'formula',
  // 第71/72/73/74条: 大汗后胃干烦渴欲饮，脉浮小便不利微热消渴；汗出而渴；渴欲饮水水入则吐(水逆)。水蓄膀胱气化不利。
  // 核心=渴+小便不利；水逆=渴欲饮水+水入则吐。
  needs: [
    ['thirsty.yes', 'urination_difficulty.yes'],
    ['thirsty.yes', 'vomiting.yes', 'no_sweat.yes'],
    // 金匮 12.32：假令瘦人脐下有悸，吐涎沫而癫眩，此水也，五苓散主之
    ['below_palp.yes', 'saliva_spit.yes'],
    // 金匮 13.5/13.6：脉浮小便不利微热消渴者五苓散主之；渴欲饮水，水入则吐者名水逆，五苓散主之
    ['water_reflux.yes'],
    // 386条：霍乱吐利，「热多欲饮水者」用五苓散；「寒多不用水者」用理中丸——渴与不渴是分水岭
    ['vomiting.yes', 'diarrhea.yes', 'thirsty.yes']
  ],
  contraindications: ['太阳蓄水、气化不利', '渴欲饮水+小便不利', '水入则吐为水逆', '多饮暖水助汗']
}
