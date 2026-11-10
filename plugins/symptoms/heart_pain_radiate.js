module.exports = {
  name: 'heart_pain_radiate',
  title: '心痛透到后背、背痛透到心',
  trigger(text) { return ['心痛透到后背', '心痛彻背', '背痛彻心', '心痛得前后穿透', '胸口痛透到背后', '心口痛穿到后背', '前后一起钻着痛', '心痛得穿透', '穿透到后背', '痛穿到后背', '心痛穿透背部', '背痛穿透到心', '前后穿透着疼'].some(k => text.includes(k)) },
  negate(text) { return ['心痛不放射'].some(k => text.includes(k)) },
  ask: '是不是心口疼起来一直穿透到后背，后背疼也反过来透到心口？'
}
