module.exports = {
  name: 'didang_tang',
  title: '抵当汤',
  kind: 'formula',
  // 第124/125条: 太阳病表证仍在脉微而沉反不结胸其人发狂，热在下焦少腹当硬满，小便自利者下血乃愈，抵当汤主之。
  // 蓄血重证(血分蓄血、瘀热在里): 少腹硬满+发狂+小便自利。
  // 与桃核承气区别在小便(本证小便自利示血分蓄血)，非单纯轻重。
  needs: [
    ['lower_abdominal_lump.yes', 'manic.yes', 'easy_urination.yes', 'cold_aversion.no', 'poor_complexion.no']
  ],
  contraindications: ['少腹硬满+发狂+小便自利(蓄血重证)', '瘀热在里', '破血逐瘀(水蛭虻虫)', '小便自利为血分蓄血之据']
}
