import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateTypeValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        rfiRecordId: schema.string(),
        rfiCode: schema.string(),
        typeName: schema.string({ escape: true }, [rules.maxLength(100), rules.unique({
            table: 'types',
            column: 'type_name'
        })]),
        lowestAmount: schema.number(),
        highestAmount: schema.number(),
        duration: schema.array().members(
            schema.number(),
        ),
        interestRate: schema.number(),
        isRolloverAllowed: schema.boolean(),
        quantityIssued: schema.number.optional(),
        quantityAvailableForIssue: schema.number.optional(),
        // fixedCharge: schema.number.optional(),
        // ratedCharge: schema.number.optional(),
        availableTypes: schema.array().members(
            schema.string(),
        ),

        minimumAllowedPeriodOfInvestment: schema.string(),
        maximumAllowedPeriodOfInvestment: schema.string(),
        // dailyMinimumLimit: schema.number.optional(),
        // dailyMaximumLimit: schema.number.optional(),
        // weeklyMinimumLimit: schema.number.optional(),
        // weeklyMaximumLimit: schema.number.optional(),
        // monthlyMinimumLimit: schema.number.optional(),
        // monthlyMaximumLimit: schema.number.optional(),
        // yearlyMinimumLimit: schema.number.optional(),
        // yearlyMaximumLimit: schema.number.optional(),
        isAutomated: schema.boolean(),
        description: schema.string.optional(),
        features: schema.array().members(
            schema.string(),
        ),
        requirements: schema.array().members(
            schema.string(),
        ),
        createdBy: schema.string.optional(),
        tagName: schema.string({ escape: true }, [rules.maxLength(100), rules.unique({
            table: 'types',
            column: 'tag_name'
        })]),
        currencyCode: schema.string(),
        lng: schema.string.optional(),
        lat: schema.string.optional(),
        status: schema.enum(['active', 'inactive']),
    });
}
