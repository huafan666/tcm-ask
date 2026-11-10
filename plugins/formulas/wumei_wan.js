module.exports = {
  name: 'wumei_wan',
  title: '乌梅丸',
  kind: 'formula',
  // 第338条: 蚘厥者其人当吐蚘,今病者静而复时烦,得食而呕又烦者,乌梅丸主之。又主久利。
  // 蚘厥(蛔厥): 吐蚘+静而复时烦+得食而呕又烦。又主久利。
  needs: [
    ['round_worm_vomit.yes', 'restless.yes'],
    ['chronic_diarrhea.yes'],
    ['chongji.yes'],
    // 金匮 19.14：蚘厥者，乌梅丸主之（蛔厥：吐蛔、静而复时烦、得食而呕又烦）
    ['round_worm_vomit.yes', 'restless.yes', 'vomiting.yes'],
    // 326条厥阴提纲：消渴，气上撞心，心中疼热，饥而不欲食，食则吐蛔
    // 「饥不欲食」这一对矛盾症状是厥阴病的关键
    ['qi_surge.yes', 'hungry.yes', 'low_appetite.yes']
  ],
  contraindications: ['吐蚘(蛔厥)+时烦/得食而呕又烦', '又主久利(慢性)', '安蛔止痛(乌梅黄连黄柏等)', '禁生冷滑物臭食']
}
