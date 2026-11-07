module.exports = {
  name: 'ganjiang_huangqin_huanglian_renshen_tang',
  title: '干姜黄芩黄连人参汤',
  kind: 'formula',
  // 第359条: 伤寒本自寒下医反复吐下之寒格更逆吐下若食入口即吐者干姜黄芩黄连人参汤主之。
  // 寒格(上热下寒,食入口即吐)。核心=食入口即吐。
  needs: [
    ['vomit_on_intake.yes']
  ],
  contraindications: ['食入口即吐(寒格上热下寒)', '辛开苦降甘补(干姜芩连人参)', '误吐下后寒格致呃逆呕吐']
}
