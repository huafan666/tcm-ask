module.exports = {
  name: 'fuling_gancao_tang',
  title: '茯苓甘草汤',
  kind: 'formula',
  // 第73条: 伤寒汗出而渴者五苓散主之；不渴者茯苓甘草汤主之。
  // 第356条: 伤寒厥而心下悸者宜先治水，当服茯苓甘草汤。
  // 水停中焦，心下悸+不渴。核心=心下悸+不渴。
  needs: [
    ['heart_palp.yes', 'thirsty.no']
  ],
  contraindications: ['汗出而不渴/厥而心下悸(水停中焦)', '心悸+不渴为水饮', '与五苓散区别在不渴']
}
