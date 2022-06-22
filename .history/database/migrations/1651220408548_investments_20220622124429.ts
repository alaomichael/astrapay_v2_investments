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
      table.text('user_id').unsigned().notNullable().index().re
      table.text('wallet_id').unsigned().nullable().index()
      table.float('amount', 255).unsigned().notNullable().index()
      table.string('duration', 100).notNullable().index()
      table.enum('rollover_type', ['100', '101', '102', '103']).unsigned().notNullable().index()
      table.integer('rollover_target').unsigned().notNullable().defaultTo(0).index()
      table.integer('rollover_done').unsigned().notNullable().defaultTo(0).index()
      table.enum('investment_type', ['fixed', 'debenture']).notNullable().index()
      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 10).notNullable().index()
      table.jsonb('wallet_holder_details').notNullable().index()
      table.float('long').unsigned().nullable()
      table.float('lat').unsigned().nullable()
      table.float('interest_rate').unsigned().nullable()
      table.float('interest_due_on_investment').unsigned().nullable()
      table.float('total_amount_to_payout').unsigned().nullable().index()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true }).index()
      table.date('start_date').nullable().index()
      table.date('payout_date').nullable().index()
      table.boolean('is_payout_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_termination_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_payout_successful').notNullable().defaultTo(false).index()
      table.string('request_type', 255).notNullable().defaultTo('start investment').index()
      table.string('approval_status', 255).notNullable().defaultTo('pending').index()
      table.string('status', 255).notNullable().defaultTo('initiated').index()
      table.jsonb('timeline').nullable().index()
      table.text('certificate_url').nullable().index()

      // table.timestamp('date_payout_was_done', { useTz: true })
      table.string('date_payout_was_done').nullable().index()
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
          'wallet_holder_details',
          'long',
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
