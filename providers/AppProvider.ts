import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class AppProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    // Register your own bindings
    // const messageQueue = this.app.container.use('Adonis/Addons/Rabbit');
    // messageQueue();
  }

  public async boot() {
    // IoC container is ready
  }

  public async ready() {
    // App is ready
    const scheduler = this.app.container.use('Adonis/Addons/Scheduler');
    scheduler.run();
    // const messageQueue = this.app.container.use('Adonis/Addons/Rabbit');
    // messageQueue.run();
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
