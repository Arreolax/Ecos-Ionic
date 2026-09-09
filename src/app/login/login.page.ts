import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, ToastController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

declare const paper: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, CommonModule, FormsModule],
})
export class LoginPage implements AfterViewInit {
  @ViewChild('canvasEl', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  // Control de vista Login vs Signup
  isSignup: boolean = false;
  isLoading: boolean = false;

  // Modelos de datos para los formularios
  loginData = {
    email: '',
    password: '',
  };

  registerData = {
    name: '',
    username: '',
    email: '',
    telefono: '',
    password: '',
    terms: false,
  };

  // Variables de Paper.js
  shapeGroup: any;
  positionArray: any[] = [];
  canvasWidth!: number;
  canvasHeight!: number;
  canvasMiddleX!: number;
  canvasMiddleY!: number;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  // Alterna entre la vista de Login y Sign Up
  toggleView(showSignup: boolean) {
    this.isSignup = showSignup;
    this.cdr.detectChanges();
  }

  // Notificaciones Toast de Ionic
  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3500,
      position: 'top',
      color,
    });
    await toast.present();
  }

  // Enviar formulario de Login a través de Axios
  async onLoginSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (!this.loginData.email.trim() || !this.loginData.password.trim()) {
      await this.showToast('Por favor, ingresa tu correo y contraseña.', 'warning');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const response = await this.authService.login(
        this.loginData.email.trim(),
        this.loginData.password
      );

      if (response.success) {
        this.isLoading = false;
        this.cdr.detectChanges();
        await this.showToast(response.message || 'Login exitoso.', 'success');
        this.router.navigate(['/tabs/dashboard']);
      } else {
        this.isLoading = false;
        this.cdr.detectChanges();
        await this.showToast(response.message || 'Credenciales incorrectas.', 'danger');
      }
    } catch (error: any) {
      this.isLoading = false;
      this.cdr.detectChanges();
      await this.showToast('Error al procesar la solicitud de inicio de sesión.', 'danger');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // Enviar formulario de Registro a través de Axios
  async onRegisterSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    if (
      !this.registerData.name.trim() ||
      !this.registerData.username.trim() ||
      !this.registerData.email.trim() ||
      !this.registerData.telefono.trim() ||
      !this.registerData.password.trim()
    ) {
      await this.showToast('Por favor, completa todos los campos requeridos.', 'warning');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    if (!this.registerData.terms) {
      await this.showToast('Debes aceptar los Términos de Servicio para registrarte.', 'warning');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const response = await this.authService.register(
        this.registerData.name.trim(),
        this.registerData.username.trim(),
        this.registerData.email.trim(),
        this.registerData.telefono.trim(),
        this.registerData.password,
        this.registerData.terms
      );

      if (response.success) {
        // Pre-llenar el correo y contraseña en el login y cambiar a la vista de login
        this.loginData.email = this.registerData.email;
        this.loginData.password = this.registerData.password;
        this.toggleView(false);
        this.isLoading = false;
        this.cdr.detectChanges();
        await this.showToast(response.message || 'Usuario registrado exitosamente.', 'success');
      } else {
        this.isLoading = false;
        this.cdr.detectChanges();
        await this.showToast(response.message || 'Error en el registro.', 'danger');
      }
    } catch (error: any) {
      this.isLoading = false;
      this.cdr.detectChanges();
      await this.showToast('Error al procesar la solicitud de registro.', 'danger');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    if (typeof paper === 'undefined') {
      return;
    }

    // Inicializar Paper.js apuntando a nuestro elemento Canvas
    paper.setup(this.canvasElement.nativeElement);
    this.shapeGroup = new paper.Group();

    this.initializeShapes();

    // Animación
    paper.view.onFrame = (event: any) => {
      if (event.count % 4 === 0) {
        for (let i = 0; i < this.shapeGroup.children.length; i++) {
          if (i % 2 === 0) {
            this.shapeGroup.children[i].rotate(-0.1);
          } else {
            this.shapeGroup.children[i].rotate(0.1);
          }
        }
      }
    };

    // Redimensionado
    paper.view.onResize = (event: any) => {
      this.getCanvasBounds();

      for (let i = 0; i < this.shapeGroup.children.length; i++) {
        this.shapeGroup.children[i].position = this.positionArray[i];
      }

      if (this.canvasWidth < 700) {
        this.shapeGroup.children[3].opacity = 0;
        this.shapeGroup.children[2].opacity = 0;
        this.shapeGroup.children[5].opacity = 0;
      } else {
        this.shapeGroup.children[3].opacity = 1;
        this.shapeGroup.children[2].opacity = 1;
        this.shapeGroup.children[5].opacity = 1;
      }
    };
  }

  getCanvasBounds() {
    this.canvasWidth = paper.view.size.width;
    this.canvasHeight = paper.view.size.height;
    this.canvasMiddleX = this.canvasWidth / 2;
    this.canvasMiddleY = this.canvasHeight / 2;

    const position1 = { x: (this.canvasMiddleX / 2) + 100, y: 100 };
    const position2 = { x: 200, y: this.canvasMiddleY };
    const position3 = { x: (this.canvasMiddleX - 50) + (this.canvasMiddleX / 2), y: 150 };
    const position4 = { x: 0, y: this.canvasMiddleY + 100 };
    const position5 = { x: this.canvasWidth - 130, y: this.canvasHeight - 75 };
    const position6 = { x: this.canvasMiddleX + 80, y: this.canvasHeight - 50 };
    const position7 = { x: this.canvasWidth + 60, y: this.canvasMiddleY - 50 };
    const position8 = { x: this.canvasMiddleX + 100, y: this.canvasMiddleY + 100 };

    this.positionArray = [position3, position2, position5, position4, position1, position6, position7, position8];
  }

  initializeShapes() {
    this.getCanvasBounds();

    const shapePathData = [
      'M231,352l445-156L600,0L452,54L331,3L0,48L231,352', 
      'M0,0l64,219L29,343l535,30L478,37l-133,4L0,0z', 
      'M0,65l16,138l96,107l270-2L470,0L337,4L0,65z',
      'M333,0L0,94l64,219L29,437l570-151l-196-42L333,0',
      'M331.9,3.6l-331,45l231,304l445-156l-76-196l-148,54L331.9,3.6z',
      'M389,352l92-113l195-43l0,0l0,0L445,48l-80,1L122.7,0L0,275.2L162,297L389,352',
      'M 50 100 L 300 150 L 550 50 L 750 300 L 500 250 L 300 450 L 50 100',
      'M 700 350 L 500 350 L 700 500 L 400 400 L 200 450 L 250 350 L 100 300 L 150 50 L 350 100 L 250 150 L 450 150 L 400 50 L 550 150 L 350 250 L 650 150 L 650 50 L 700 150 L 600 250 L 750 250 L 650 300 L 700 350 '
    ];

    for (let i = 0; i < shapePathData.length; i++) {
      const headerShape = new paper.Path({
        strokeColor: 'rgba(255, 255, 255, 0.5)',
        strokeWidth: 2,
        parent: this.shapeGroup,
      });
      headerShape.pathData = shapePathData[i];
      headerShape.scale(2);
      headerShape.position = new paper.Point(this.positionArray[i].x, this.positionArray[i].y);
    }
  }
}
