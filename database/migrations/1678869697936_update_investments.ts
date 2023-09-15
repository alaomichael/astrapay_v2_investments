import BaseSchema from '@ioc:Adonis/Lucid/Schema'


export default class UpdateInvestments extends BaseSchema {

  public async up() {
    this.schema.alterTable('investments', (table) => {
      table.integer('verification_request_attempts').notNullable().defaultTo(0)
      table.integer('number_of_attempts').notNullable().defaultTo(0)
    })

    // this.schema.alterTable('rfi_memberships', (table) => {
    //   table.boolean('is_email_verified').defaultTo(false)
    //   table.boolean('is_profile_sync').defaultTo(false)
    //   table.boolean('is_auth_record_created').defaultTo(false)
    // })

    // this.schema.alterTable('rfi_directors', (table) => {
    //   table.string('share').nullable()
    //   table.string('share_type').nullable()
    // })
  }

  public async down() {
    this.schema.alterTable('investments', (table) => {
      table.dropColumn('verification_request_attempts')
      table.dropColumn('number_of_attempts')
      // table.dropColumn('rfi_onboarding_step')
      // table.dropColumn('is_root_user_requested')
      // table.dropColumn('root_user_requested_at')
    })

    // this.schema.alterTable('rfi_memberships', (table) => {
    //   table.dropColumn('is_email_verified')
    //   table.dropColumn('is_profile_sync')
    //   table.dropColumn('is_auth_record_created')
    // })

    // this.schema.alterTable('rfi_directors', (table) => {
    //   table.dropColumn('share')
    //   table.dropColumn('share_type')
    // })
  }
}