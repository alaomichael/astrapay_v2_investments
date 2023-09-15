import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'types'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid("id").primary().index().unique().notNullable();
      table.uuid("rfi_record_id")
        .references("id")
        .inTable("rfi_records")
        .notNullable()
        .index()
        .onDelete("CASCADE");
      table.string("rfi_code", 225).notNullable().index();
      table.string("type_name", 255).notNullable().index().unique();
      table.float('lowest_amount', 12).unsigned().notNullable().index()
      table.float('highest_amount', 12).unsigned().notNullable().index()
      // table.string('duration', 5).notNullable().index()
      table.float('interest_rate').unsigned().nullable().index()
      table.boolean('is_rollover_allowed').index().notNullable().defaultTo(true);
      // table.boolean('is_active').notNullable().index().defaultTo(true)
      table.float("quantity_issued").notNullable().defaultTo(0);
      table.float("quantity_available_for_issue").nullable();
      // table.float("fixed_charge", 255).nullable();
      // table.float("rated_charge", 255).nullable();
      // table.specificType('available_types', 'text ARRAY').nullable();
      // table.jsonb('available_types').nullable();//text[]
      table.jsonb("available_types").nullable();
      // table.specificType('available_types', 'text[]').nullable();
      table.string("minimum_allowed_period_of_investment", 255).notNullable().defaultTo(30);
      table.string("maximum_allowed_period_of_investment", 255).notNullable().defaultTo(360);
      // table.float("daily_minimum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("daily_maximum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("weekly_minimum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("weekly_maximum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("monthly_minimum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("monthly_maximum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("yearly_minimum_limit", 255).notNullable().index().defaultTo(0);
      // table.float("yearly_maximum_limit", 255).notNullable().index().defaultTo(0);
      table.boolean("is_automated").notNullable().defaultTo(false);
      table.string("description").nullable();
      // table.specificType('features', 'text ARRAY').nullable();
      // table.specificType('requirements', 'text ARRAY').nullable();
      table.jsonb('features').nullable();
      // table.specificType('features', 'text[]').nullable();
      table.jsonb('requirements').nullable();
      // table.specificType('requirements', 'text[]').nullable();
      table.string("created_by").notNullable();
      table.string('tag_name', 100).notNullable().index().unique();
      table.string('currency_code', 10).notNullable().index().defaultTo("NGN")
      table.string('lng').unsigned().nullable().index()
      table.string('lat').unsigned().nullable().index()
      table.string('status', 255).notNullable().index().defaultTo("active") // or inactive

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
