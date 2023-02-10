/* eslint-disable prettier/prettier */
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
        // initiationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        initiationNotificationEmail: schema.array().members(
            schema.object().members({
                email: schema.string({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // activationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        activationNotificationEmail: schema.array().members(
            schema.object().members({
                email: schema.string({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // maturityNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        maturityNotificationEmail: schema.array().members(
            schema.object().members({
                email: schema.string({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // payoutNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        payoutNotificationEmail: schema.array().members(
            schema.object().members({
                email: schema.string({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // rolloverNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        rolloverNotificationEmail: schema.array().members(
            schema.object().members({
                email: schema.string({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
        // liquidationNotificationEmail: schema.string({ escape: true }, [rules.email()]),
        liquidationNotificationEmail: schema.array().members(
            schema.object().members({
                email: schema.string({ escape: true }, [rules.email()]),
                name: schema.string.optional(),
            })),
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
