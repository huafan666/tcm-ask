module.exports = {
  name: 'solar_windstrike',
  title: '太阳中风',
  kind: 'summary',
  needs: [
    ['taiyang_disease.yes', 'fever.yes', 'sweat.yes'],
    ['fever.yes', 'sweat.yes', 'wind_aversion.yes']
  ]
}
