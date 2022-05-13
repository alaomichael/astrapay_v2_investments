import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Approval from 'App/Models/Approval'
import Investment from 'App/Models/Investment'
import { DateTime } from 'luxon'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Event from '@ioc:Adonis/Core/Event'

export default class ApprovalsController {
  public async index({ params, request, response }: HttpContextContract) {
    console.log('Approvals params: ', params)
    const { userId, limit, investmentId, requestType, approvalStatus, remark } = request.qs()
    console.log('Approvals query: ', request.qs())
    const countApprovals = await Approval.query().where('approval_status', 'pending').getCount()
    console.log('Approval count: ', countApprovals)

    const approval = await Approval.all()
    let sortedApprovals = approval
    if (userId) {
      // @ts-ignore
      sortedApprovals = await Approval.query().where('user_id', userId)
    }
    // if (investmentId) {
    //   // @ts-ignore
    //   sortedApprovals = await Approval.query().where('investment_id', investmentId)
    // }
    if (investmentId) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        return approval.investmentId === parseInt(investmentId)
      })
    }

    if (requestType) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        return approval.requestType!.startsWith(requestType)
        // return approval.requestType!.includes(requestType)
      })
    }

    if (remark && sortedApprovals.length > 0) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        if (approval.remark !== null) {
          return approval.remark.startsWith(remark)
        } else {
          return
        }
      })
    }

    if (approvalStatus) {
      sortedApprovals = sortedApprovals.filter((approval) => {
        // @ts-ignore
        return approval.approvalStatus === `${approvalStatus}`
      })
    }

    if (limit) {
      sortedApprovals = sortedApprovals.slice(0, Number(limit))
    }
    if (sortedApprovals.length < 1) {
      return response.status(200).json({
        status: 'fail',
        message: 'no approval request matched your search',
        data: [],
      })
    }
    // return approval(s)
    return response.status(200).json({
      status: 'ok',
      data: sortedApprovals.map((approval) => approval.$original),
    })
  }

  public async store({ request, response }: HttpContextContract) {
    try {
      const approvalSchema = schema.create({
        userId: schema.number(),
        investmentId: schema.number(),
        requestType: schema.string({ escape: true }, [rules.maxLength(50)]),
      })
      const payload: any = await request.validate({ schema: approvalSchema })
      const approval = await Approval.create(payload)
      // @ts-ignore
      // approval.status = 'active'
      await approval.save()
      console.log('The new approval request:', approval)

      // TODO
      console.log('A New approval request has been Created.')

      // Save approval new status to Database
      await approval.save()
      // Send approval Creation Message to Queue

      // @ts-ignore
      Event.emit('new:approval', { id: approval.id, extras: approval.requestType })
      return response.status(201).json({ status: 'ok', data: approval.$original })
    } catch (error) {
      console.error(error)
      return response.status(404).json({
        status: 'fail',
        message: 'your approval request was not successful, please try again.',
      })
    }
  }

  public async update({ request, response }: HttpContextContract) {
    try {
      const { investmentId, userId } = request.qs()
      console.log('Approval query: ', request.qs())

      let approval = await Approval.query().where({
        investment_id: investmentId,
        user_id: userId,
      })
      console.log(' QUERY RESULT: ', approval)
      let investment = await Investment.query().where({
        id: investmentId,
        user_id: userId,
      })
      if (approval.length < 1 || investment === undefined) {
        return response.status(404).json({ status: 'fail', message: 'Not Found' })
      }
      console.log(' QUERY RESULT for investment: ', investment[0].$original)

      if (approval.length > 0) {
        console.log('Investment approval Selected for Update:', approval)
        if (approval) {
          approval[0].approvalStatus = request.input('approvalStatus')
            ? request.input('approvalStatus')
            : approval[0].approvalStatus
          approval[0].remark = request.input('remark')
            ? request.input('remark')
            : approval[0].remark
          if (approval) {
            let newStatus
            await approval[0].save()
            console.log('Update Approval Request:', approval)
            if (
              approval[0].requestType === 'start investment' &&
              approval[0].approvalStatus === 'approved'
            ) {
              newStatus = 'initiated'
              investment[0].status = newStatus
              investment[0].approvalStatus = approval[0].approvalStatus
              // Save the updated investment
              await investment[0].save()
            } else if (
              approval[0].requestType === 'terminate investment' &&
              approval[0].approvalStatus === 'approved'
            ) {
              newStatus = 'terminated'
              investment[0].status = newStatus
              investment[0].approvalStatus = approval[0].approvalStatus
              investment[0].isPayoutAuthorized = true
              investment[0].isTerminationAuthorized = true
              // Save the updated investment
              await investment[0].save()
            } else if (
              approval[0].requestType === 'payout investment' &&
              approval[0].approvalStatus === 'approved'
            ) {
              // newStatus = 'payout'
              // investment[0].status = newStatus
              investment[0].approvalStatus = approval[0].approvalStatus
              investment[0].isPayoutAuthorized = true
              investment[0].isTerminationAuthorized = true
              // Save the updated investment
              await investment[0].save()
            } else if (
              approval[0].requestType === 'start investment' &&
              approval[0].approvalStatus === 'declined'
            ) {
              newStatus = 'initiated'
              investment[0].status = newStatus
              investment[0].approvalStatus = approval[0].approvalStatus
              // Save the updated investment
              await investment[0].save()
            } else if (
              approval[0].requestType === 'terminate investment' &&
              approval[0].approvalStatus === 'declined'
            ) {
              newStatus = 'active'
              investment[0].status = newStatus
              investment[0].approvalStatus = approval[0].approvalStatus
              investment[0].isPayoutAuthorized = false
              investment[0].isTerminationAuthorized = false
              // Save the updated investment
              await investment[0].save()
            } else if (
              approval[0].requestType === 'payout investment' &&
              approval[0].approvalStatus === 'declined'
            ) {
              newStatus = 'active'
              investment[0].status = newStatus
              investment[0].approvalStatus = approval[0].approvalStatus
              investment[0].isPayoutAuthorized = false
              investment[0].isTerminationAuthorized = false
              // Save the updated investment
              await investment[0].save()
            }
            // Update Investment data
            console.log(' Updated investment line 196: ', investment[0].$original)
            // send to user
            return response
              .status(200)
              .json({ status: 'ok', data: approval.map((inv) => inv.$original) })
          }
          return // 422
        } else {
          return response.status(304).json({ status: 'fail', data: approval })
        }
      } else {
        return response
          .status(404)
          .json({ status: 'fail', message: 'No data match your query parameters' })
      }
    } catch (error) {
      console.error(error)
    }
    // return // 401
  }

  public async destroy({ request, response }: HttpContextContract) {
    const { userId, investmentId, approvalId } = request.qs()
    console.log('approval query: ', request.qs())

    let approval = await Approval.query().where({
      investment_id: investmentId,
      user_id: userId,
      id: approvalId,
    })
    console.log(' QUERY RESULT: ', approval)

    if (approval.length > 0) {
      approval = await Approval.query()
        .where({ investment_id: investmentId, user_id: userId, id: approvalId })
        .delete()
      console.log('Deleted data:', approval)
      return response.status(200).json({ status: 'ok', message: 'Approval Request Deleted.' })
    } else {
      return response.status(404).json({ status: 'fail', message: 'Invalid parameters' })
    }
  }
}
