/**
 * Config source: https://git.io/JesV9
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

// import Env from '@ioc:Adonis/Core/Env'
// import { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'

// const databaseConfig: DatabaseConfig = {
/*
|--------------------------------------------------------------------------
| Connection
|--------------------------------------------------------------------------
|
| The primary connection for making database queries across the application
| You can use any key from the `connections` object defined in this same
| file.
|
*/
// connection: Env.get('DB_CONNECTION'),

// connections: {
/*
|--------------------------------------------------------------------------
| PostgreSQL config
|--------------------------------------------------------------------------
|
| Configuration for PostgreSQL database. Make sure to install the driver
| from npm when using this connection
|
| npm i pg
|
*/
//     pg: {
//       client: 'pg',
//       connection: {
//         host: Env.get('PG_HOST'),
//         port: Env.get('PG_PORT'),
//         user: Env.get('PG_USER'),
//         password: Env.get('PG_PASSWORD', ''),
//         database: Env.get('PG_DB_NAME'),
//       },
//       migrations: {
//         naturalSort: true,
//       },
//       healthCheck: true,
//       debug: false,
//     },

//   }
// }

// export default databaseConfig

import Env from '@ioc:Adonis/Core/Env'
// import { OrmConfig } from '@ioc:Adonis/Lucid/Orm'
import { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'
import Application from '@ioc:Adonis/Core/Application'

// const databaseConfig: DatabaseConfig & { orm: Partial<OrmConfig> } = {
const databaseConfig: DatabaseConfig = {
  connection: Env.get('DB_CONNECTION'),

  connections: {
    pg: {
      client: 'pg',
      connection: Application.inProduction
        ? Env.get('DATABASE_URL') + '?ssl=no-verify'
        : {
          host: Env.get('PG_HOST'),
          port: Env.get('PG_PORT'),
          user: Env.get('PG_USER'),
          password: Env.get('PG_PASSWORD', ''),
          database: Env.get('PG_DB_NAME'),
          // ssl: { rejectUnauthorized: false }, // this line is required (just added)
        },
      // acquireConnectionTimeout: 10000,
      healthCheck: Application.inDev,
      debug: Application.inDev,
      pool: {
        min: 0,
        max: 90,
        idleTimeoutMillis: 20 * 60 * 1000, // 20 secs 
        createTimeoutMillis: 20 * 60 * 1000, // 20 secs //300*10000,
        acquireTimeoutMillis: 20 * 60 * 1000, // 20 secs  //30000000,
        // propagateCreateError: false,
        reapIntervalMillis: 1 * 1000, // 1 milli seconds
        createRetryIntervalMillis: 2 * 1000, // 1 milli seconds
        afterCreate: function (conn, done) {
          // in this example we use pg driver's connection API
          conn.query('SET timezone="UTC+1";', function (err) {
            if (err) {
              // first query failed, 
              // return error and don't try to make next query
              console.log("Pool full error. ===============================")
              done(err, conn);
            } else {
              // do the second query...
              conn.query('SET timezone="UTC+1";',
                // setTimeout(() => {
                //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
                // }, 2000),

                // 'SELECT set_limit(0.01);',
                function (err) {
                  // if err is not falsy, 
                  //  connection is discarded from pool
                  // if connection aquire was triggered by a 
                  // query the error is passed to query promise

                  // setTimeout(() => {
                  //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
                  // }, 2000);

                  console.log("Pool not full. ===============================")
                  done(err, conn);
                });
            }
          });
        }
      },
    },

    /*
    I usually use this custom connection to run database migrations on remote database from my local machine. For instance,
    node ace migration:run --connection=custom, this will run the migration against you remote database. 
    In order to use this connection, you must set DATABASE_URL in .env file, you can get the value from your heroku dashboard, 
    or by running this command on your terminal: heroku config:get DATABASE_URL --app=your_app_name
    */
    custom: {
      client: 'pg',
      connection: Env.get('DATABASE_URL') + '?ssl=no-verify',
      // pool: {
      //   afterCreate: (conn, done) => {
      //     // .... add logic here ....
      //     // you must call with new connection
      //     done(null, conn);
      //   },
      // }
      pool: {
        min: 0,
        max: 90,
        idleTimeoutMillis: 20 * 60 * 1000, // 20 secs 
        createTimeoutMillis: 20 * 60 * 1000, // 20 secs //300*10000,
        acquireTimeoutMillis: 20 * 60 * 1000, // 20 secs  //30000000,
        // propagateCreateError: false,
        reapIntervalMillis: 1 * 1000, // 1 milli seconds
        createRetryIntervalMillis: 2 * 1000, // 1 milli seconds
        afterCreate: function (conn, done) {
          // in this example we use pg driver's connection API
          conn.query('SET timezone="UTC+1";', function (err) {
            if (err) {
              // first query failed, 
              // return error and don't try to make next query
              console.log("Pool full error. ===============================")
              done(err, conn);
            } else {
              // do the second query...
              conn.query('SET timezone="UTC+1";',
                // setTimeout(() => {
                //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
                // }, 2000),

                // 'SELECT set_limit(0.01);',
                function (err) {
                  // if err is not falsy, 
                  //  connection is discarded from pool
                  // if connection aquire was triggered by a 
                  // query the error is passed to query promise

                  // setTimeout(() => {
                  //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
                  // }, 2000);

                  console.log("Pool not full. ===============================")
                  done(err, conn);
                });
            }
          });
        }
      },
    },
  },

  // orm: {},
}

export default databaseConfig