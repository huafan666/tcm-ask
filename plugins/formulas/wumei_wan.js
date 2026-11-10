module.exports = {
  name: 'wumei_wan',
  title: '乌梅丸',
  kind: 'formula',
  // 第338条: 蚘厥者其人当吐蚘,今病者静而复时烦,得食而呕又烦者,乌梅丸主之。又主久利。
  // 蚘厥(蛔厥): 吐蚘+静而复时烦+得食而呕又烦。又主久利。
  needs: [
    ['round_worm_vomit.yes', 'restless.yes'],
    ['chronic_diarrhea.yes'],
    ['chongji.yes']
  ],
  contraindications: ['吐蚘(蛔厥)+时烦/得食而呕又烦', '又主久利(慢性)', '安蛔止痛(乌梅黄连黄柏等)', '禁生冷滑物臭食']
}
