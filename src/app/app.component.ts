import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline } from 'ionicons/icons';
import { NetworkService } from './services/network.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, IonApp, IonRouterOutlet, IonIcon],
})
export class AppComponent {
  public networkService = inject(NetworkService);

  constructor() {
    addIcons({ cloudOfflineOutline });
  }
}
