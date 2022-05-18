import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AlterPayoutAddInvestmentids extends BaseSchema {
  protected tableName = 'payouts'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('investment_id').unsigned().notNullable().index()
      table.index(['investment_id'], 'newest_payout_full_index')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('investment_id')
    })
  }
}
