module.exports = {
  name: 'ye_bing',
  title: '暍病',
  kind: 'summary',
  // 金匮要略·痉湿暍病脉证并治第二：太阳中热者，暍是也。汗出恶寒，身热而渴，白虎加人参汤主之。（2.25：太阳中暍，发热恶寒，身重而疼痛……手足逆冷）
  needs: [
    ['sweat.yes', 'cold_aversion.yes', 'fever.yes', 'thirsty.yes'],
    ['fever.yes', 'cold_aversion.yes', 'body_heavy.yes', 'cold_extremities.yes']
  ],
  contraindications: ['暍病＝夏季暑热所伤：汗出恶寒、身热而渴（汗多肌疏故恶寒，非表实证）', '第二路径对应 2.25：发热恶寒、身重疼痛而手足逆冷（暑热内郁、阳气不达四末）', '治禁：不可发汗（汗之则恶寒甚）、不可温针（温针则发热甚）、不可数下（下之则淋甚）', '主方：白虎加人参汤（津伤）；水湿在表者一物瓜蒂汤']
}
