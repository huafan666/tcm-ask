module.exports = {
  name: 'xiaochengqi_tang',
  title: '小承气汤',
  kind: 'formula',
  // 阳明篇小承气条: 208/213/214/250/251
  // 阳明腑实轻证/微和胃气。核心=纯热证(喜冷饮+不恶寒) + 大便硬 + 放屁(气尚通→大便在小肠未深结)。
  // 放屁=气能通,燥结不深,用小承气微和胃气; 虚证/身体羸弱禁用。譫语止勿再服。
  needs: [
    ['cold_drink_desire.yes', 'cold_aversion.no', 'constipation.yes', 'flatus.yes']
  ],
  contraindications: ['纯热证才可用(喜冷饮+不恶寒)', '虚证/气色差/喜热饮者禁用', '放屁气能通→大便在小肠,轻下和胃', '譫语止勿再服']
}
