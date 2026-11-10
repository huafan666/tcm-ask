module.exports = {
  name: 'baihu_jia_renshen',
  title: '白虎加人参汤',
  kind: 'formula',
  // 第26条: 服桂枝汤大汗出后大烦渴不解脉洪大者，白虎加人参汤主之。
  // 白虎=纯热证：强调一点都不怕冷(不恶寒)，区分表证/半表半里。
  // 暂不做脉，去脉洪大。
  //
  // 白虎汤 vs 白虎加人参汤：原文里加人参的指征**不是「渴得更厉害」，而是「津气两伤」**——
  //   26 条「服桂枝汤，大汗出后，大烦渴不解」          → 汗多伤津
  //   169 条「大渴，舌上干燥而烦」「时时恶风」          → 口干舌燥 / 恶风
  //   170 条「背微恶寒」                                → 背恶寒
  //   金匮 13.12「渴欲饮水，口干舌燥者」                 → 口干舌燥
  // 所以本方第 1 条不再用光秃秃的「大渴+不恶寒」，必须同时有津气两伤的证据；
  // 白虎汤那边则要求 mouth_dry.no。两边一配，口干就分得开了。
  needs: [
    ['severe_thirst.yes', 'cold_aversion.no', 'mouth_dry.yes'],
    ['severe_thirst.yes', 'cold_aversion.no', 'wind_aversion.yes'],
    ['severe_thirst.yes', 'cold_aversion.no', 'back_cold_patch.yes'],
    ['sweat.yes', 'cold_aversion.yes', 'fever.yes', 'thirsty.yes'],
    // 金匮 13.12：渴欲饮水，口干舌燥者，白虎加人参汤主之
    ['thirsty.yes', 'mouth_dry.yes'],
    // 旧路径：原先用「嗓子发干」（throat_dry）顶替「口干舌燥」，
    // 但咽干和口腔津亏不是一回事，现在有了 mouth_dry，这条只作为兼容保留
    ['thirsty.yes', 'throat_dry.yes', 'fever.yes']
  ],
  contraindications: ['纯热证(不恶寒)才可', '大烦渴不解、热盛津伤', '清热生津益气', '若兼恶寒则非白虎证', '金匮要略·痉湿暍病脉证并治第二：太阳中热者，暍是也。汗出恶寒，身热而渴，白虎加人参汤主之（暍病：暑热逼津外泄、汗多肌疏故恶寒）', '与白虎汤的鉴别：兼口干舌燥 / 时时恶风 / 背微恶寒（津气两伤）者用本方']
}

