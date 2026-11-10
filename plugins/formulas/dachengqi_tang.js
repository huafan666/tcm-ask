module.exports = {
  name: 'dachengqi_tang',
  title: '大承气汤',
  kind: 'formula',
  // 阳明篇大承气条: 208/209/212/215/217/220/238/240/241/242/251/252/253/254/255/256
  // 阳明腑实燥屎重证。核心=纯热证 + 大便硬 + 身体好(气色不差)。
  // 佐证(潮热/譫语/左腹按痛/不放屁)命中其一即成立——都是佐证不是铁律。
  // 身体好时直接用大承气峻下; 虚证(气色差/喜热饮/恶寒)禁用——泻下伤身。
  needs: [
    ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'tidal_fever.yes'],
    ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'delirium.yes'],
    ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'left_abdomen_press_pain.yes'],
    ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'poor_complexion.no', 'flatus.no'],
    ['kou_jin.yes', 'chest_fullness.yes', 'limb_spasm.yes', 'cold_drink_desire.yes'],
    // 金匮 10.13：腹满不减，减不足言，当须下之，宜大承气汤（腹满持续不消＝里实壅结）
    ['abdominal_fullness.yes', 'severe_abdominal_pain.yes']
  ,
    // 金匮 17.39：下利，三部脉皆平，按之心下坚者，急下之，宜大承气汤
    ['diarrhea.yes','epigastric_lump_soft.yes'],
    // 金匮 21.3/21.7：病解能食七八日更发热此为胃实；产后七八日少腹坚痛恶露不尽、不大便烦躁发热，宜大承气汤
    ['postpartum.yes','constipation.yes','delirium.yes'],
    ['postpartum.yes','lochia_retention.yes','fever.yes']
  ],
  contraindications: ['纯热证才可用(喜冷饮+不恶寒)+身体好(气色不差)', '虚证/气色差/喜热饮者禁用(泻下伤身)', '佐证: 潮热/譫语/左腹按痛/不放屁任一', '峻下热结(大黄芒硝枳朴)', '得下餘勿服', '金匮要略·痉湿暍病脉证并治第二：痉为病，胸满口噤，卧不著席，脚挛急，必齘齿，可与大承气汤']
}
