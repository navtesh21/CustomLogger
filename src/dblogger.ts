import { Client, Pool, PoolClient } from 'pg';
import {LogLevel} from './index'

class databaseLogger{
  private static connectionStringRegex: RegExp = /^postgresql:\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_!@#\$%\^&\*\(\)\-+=]+@[a-zA-Z0-9\.\-]+:[0-9]+\/[a-zA-Z0-9_]+$/;
  private connectionString : string
  private client: Client;
  private pool: Pool;



  //constructor
  constructor (connectionString : string ){
      const match = databaseLogger.connectionStringRegex.exec(connectionString);
      if (!match) {
      throw new Error('Invalid PostgreSQL connection string format.');
      } 
      this.connectionString = connectionString;
      this.client = new Client({
          connectionString: this.connectionString
        });
      this.pool = new Pool({
        connectionString: this.connectionString
      });
      this.init()

  }


  // Initialize the logger
  private async init() {
      try {
          await this.connect();
          const cal = await this.pool.connect();
          await this.createTables(cal)
          console.log("Initialization complete!")
      } catch (error) {
          console.error('Error modifying the database:', error);
      }
  }


  // Connecting to the database
  private async connect() {
      try {
          await this.client.connect();
          
          console.log("Connected to database")
      } catch (error) {
          console.error('Error connecting to the database:', error);
      }
      
  }



  private async createTables(cal:PoolClient){
      const logLevels = ['warn', 'debug', 'info', 'error'];
      
      //creating individual level log table
      const queries = logLevels.map(level => `
          CREATE TABLE IF NOT EXISTS ${level}_logs (
              id SERIAL PRIMARY KEY,
              message VARCHAR(255) NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
      `);

      // Creating the dump table
      queries.push(`
          CREATE TABLE IF NOT EXISTS mylogs (
              id SERIAL PRIMARY KEY,
              level VARCHAR(10) NOT NULL,
              message VARCHAR(255) NOT NULL,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
      `);

      try {
          await cal.query('BEGIN')
          for (const query of queries) {
              await cal.query(query);
              console.log("Table done ")
          }
          console.log('Tables created successfully.');
          await cal.query('COMMIT')
      } catch (error) {
          await cal.query('ROLLBACK')
          console.error('Error creating tables:', error);
      }

  }


  private async logToDump
  (level: LogLevel, message: string){

      const query= `
          INSERT INTO mylogs (level, message)
          VALUES ($1, $2);
      `;
      try {  
          await this.client.query(query, [level, message]);
          console.log('Logs inserted in mylogs table successfully');
      } catch (err) {
          console.error('Error inserting logs:', err);
      } 
  }



  private async logToLevel 
  (level: LogLevel, message:string){

      const tableName = `${level}_logs`;
      const query= `
          INSERT INTO ${tableName} (message)
          VALUES ($1);`;

      try {  
          await this.client.query(query, [message]);
          console.log(`Logs inserted in ${tableName} table successfully`);
      } catch (err) {
          console.error('Error inserting logs:', err);
      } 
  }


  private async log
  (level: LogLevel, message:string){



      //Logging to dump table
      await this.logToDump(level, message)

      //Logging to level table
      await this.logToLevel(level, message)
  }



  public async debug(message: string) {
      await this.log("debug", message);
  }

  public async info(message: string) {
    await this.log("info", message);
  }

  public async warn(message: string) {
    await this.log("warn", message);
  }

  public async error(message: string) {
    await this.log("error", message);
  }



  public async  getlogsTable(){
    const result = await this.client.query(`
      SELECT * FROM mylogs;
    `);
    console.log("mylogs table contents: ",result.rows);
  }


  public async  getdebugTable(){
    const result = await this.client.query(`
      SELECT * FROM debug_logs;
    `);
    console.log("debug_logs table contents: ",result.rows);
  }

  public async  getwarnTable(){
    const result = await this.client.query(`
      SELECT * FROM warn_logs;
    `);
    console.log("warn_logs table contents: ",result.rows);
  }

  public async  getinfoTable(){
    const result = await this.client.query(`
      SELECT * FROM info_logs;
    `);
    console.log("info_logs table contents: ",result.rows);
    }

  public async  geterrorTable(){
    const result = await this.client.query(`
      SELECT * FROM error_logs;
    `);
    console.log("error_logs table contents: ",result.rows);
  }
}

const datab = new databaseLogger("postgresql://postgres:mysecretpassword@localhost:5432/postgres");
  (async () => {
  await datab.info("This is a info message")
  await datab.getlogsTable()
  await datab.getdebugTable()
  await datab.geterrorTable()
  await datab.getinfoTable()
  await datab.getwarnTable()
  })();