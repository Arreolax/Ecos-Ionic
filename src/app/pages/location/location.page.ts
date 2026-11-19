import { Component, OnInit } from '@angular/core';
import { LocationService } from '../../services/location.service';
import { PhotoService } from '../../services/photo.service';
import { PermissionStatus } from '@capacitor/geolocation';
import { PermissionStatus } from '@capacitor/geolocation';

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
})
export class LocationPage implements OnInit {
  latitude: number | null = null;
  longitude: number | null = null;
  errorMsg: string | null = null;
  photos: Array<{ filePath: string; latitude: number; longitude: number; timestamp: string }> = [];

  constructor(private locSrv: LocationService,
              private photoSrv: PhotoService) {}

  async ngOnInit() {
    try {
      const perm: PermissionStatus = await this.locSrv.requestPermission();
      if (perm.location === 'granted') {
        const pos = await this.locSrv.getCurrentPosition();
        this.latitude = pos.coords.latitude;
        this.longitude = pos.coords.longitude;
        await this.loadSavedPhotos();
      } else {
        this.errorMsg = 'Permiso de ubicación denegado.';
      }
    } catch (e: any) {
      this.errorMsg = e.message ?? 'Error inesperado al obtener la ubicación.';
    }
  }

  async takePhoto() {
    try {
      const result = await this.photoSrv.capturePhotoWithLocation();
      // refresh list
      await this.loadSavedPhotos();
    } catch (e: any) {
      this.errorMsg = e.message ?? 'Error al capturar la foto.';
    }
  }

  private async loadSavedPhotos() {
    this.photos = await this.photoSrv.getSavedPhotos();
  }

  latitude: number | null = null;
  longitude: number | null = null;
  errorMsg: string | null = null;

  constructor(private locSrv: LocationService) {}

  async ngOnInit() {
    try {
      const perm: PermissionStatus = await this.locSrv.requestPermission();
      if (perm.location === 'granted') {
        const pos = await this.locSrv.getCurrentPosition();
        this.latitude = pos.coords.latitude;
        this.longitude = pos.coords.longitude;
      } else {
        this.errorMsg = 'Permiso de ubicación denegado.';
      }
    } catch (e: any) {
      this.errorMsg = e.message ?? 'Error inesperado al obtener la ubicación.';
    }
  }
}
