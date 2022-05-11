import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Approval from 'App/Models/Approval'
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
      data: sortedApprovals,
    })
  }

  public async store({ request }: HttpContextContract) {
    // const user = await auth.authenticate()
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
    return approval
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
            // send to user
            await approval[0].save()
            console.log('Update Approval Request:', approval)
            return approval
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
      return response.send('Approval Delete.')
    } else {
      return response.status(404).json({ status: 'fail', message: 'Invalid parameters' })
    }
  }
}
