module.exports = {
  name: 'jin_chuang',
  title: '金疮',
  kind: 'summary',
  // 金匮要略·疮痈肠痈浸淫病脉证并治第十八：若身有疮，被刀斧所伤，亡血故也……病金疮，王不留行散主之。
  needs: [
    ['wound_injury.yes'],
    ['wound_injury.yes', 'poor_complexion.yes'],
    ['wound_injury.yes', 'body_pain.yes']
  ],
  contraindications: ['金疮是刀斧等金属利器造成的外伤，古人把金刃所伤叫「金疮」', '原文 18.9 有一句很实用的话：脉浮微而涩本来应该是有出血或出汗，如果既没汗也没明显出血，那就要想到「身有疮，被刀斧所伤，亡血」——就是有外伤失血', '治疗用王不留行散：既能内服（止血、活血、消肿），也能外敷（「小疮即粉之」）', '⚠ 外伤伤口必须先清创、消毒、打破伤风，中药只是辅助，伤口深大必须就医']
}
