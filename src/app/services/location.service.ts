import { Injectable } from '@angular/core';
import { Geolocation, PermissionStatus, GeolocationPosition } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class LocationService {
  /**
   * Request location permissions from the user.
   */
  async requestPermission(): Promise<PermissionStatus> {
    const status = await Geolocation.requestPermissions();
    return status;
  }

  /**
   * Get the current position with high accuracy.
   * Throws if permission is not granted.
   */
  async getCurrentPosition(): Promise<GeolocationPosition> {
    return await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
  }
}
