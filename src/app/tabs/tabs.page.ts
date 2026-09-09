import { Component } from '@angular/core';
import { IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { triangle, images, square, logInOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs],
})
export class TabsPage {
  constructor() {
    addIcons({ triangle, images, square, logInOutline });
  }
}
