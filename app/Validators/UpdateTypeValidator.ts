import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class UpdateTypeValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        rfiRecordId: schema.string.optional(),
        rfiCode: schema.string.optional(),
        typeName: schema.string.optional({ escape: true }, [rules.maxLength(100), rules.unique({
            table: 'types',
            column: 'type_name'
        })]),
        lowestAmount: schema.number.optional(),
        highestAmount: schema.number.optional(),
        duration: schema.array.optional().members(
            schema.string(),
        ),
        interestRate: schema.number.optional(),
        isRolloverAllowed: schema.boolean.optional(),
        quantityIssued: schema.number.optional(),
        quantityAvailableForIssue: schema.number.optional(),
        // fixedCharge: schema.number.optional(),
        // ratedCharge: schema.number.optional(),
        availableTypes: schema.array.optional().members(
            schema.string(),
        ),

        minimumAllowedPeriodOfInvestment: schema.string.optional(),
        maximumAllowedPeriodOfInvestment: schema.string.optional(),
        // dailyMinimumLimit: schema.number.optional(),
        // dailyMaximumLimit: schema.number.optional(),
        // weeklyMinimumLimit: schema.number.optional(),
        // weeklyMaximumLimit: schema.number.optional(),
        // monthlyMinimumLimit: schema.number.optional(),
        // monthlyMaximumLimit: schema.number.optional(),
        // yearlyMinimumLimit: schema.number.optional(),
        // yearlyMaximumLimit: schema.number.optional(),
        isAutomated: schema.boolean.optional(),
        description: schema.string.optional(),
        // isRenewable: schema.boolean.optional(),
        features: schema.array.optional().members(
            schema.string(),
        ),
        requirements: schema.array.optional().members(
            schema.string(),
        ),
        createdBy: schema.string.optional(),
        tagName: schema.string.optional({ escape: true }, [rules.maxLength(100), rules.unique({
            table: 'types',
            column: 'tag_name'
        })]),
        currencyCode: schema.string.optional(),
        lng: schema.string.optional(),
        lat: schema.string.optional(),
        status: schema.enum.optional(['active', 'inactive']),

    });
}
