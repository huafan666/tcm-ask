module.exports = {
  name: 'danggui_shaoyao_san',
  title: '当归芍药散',
  kind: 'formula',
  // 金匮要略·妇人妊娠病脉证并治第二十：妇人怀妊，腹中㽲痛，当归芍药散主之。
  needs: [
    ['pregnancy.yes', 'abdominal_cramp_after_birth.yes'],
    ['abdominal_cramp_after_birth.yes', 'urination_difficulty.yes'],
    ['pregnancy.yes', 'abdominal_pain.yes'],
    // 金匮 22.18：妇人腹中诸疾痛，当归芍药散主之
    ['abdominal_pain.yes','vaginal_discharge.yes']
  ],
  contraindications: ['治妊娠腹中「㽲痛」——绵绵不休的隐痛，病机是肝脾不和、血虚湿滞', '六味：当归、芍药（重用一斤）、川芎养血柔肝；茯苓、白术、泽泻健脾利湿', '**养血与利湿并施**——这是本方的特点：既补血又除湿，因为妊娠期常见血虚兼水湿', '做成散剂「取方寸匕，酒和，日三服」', '后世也用于痛经、月经不调、更年期水肿等属肝脾不和者，是妇科名方']
}
