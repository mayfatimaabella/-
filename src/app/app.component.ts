import { Component } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor() {
    this.initializeTheme();
  }

  async initializeTheme(){
    const paletteToggle = await Preferences.get({ key: 'paletteToggle'});
    if (paletteToggle.value){
      const isDark = JSON.parse(paletteToggle.value);
      document.documentElement.classList.toggle('ion-palette-dark', isDark);
    }
}
}