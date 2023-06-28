import { schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateTimelineValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        // initiate the parent class
        super()
    }

    public schema = schema.create({
        investmentId: schema.string({ escape: true }),
        userId: schema.string(),
        walletId: schema.string(),
        action: schema.string(),
        message: schema.string.optional(),
        adminMessage: schema.string.optional(),
        metadata: schema.string.optional(),
        createdAt: schema.string.optional(),
    })

}
