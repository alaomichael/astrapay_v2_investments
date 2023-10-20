import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UpdateApprovals extends BaseSchema {

  public async up() {
    this.schema.alterTable('approvals', (table) => {
      table.string('approved_by').nullable()

    })
  }

  public async down() {
    this.schema.alterTable('approvals', (table) => {
      table.dropColumn('approved_by')

    })

  }
}

