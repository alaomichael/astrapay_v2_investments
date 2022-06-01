/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable prettier/prettier */
// import HttpContext from '@ioc:Adonis/Core/HttpContext'
import Event from '@ioc:Adonis/Core/Event'
import Investment from 'App/Models/Investment'
import { interestDueOnPayout, investmentRate, sendPaymentDetails } from 'App/Helpers/utils'
import { DateTime } from 'luxon'
import Setting from 'App/Models/Setting'
import Payout from 'App/Models/Payout'
import PuppeteerServices from './PuppeteerServices'
export default class RolloverServices {
  effectRollover = async (investmentData: { interestDueOnInvestment?: any; duration: any; investmentType: any; amount?: any; rolloverType?: any; rolloverTarget?: any; rolloverDone?: any; userId?: any; tagName?: any; currencyCode?: any; long?: any; lat?: any; walletHolderDetails?: any }, amount: any, rolloverType: any, rolloverDone: number, rolloverTarget: number) => {
    return new Promise(async (resolve, reject) => {
      console.log(
        'Datas line 1562 : ',
        investmentData,
        amount,
        rolloverType,
        rolloverDone,
        rolloverTarget
      )
      if (!investmentData || rolloverTarget < 0) {
        reject(
          new Error(
            'Incomplete parameters , or no rollover target was set, or is less than allowed range'
          )
        )
      }
      let amountToPayoutNow: any
      let amountToBeReinvested: any
      let timelineObject: { id: void; action: string; message: string; createdAt: DateTime; meta: string }
      let timeline: any[]
      let settings = await Setting.query().where({ tagName: 'default setting' })
      console.log('Approval setting line 2081:', settings[0])
      if (rolloverDone >= rolloverTarget) {
        let payload = investmentData
        let payout: Payout
        let investmentId = payload.id
     let userId = payload.userId
        let requestType = 'payout investment'
        amountToPayoutNow = amount + investmentData.interestDueOnInvestment
        // Send Investment Initiation Message to Queue
        payload = investmentData
        console.log('Payout investment data line 2091:', payload)
        // check if payout request is existing
        let payoutRequestIsExisting = await Payout.query().where({
          investment_id: investmentId,
          user_id: userId,
        })
        console.log(
          'Investment payout Request Is Existing data line 2098:',
          payoutRequestIsExisting
        )
        if (
          payoutRequestIsExisting.length < 1 &&
          // investment[0].requestType !== 'start investment' &&
          payload.approvalStatus !== 'pending' &&
          payload.status !== 'initiated'
        ) {
          console.log('Payout investment data line 2107:', payload)
          payload.timeline = JSON.stringify(investment[0].timeline)
          console.log('Payout investment data line 2109:', payload)

          payout = await Payout.create(payload)
          payout.status = 'payout'
          payout.isPayoutAuthorized = investment[0].isPayoutAuthorized
          payout.isTerminationAuthorized = investment[0].isTerminationAuthorized

          await payout.save()
          console.log('Matured Payout investment data line 2117:', payout)
        } else {
          payoutRequestIsExisting[0].requestType = investment[0].requestType
          payoutRequestIsExisting[0].isPayoutAuthorized = investment[0].isPayoutAuthorized
          payoutRequestIsExisting[0].isTerminationAuthorized = investment[0].isTerminationAuthorized
          payoutRequestIsExisting[0].status = 'payout'
          // investment[0]
          payload.status = 'payout'
          //  Save
          await payoutRequestIsExisting[0].save()
          await payload.save()
        }

        let isPayoutAutomated = settings[0].isPayoutAutomated
        if (isPayoutAutomated === false) {
          try {
            let approvalRequestIsDone = approvalRequest(userId, investmentId, requestType)
            console.log(' Approval request return line 1672 : ', approvalRequestIsDone)
            if (approvalRequestIsDone === undefined) {
              return response.status(400).json({
                status: 'FAILED',
                message:
                  'payment processing approval request was not successful, please try again.',
                data: [],
              })
            }
          } catch (error) {
            console.error(error)
            return response.send({
              status: 'FAILED',
              message: 'The approval request for this transaction was not sent successfully.',
              error: error.message,
            })
          }

          // update timeline
          timelineObject = {
            id: uuid(),
            action: 'investment payment approval initiated',
            // @ts-ignore
            message: `${investment[0].walletHolderDetails.firstName} investment has just been sent for payment processing approval.`,
            createdAt: DateTime.now(),
            meta: `amount to payout: ${investment[0].totalAmountToPayout}, request type : ${investment[0].requestType}`,
          }
          console.log('Timeline object line 2168:', timelineObject)
          //  Push the new object to the array
          timeline = investment[0].timeline
          timeline.push(timelineObject)
          console.log('Timeline object line 2173:', timeline)
          // stringify the timeline array
          investment[0].timeline = JSON.stringify(timeline)
          // Save
          await investment[0].save()

          return response.send({
            status: 'OK',
            message:
              'Rollover target has been reached or exceeded, and the investment details has been sent to admin for payout approval.',
            data: investment[0].$original,
          })
        } else {
          try {
            // TODO
            // Send Payment details to Transaction Service
            // Update with the real transaction service endpoint and payload
            let rate = await sendPaymentDetails(amount, duration, investmentType)
            console.log(' Rate return line 2190 : ', rate)
          } catch (error) {
            console.error(error)
            return response.send({
              status: 'FAILED',
              message: 'The transaction was not sent successfully.',
              error: error.message,
            })
          }
          const isTransactionSentForProcessing = true
          if (isTransactionSentForProcessing === false) {
            return response.send({
              status: 'FAILED',
              message: 'The transaction was not sent successfully.',
              isTransactionInProcess: isTransactionSentForProcessing,
            })
          }
          //}
          // update timeline
          timelineObject = {
            id: uuid(),
            action: 'investment payout initiated',
            // @ts-ignore
            message: `${investment[0].walletHolderDetails.firstName} investment has just been sent for payment processing.`,
            createdAt: DateTime.now(),
            meta: `amount to payout: ${investment[0].totalAmountToPayout}, request type : ${investment[0].requestType}`,
          }
          console.log('Timeline object line 2217:', timelineObject)
          //  Push the new object to the array
          timeline = investment[0].timeline
          timeline.push(timelineObject)
          console.log('Timeline object line 2221:', timeline)
          // stringify the timeline array
          investment[0].timeline = JSON.stringify(timeline)
          // Save
          await investment[0].save()

          return response.send({
            status: 'OK',
            message:
              'Rollover target has been reached or exceeded, and payout of the sum total of your principal and interest has been initiated.',
            data: investment[0].$original,
          })
        }
      }
      // if rolloverDone < rolloverTarget
      investmentData = investment[0]
      let payload = investmentData
      console.log('Payload line 1969 :', payload)
      let payloadDuration = investmentData.duration
      let payloadInvestmentType = investmentData.investmentType

      // let investmentRate = async function () {
      //   try {
      //     const response = await axios.get(
      //       `${API_URL}/investments/rates?amount=${payload.amount}&duration=${payload.duration}&investmentType=${payload.investmentType}`
      //     )
      //     console.log('The API response: ', response.data)
      //     if (response.data.status === 'OK' && response.data.data.length > 0) {
      //       return response.data.data[0].interest_rate
      //     } else {
      //       return
      //     }
      //   } catch (error) {
      //     console.error(error)
      //   }
      // }

      // A function for creating new investment
      const createInvestment = async (
        payloadAmount: any,
        payloadDuration: any,
        payloadInvestmentType: any,
        investmentData: { amount: any; rolloverType: any; rolloverTarget: any; rolloverDone: any; investmentType: any; duration: any; userId: any; tagName: any; currencyCode: any; long: any; lat: any; walletHolderDetails: any }
      ) => {
        console.log('Investment data line 1713: ', investmentData)
        console.log('Investment payloadAmount data line 1714: ', payloadAmount)
        console.log('Investment payloadDuration data line 1715: ', payloadDuration)
        console.log('Investment payloadInvestmentType data line 1717: ', payloadInvestmentType)

        console.log(
          ' The Rate return for RATE line 2274: ',
          await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
        )
        let rate = await investmentRate(payloadAmount, payloadDuration, payloadInvestmentType)
        console.log(' Rate return line 2282 : ', rate)
        if (rate === undefined) {
          return response.status(400).json({
            status: 'FAILED',
            message: 'no investment rate matched your search, please try again.',
            data: [],
          })
        }
        let settings = await Setting.query().where({ tagName: 'default setting' })
        console.log('Approval setting line 2291:', settings[0])
        let payload: Partial<{ id: string; userId: string; walletId: string; amount: number; duration: string; rolloverType: "100" | "101" | "102" | "103"; rolloverTarget: number; rolloverDone: number; investmentType: "fixed" | "debenture"; tagName: string; currencyCode: string; walletHolderDetails: JSON; long: number; lat: number; interestRate: number; interestDueOnInvestment: number; totalAmountToPayout: number; createdAt: DateTime; startDate: DateTime; payoutDate: DateTime; isPayoutAuthorized: boolean; isTerminationAuthorized: boolean; isPayoutSuccessful: boolean; requestType: string; approvalStatus: string; status: string; timeline: string; certificateUrl: string; datePayoutWasDone: DateTime; updatedAt: DateTime }>
        // destructure / extract the needed data from the investment
        let {
          amount,
          rolloverType,
          rolloverTarget,
          rolloverDone,
          investmentType,
          duration,
          userId,
          tagName,
          currencyCode,
          long,
          lat,
          walletHolderDetails,
        } = investmentData
        // copy the investment data to payload
        payload = {
          amount,
          rolloverType,
          rolloverTarget,
          rolloverDone,
          investmentType,
          duration,
          userId,
          tagName,
          currencyCode,
          long,
          lat,
          walletHolderDetails,
        }
        payload.amount = payloadAmount
        //  payload.interestRate = rate
        console.log('PAYLOAD line 2325 :', payload)

        const investment = await Investment.create(payload)
        investment.interestRate = rate

        // When the Invest has been approved and activated
        let investmentAmount = investment.amount
        let investmentDuration = investment.duration
        let amountDueOnPayout = await interestDueOnPayout(
          investmentAmount,
          rate,
          investmentDuration
        )
        // @ts-ignore
        investment.interestDueOnInvestment = amountDueOnPayout
        // @ts-ignore
        investment.totalAmountToPayout = investment.amount + amountDueOnPayout
        // @ts-ignore
        investment.walletId = investment.walletHolderDetails.investorFundingWalletId
        await investment.save()
        console.log('The new Reinvestment, line 2345 :', investment)

        await investment.save()
        let newInvestmentId = investment.id
        // @ts-ignore
        let newInvestmentEmail = investment.walletHolderDetails.email

        // Send Investment Initiation Message to Queue

        // check if Approval is set to Auto, from Setting Controller
        let requestType = 'start investment'
        let approvalIsAutomated = settings[0].isInvestmentAutomated
        if (approvalIsAutomated === false) {
          // Send Approval Request to Admin
          userId = investment.userId
          let investmentId = investment.id
          // let requestType = 'start investment'
          let approval = approvalRequest(userId, investmentId, requestType)
          console.log(' Approval request return line 2362 : ', approval)
          if (approval === undefined) {
            return response.status(400).json({
              status: 'FAILED',
              message: 'investment approval request was not successful, please try again.',
              data: [],
            })
          }
          // update timeline
          timelineObject = {
            id: uuid(),
            action: 'investment initiated',
            // @ts-ignore
            message: `${investment.walletHolderDetails.firstName} investment has just been sent for activation approval.`,
            createdAt: DateTime.now(),
            meta: `amount invested: ${investment.amount}, request type : ${requestType}`,
          }
          console.log('Timeline object line 2380:', timelineObject)
          //  Push the new object to the array
          console.log('Timeline array line 2382:', investment.timeline)
          //  create a new timeline array
          timeline = []
          timeline.push(timelineObject)
          console.log('Timeline object line 2384:', timeline)
          // stringify the timeline array
          investment.timeline = JSON.stringify(timeline)
          console.log('Timeline array line 2389:', investment.timeline)
          // Save
          await investment.save()

          // Send to Notification Service
          // New investment initiated
          Event.emit('new:investment', {
            id: newInvestmentId,
            email: newInvestmentEmail,
          })
        } else if (approvalIsAutomated === true) {
          // TODO
          // If Approval is automated
          // Send Investment Payload To Transaction Service and await response
          let sendToTransactionService = 'OK' //= new SendToTransactionService(investment)
          console.log(' Feedback from Transaction service: ', sendToTransactionService)
          if (sendToTransactionService === 'OK') {
            // Activate the investment
            investment.requestType = requestType
            investment.status = 'active'
            investment.approvalStatus = 'approved'
            investment.startDate = DateTime.now() //.toISODate()
            investment.payoutDate = DateTime.now().plus({
              days: parseInt(investmentDuration),
            })
            // update timeline
            timelineObject = {
              id: uuid(),
              action: 'investment activated',
              // @ts-ignore
              message: `${investment.walletHolderDetails.firstName} investment has just been activated.`,
              createdAt: DateTime.now(),
              meta: `amount invested: ${investment.amount}, request type : ${investment.requestType}`,
            }
            console.log('Timeline object line 2422:', timelineObject)
            //  Push the new object to the array
            timeline = [] //JSON.parse(investment.timeline)
            timeline.push(timelineObject)
            console.log('Timeline object line 2426:', timeline)
            // stringify the timeline array
            investment.timeline = JSON.stringify(timeline)
            // Save
            await investment.save()
            const requestUrl = Env.get('CERTIFICATE_URL') //+ investment.id
            await new PuppeteerServices(requestUrl, {
              paperFormat: 'a3',
              fileName: `${investment.requestType}_${investment.id}`,
            })
              .printAsPDF(investment)
              .catch((error) => console.error(error))
            console.log('Investment Certificate generated, URL, line 2439: ', requestUrl)
            // save the certicate url
            investment.certificateUrl = requestUrl
            await investment.save()
            // Send to Notification Service
            // New Investment Initiated and Activated
            Event.emit('new:investment', {
              id: newInvestmentId,
              email: newInvestmentEmail,
            })
          }
        }
        return response.status(201).json({ status: 'OK', data: investment.$original })
        // END
      }
      let payout: Payout
      let investmentCreated: undefined
      let newTimeline: any[] = []
      let rate: undefined

      switch (rolloverType) {
        case '101':
          //'101' = 'rollover principal only',
          amountToBeReinvested = amount
          payloadDuration = investment[0].duration
          payloadInvestmentType = investment[0].investmentType
          amountToPayoutNow = investment[0].interestDueOnInvestment
          // investment[0].amount = amountToBeReinvested
          investment[0].totalAmountToPayout = amountToPayoutNow
          rolloverDone = rolloverDone + 1
          investment[0].rolloverTarget = rolloverTarget
          investment[0].rolloverDone = rolloverDone
          await investment[0].save()
          investmentData = investment[0]
          // Save the payment data in payout table
          payload = investmentData
          console.log('Payout investment data line 2475:', payload)
          payload.timeline = JSON.stringify(investment[0].timeline)
          console.log('Matured Payout investment data line 2477:', payload)

          payout = await Payout.create(payload)
          payout.status = 'payout'
          await payout.save()
          console.log('Matured Payout investment data line 2482:', payout)

          // send payment details to transction service

          // Send Notification

          console.log(
            ' The Rate return for RATE line 2491: ',
            await investmentRate(amountToBeReinvested, payloadDuration, payloadInvestmentType)
          )
          rate = await investmentRate(amountToBeReinvested, payloadDuration, payloadInvestmentType)
          console.log(' Rate return line 2503 : ', rate)
          if (rate === undefined) {
            //  send the money to the investor wallet
            console.log(
              `Principal of ${currencyCode} ${amountToBeReinvested} and the interest of ${currencyCode} ${amountToPayoutNow} was paid, because there was no investment product that matched your request.`
            )
            // update timeline
            timelineObject = {
              id: uuid(),
              action: 'matured investment payout',
              // @ts-ignore
              message: `${investment[0].walletHolderDetails.firstName} payment on investment has just been sent.`,
              createdAt: DateTime.now(),
              meta: `amount invested: ${investment[0].amount},amount paid: ${
                investment[0].interestDueOnInvestment + investment[0].amount
              }, request type : ${investment[0].requestType}`,
            }
            console.log('Timeline object line 2518:', timelineObject)
            //  Push the new object to the array
            newTimeline = investment[0].timeline
            newTimeline.push(timelineObject)
            console.log('Timeline object line 2522:', newTimeline)
            // stringify the timeline array
            investment[0].timeline = JSON.stringify(newTimeline)
            // Save
            await investment[0].save()

            return response.status(400).json({
              status: 'FAILED',
              message: 'no investment rate matched your search, please try again.',
              data: [],
            })
          }
          // initiate a new investment
          createInvestment(
            amountToBeReinvested,
            payloadDuration,
            payloadInvestmentType,
            investmentData
          )

          console.log(
            `Principal of ${currencyCode} ${amountToBeReinvested} was Reinvested and the interest of ${currencyCode} ${amountToPayoutNow} was paid`
          )
          // update timeline
          timelineObject = {
            id: uuid(),
            action: 'matured investment payout',
            // @ts-ignore
            message: `${investment[0].walletHolderDetails.firstName} payment on investment has just been sent.`,
            createdAt: DateTime.now(),
            meta: `amount reinvested: ${investment[0].amount},amount paid: ${investment[0].totalAmountToPayout}, request type : ${investment[0].requestType}`,
          }
          console.log('Timeline object line 2554:', timelineObject)
          //  Push the new object to the array
          newTimeline = investment[0].timeline
          newTimeline.push(timelineObject)
          console.log('Timeline object line 2558:', newTimeline)
          // stringify the timeline array
          investment[0].timeline = JSON.stringify(newTimeline)
          // Save
          await investment[0].save()
          break
        case '102':
          // '102' = 'rollover principal plus interest',
          amountToBeReinvested = amount + investment[0].interestDueOnInvestment
          payloadDuration = investment[0].duration
          payloadInvestmentType = investment[0].investmentType
          //  investment[0].amount = amountToBeReinvested
          investment[0].totalAmountToPayout = 0
          amountToPayoutNow = investment[0].totalAmountToPayout
          rolloverDone = rolloverDone + 1
          investment[0].rolloverTarget = rolloverTarget
          investment[0].rolloverDone = rolloverDone
          await investment[0].save()
          investmentData = investment[0]
          // Save the payment data in payout table
          payload = investmentData
          console.log('Payout investment data line 2578:', payload)
          payload.timeline = JSON.stringify(investment[0].timeline)
          console.log('Matured Payout investment data line 2580:', payload)
          payout = await Payout.create(payload)
          payout.status = 'payout'
          await payout.save()
          console.log('Matured Payout investment data line 2584:', payout)

          // send payment details to transction service

          // Send Notification

          console.log(
            ' The Rate return for RATE line 2591: ',
            await investmentRate(amountToBeReinvested, payloadDuration, payloadInvestmentType)
          )
          rate = await investmentRate(amountToBeReinvested, payloadDuration, payloadInvestmentType)
          console.log(' Rate return line 2603 : ', rate)
          if (rate === undefined) {
            //  send the money to the investor wallet
            console.log(
              `Principal of ${currencyCode} ${amountToBeReinvested} and the interest of ${currencyCode} ${amountToPayoutNow} was paid, because there was no investment product that matched your request.`
            )
            // update timeline
            timelineObject = {
              id: uuid(),
              action: 'matured investment payout',
              // @ts-ignore
              message: `${investment[0].walletHolderDetails.firstName} payment on investment has just been sent.`,
              createdAt: DateTime.now(),
              meta: `amount paid back to wallet: ${amountToBeReinvested},interest: ${investment[0].totalAmountToPayout}, request type : ${investment[0].requestType}`,
            }
            console.log('Timeline object line 2618:', timelineObject)
            //  Push the new object to the array
            newTimeline = investment[0].timeline
            newTimeline.push(timelineObject)
            console.log('Timeline object line 2622:', newTimeline)
            // stringify the timeline array
            investment[0].timeline = JSON.stringify(newTimeline)
            // Save
            await investment[0].save()

            return response.status(400).json({
              status: 'FAILED',
              message: 'no investment rate matched your search, please try again.',
              data: [],
            })
          }

          investmentCreated = await createInvestment(
            amountToBeReinvested,
            payloadDuration,
            payloadInvestmentType,
            investmentData
          )
          console.log('investmentCreated data line 2641:', investmentCreated)
          if (investmentCreated === undefined) {
            // send the money to the user
            // send payment details to transction service
            // Send Notification
            return response.status(404).json({
              status: 'FAILED',
              message: 'reinvestment was not successful, please try again',
              data: [amountToBeReinvested, payloadDuration, payloadInvestmentType, investmentData],
            })
            // break
          }

          console.log(
            `The Sum Total of the Principal and the interest of ${currencyCode} ${amountToBeReinvested} was Reinvested`
          )
          // update timeline

          timelineObject = {
            id: uuid(),
            action: 'matured investment payout',
            // @ts-ignore
            message: `${investment[0].walletHolderDetails.firstName} payment for matured investment has just been sent.`,
            createdAt: DateTime.now(),
            meta: `amount paid: ${investment[0].totalAmountToPayout},amount reinvested: ${amountToBeReinvested}, request type : ${investment[0].requestType}`,
          }
          console.log('Timeline object line 2674:', timelineObject)
          //  Push the new object to the array
          newTimeline = investment[0].timeline
          newTimeline.push(timelineObject)
          console.log('Timeline object line 2678:', newTimeline)
          // stringify the timeline array
          investment[0].timeline = JSON.stringify(newTimeline)
          // Save
          await investment[0].save()
          break
        // case '103':
        //   // '103' = 'rollover interest only'
        //   amountToBeReinvested = investment[0].interestDueOnInvestment
        //   amountToPayoutNow = amount
        //   payloadDuration = investment[0].duration
        //   payloadInvestmentType = investment[0].investmentType
        //   investment[0].amount = amountToBeReinvested
        //   investment[0].totalAmountToPayout = amountToPayoutNow
        //   rolloverDone = rolloverDone + 1
        //   investment[0].rolloverTarget = rolloverTarget
        //   investment[0].rolloverDone = rolloverDone
        //   await investment[0].save()
        //   investmentData = investment[0]
        //   // Save the payment data in payout table
        //   payload = investmentData
        //   console.log('Payout investment data line 1941:', payload)
        //   payout = await Payout.create(payload)
        //   payout.status = 'payout'
        //   await payout.save()
        //   console.log('Matured Payout investment data line 1945:', payout)
        //   // send payment details to transction service

        //   // Send Notification

        //   // initiate a new investment
        //   investmentCreated = await createInvestment(
        //     amountToBeReinvested,
        //     payloadDuration,
        //     payloadInvestmentType,
        //     investmentData
        //   )
        //   console.log('investmentCreated data line 1990:', investmentCreated)
        //   if (investmentCreated === undefined) {
        //     // send the money to the user
        //     // send payment details to transction service
        //     // Send Notification
        // return response.status(404).json({
        //   status: 'FAILED',
        //   message: 'reinvestment was not successful, please try again',
        //   data: [
        //     amountToBeReinvested,
        //     payloadDuration,
        //     payloadInvestmentType,
        //     investmentData,
        //   ],
        // })
        //   }

        //   console.log(
        //     `The Interest of ${currencyCode} ${amountToBeReinvested} was Reinvested and the Principal of ${currencyCode} ${amountToPayoutNow} was paid`
        //   )
        //   break
        default:
          console.log('Nothing was done on this investment')
          break
      }
      return resolve({
        payload,
        amountToBeReinvested,
        amountToPayoutNow,
        rolloverDone,
      })
    })
  }
}
function uuid() {
    throw new Error('Function not implemented.')
}

function approvalRequest(userId: any, investmentId: any, requestType: string) {
    throw new Error('Function not implemented.')
}

function duration(amount: any, duration: any, investmentType: any) {
    throw new Error('Function not implemented.')
}

function investmentType(amount: any, duration: (amount: any, duration: any, investmentType: any) => void, investmentType: any) {
    throw new Error('Function not implemented.')
}

function userId(userId: any, investmentId: any, requestType: string) {
    throw new Error('Function not implemented.')
}

