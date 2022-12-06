import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateSettingValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        rfiName: schema.string({ escape: true },
            [rules.maxLength(100), rules.unique({
                table: 'settings',
                column: 'rfi_name'
            })]
        ),
        rfiCode: schema.string({ escape: true },
            [rules.maxLength(100), rules.unique({
                table: 'settings',
                column: 'rfi_code'
            })]
        ),
        rfiImageUrl: schema.string(),
        fundingWalletId: schema.string({ escape: true },),
        isPayoutAutomated: schema.boolean(),
        fundingSourceTerminal: schema.string({ escape: true },),
        isInvestmentAutomated: schema.boolean(),
        isRolloverAutomated: schema.boolean(),
        // investmentType: schema.string({ escape: true },),
        tagName: schema.string.optional({ escape: true },),
        currencyCode: schema.string(),
        // tagName: schema.string({ escape: true }, [rules.maxLength(100), rules.unique({
        //     table: 'settings',
        //     column: 'tag_name'
        // })]),
    })

}