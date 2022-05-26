import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TaxRecords extends BaseSchema {
  protected tableName = 'tax_records'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
       table.uuid('id').primary().index().unique().notNullable()
      table.string('state', 100).notNullable().index()
      table.string('lga', 100).nullable().index()
      table.string('tax_code', 100).nullable().index()
      table.integer('rate').unsigned().notNullable().index()
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('investment_id').unsigned().notNullable().index()
      table.integer('income').unsigned().notNullable().index()
      table.integer('tax_deducted').unsigned().notNullable().index()
      table.jsonb('investor_details').notNullable().index()
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // indexes
      table.index(
        [
          'id',
          'state',
          'lga',
          'tax_code',
          'rate',
          'user_id',
          'investment_id',
          'income',
          'tax_deducted',
          'investor_details',
        ],
        'taxrecords_full_index'
      )
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
