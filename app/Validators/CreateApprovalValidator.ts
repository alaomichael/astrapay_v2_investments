import { schema, } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateApprovalValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        walletId: schema.string(),
        userId: schema.string(),
        investmentId: schema.string(),
        requestType: schema.string(),
        approvalStatus: schema.string(),
        assignedTo: schema.string.optional(),
        // remark: schema.string.optional(),
        remark: schema.array.optional().members(
            schema.object.optional().members({
                field: schema.string(),
                reason: schema.string(),
            })),
        processedBy: schema.string.optional(),
    });
}
