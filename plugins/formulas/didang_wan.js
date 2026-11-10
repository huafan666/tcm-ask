module.exports = {
  name: 'didang_wan',
  title: '抵当丸',
  kind: 'formula',
  // 第126条: 伤寒有热少腹满，应小便不利反利者，为有血也，当下之，宜抵当丸。
  // 蓄血(较抵当汤缓): 有热少腹满+小便反利。与抵当汤区别在腹部(满vs硬满/发狂)
  needs: [
    ['lower_abdominal_lump.yes', 'easy_urination.yes', 'cold_aversion.no', 'poor_complexion.no'],
    ['lower_abdominal_lump.yes', 'easy_urination.yes']
  ],
  contraindications: ['有热少腹满、小便反利(有血)', '较抵当汤证稍缓', '下瘀血']
}
