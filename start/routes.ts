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
import Rabbit from '@ioc:Adonis/Addons/Rabbit'
import Route from '@ioc:Adonis/Core/Route'
// Route.get('/', async () => {
//   return { hello: 'world' }
// })

Route.get('/', async () => {
  // Ensures the queue exists
  await Rabbit.assertQueue('my_queue')

  // Sends a message to the queue
  await Rabbit.sendToQueue('my_queue', 'This message was sent by adonis-rabbit. Testing.....')
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
    Route.post('investments/approvals', 'ApprovalsController.store')
    Route.post('admin/investments', 'InvestmentsController.store')
    Route.post('admin/investments/rates', 'RatesController.store')
    // Route.post('admin/investments/taxes', 'TaxesController.store')
    // Route.post('admin/investments/taxrecords', 'TaxRecordsController.store')
    Route.post('admin/investments/approvals', 'ApprovalsController.store')
    Route.post('admin/investments/transactions', 'InvestmentsController.processPayment')
    Route.post('admin/investments/settings', 'SettingsController.store')
    Route.post('admin/investments/rfi_records', 'RfiRecordsController.store')
    Route.post("admin/investments/types", "TypesController.store");
    // GET ROUTES
    Route.get('investments', 'InvestmentsController.index')
    Route.get('admin/investments', 'InvestmentsController.index')
    Route.get('investments/rates', 'RatesController.index')
    Route.get('admin/investments/settings', 'SettingsController.index')
    Route.get('admin/investments/rates', 'RatesController.index')
    Route.get('admin/investments/taxes', 'TaxesController.index')
    Route.get('admin/investments/taxrecords', 'TaxRecordsController.index')
    Route.get('admin/investments/approvals', 'ApprovalsController.index')
    // Route.get('investments/payouts', 'InvestmentsController.showPayouts')
    Route.get('investments/payouts', 'PayoutsController.index')
    Route.get('admin/investments/payouts', 'InvestmentsController.showPayouts')
    Route.get('admin/investments/payoutrecords', 'PayoutRecordsController.index')
    Route.get('admin/investments/feedbacks', 'InvestmentsController.feedbacks')
    Route.get('admin/investments/transactionsfeedbacks', 'InvestmentsController.transactionStatus')
    Route.get('admin/investments/rfi_records', 'RfiRecordsController.index')
    Route.get("admin/investments/types", "TypesController.index");
    Route.get("investments/types", "TypesController.index");
    Route.get("investments/types/:typeId", "TypesController.showByTypeId");
    Route.get("admin/investments/types/:typeId", "TypesController.showByTypeId");
    Route.get("admin/investments/about_to_be_mature_investments", "InvestmentsController.collateAboutToBeMatureInvestment");
    Route.get("admin/investments/reactivate_suspended_investment_payout", "InvestmentsController.reactivateSuspendedPayoutInvestment");
    Route.get("admin/investments/reactivate_suspended_investment_rollover", "InvestmentsController.reactivateSuspendedRolloverInvestment");
    Route.get("admin/investments/matured_investments", "InvestmentsController.collateMaturedInvestment");
    Route.get("admin/investments/activate_approved_investments", "InvestmentsController.activateApprovedInvestment");
    Route.get("admin/investments/payout_matured_investments", "InvestmentsController.payoutMaturedInvestment");
    Route.get("admin/investments/retry_failed_payout_of_matured_investment", "InvestmentsController.retryFailedPayoutOfMaturedInvestment");
    Route.get("admin/investments/rollover_matured_investments", "InvestmentsController.rolloverMaturedInvestment");
    // Route.get("admin/investments/liquidate_investments", "InvestmentsController.liquidateInvestment");
    Route.get("admin/investments/sum_of_matured_investment", "InvestmentsController.sumOfMaturedInvestment");

    // Route.get('admin/investments/:userId', 'InvestmentsController.show')
    Route.get('investments/users/:userId', 'InvestmentsController.showByUserId')
    Route.get('admin/investments/:investmentId', 'InvestmentsController.showByInvestmentId')
    Route.get('investments/:investmentId', 'InvestmentsController.showByInvestmentId')



    // Route.get('investments/:userId', 'InvestmentsController.show')

    // Route.get('investments/rates', 'InvestmentsController.rate')

    // PUT ROUTES
    Route.put('investments/payouts', 'InvestmentsController.payout')
    Route.put('investments/terminates', 'InvestmentsController.payout')
    Route.put('admin/investments/settings/:id', 'SettingsController.update')
    Route.put('admin/investments/terminates', 'InvestmentsController.payout')
    Route.put('admin/investments/payouts', 'InvestmentsController.payout')
    Route.put('admin/investments/rates', 'RatesController.update')
    // Route.put('admin/investments/taxes', 'TaxesController.update')
    // Route.put('admin/investments/taxrecords', 'TaxRecordsController.update')
    Route.put('admin/investments/approvals/:id', 'ApprovalsController.update')
    Route.put('admin/investments', 'InvestmentsController.update')
    Route.put('investments', 'InvestmentsController.update')
    Route.put('investments/:investmentId', 'InvestmentsController.updateByInvestmentId')
    Route.put('admin/investments/rfi_records', 'RfiRecordsController.update')
    // updateInterestRate
    Route.put("admin/investments/types/interest_rate/:typeId", "TypesController.updateInterestRate");
    Route.put("admin/investments/types/:typeId", "TypesController.update");
    // liquidate investment
        Route.put("admin/investments/liquidate_investments", "InvestmentsController.liquidateInvestment");


    // DELETE ROUTES
    Route.delete('admin/investments/settings', 'SettingsController.destroy')
    Route.delete('admin/investments/rates', 'RatesController.destroy')
    Route.delete('admin/investments/taxes', 'TaxesController.destroy')
    Route.delete('admin/investments/taxrecords', 'TaxRecordsController.destroy')
    Route.delete('admin/investments/approvals', 'ApprovalsController.destroy')
    Route.delete('admin/investments/rfi_records', 'RfiRecordsController.destroy')
    Route.delete('admin/investments/:userId', 'InvestmentsController.destroy')
    Route.delete('investments/:userId', 'InvestmentsController.destroy')
    Route.delete("admin/investments/types/:typeId", "TypesController.destroy");

    // Route.delete('investments/:id', 'InvestmentsController.destroy')
  })
}).prefix('api/v2')
