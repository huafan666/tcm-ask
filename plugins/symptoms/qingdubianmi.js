module.exports = {
  name: 'qingdubianmi',
  title: '轻度便秘',
  trigger(text) { return ['一点点便秘', '大便不太通畅'].some(k => text.includes(k)) },
  // 原来问句里带了一句「但不觉得怕冷」，等于一个问题问了两件事（怕冷另有专门节点），
  // 病人没法干脆地答是/否。这里只问轻重这一件事。
  ask: '是不是便秘还算轻——两三天才一次，但不算干硬得难受？'
}
