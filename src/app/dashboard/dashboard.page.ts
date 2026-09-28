import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
  IonSpinner,
  IonBadge,
  ViewWillEnter,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  logInOutline,
  logOutOutline,
  imagesOutline,
  personCircleOutline,
  cameraOutline,
  personOutline,
  bookOutline,
  book,
  ellipsisVertical,
  bookmarkOutline,
  bookmark,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { PhotoService, UserPhoto } from '../services/photo.service';
import { NotesService, Note } from '../notes/notes.service';

import { HeaderComponent } from '../components/header/header.component';

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
    IonSpinner,
    IonBadge,
    RouterLink,
    HeaderComponent
  ],
})
export class DashboardPage implements OnInit, ViewWillEnter {
  public authService = inject(AuthService);
  public photoService = inject(PhotoService);
  private notesService = inject(NotesService);
  private router = inject(Router);
  
  private cdr = inject(ChangeDetectorRef); 

  recentNotes: Note[] = [];
  isLoadingNotes = false;

  constructor() {
    addIcons({
      logInOutline,
      logOutOutline,
      imagesOutline,
      personCircleOutline,
      cameraOutline,
      personOutline,
      bookOutline,
      book,
      ellipsisVertical,
      bookmarkOutline,
      bookmark,
      timeOutline,
    });
  }

  async ngOnInit() {
    this.loadNotes();
  }

  async ionViewWillEnter() {
  this.loadPhotos().catch(err => console.error("Error al cargar fotos:", err));
  this.loadNotes();
}

  async loadPhotos() {
    await this.authService.isAuthenticated();
    await this.photoService.loadSaved();
  }

  loadNotes() {
    const user = this.authService.currentUser();
    const userId = user && user.id ? Number(user.id) : 0; 
    
    this.isLoadingNotes = true;

    if (!userId) {
      this.recentNotes = [];
      this.isLoadingNotes = false;
      this.cdr.detectChanges();
      return;
    }

    this.notesService.getNotes(userId).subscribe({
      next: (notes) => {
        this.recentNotes = notes
          .sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            
            return dateB - dateA;
          })
          .slice(0, 3);
          
        this.isLoadingNotes = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error al cargar notas en dashboard', err);
        this.recentNotes = [];
        this.isLoadingNotes = false;
        this.cdr.detectChanges(); 
      },
    });
  }

  get recentPhotos(): UserPhoto[] {
    return this.photoService.photos().slice(0, 3);
  }

  
}