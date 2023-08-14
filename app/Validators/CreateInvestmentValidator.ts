import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateInvestmentValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        userId: schema.string(),
        walletId: schema.string(),
        rfiRecordId: schema.string(),
        rfiCode: schema.string(),
        firstName: schema.string(),
        lastName: schema.string(),
        phone: schema.string(),
        email: schema.string([rules.email()]),
        // investorFundingWalletId: schema.string(),
        amount: schema.number(),
        duration: schema.number(),
        rolloverType: schema.enum(['100', '101', '102', '103']),
        isRolloverActivated: schema.boolean(),
        rolloverTarget: schema.number(),
        // rolloverDone: schema.number(),
        investmentTypeName: schema.string(),
        investmentTypeId: schema.string(),
        investmentType: schema.enum(['fixed', 'debenture']),
        tagName: schema.string({ escape: true }, [rules.maxLength(150)]),
        currencyCode: schema.string.optional({ escape: true }, [rules.maxLength(5)]),
        // interestRate: schema.number(),
        // interestDueOnInvestment: schema.number(),
        // totalAmountToPayout: schema.number(),
        // processedBy: schema.string.optional(),
        lng: schema.string(),
        lat: schema.string(),
        assignedTo: schema.string.optional(),
        approvedBy: schema.string.optional(),
    });
}
