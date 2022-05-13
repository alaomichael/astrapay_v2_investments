import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterPayoutAddRequesttypes extends BaseSchema {
  protected tableName = 'payouts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('request_type', 255).notNullable().defaultTo('payout investment').index()
      table.index(['request_type'], 'new_payout_full_index')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('request_type')
    })
  }
}
