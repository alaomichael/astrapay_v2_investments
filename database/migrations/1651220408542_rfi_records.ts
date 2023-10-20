import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'rfi_records'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.string("external_rfi_record_id", 255).notNullable().unique().index();
      table.string("rfi_name", 255).notNullable().unique().index();
      table.string("rfi_code", 255).notNullable().unique().index();
      table.string("phone", 255).notNullable().unique().index();
      table.string("phone2", 255).nullable().unique().index();
      table.string("email", 255).notNullable().unique().index();
      table.string("website", 255).notNullable().unique().index();
      table.string("slogan", 255).nullable().unique().index();
      table.string("image_url", 255).notNullable().index();
      table.string("address", 255).notNullable().index();
      // table.specificType("other_information", "text ARRAY").nullable();


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
