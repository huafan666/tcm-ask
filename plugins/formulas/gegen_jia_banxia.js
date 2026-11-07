module.exports = {
  name: 'gegen_jia_banxia',
  title: '葛根加半夏汤',
  kind: 'formula',
  // 第33条: 太阳与阳明合病，不下利但呕者，葛根加半夏汤主之。
  needs: [
    ['vomiting.yes', 'diarrhea.no']
  ],
  contraindications: ['太阳阳明合病但呕、不下利者主之', '和胃降逆止呕']
}

