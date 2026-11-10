module.exports = {
  name: 'appetite_any',
  title: '食欲异常',
  kind: 'symptom_group',
  // 症状筛选组（感觉）：食欲异常
  trigger(text) { return ['吃不下', '不想吃', '食欲', '胃口', '能吃', '想吃饭'].some(k => text.includes(k)) },
  ask: '是不是吃东西方面有问题——吃不下、特别能吃、或者食欲忽好忽坏？',
  children: ['low_appetite', 'hungry', 'polyphagia', 'appetite_fluctuating'],
  contraindications: ['【症状筛选组】只做粗筛，不参与证候/方剂的推理判定', '规则：任一子症状成立 ⇒ 本组成立；某个子症状被否定**不会**把本组判成不成立', '维度：感觉｜未归入本组的：恶心呕吐（是吐不是食欲）、消瘦、吞咽困难']
}
