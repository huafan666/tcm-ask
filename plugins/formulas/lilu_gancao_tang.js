module.exports = {
  name: 'lilu_gancao_tang',
  title: '藜芦甘草汤',
  kind: 'formula',
  // 金匮要略·趺蹶手指臂肿转筋阴狐疝蚘虫病脉证并治第十九：病人常以手指臂肿动，此人身体瞤瞤者，藜芦甘草汤主之。
  needs: [
    ['finger_arm_swelling_tremor.yes'],
    ['finger_arm_swelling_tremor.yes', 'muscle_twitching.yes']
  ],
  contraindications: ['治手指胳膊发肿而且抽动、身体肌肉也跳（瞤瞤）的情况', '**原方组成未见于《金匮》正文**，只留方名。后世多认为是藜芦、甘草两味', '藜芦是**涌吐药**，有毒，作用峻猛，「吐」的机理可能是通过涌吐痰涎来治「肿动」', '⚠ 藜芦毒性大，反甘草（十八反中「诸参辛芍叛藜芦」），现代极少内服，**本条仅供文献参考，绝对不可照方自行服用**']
}
