import { Injectable, signal, OnDestroy } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root',
})
export class NetworkService implements OnDestroy {
  /** true = hay conexión, false = sin conexión */
  public isOnline = signal<boolean>(true);

  private listenerHandle: any = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Estado inicial real del dispositivo
    const status = await Network.getStatus();
    this.isOnline.set(status.connected);

    // Escucha cambios de conectividad en tiempo real
    this.listenerHandle = await Network.addListener(
      'networkStatusChange',
      (status) => {
        this.isOnline.set(status.connected);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.listenerHandle) {
      this.listenerHandle.remove();
    }
  }
}
