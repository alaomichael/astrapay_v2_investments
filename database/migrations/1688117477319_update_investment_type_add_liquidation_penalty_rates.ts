import BaseSchema from '@ioc:Adonis/Lucid/Schema'


export default class UpdateInvestmentTypeAddLiquidationPenaltyRate extends BaseSchema {

  public async up() {
    this.schema.alterTable('types', (table) => {
      table.integer('liquidation_penalty_rate').nullable()
          })
  }

  public async down() {
    this.schema.alterTable('types', (table) => {
      table.dropColumn('liquidation_penalty_rate')
    })
  }
}