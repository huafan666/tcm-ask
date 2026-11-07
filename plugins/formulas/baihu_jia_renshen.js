module.exports = {
  name: 'baihu_jia_renshen',
  title: '白虎加人参汤',
  kind: 'formula',
  // 第26条: 服桂枝汤大汗出后大烦渴不解脉洪大者，白虎加人参汤主之。
  // 白虎=纯热证：强调一点都不怕冷(不恶寒)，区分表证/半表半里。
  // 暂不做脉，去脉洪大，用 大烦渴 + 不恶寒(纯热证) 判定。
  needs: [
    ['severe_thirst.yes', 'cold_aversion.no']
  ],
  contraindications: ['纯热证(不恶寒)才可', '大烦渴不解、热盛津伤', '清热生津益气', '若兼恶寒则非白虎证']
}

