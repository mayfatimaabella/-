import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

const API_URL = environment.API_URL;
const API_KEY = environment.API_KEY;

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  constructor(private http: HttpClient) { }

  getWeatherData(lat: number, lon: number, units: string){
    return this.http.get(`${API_URL}/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${units}`);
  }

  getCoordinatesFromLocation(location: string){
    return this.http.get<any>(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`);
  }

  getCityName(lat: number, lon: number) {
    return this.http.get<any>(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`);
  }
}
