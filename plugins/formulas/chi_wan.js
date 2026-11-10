module.exports = {
  name: 'chi_wan',
  title: '赤丸',
  kind: 'formula',
  // 金匮要略·腹满寒疝宿食病脉证并治第十：寒气厥逆，赤丸主之。
  needs: [
    ['cold_extremities.yes', 'abdominal_pain.yes'],
    ['cold_extremities.yes', 'circumumbilical_pain.yes']
  ],
  contraindications: ['治「寒气厥逆」——阴寒内盛导致四肢冰冷，同时伴腹痛', '茯苓、半夏化饮降逆，乌头、细辛温散沉寒，朱砂（原方用真朱）镇逆安神', '**乌头有毒**，做成蜜丸小量服（如麻子大，先食酒下三丸），须严格按原法', '朱砂含汞，现代多不入内服，须谨慎', '原文说「不知，稍增之，以知为度」——见效就停，不能一直加量']
}
