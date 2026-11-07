module.exports = {
  name: 'sini_san',
  title: '四逆散',
  kind: 'formula',
  // 第318条: 少阴病四逆其人或咳或悸或小便不利或腹中痛或泄利下重者四逆散主之。
  // 阳郁致厥(气郁手足逆冷),非阳虚。核心=手足逆冷+或咳/心悸等或然证。
  // 与阳虚(真武/附子汤/通脉四逆)区别: 本证为气机郁滞非阳衰。
  needs: [
    ['cold_extremities.yes', 'cough.yes'],
    ['cold_extremities.yes', 'heart_palp.yes'],
    ['cold_extremities.yes', 'abdominal_pain.yes']
  ],
  contraindications: ['手足逆冷(阳郁气滞,非阳虚)', '或咳/悸/腹中痛等或然证', '疏肝解郁(柴胡枳实芍药甘草)', '阳虚真寒者非此(用附子辈)']
}
