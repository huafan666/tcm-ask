module.exports = {
  name: 'xigaiyixialeng',
  title: '膝盖以下冷',
  trigger(text) { return ['小腿冷', '脚冷'].some(k => text.includes(k)) },
  ask: '是不是膝盖以下（小腿、脚）都是凉的？'
}
