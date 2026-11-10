module.exports = {
  name: 'huangqi_jianzhong_tang',
  title: '黄芪建中汤',
  kind: 'formula',
  // 
  needs: [
    ['abdominal_tension.yes', 'low_energy.yes'],
    ['abdominal_tension.yes', 'weight_loss.yes'],
    ['abdominal_tension.yes', 'xu_lao.yes']
  ],
  contraindications: ['治虚劳「里急、诸不足」——肚子拘急发紧，加上各种虚（没劲、消瘦、气短）', '就是小建中汤加黄芪：小建中温中缓急，黄芪补气固表', '比小建中汤更偏气虚，适合虚得厉害、还容易出汗怕风的', '同样「呕家不可用」——方里饴糖多，呕吐的人吃了更难受', '条文收紧依据：金匮 6.15：虚劳里急、诸不足，黄芪建中汤主之']
}
