module.exports = {
  name: 'polyphagia',
  title: '吃得多还容易饿',
  trigger(text) { return ['吃得多还容易饿', '消谷引食', '吃很多还是饿', '特别能吃还老饿', '刚吃完又饿', '饭量大还容易饿', '老是饿得慌吃得多'].some(k => text.includes(k)) },
  negate(text) { return ['吃不下', '胃口一般'].some(k => text.includes(k)) },
  ask: '是不是特别能吃、吃得很多，可很快又饿了？'
}
