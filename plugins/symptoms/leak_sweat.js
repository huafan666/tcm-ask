module.exports = {
  name: 'leak_sweat',
  title: '漏汗',
  kind: 'symptom',
  trigger(text) { return ['漏汗', '汗流不止', '汗止不住', '汗一直流', '像漏水一样出汗'].some(k => text.includes(k)) },
  negate(text) { return ['不漏汗', '汗能止住'].some(k => text.includes(k)) },
  ask: '是不是汗止不住、一直往外漏，像漏水似的，擦了又出、捂不住？这叫漏汗(阳虚无固摄)。'
}

