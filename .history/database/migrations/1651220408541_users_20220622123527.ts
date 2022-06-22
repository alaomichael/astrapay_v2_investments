import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().index().unique().notNullable()
      table.text('user_id').unsigned().notNullable().index()
      table.text('wallet_id').unsigned().nullable().index()
      table.text('okra_record_id').unsigned().notNullable().index()
      table.jsonb('account_to_credit_details').notNullable().index()
      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 10).notNullable().index()
      table.jsonb('wallet_holder_details').nullable().index()
      table.float('long').unsigned().nullable()
      table.float('lat').unsigned().nullable()
          /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).index()
      table.string('request_type', 255).notNullable().defaultTo('start investment').index()
      table.string('approval_status', 255).notNullable().defaultTo('pending').index()
      table.string('status', 255).notNullable().defaultTo('initiated').index()
      table.jsonb('timeline').nullable().index()
      table.text('certificate_url').nullable().index()

      table.timestamp('updated_at', { useTz: true })

      // indexes
      table.index(['id', 'user_id', 'wallet_id', 'amount', 'okra_record_id'], 'user_full_index')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
