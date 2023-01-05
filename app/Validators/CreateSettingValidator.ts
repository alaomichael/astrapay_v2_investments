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
        initiationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        activationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        maturityNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        payoutNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        rolloverNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        liquidationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        investmentWalletId: schema.string({ escape: true },),
        payoutWalletId: schema.string({ escape: true },),
        // investment_wallet_id
        // payout_wallet_id
        isPayoutAutomated: schema.boolean(),
        liquidationPenalty: schema.number.optional(),
        fundingSourceTerminal: schema.string({ escape: true },),
        isInvestmentAutomated: schema.boolean(),
        isRolloverAutomated: schema.boolean(),
        isAllPayoutSuspended: schema.boolean(),
        isAllRolloverSuspended: schema.boolean(),
        // investmentType: schema.string({ escape: true },),
        tagName: schema.string.optional({ escape: true },),
        currencyCode: schema.string(),
        // tagName: schema.string({ escape: true }, [rules.maxLength(100), rules.unique({
        //     table: 'settings',
        //     column: 'tag_name'
        // })]),
    })

}