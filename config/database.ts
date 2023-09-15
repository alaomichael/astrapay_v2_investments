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

const INVESTMENT_DB_POOL_MIN = Number(Env.get('INVESTMENT_DB_POOL_MIN'));
const INVESTMENT_DB_POOL_MAX = Number(Env.get('INVESTMENT_DB_POOL_MAX'));
const INVESTMENT_DB_POOL_IDLETIMEOUTMILLIS = Number(Env.get('INVESTMENT_DB_POOL_IDLETIMEOUTMILLIS'));
const INVESTMENT_DB_POOL_CREATETIMEOUTMILLIS = Number(Env.get('INVESTMENT_DB_POOL_CREATETIMEOUTMILLIS'));
const INVESTMENT_DB_POOL_ACQUIRETIMEOUTMILLIS = Number(Env.get('INVESTMENT_DB_POOL_ACQUIRETIMEOUTMILLIS'));
const INVESTMENT_DB_POOL_REAPINTERVALMILLIS = Number(Env.get('INVESTMENT_DB_POOL_REAPINTERVALMILLIS'));
const INVESTMENT_DB_POOL_CREATERETRYINTERVALMILLIS = Number(Env.get('INVESTMENT_DB_POOL_CREATERETRYINTERVALMILLIS'));
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
      // pool: {
      //   min: 0,
      //   max: 90,
      //   idleTimeoutMillis: 20 * 60 * 1000, // 20 secs 
      //   createTimeoutMillis: 20 * 60 * 1000, // 20 secs //300*10000,
      //   acquireTimeoutMillis: 20 * 60 * 1000, // 20 secs  //30000000,
      //   // propagateCreateError: false,
      //   reapIntervalMillis: 1 * 1000, // 1 milli seconds
      //   createRetryIntervalMillis: 2 * 1000, // 1 milli seconds
      //   afterCreate: function (conn, done) {
      //     // in this example we use pg driver's connection API
      //     conn.query('SET timezone="UTC+1";', function (err) {
      //       if (err) {
      //         // first query failed, 
      //         // return error and don't try to make next query
      //         console.log("Pool full error. ===============================")
      //         done(err, conn);
      //       } else {
      //         // do the second query...
      //         conn.query('SET timezone="UTC+1";',
      //           // setTimeout(() => {
      //           //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
      //           // }, 2000),

      //           // 'SELECT set_limit(0.01);',
      //           function (err) {
      //             // if err is not falsy, 
      //             //  connection is discarded from pool
      //             // if connection aquire was triggered by a 
      //             // query the error is passed to query promise

      //             // setTimeout(() => {
      //             //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
      //             // }, 2000);

      //             console.log("Pool not full. ===============================")
      //             done(err, conn);
      //           });
      //       }
      //     });
      //   }
      // },
      pool: {
        min: INVESTMENT_DB_POOL_MIN,//Env.get('INVESTMENT_DB_POOL_MIN'),// 1, // Adjust the minimum number of connections based on your application's requirements
        max: INVESTMENT_DB_POOL_MAX,//Env.get('INVESTMENT_DB_POOL_MAX'),// 25, // Adjust the maximum number of connections based on your application's requirements
        idleTimeoutMillis: INVESTMENT_DB_POOL_IDLETIMEOUTMILLIS,//Env.get('INVESTMENT_DB_POOL_IDLETIMEOUTMILLIS'),// 20000, // 20 seconds
        createTimeoutMillis: INVESTMENT_DB_POOL_CREATETIMEOUTMILLIS,//Env.get('INVESTMENT_DB_POOL_CREATETIMEOUTMILLIS'),// 30000, // 30 seconds
        acquireTimeoutMillis: INVESTMENT_DB_POOL_ACQUIRETIMEOUTMILLIS,//Env.get('INVESTMENT_DB_POOL_ACQUIRETIMEOUTMILLIS'),// 30000, // 30 seconds
        reapIntervalMillis: INVESTMENT_DB_POOL_REAPINTERVALMILLIS,//Env.get('INVESTMENT_DB_POOL_REAPINTERVALMILLIS'),//1000, // 1 second
        createRetryIntervalMillis: INVESTMENT_DB_POOL_CREATERETRYINTERVALMILLIS,//Env.get('INVESTMENT_DB_POOL_CREATERETRYINTERVALMILLIS'),// 2000, // 2 seconds
        afterCreate: function (conn, done) {
          conn.query('SET timezone="UTC+1";', function (err) {
            if (err) {
              console.error("Error setting timezone:", err);
              done(err, conn);
            } else {
              console.log("Connection acquired from the pool.");
              done(null, conn);
            }
          });
        },
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
      // pool: {
      //   min: 0,
      //   max: 90,
      //   idleTimeoutMillis: 20 * 60 * 1000, // 20 secs 
      //   createTimeoutMillis: 20 * 60 * 1000, // 20 secs //300*10000,
      //   acquireTimeoutMillis: 20 * 60 * 1000, // 20 secs  //30000000,
      //   // propagateCreateError: false,
      //   reapIntervalMillis: 1 * 1000, // 1 milli seconds
      //   createRetryIntervalMillis: 2 * 1000, // 1 milli seconds
      //   afterCreate: function (conn, done) {
      //     // in this example we use pg driver's connection API
      //     conn.query('SET timezone="UTC+1";', function (err) {
      //       if (err) {
      //         // first query failed, 
      //         // return error and don't try to make next query
      //         console.log("Pool full error. ===============================")
      //         done(err, conn);
      //       } else {
      //         // do the second query...
      //         conn.query('SET timezone="UTC+1";',
      //           // setTimeout(() => {
      //           //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
      //           // }, 2000),

      //           // 'SELECT set_limit(0.01);',
      //           function (err) {
      //             // if err is not falsy, 
      //             //  connection is discarded from pool
      //             // if connection aquire was triggered by a 
      //             // query the error is passed to query promise

      //             // setTimeout(() => {
      //             //   console.log("Running Timeout in Pool not full, delay for 2secs. ===============================")
      //             // }, 2000);

      //             console.log("Pool not full. ===============================")
      //             done(err, conn);
      //           });
      //       }
      //     });
      //   }
      // },
      pool: {
        min: INVESTMENT_DB_POOL_MIN,//Env.get('INVESTMENT_DB_POOL_MIN'),// 1, // Adjust the minimum number of connections based on your application's requirements
        max: INVESTMENT_DB_POOL_MAX,//Env.get('INVESTMENT_DB_POOL_MAX'),// 25, // Adjust the maximum number of connections based on your application's requirements
        idleTimeoutMillis: INVESTMENT_DB_POOL_IDLETIMEOUTMILLIS,//Env.get('INVESTMENT_DB_POOL_IDLETIMEOUTMILLIS'),// 20000, // 20 seconds
        createTimeoutMillis: INVESTMENT_DB_POOL_CREATETIMEOUTMILLIS,//Env.get('INVESTMENT_DB_POOL_CREATETIMEOUTMILLIS'),// 30000, // 30 seconds
        acquireTimeoutMillis: INVESTMENT_DB_POOL_ACQUIRETIMEOUTMILLIS,//Env.get('INVESTMENT_DB_POOL_ACQUIRETIMEOUTMILLIS'),// 30000, // 30 seconds
        reapIntervalMillis: INVESTMENT_DB_POOL_REAPINTERVALMILLIS,//Env.get('INVESTMENT_DB_POOL_REAPINTERVALMILLIS'),//1000, // 1 second
        createRetryIntervalMillis: INVESTMENT_DB_POOL_CREATERETRYINTERVALMILLIS,//Env.get('INVESTMENT_DB_POOL_CREATERETRYINTERVALMILLIS'),// 2000, // 2 seconds
        afterCreate: function (conn, done) {
          conn.query('SET timezone="UTC+1";', function (err) {
            if (err) {
              console.error("Error setting timezone:", err);
              done(err, conn);
            } else {
              console.log("Connection acquired from the pool.");
              done(null, conn);
            }
          });
        },
      },
    },
  },

  // orm: {},
}

export default databaseConfig