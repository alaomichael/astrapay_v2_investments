import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Payouts extends BaseSchema {
  /**
   * .enum('rollover_type', ['100' = 'no rollover',
   *  '101' = 'rollover principal only',
   * '102' = 'rollover principal with interest',
   * '103' = 'rollover interest only'])
   */

  /**
   *
   * @protected
   * @memberof Payouts
   */

  protected tableName = 'payouts'

  /**
   *
   * @return {void}@memberof Payouts
   */
  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').index().unique().notNullable()
      table.integer('user_id').unsigned().notNullable().index()
      table.integer('wallet_id').unsigned().nullable().index()
      table.float('amount', 255).unsigned().notNullable().index()
      table.string('duration', 100).notNullable().index()
      table.enum('rollover_type', ['100', '101', '102', '103']).unsigned().notNullable().index()
      table.enum('investment_type', ['fixed', 'debenture']).notNullable().index()

      table.string('tag_name', 255).notNullable()
      table.string('currency_code', 10).notNullable()
      table.jsonb('wallet_holder_details').notNullable().index()
      table.float('long').unsigned().nullable().index()
      table.float('lat').unsigned().nullable().index()
      table.float('interest_rate').unsigned().nullable()
      table.float('interest_due_on_investment').unsigned().nullable()
      table.float('total_amount_to_payout').unsigned().nullable().index()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.date('payout_date').nullable().index()
      table.boolean('is_payout_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_termination_authorized').notNullable().defaultTo(false).index()
      table.boolean('is_payout_successful').notNullable().defaultTo(false).index()
      table.string('status', 255).notNullable().index()
      // table.timestamp('date_payout_was_done', { useTz: true })
      table.string('date_payout_was_done').nullable().index()
      table.timestamp('updated_at', { useTz: true })

      table.index(
        [
          'id',
          'user_id',
          'wallet_id',
          'amount',
          'duration',
          'rollover_type',
          'investment_type',
          'wallet_holder_details',
          'long',
          'lat',
          'total_amount_to_payout',
          'is_payout_authorized',
          'is_termination_authorized',
          'is_payout_successful',
          'status',
          'date_payout_was_done',
        ],
        'payout_full_index'
      )
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
