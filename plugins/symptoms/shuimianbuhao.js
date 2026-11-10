module.exports = {
  name: 'shuimianbuhao',
  title: '睡眠不好（笼统说法）',
  // 笼统描述：病人只会说这一句。必须靠反问细化到入睡困难/容易醒/睡眠浅/多梦/虚烦不得眠。
  // vague:true 让问诊知道「说了这个不等于说清是哪一种」，要继续往下问；
  // 同时任何方剂/证候都不得直接依赖本节点。
  vague: true,
  trigger(text) { return ['睡眠不好', '睡不好', '失眠', '睡得不好'].some(k => text.includes(k)) },
  ask: '是不是睡眠不好？（先答这句，后面我再问你是哪一种）'
}
