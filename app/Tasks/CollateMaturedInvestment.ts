import { BaseTask } from 'adonis5-scheduler/build'
import InvestmentsServices from 'App/Services/InvestmentsServices'
import { DateTime } from 'luxon'
// import axios from 'axios'

export default class CollateMaturedInvestment extends BaseTask {
    public static get schedule() {
        // *    *    *    *    *    *
        // ┬    ┬    ┬    ┬    ┬    ┬
        // │    │    │    │    │    │
        // │    │    │    │    │    └ day of week(0 - 7)(0 or 7 is Sun)
        // │    │    │    │    └───── month(1 - 12)
        // │    │    │    └────────── day of month(1 - 31)
        // │    │    └─────────────── hour(0 - 23)
        // │    └──────────────────── minute(0 - 59)
        // └───────────────────────── second(0 - 59, OPTIONAL)
        // return '* * * * * *'

        return '*/5 * * * *' // runs every 5 minutes
        // return '0 */2 * * *' // runs every 2 hours 0 minute
    }
    /**
     * Set enable use .lock file for block run retry task
     * Lock file save to `build/tmpTaskLock`
     */
    public static get useLock() {
        return false
    }

    public async handle() {
        // @ts-ignore
        this.logger.info('Handled')
        console.log("Scheduler is Running Collate Matured Investment ==============================================")
        // TODO : Update this when going live
        // let checkedForPaymentAt = DateTime.now().minus({ minutes: 4 });
        // console.log("last CheckedForPaymentAt @  :", checkedForPaymentAt);

        let queryParams = {
            limit: "20",
            offset: "0",
            // add checkedForPaymentAt
        }
        // console.log("Query params in type service line 42:", queryParams)
        let investmentsServices = new InvestmentsServices();
        await investmentsServices.collateMaturedInvestment(queryParams);
        // let listOfCollatedMaturedInvestments = await investmentsServices.collateMaturedInvestment(queryParams);  
        // console.log("After AXIOS CALL for Collate Matured Investment ,  ==================================================");
        // console.log("The ASTRAPAY API Collate Matured Investment response,line 47: ", listOfCollatedMaturedInvestments);
    }
}
