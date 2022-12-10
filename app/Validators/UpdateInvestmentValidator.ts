import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class UpdateInvestmentValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        userId: schema.string.optional(),
        walletId: schema.string.optional(),
        rfiRecordId: schema.string.optional(),
        rfiCode: schema.string.optional(),
        firstName: schema.string.optional(),
        lastName: schema.string.optional(),
        phone: schema.string.optional(),
        email: schema.string.optional(),
        investorFundingWalletId: schema.string.optional(),
        amount: schema.number.optional(),
        duration: schema.number.optional(),
        isRolloverActivated: schema.boolean.optional(),
        rolloverType: schema.enum.optional(['100', '101', '102', '103']),
        rolloverTarget: schema.number.optional(),
        rolloverDone: schema.number.optional(),
        investmentTypeName: schema.string.optional(),
        investmentTypeId: schema.string.optional(),
        investmentType: schema.enum.optional(['fixed', 'debenture']),
        tagName: schema.string.optional({ escape: true }, [rules.maxLength(150)]),
        currencyCode: schema.string.optional({ escape: true }, [rules.maxLength(5)]),
        interestRate: schema.number.optional(),
        interestDueOnInvestment: schema.number.optional(),
        totalAmountToPayout: schema.number.optional(),
        processedBy: schema.string.optional(),
        assignedTo: schema.string.optional(),
        approvedBy: schema.string.optional(),
        lng: schema.string.optional(),
        lat: schema.string.optional(),
    });
}
