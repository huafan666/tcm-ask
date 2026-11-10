module.exports = {
  name: 'pin_nue',
  title: '牝疟',
  kind: 'summary',
  // 金匮要略·疟病脉证并治第四：疟多寒者，名曰牝疟，蜀漆散主之。
  needs: ['periodic_chill_fever.yes', 'chill_predominant.yes'],
  contraindications: ['牝疟就是「疟多寒」——发作时以发冷为主、发热很少，甚至只冷不热', '「牝」是雌性的意思，古人用雌（阴）来形容这种偏寒的类型；偏热的叫「牡疟」', '病机是阳气被痰湿蔽阻，出不来，所以寒多']
}
