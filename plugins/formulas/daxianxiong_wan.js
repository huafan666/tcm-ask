module.exports = {
  name: 'daxianxiong_wan',
  title: '大陷胸丸',
  kind: 'formula',
  // 第131条: 病发于阳而反下之，结胸者项亦强，如柔痓状，下之则和，宜大陷胸丸。
  // 结胸兼项强(如柔痓)。核心=结胸(心下硬满)+项强。
  needs: [
    ['full_epigastric_hard_pain.yes', 'neck_stiff_pain.yes', 'cold_aversion.no']
  ],
  contraindications: ['结胸而项亦强(如柔痓)', '从心下至少腹硬满痛兼项强', '峻下逐水，丸剂缓图']
}
