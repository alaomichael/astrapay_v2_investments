/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/
import HealthCheck from '@ioc:Adonis/Core/HealthCheck'
import Route from '@ioc:Adonis/Core/Route'

Route.get('/', async () => {
  return { hello: 'world' }
})

Route.get('health', async ({ response }) => {
  const report = await HealthCheck.getReport()
  return report.healthy ? response.ok(report) : response.badRequest(report)
})

Route.group(() => {
  Route.group(() => {
    // Route.resource('investments/payouts', 'PayoutsController').apiOnly()
    // Route.resource('users.investment', 'InvestmentsController').apiOnly()
    // Route.resource('investment', 'InvestmentsController').apiOnly()
    Route.post('investments', 'investmentsController.store')
    Route.get('investments', 'InvestmentsController.index')
    Route.get('investments/rates', 'InvestmentsController.rate')
    Route.get('investments/rate', 'RatesController.index')
    Route.get('investments/:userId', 'InvestmentsController.show')
    Route.put('investments/payout', 'InvestmentsController.payout')
    Route.put('investments/:id', 'InvestmentsController.update')
  })
}).prefix('api/v2')
