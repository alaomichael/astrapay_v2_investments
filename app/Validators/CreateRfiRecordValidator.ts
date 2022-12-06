import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import BaseValidator from './BaseValidator'
export default class CreateRfiRecordValidator extends BaseValidator {
    constructor(protected ctx: HttpContextContract) {
        super()
    }

    public schema = schema.create({
        rfiName: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'rfi_name'
            })]
        ),
        rfiCode: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'rfi_code'
            })]
        ),
        phone: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'phone'
            })]
        ),
        phone2: schema.string.optional({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'phone2'
            })]
        ),
        email: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'email'
            })]
        ),
        website: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'website'
            }), rules.url()]
        ),
        slogan: schema.string.optional({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'slogan'
            })]
        ),
        imageUrl: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'image_url'
            })]
        ),
        address: schema.string({ escape: true },
            [rules.maxLength(255), rules.unique({
                table: 'rfi_records',
                column: 'address'
            })]
        ),
        otherInformation: schema.array.optional().members(
            schema.object().members({
                field: schema.string(),
                reason: schema.string(),
            })),
    })

}