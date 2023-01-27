import { BaseTask } from 'adonis5-scheduler/build'
// import InvestmentsServices from 'App/Services/InvestmentsServices'
import TypesServices from 'App/Services/TypesServices'
// import { DateTime } from 'luxon'
// import axios from 'axios'
const Env = require("@ioc:Adonis/Core/Env");
const DEFAULT_INTEREST_RATE = Env.get("DEFAULT_INTEREST_RATE");

export default class ResetInvestmentInterestRate extends BaseTask {
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

        // return '*/20 * * * *' // runs every 20 minutes
        // return '0 */2 * * *' // runs every 2 hours 0 minute
        return '0 0 * * *' // runs every 00:00 daily
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
        console.log("Scheduler is Running Reset Investment Interest Rate ==============================================")
        // TODO : Update this when going live
        // let checkedForPaymentAt = DateTime.now().minus({ minutes: 4 });
        // console.log("last CheckedForPaymentAt @  :", checkedForPaymentAt);

        let queryParams = {
            limit: "20",
            offset: "0",
            // add checkedForPaymentAt
        }
        let defaultInterestRate;
        if (DEFAULT_INTEREST_RATE !== undefined || DEFAULT_INTEREST_RATE !== null){
            defaultInterestRate = Number(DEFAULT_INTEREST_RATE);
        }else{
            defaultInterestRate = 10;
        }
        // console.log("Query params in type service line 42:", queryParams)
        let typesServices = new TypesServices();
       let listOfInvestmentType = await typesServices.getTypes(queryParams);   
        for (let index = 0; index < listOfInvestmentType.length; index++) {
            const currentInvestmentType = listOfInvestmentType[index];
           let updatedInterestRate = await typesServices.updateTypeInterestRate(currentInvestmentType, defaultInterestRate);  
            console.log("After AXIOS CALL for Reset Investment Interest Rate,  ==================================================");
            console.log(updatedInterestRate!.interestRate);  
        }
        
        // console.log("After AXIOS CALL for Reset Investment Interest Rate,  ==================================================");
        // console.log("The ASTRAPAY API Reset Investment Interest Rate response,line 64: ");

    }
}
