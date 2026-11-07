module.exports = {
  name: 'ganxuebuzu',
  title: '肝血不足',
  kind: 'summary',
  needs: [
    ['tuofa.yes'],
    ['tuofa.yes', 'jaundice.yes'],
    ['shuiqian.yes', 'tuofa.yes', 'jaundice.yes']
  ],
  contraindications: ['肝血中还有精', '精不动']
}
