module.exports = {
  name: 'qugui_jia_baizhu_tang',
  title: '去桂加白术汤',
  kind: 'formula',
  // 第174条: 若其人大便硬，小便自利者，去桂加白术汤主之。
  // 桂枝附子汤证，但大便硬小便自利→去桂加白术(湿胜于风)。
  needs: [
    ['body_ache_stiff.yes', 'easy_urination.yes']
  ],
  contraindications: ['大便硬、小便自利(湿重于风)', '去桂加白术', '祛湿健脾']
}
