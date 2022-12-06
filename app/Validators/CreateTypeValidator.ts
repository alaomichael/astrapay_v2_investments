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
        duration: schema.string(),
        interestRate: schema.number(),
        isRolloverAllowed: schema.boolean(),
        quantityIssued: schema.number.optional(),
        quantityAvailableForIssue: schema.number(),
        // fixedCharge: schema.number.optional(),
        // ratedCharge: schema.number.optional(),
        availableTypes: schema.array.optional().members(
            schema.string(),
        ),
        currencyCode: schema.string(),
        allowedPeriodOfUsage: schema.string.optional(),
        dailyMinimumLimit: schema.number.optional(),
        dailyMaximumLimit: schema.number.optional(),
        weeklyMinimumLimit: schema.number.optional(),
        weeklyMaximumLimit: schema.number.optional(),
        monthlyMinimumLimit: schema.number.optional(),
        monthlyMaximumLimit: schema.number.optional(),
        yearlyMinimumLimit: schema.number.optional(),
        yearlyMaximumLimit: schema.number.optional(),
        isAutomated: schema.boolean.optional(),
        isRenewable: schema.boolean.optional(),
        avalaibleModeOfDelivery: schema.array().members(
            schema.string(),
        ),
        features: schema.array().members(
            schema.string(),
        ),
        requirements: schema.array().members(
            schema.string(),
        ),
        lng: schema.string.optional(),
        lat: schema.string.optional(),
        // accountStatus: schema.string.optional(),
        tagName: schema.string({ escape: true }, [rules.maxLength(100), rules.unique({
            table: 'products',
            column: 'tag_name'
        })]),
        
        rfiRecordId: schema.string(),
        // remark: schema.array.optional().members(
        //     schema.object().members({
        //         field: schema.enum([
        //             "productName",
        //             "quantityIssued",
        //             "quantityAvailableForIssue",
        //             "fixedCharge",
        //             "ratedCharge",
        //             "availableTypes",
        //             "currencyCode",
        //             "allowedPeriodOfUsage",
        //             "dailyMinimumLimit",
        //             "dailyMaximumLimit",
        //             "weeklyMinimumLimit",
        //             "weeklyMaximumLimit",
        //             "monthlyMinimumLimit",
        //             "monthlyMaximumLimit",
        //             "yearlyMinimumLimit",
        //             "yearlyMaximumLimit",
        //             "isAutomated",
        //             "isRenewable",
        //             "avalaibleModeOfDelivery",
        //             "features",
        //             "requirements",
        //             "lng",
        //             "lat",
        //             "tagName",
        //             "bankCode",
        //             "bankRecordId"]),
        //         reason: schema.string(),
        //     })),
        createdBy: schema.string(),
        status: schema.enum(['active', 'inactive']),

    });
}
