import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UpdateApprovals extends BaseSchema {

  public async up() {
    this.schema.alterTable('approvals', (table) => {
      table.string('rfi_code').notNullable().defaultTo("nil")

    })
  }

  public async down() {
    this.schema.alterTable('approvals', (table) => {
      table.dropColumn('rfi_code')

    })

  }
}

