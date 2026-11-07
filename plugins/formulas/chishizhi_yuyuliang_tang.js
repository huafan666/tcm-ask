module.exports = {
  name: 'chishizhi_yuyuliang_tang',
  title: '赤石脂禹余粮汤',
  kind: 'formula',
  // 第159条: 伤寒服汤药下利不止心下痞硬，服泻心已复下利不止，此利在下焦，赤石脂禹余粮汤主之。
  // 下利不止在下焦。核心=下利不止。
  needs: [
    ['clear_grain_diarrhea.yes'],
    ['diarrhea.yes', 'epigastric_lump_soft.yes']
  ],
  contraindications: ['下利不止在下焦', '涩肠固脱止利']
}
