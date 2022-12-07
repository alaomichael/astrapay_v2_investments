import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'timelines'


  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table
        .uuid("investment_id")
        .references("id")
        .inTable("investments")
        .nullable()
        .index()
        .onDelete("CASCADE");
      table
        .string("user_id")
        .nullable()
        .index()
      table
        .string("wallet_id")
        .nullable()
        .index()

      table.string("action", 100).notNullable().index();
      table.string("message", 255).nullable();
      table.string("metadata", 255).nullable();
      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp("created_at", { useTz: true });
      table.timestamp("updated_at", { useTz: true });

      table.index(["investment_id", "action", "message",], "timeline_index");
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
