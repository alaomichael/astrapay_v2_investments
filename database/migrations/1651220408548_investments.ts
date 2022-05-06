import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Investments extends BaseSchema {
  protected tableName = 'investments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable()
      table.integer('wallet_id').unsigned().nullable()
      table.integer('amount', 255).unsigned().notNullable()
      table.string('duration', 100).notNullable()
      table
        .enum('rollover_type', ['100' | '101' | '102' | '103' | 104 | 105 | 106 | 107])
        .unsigned()
        .notNullable()
      table.enum('investment_type', ['fixed', 'debenture']).notNullable()
      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 10).notNullable()
      table.jsonb('wallet_holder_details').notNullable()
      table.float('long').unsigned().nullable()
      table.float('lat').unsigned().nullable()
      table.float('interest_rate').unsigned().nullable()
      table.integer('interest_due_on_investment').unsigned().nullable()
      table.integer('total_amount_to_payout').unsigned().nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.date('payout_date').nullable()
      table.boolean('is_payout_authorized').notNullable().defaultTo(false)
      table.boolean('is_termination_authorized').notNullable().defaultTo(false)
      table.boolean('is_payout_successful').notNullable().defaultTo(false)
      table.string('status', 255).notNullable()
      // table.timestamp('date_payout_was_done', { useTz: true })
      table.string('date_payout_was_done').nullable()
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
