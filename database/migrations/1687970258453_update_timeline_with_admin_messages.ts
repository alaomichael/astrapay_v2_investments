
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UpdateTimelineWithAdminMessages extends BaseSchema {

  public async up() {
    this.schema.alterTable('timelines', (table) => {
      table.string('admin_message').nullable()

    })
  }

  public async down() {
    this.schema.alterTable('timelines', (table) => {
      table.dropColumn('admin_message')

    })

  }
}

