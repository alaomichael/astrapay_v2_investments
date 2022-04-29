import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Investments extends BaseSchema {
  protected tableName = 'investments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('amount', 255).unsigned().notNullable()
      table.string('period', 255).notNullable()
      table.integer('user_id').unsigned().notNullable()
      table.integer('wallet_id').unsigned().nullable()
      table.string('rollover_type', 255).unsigned().notNullable()
      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 255).notNullable()
      table.float('long').unsigned().nullable()
      table.float('lat').unsigned().nullable()
      table.jsonb('wallet_holder_details').notNullable()
      table.date('payout_date').nullable()
      table.float('interest_rate').unsigned().nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
