module.exports = {
  name: 'shaoyao_gancao_fuzi_tang',
  title: '芍药甘草附子汤',
  kind: 'formula',
  // 第68条: 发汗病不解反恶寒者，虚故也；兼脚挛急者，芍药甘草附子汤主之。
  // 阳虚发汗后恶寒+脚挛急。核心=恶寒+脚挛急。
  needs: [
    ['cold_aversion.yes', 'limb_spasm.yes']
  ],
  contraindications: ['发汗后反恶寒+脚挛急(阳虚)(虚故也)', '扶阳益阴', '单纯恶寒无挛急者宜多方别辨']
}
