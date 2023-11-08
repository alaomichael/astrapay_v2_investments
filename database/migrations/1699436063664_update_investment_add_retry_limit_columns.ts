// investments
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UpdateInvestmentAddRetryLimitColumns extends BaseSchema {
  public async up() {
    this.schema.alterTable('investments', (table) => {
      table.integer('max_attempts').notNullable().defaultTo(50);
      table.integer('attempts').notNullable().defaultTo(0);
      table.timestamp("last_attempt_at", { useTz: true }).nullable();
      table.integer('retry_period').notNullable().defaultTo(0);
    })

  }

  public async down() {
    this.schema.alterTable('investments', (table) => {
      table.dropColumn('max_attempts')
      table.dropColumn('attempts')
      table.dropColumn('last_attempt_at')
      table.dropColumn('retry_period')
    })

  }
}
