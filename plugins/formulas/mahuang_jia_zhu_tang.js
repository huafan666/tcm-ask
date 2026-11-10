module.exports = {
  name: 'mahuang_jia_zhu_tang',
  title: '麻黄加术汤',
  kind: 'formula',
  // 金匮要略·痉湿暍病脉证并治第二：湿家身烦疼，可与麻黄加术汤发其汗为宜，慎不可以火攻之。
  needs: ['body_ache_stiff.yes', 'no_sweat.yes'],
  contraindications: ['寒湿在表、表实无汗，故用麻黄汤加白术微发其汗', '「发其汗为宜，慎不可以火攻之」——禁火攻（温针、火熏）', '无汗是麻黄剂的前提（本条未明写，由「发其汗为宜」与麻黄本方推定）', '与防己黄芪汤区别：本方无汗（表实），防己黄芪汤汗出恶风（表虚）']
}
