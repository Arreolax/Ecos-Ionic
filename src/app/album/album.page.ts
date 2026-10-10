import { Component, OnInit, inject, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  ActionSheetController,
  AlertController,
  LoadingController,
  ToastController,
} from "@ionic/angular";
import { ViewWillEnter } from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  camera,
  trash,
  close,
  informationCircleOutline,
  imagesOutline,
  addOutline,
  cameraOutline,
  heart,
  heartOutline,
  folderOutline,
  folder,
} from "ionicons/icons";
import type { UserPhoto } from "../services/photo.service";
import { PhotoService } from "../services/photo.service";
import { AuthService } from "../services/auth.service";

export interface FolderGroup {
  folder_id: number | string;
  folder_name: string;
  coverPhotos: UserPhoto[];
  photoCount: number;
}

@Component({
  selector: "app-album",
  templateUrl: "./album.page.html",
  styleUrls: ["./album.page.scss"],
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonButton,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class AlbumPage implements OnInit, ViewWillEnter {
  public photoService = inject(PhotoService);
  private authService = inject(AuthService);
  private actionSheetController = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private router = inject(Router);

  public folderGroups = computed(() => {
    const photos = this.photoService.photos();
    const groups = new Map<string | number, FolderGroup>();

    if (photos.length === 0) {
      return [];
    }

    const todasGroup: FolderGroup = {
      folder_id: 1,
      folder_name: "Todas las Imagenes",
      coverPhotos: [],
      photoCount: 0,
    };

    const favoritasGroup: FolderGroup = {
      folder_id: 'favoritas',
      folder_name: "Favoritas",
      coverPhotos: [],
      photoCount: 0,
    };

    for (const photo of photos) {
      todasGroup.photoCount++;
      if (todasGroup.coverPhotos.length < 3) {
        todasGroup.coverPhotos.push(photo);
      }

      if (photo.isFavorite || (photo as any).favorite) {
        favoritasGroup.photoCount++;
        if (favoritasGroup.coverPhotos.length < 3) {
          favoritasGroup.coverPhotos.push(photo);
        }
      }

      const folderId = photo.folder_id ?? 3;
      const folderName = photo.folder_name || "Sin Carpeta";

      if (
        folderId === 1 ||
        folderId === 2 ||
        folderId === 3 ||
        folderName === "Sin Carpeta" ||
        folderName === "Ocultas" ||
        folderId === 'favoritas' 
      ) {
        continue;
      }

      if (!groups.has(folderId)) {
        groups.set(folderId, {
          folder_id: folderId,
          folder_name: folderName,
          coverPhotos: [photo],
          photoCount: 1,
        });
      } else {
        const group = groups.get(folderId)!;
        group.photoCount++;

        if (group.coverPhotos.length < 3) {
          group.coverPhotos.push(photo);
        }
      }
    }

    const result = Array.from(groups.values());
    
    result.unshift(favoritasGroup);
    result.unshift(todasGroup);

    return result;
  });

  constructor() {
    addIcons({
      camera,
      trash,
      close,
      informationCircleOutline,
      imagesOutline,
      addOutline,
      cameraOutline,
      heart,
      heartOutline,
      folderOutline,
      folder,
    });
  }

  async ngOnInit() {
    this.ionViewWillEnter();
  }

  async ionViewWillEnter() {
    await this.authService.isAuthenticated();
    await this.photoService.loadSaved();
  }

  async handleRefresh(event: any) {
    try {
      await this.photoService.loadSaved();
    } finally {
      event.target.complete();
    }
  }

  goToCamera() {
    this.router.navigate(["/tabs/camera"]);
  }

  async openFolder(folder: FolderGroup) {
    this.router.navigate(["/tabs/album-fotos", folder.folder_id], {
      queryParams: { folderName: folder.folder_name },
    });
  }

  private async presentToast(
    message: string,
    color: "success" | "danger" | "warning" = "success",
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: "bottom",
      color,
    });
    await toast.present();
  }
}
