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

    // POST ROUTES
    Route.post('investments', 'InvestmentsController.store')
    Route.post('admin/investments', 'InvestmentsController.store')
    Route.post('admin/investments/rates', 'RatesController.store')

    // GET ROUTES
    Route.get('investments', 'InvestmentsController.index')
    Route.get('admin/investments', 'InvestmentsController.index')
    // Route.get('investments/rates', 'InvestmentsController.rate')
    Route.get('investments/rates', 'RatesController.index')
    Route.get('admin/investments/rates', 'RatesController.index')
    Route.get('investments/:userId', 'InvestmentsController.show')
    Route.get('admin/investments/:userId', 'InvestmentsController.show')
    Route.get('admin/investments/approval', 'InvestmentsController.showApprovalRequest')

    // PUT ROUTES
    Route.put('investments/payout', 'InvestmentsController.payout')
    Route.put('admin/investments/payout', 'InvestmentsController.payout')
    Route.put('investments/:id', 'InvestmentsController.update')
    Route.put('admin/investments/:id', 'InvestmentsController.update')
    Route.put('admin/investments/rates', 'RatesController.update')
    Route.put('admin/investments/approval', 'InvestmentsController.approve')

    // DELETE ROUTES
    Route.delete('admin/investments/rates', 'RatesController.destroy')
    // Route.delete('admin/investments/rates', 'RatesController.destroy')
    Route.delete('investments/:id', 'InvestmentsController.destroy')
    Route.delete('admin/investments/:id', 'InvestmentsController.destroy')
  })
}).prefix('api/v2')
