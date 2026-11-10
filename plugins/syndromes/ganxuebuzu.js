module.exports = {
  name: 'ganxuebuzu',
  title: '肝血不足',
  kind: 'summary',
  // 
  needs: [
    ['tuofa.yes', 'insomnia_onset.yes'],
    ['tuofa.yes', 'duomeng.yes'],
    ['tuofa.yes', 'face_pale.yes'],
    ['tuofa.yes']
  ],
  contraindications: ['肝血中还有精', '精不动', '肝血不足的睡眠表现按具体类型判：入睡困难 / 多梦，不用「睡眠不好」这个笼统说法']
}
