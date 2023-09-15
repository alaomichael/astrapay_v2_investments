import Event from '@ioc:Adonis/Core/Event'

Event.on('new:investment', (investment) => {
  console.log('Newest Investment: ', investment)
})

Event.on('list:investments', (investment) => {
  console.log('List of Investment: ', investment)
})

Event.on('service_account::send_service_account', 'SettingServiceAccount.sendServiceAccount')
// Event.on('investments:list', 'InvestmentsController.index')