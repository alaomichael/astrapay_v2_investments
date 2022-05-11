import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Approvals extends BaseSchema {
  protected tableName = 'approvals'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
    table.increments('id').index().unique().notNullable()
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('investment_id').unsigned().notNullable().index()
      table.string('request_type', 100).notNullable().index()
       table.string('approval_status', 100).notNullable().index()
 table.string('remark', 100).nullable().index()
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
