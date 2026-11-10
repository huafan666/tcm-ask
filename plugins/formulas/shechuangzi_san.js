module.exports = {
  name: 'shechuangzi_san',
  title: '蛇床子散',
  kind: 'formula',
  // 金匮要略·妇人杂病脉证并治第二十二：蛇床子散方，温阴中坐药。
  needs: [
    ['vulvar_cold.yes'],
    ['vaginal_discharge.yes', 'vulvar_cold.yes'],
    ['vaginal_discharge.yes', 'genital_ulcer.yes']
  ],
  contraindications: ['**外用的坐药（阴道栓）**，原文明确说「温阴中坐药」——温煦阴中', '只有一味蛇床子，研末用白粉（米粉）少许和成枣核大，绵裹纳阴中', '蛇床子温肾助阳、燥湿杀虫，是治阴部寒冷、带下、阴痒的经典外用药', '⚠ **只可外用，不可内服**（内服须严格炮制用量）', '⚠ 阴部瘙痒、分泌物异常要先查阴道炎（滴虫、霉菌等）']
}
