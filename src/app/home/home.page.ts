import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Geolocation } from '@capacitor/geolocation';
import { AlertController } from '@ionic/angular';
import { WeatherService } from '../service/weather/weather.service';
import { Preferences } from '@capacitor/preferences';
import { SqliteService } from '../service/sqlite/sqlite.service';
import { Router } from '@angular/router';
import { SwiperModule } from 'swiper/types';


const API_URL = environment.API_URL;
const API_KEY = environment.API_KEY;

interface WeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    weather: {
      description: string;
      icon: string;
    }[];
    feels_like: number;
  };
  daily: {
    dt: number;
    temp: {
      day: number;
    };
    weather: {
      description: string;
      icon: string;
    }[];
  }[];
  hourly: {
    dt: number;
    temp: number;
    weather: {
      description: string;
      icon: string;
    }[];
  }[];
  alerts?: WeatherAlert[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  weatherData: WeatherData | undefined;
  currentWeather: WeatherData['current'] | undefined;
  dailyForecast: WeatherData['daily'] | undefined;
  hourlyForecast: WeatherData['hourly'] | undefined;
  units: string = 'metric';
  latitude: number | undefined;
  longitude: number | undefined;
  locationName: string = '';
  lastAlertEvent: string = '';
  showAlerts: boolean = true; 


  constructor(
    private weatherService: WeatherService,
    public alertController: AlertController,
    public httpClient: HttpClient,
    private sqliteService: SqliteService,
    private router: Router,) {
    this.getLocation();}

  async ngOnInit() {
    const lastLocation = await Preferences.get({ key: 'lastLocation' });
    const storedUnits = await Preferences.get({ key: 'units' });

    if (lastLocation.value) this.locationName = lastLocation.value;
    if (storedUnits.value) this.units = storedUnits.value;
    this.loadPreferences();
    this.getLocation();
  }

  async savePreferences(){
    await Preferences.set({ key: 'lastLocation', value: this.locationName });
  }

  async getLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.latitude = coordinates.coords.latitude;
      this.longitude = coordinates.coords.longitude;
      this.getWeatherData();
      this.getCityName();
    } catch (error) {
      this.presentAlert('Location Error', 'Cannot find your current location');
      this.latitude = 33.44;
      this.longitude = -94.04;
      this.getWeatherData();
      this.locationName = 'Enter location';
    }
  }

  getWeatherData() {
    if (this.latitude && this.longitude) {
      this.weatherService.getWeatherData(this.latitude, this.longitude, this.units)
        .subscribe(async (results: any) => {
          console.log(results);
          this.weatherData = results;
          this.currentWeather = results.current;
          this.dailyForecast = results.daily.slice(1, 6);
          this.hourlyForecast = results.hourly.slice(0, 24);

          await this.sqliteService.weatherCache(this.locationName || 'Unknown', results);

        }, async (error) => {
          console.error('API Error. Loading cached data...', error);

          const cached = await this.sqliteService.getCachedWeather(this.locationName || 'Unknown');
          if (cached) {
            this.weatherData = cached;
            this.currentWeather = cached.current;
            this.dailyForecast = cached.daily.slice(1,6);
            this.hourlyForecast = cached.hourly.slice(0,24);
            this.presentAlert('Offline Mode', 'Showing cached weather data.');
          } else {
            this.presentAlert('Error', 'No weather data available offline.');
          }
        });
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async presentPrompt() {
    const alert = await this.alertController.create({
      header: 'Enter location',
      inputs: [
        {
          name: 'location',
          type: 'text',
          placeholder: 'City or Zip Code',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Search',
          handler: (data) => {
            this.getCoordinatesFromLocation(data.location);
          },
        },
      ],
    });
    await alert.present();
  }

async getCityName() {
  if (this.latitude && this.longitude) {
    this.weatherService.getCityName(this.latitude, this.longitude).subscribe((results) => {
      if (results && results.length > 0) {
        this.locationName = results[0].name;
        this.savePreferences();
      } else {
        this.locationName = 'Location Not Found';
      }
    });
  }
}

async getCoordinatesFromLocation(location: string) {
  this.weatherService.getCoordinatesFromLocation(location).subscribe((results) => {
    if (results && results.length > 0) {
      this.latitude = results[0].lat;
      this.longitude = results[0].lon;
      this.getWeatherData();
      this.locationName = results[0].name;
      this.savePreferences();
    } else {
      this.presentAlert('Location not found', 'Can\'t find specified location.');
    }
  });
}

  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  timeStamp(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'});
  }

  dateFormat(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long'
    };
    const formattedDate = date.toLocaleDateString(undefined, options);
    const [weekday, monthDay] = formattedDate.split(', ');
    return `<span>${monthDay}</span><br><span>${weekday}</span>`;
  }
  

  getTempUnit(): string {
    return this.units === 'metric' ? '°C' : '°F';
  }

  getWeatherAndLocation(){
    this.getWeatherData();
    this.getCityName();
  }

  goToSettings(){
    this.router.navigate(['/settings']);
  }

  ionViewWillEnter() {
    this.loadPreferences();
  }

  async loadPreferences() {
    const lastLocation = await Preferences.get({ key: 'lastLocation' });
    const storedUnits = await Preferences.get({ key: 'units' });
    const alertPref = await Preferences.get({ key: 'showAlerts' });
  
    if (lastLocation.value) this.locationName = lastLocation.value;
    if (storedUnits.value) this.units = storedUnits.value;
    if (alertPref.value) this.showAlerts = JSON.parse(alertPref.value);
  
    this.getWeatherData();
    this.getCityName();
  }
  

}