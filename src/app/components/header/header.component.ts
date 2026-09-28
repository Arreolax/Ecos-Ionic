import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonPopover,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  logInOutline,
  logOutOutline,
  imagesOutline,
  personCircleOutline,
  personCircle, // <-- Ícono sólido agregado
  cameraOutline,
  camera,       // <-- Ícono sólido agregado
  personOutline,
  bookOutline,
  book,
  ellipsisVertical,
  bookmarkOutline,
  bookmark,
  timeOutline,
} from 'ionicons/icons';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonPopover,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    RouterLink,
  ],
})
export class HeaderComponent implements OnInit {

  public authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({
      logInOutline,
      logOutOutline,
      imagesOutline,
      personCircleOutline,
      personCircle, // <-- Registrado para usar en el HTML
      cameraOutline,
      camera,       // <-- Registrado para usar en el HTML
      personOutline,
      bookOutline,
      book,
      ellipsisVertical,
      bookmarkOutline,
      bookmark,
      timeOutline,
    });
   }

  ngOnInit() {}

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}