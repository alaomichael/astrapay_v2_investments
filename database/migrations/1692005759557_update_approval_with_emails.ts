import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UpdateApprovalsWithEmail extends BaseSchema {

  public async up() {
    this.schema.alterTable('approvals', (table) => {
      table.string('email').nullable()

    })
  }

  public async down() {
    this.schema.alterTable('approvals', (table) => {
      table.dropColumn('email')

    })

  }
}

