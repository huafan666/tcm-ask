module.exports = {
  name: 'mei_he_qi',
  title: '梅核气',
  kind: 'summary',
  // 金匮要略·妇人杂病脉证并治第二十二：妇人咽中如有炙脔，半夏厚朴汤主之。
  needs: [
    ['throat_lump_foreign.yes'],
    ['throat_lump_foreign.yes', 'chest_qi_stuffiness.yes'],
    ['throat_lump_foreign.yes', 'hypochondriac_fullness.yes']
  ],
  contraindications: ['梅核气：**咽中如有炙脔**——嗓子里好像有块烤熟的肉堵着，咳不出来也咽不下去，但吃饭喝水不受影响（这一点很重要，可与真正的食管梗阻区分）', '病机是**痰气互结**：情志不舒、气机郁滞，痰随气结于咽喉', '半夏厚朴汤（半夏、厚朴、茯苓、生姜、苏叶）——行气开郁、降逆化痰', '多见于情绪紧张、压力大时加重；现代常对应咽部异物感症、癔球症', '⚠ 如果**真的吞咽困难、体重下降、进食梗阻感进行性加重**，必须做胃镜排除食管病变，不能一律当梅核气']
}
