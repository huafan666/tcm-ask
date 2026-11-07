module.exports = {
  name: 'guizhi_qu_gui_jia_fuling',
  title: '桂枝去桂加茯苓白术汤',
  kind: 'formula',
  // 第28条: 服桂枝汤或下之仍头项强痛翕翕发热无汗心下满微痛小便不利者，桂枝去桂加茯苓白术汤主之。
  // 病机: 水饮内停。核心=心下满+小便不利(水饮停)。无汗为伴随，非必须。
  needs: [
    ['epigastric_fullness.yes', 'urination_difficulty.yes'],
    ['epigastric_fullness.yes', 'urination_difficulty.yes', 'no_sweat.yes']
  ],
  contraindications: ['水饮内停用苓术利水', '去桂加茯苓白术', '心下满+小便不利为要']
}

