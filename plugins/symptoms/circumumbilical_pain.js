module.exports = {
  name: 'circumumbilical_pain',
  title: '肚脐周围痛',
  trigger(text) { return ['肚脐周围痛', '绕脐痛', '绕着肚脐一圈痛', '肚脐眼周围疼', '脐周疼痛', '肚脐四周痛', '肚脐眼周围痛', '脐周痛', '绕着肚脐痛'].some(k => text.includes(k)) },
  negate(text) { return ['肚脐周围不痛'].some(k => text.includes(k)) },
  ask: '是不是疼在肚脐周围、绕着肚脐一圈？'
}
