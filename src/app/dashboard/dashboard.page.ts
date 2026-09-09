import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
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
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logInOutline, logOutOutline, imagesOutline, personCircleOutline, cameraOutline, personOutline } from 'ionicons/icons';
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
    IonCardTitle,
    IonCardContent,
    RouterLink,
  ],
})
export class DashboardPage {
  constructor(public authService: AuthService, private router: Router) {
    addIcons({ logInOutline, logOutOutline, imagesOutline, personCircleOutline, cameraOutline, personOutline });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
