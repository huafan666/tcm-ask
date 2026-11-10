module.exports = {
  name: 'skin_itch_hives',
  title: '身上痒起风团',
  trigger(text) { return ['身上痒起风团', '身上起风团', '起瘾疹', '皮肤痒起疙瘩', '一挠起一片风团', '身上痒痒的起疹子', '荨麻疹'].some(k => text.includes(k)) },
  negate(text) { return ['身上不痒'].some(k => text.includes(k)) },
  ask: '是不是身上发痒，一挠就起一片片风团（荨麻疹）？'
}
