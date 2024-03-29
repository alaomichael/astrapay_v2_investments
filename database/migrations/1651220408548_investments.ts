import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Investments extends BaseSchema {
  /**
   * .enum('rollover_type', ['100' = 'no rollover',
   *  '101' = 'rollover principal only',
   * '102' = 'rollover principal with interest',
   * '103' = 'rollover interest only'])
   */

  protected tableName = 'investments'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().index().unique().notNullable()
      table
        .text('user_id')
        .unsigned()
        .notNullable()
        .index()
        // .references('user_id')
        // .inTable('users')
        // .onDelete('CASCADE')
      table
        .text('wallet_id')
        .unsigned()
        .nullable()
        .index()
        // .references('wallet_id')
        // .inTable('users')
        // .onDelete('CASCADE')
      table.uuid("rfi_record_id")
        .references("id")
        .inTable("rfi_records")
        .notNullable()
        .index()
        .onDelete("CASCADE");
      table.string("rfi_code", 225).notNullable().index();
      table.string("first_name", 225).notNullable().index();
      table.string("last_name", 225).notNullable().index();
      table.string("phone", 225).notNullable().index();
      table.string("email", 225).notNullable().index();
      table.string("investor_funding_wallet_id", 225).notNullable().index();
      table.float('amount', 255).unsigned().notNullable().index()
      table.integer('duration', 100).notNullable().index()
      table.enum('rollover_type', ['100', '101', '102', '103']).unsigned().notNullable().index()
      table.integer('rollover_target').unsigned().notNullable().defaultTo(0).index()
      table.integer('rollover_done').unsigned().notNullable().defaultTo(0).index()
      table.string('investment_type_name',255).notNullable().index()
      table.uuid('investment_type_id')
        .references("id")
        .inTable("types")
        .notNullable()
        .index()
        .onDelete("CASCADE");
      table.enum('investment_type', ['fixed', 'debenture']).notNullable().index()
      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 10).notNullable().index()
      // table.jsonb('wallet_holder_details').notNullable().index()
      table.float('interest_rate').unsigned().nullable()
      table.float('interest_due_on_investment').unsigned().nullable()
      table.float('total_amount_to_payout').unsigned().nullable().index()
      table.float('penalty').unsigned().nullable().index()
      table.boolean("is_request_sent").notNullable().defaultTo(false);
      table.string("investment_request_reference").nullable();
      table.string("principal_payout_request_reference").nullable();
      table.string("interest_payout_request_reference").nullable();
      table.boolean("is_investment_created").notNullable().defaultTo(false);

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
     
      table.date('start_date').nullable().index()
      table.date('payout_date').nullable().index()
      table.boolean("is_investment_completed").notNullable().defaultTo(false);
      table.timestamp("investment_completion_date").nullable().index();
      table.boolean('is_rollover_activated').notNullable().defaultTo(false).index()
      table.boolean('is_rollover_suspended').notNullable().defaultTo(false).index()
      table.date('rollover_reactivation_date').nullable().index()
      table.boolean('is_payout_authorized').notNullable().defaultTo(true).index()
      table.boolean('is_payout_suspended').notNullable().defaultTo(false).index()
      table.date('payout_reactivation_date').nullable().index()
      table.boolean('is_termination_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_payout_successful').notNullable().defaultTo(false).index()
      table.string('request_type', 255).notNullable().defaultTo('start_investment').index()
      table.string('approval_status', 255).notNullable().defaultTo('pending').index()
      table.string('status', 255).notNullable().defaultTo('initiated').index()
      table.string('principal_payout_status', 255).notNullable().defaultTo('pending').index()
      table.string('interest_payout_status', 255).notNullable().defaultTo('pending').index()
      // table.jsonb('timeline').nullable().index()
      table.text('certificate_url').nullable().index()

      // table.timestamp('date_payout_was_done', { useTz: true })
      table.date('date_payout_was_done').nullable().index()
      table.float('lng').unsigned().nullable()
      table.float('lat').unsigned().nullable()
      table.string("processed_by", 255).notNullable().defaultTo("automation").index();
      table.string("approved_by", 255).notNullable().defaultTo("automation").index();
      table.string("assigned_to", 255).notNullable().defaultTo("automation").index();
      table.timestamp('created_at', { useTz: true }).index()
      table.timestamp('updated_at', { useTz: true })

      // indexes
      table.index(
        [
          'id',
          'user_id',
          'wallet_id',
          'amount',
          'duration',
          'rollover_type',
          'rollover_target',
          'rollover_done',
          'investment_type',
          'lng',
          'lat',
          'start_date',
          'payout_date',
          'total_amount_to_payout',
          'is_payout_authorized',
          'is_termination_authorized',
          'is_payout_successful',
          'request_type',
          'approval_status',
          'status',
          'date_payout_was_done',
          'certificate_url',
        ],
        'investment_full_index'
      )
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
