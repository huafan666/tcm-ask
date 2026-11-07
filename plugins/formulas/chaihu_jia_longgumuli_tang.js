module.exports = {
  name: 'chaihu_jia_longgumuli_tang',
  title: '柴胡加龙骨牡蛎汤',
  kind: 'formula',
  // 第107条: 伤寒八九日下之，胸满烦惊，小便不利，譫语，一身尽重不可转侧者，柴胡加龙骨牡蛎汤主之。
  // 少阳兼烦惊、譫语。核心=胸满烦惊/譫语。
  needs: [
    ['delirium.yes', 'restless.yes'],
    ['chest_fullness.yes', 'restless.yes']
  ],
  contraindications: ['胸满烦惊、譫语', '少阳证兼烦惊谵语', '和解镇惊安神']
}
