import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonList,
  IonThumbnail,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonPopover,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logInOutline, logOutOutline, imagesOutline, personCircleOutline, cameraOutline, personOutline, bookOutline, book, ellipsisVertical } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonList,
    IonThumbnail,
    IonPopover,
    RouterLink,
  ],
})
export class DashboardPage {
  constructor(public authService: AuthService, private router: Router) {
    addIcons({ logInOutline, logOutOutline, imagesOutline, personCircleOutline, cameraOutline, personOutline, bookOutline, book, ellipsisVertical });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
