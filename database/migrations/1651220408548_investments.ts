import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Investments extends BaseSchema {
  protected tableName = 'investments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').index().unique().notNullable()
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('wallet_id').unsigned().nullable().index()
      table.integer('amount', 255).unsigned().notNullable().index()
      table.string('duration', 100).notNullable().index()
      table
        .enum('rollover_type', ['100', '101', '102', '103', '104', '105', '106', '107'])
        .unsigned()
        .notNullable()
        .index()
      table
        .enum('investment_type', [fixed | debenture])
        .notNullable()
        .index()
      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 10).notNullable().index()
      table.jsonb('wallet_holder_details').notNullable().index()
      table.float('long').unsigned().nullable()
      table.float('lat').unsigned().nullable()
      table.float('interest_rate').unsigned().nullable()
      table.integer('interest_due_on_investment').unsigned().nullable()
      table.integer('total_amount_to_payout').unsigned().nullable().index()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).index()
      table.date('payout_date').nullable().index()
      table.boolean('is_payout_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_termination_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_payout_successful').notNullable().defaultTo(false).index()
      table.string('status', 255).notNullable().defaultTo('initiated').index()
      // table.timestamp('date_payout_was_done', { useTz: true })
      table.string('date_payout_was_done').nullable().index()
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
