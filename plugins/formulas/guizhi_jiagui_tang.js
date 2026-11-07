module.exports = {
  name: 'guizhi_jiagui_tang',
  title: '桂枝加桂汤',
  kind: 'formula',
  // 第117条: 烧针令其汗针处被寒，核起而赤者必发奔豚，气从少腹上冲心者，与桂枝加桂汤。
  // 心阳虚奔豚(气从少腹上冲心)。核心=奔豚/气上冲。
  needs: [
    ['ben_tun.yes'],
    ['qi_surge.yes']
  ],
  contraindications: ['气从少腹上冲心(奔豚)', '心阳虚、烧针外寒引发', '温补心阳降逆']
}
