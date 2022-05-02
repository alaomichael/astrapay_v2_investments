import Event from '@ioc:Adonis/Core/Event'

Event.on('new:investment', (investment) => {
  console.log(investment)
})
