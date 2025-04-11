import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';


@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  private sqlite = new SQLiteConnection(CapacitorSQLite);
  private database: SQLiteDBConnection | null = null;

  async initializeDB(){
    if(!this.database) {
      this.database = await this.sqlite.createConnection('weatherDatabase',false,'no-encryption',1,false);
      await this.database.open();
      await this.database.execute(`
        CREATE TABLE IF NOT EXISTS weather_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);`);
    }
  }

  async weatherCache(city: string, data: any){
    await this.initializeDB();
    await this.database?.run(`DELETE FROM weather_cache WHERE city = ?`, [city]);
    await this.database?.run(`INSERT INTO weather_cache (city, data) VALUES (?,?)`, [city, JSON.stringify(data)]);
  }

  async getCachedWeather(city: string): Promise<any | null> {
    await this.initializeDB();
    const result = await this.database?.query(`SELECT data FROM weather_cache WHERE city = ? ORDER BY timestamp DESC LIMIT 1`, [city]);
    if (result?.values && result.values.length > 0) {
      return JSON.parse(result.values[0].data);
    }
    return null;
  }
  constructor() { }
}
