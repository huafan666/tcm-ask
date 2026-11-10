module.exports = {
  name: 'banxia_ganjiang_san',
  title: '半夏干姜散',
  kind: 'formula',
  // 
  needs: [
    ['vomit_saliva.yes', 'cold_aversion.yes'],
    ['vomit_saliva.yes', 'cold_extremities.yes'],
    ['vomiting.yes', 'saliva_spit.yes', 'cold_aversion.yes']
  ],
  contraindications: ['治寒性的干呕、吐涎沫：吐的是清稀涎沫，不是食物，伴怕冷', '只有两味：半夏（降逆止呕）、干姜（温中散寒），等分为散', '原文服法「取方寸匕，浆水一升半，煎取七合，顿服之」——浆水助其和胃', '和小半夏汤的区别：小半夏汤是半夏+生姜，偏散饮止呕；本方是半夏+干姜，**偏温中**，适合胃寒明显者', '和干姜人参半夏丸（妊娠呕吐）也不同，那条有虚证', '「干呕吐涎沫」在库里另有 vomit_saliva 节点，与本方最贴合']
}
