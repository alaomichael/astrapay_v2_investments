import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'investment_tenures'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id')
      table.uuid("type_id").references('id').inTable('types').notNullable().index().onDelete('CASCADE');
      table.string("tenure", 255).notNullable().index()

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
