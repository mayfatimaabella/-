import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { WeatherService } from '../service/weather/weather.service';
import { SqliteService } from '../service/sqlite/sqlite.service';
import { NavController } from '@ionic/angular';
import { l } from '@angular/core/navigation_types.d-u4EOrrdZ';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit {

  units: string = 'metric';
  paletteToggle: boolean = false;
  showAlerts: boolean = true;

  constructor(
    private weatherService: WeatherService,
    private sqliteService: SqliteService,
    private navController: NavController,
    
  ) { }

  async ngOnInit() {

    const units = await Preferences.get({ key: 'units'});
    const paletteToggle = await Preferences.get({ key: 'paletteToggle'});
    const showAlerts = await Preferences.get({ key: 'showAlerts'});

    if (units.value) this.units = units.value;
    if (paletteToggle.value) this.paletteToggle = JSON.parse(paletteToggle.value);
    if (showAlerts.value) this.showAlerts = JSON.parse(showAlerts.value);

    this.toggleDarkPalette(this.paletteToggle);
  }

  toggleUnits(event: any){
    this.units = this.units === 'metric' ? 'imperial' : 'metric';
    this.savePreferences();
  }

  toggleAlerts(){
    this.showAlerts = !this.showAlerts;
    this.savePreferences();
  }

  toggleChange(event: CustomEvent) {
    this.paletteToggle = event.detail.checked;
    this.toggleDarkPalette(this.paletteToggle);
    this.savePreferences();
  }

  toggleDarkPalette(shouldAdd: boolean){
    document.documentElement.classList.toggle('ion-palette-dark', shouldAdd);

  }

  themeChanged(event: any){
    this.paletteToggle = event.detail.value === 'dark';
    this.toggleDarkPalette(this.paletteToggle);
    this.savePreferences();
  }

  async savePreferences(){
    await Preferences.set({ key: 'units', value: this.units});
    await Preferences.set({ key: 'paletteToggle', value: JSON.stringify(this.paletteToggle)}) ;
    await Preferences.set({ key: 'showAlerts', value: JSON.stringify(this.showAlerts)});
  }

  goToHome(){
    this.navController.navigateBack('/home');
  }

}
