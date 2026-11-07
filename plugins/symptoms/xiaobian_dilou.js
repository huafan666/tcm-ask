module.exports = {
  name: 'xiaobian_dilou',
  title: '小便滴漏',
  trigger(text) { return ['小便滴漏', '小便一滴一滴的', '小便漏'].some(k => text.includes(k)) },
  ask: '是不是小便时常容易滴漏，一点一点的好像挤出来的，或者自己漏一点点的尿'
}
