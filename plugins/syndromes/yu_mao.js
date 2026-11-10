module.exports = {
  name: 'yu_mao',
  title: '郁冒',
  kind: 'summary',
  // 金匮要略·妇人产后病脉证治第二十一：产妇郁冒，其脉微弱，呕不能食，大便反坚，但头汗出。所以然者，血虚而厥，厥而必冒……以血虚下厥，孤阳上出，故头汗出。
  needs: [
    ['postpartum.yes', 'head_sweat_only.yes'],
    ['postpartum.yes', 'vomiting.yes', 'low_appetite.yes'],
    ['postpartum.yes', 'dizziness.yes', 'head_sweat_only.yes']
  ],
  contraindications: ['郁冒是产后三大病之一（痉、郁冒、大便难）：「冒」就是**头晕目眩、昏蒙不清**，「郁」是气机郁滞不舒', '典型表现：脉微弱、呕吐吃不下、大便反而干硬、**只有头上出汗**', '病机原文讲得清楚：**血虚下厥，孤阳上出**——产后失血多、下焦虚寒（下厥），虚阳被逼得上浮（孤阳上出），所以只有头部出汗、头目昏冒', '原文给了预后：「冒家欲解，必大汗出」——郁冒将解时会出一身大汗，汗出则阴阳调和', '治法思路是养血益气、调和阴阳（小柴胡汤类或桂枝汤类），不是单纯止汗']
}
