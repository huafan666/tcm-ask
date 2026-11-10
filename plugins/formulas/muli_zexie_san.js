module.exports = {
  name: 'muli_zexie_san',
  title: '牡蛎泽泻散',
  kind: 'formula',
  // 395条：大病差后，从腰以下有水气者，牡蛎泽泻散主之。
  needs: ['pitting_edema.yes', 'fever.no'],
  contraindications: ['395条：大病差后，从腰以下有水气者', '牡蛎、泽泻、蜀漆、葶苈子、商陆根、海藻、栝蒌根——逐水消肿、软坚散结', '⚠ 原文只有「腰以下有水气」一个抓手，判据本身很窄；「大病差后」这个病程条件库里没有对应节点', '商陆、蜀漆药力峻猛，体虚者慎用']
}
