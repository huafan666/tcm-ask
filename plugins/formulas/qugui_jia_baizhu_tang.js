module.exports = {
  name: 'qugui_jia_baizhu_tang',
  title: '去桂加白术汤',
  kind: 'formula',
  // 第174条: 若其人大便硬，小便自利者，去桂加白术汤主之。
  // 桂枝附子汤证，但大便硬小便自利→去桂加白术(湿胜于风)。
  needs: ['body_ache_stiff.yes', 'constipation.yes', 'easy_urination.yes'],
  contraindications: ['风湿兼里湿（湿胜于风）：身体疼烦不能转侧 + 大便坚 + 小便自利', '大便坚、小便自利是去桂加白术的唯一鉴别点（与桂枝附子汤只差这一处）', '去桂加白术：重在祛湿健脾']
}
