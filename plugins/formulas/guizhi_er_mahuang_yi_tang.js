module.exports = {
  name: 'guizhi_er_mahuang_yi_tang',
  title: '桂枝二麻黄一汤',
  kind: 'formula',
  // 25条：服桂枝汤，大汗出，脉洪大者，与桂枝汤如前法；若形似疟，一日再发者，汗出必解，宜桂枝二麻黄一汤。
  needs: ['fever.yes', 'cold_aversion.yes', 'periodic_chill_fever.yes', 'sweat.yes'],
  contraindications: ['25条：服桂枝汤大汗出后，形似疟、一日再发者', '桂枝汤与麻黄汤按 2:1 配比，比各半汤更偏于解肌', '与桂枝麻黄各半汤的区别：本方有汗（已发过汗），各半汤是无汗而身痒']
}
