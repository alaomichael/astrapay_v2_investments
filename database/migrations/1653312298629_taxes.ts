import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Taxes extends BaseSchema {
  protected tableName = 'taxes'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').index().unique().notNullable()
      table.string('state', 100).notNullable().index()
      table.string('lga', 100).nullable().index()
      table.string('tax_code', 100).nullable().index()
      table.integer('rate').unsigned().notNullable().index()
      table.integer('lowest_amount').unsigned().nullable().index()
      table.integer('highest_amount').unsigned().nullable().index()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // indexes
      table.index(
        ['id', 'state', 'lga', 'tax_code', 'rate', 'lowest_amount', 'highest_amount'],
        'tax_full_index'
      )
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
