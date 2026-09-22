import { Component, OnInit, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { NotesService, Note } from "./notes.service";

import { AuthService } from '../services/auth.service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonChip,
  IonLabel,
  IonFab,
  IonFabButton,
  IonModal,
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  ToastController,
  AlertController,
} from "@ionic/angular";
import { addIcons } from "ionicons";
import {
  add,
  createOutline,
  trashOutline,
  pinOutline,
  searchOutline,
  bookOutline,
  closeOutline,
  checkmarkOutline,
  documentTextOutline,
  timeOutline,
  colorPaletteOutline,
  bookmarkOutline,
  bookmark,
  sparklesOutline,
} from "ionicons/icons";

@Component({
  selector: "app-notes",
  templateUrl: "./notes.page.html",
  styleUrls: ["./notes.page.scss"],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    IonChip,
    IonLabel,
    IonFab,
    IonFabButton,
    IonModal,
    IonItem,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonRefresher,
    IonRefresherContent,
  ],
})
export class NotesPage implements OnInit {
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private notesService = inject(NotesService);
  private cdr = inject(ChangeDetectorRef);

  private authService = inject(AuthService);

  currentUserId: number = 0;

  searchTerm: string = "";
  selectedCategory: string = "Todas";
  isModalOpen: boolean = false;
  isEditing: boolean = false;
  isSaving: boolean = false; 

  categories: string[] = [
    "Todas",
    "Personal",
    "Ideas",
    "Trabajo",
    "Importante",
    "Diario",
  ];

  availableColors: string[] = [
    "#3880ff", 
    "#2dd36f", 
    "#ffc409", 
    "#eb445a", 
    "#9d5bd2", 
    "#ff7961",
  ];

  activeNote: Partial<Note> = {
    title: "",
    content: "",
    category: "Personal",
    color: "#3880ff",
  };

  notes: Note[] = [];

  togglePin(note: Note, event?: Event) {
    if (event) event.stopPropagation();
    
    note.is_pinned = !note.is_pinned;
    
    this.cdr.detectChanges(); 
    
    this.notesService.saveNote(note).subscribe({
      next: (res: any) => {
        if (res.success === true || res.status === 'success') {
          this.loadNotesFromApi(); 
          
          const mensaje = note.is_pinned ? 'Nota fijada' : 'Nota desfijada';
          this.showToast(mensaje, 'success');
        } else {
          note.is_pinned = !note.is_pinned;
          this.cdr.detectChanges();
          this.showToast(res.message || 'No se pudo cambiar el estado de la nota.', 'danger');
        }
      },
      error: (err) => {
        note.is_pinned = !note.is_pinned;
        this.cdr.detectChanges();
        
        console.error('Error al fijar la nota', err);
        this.showToast('Error de conexión al intentar cambiar el estado.', 'danger');
      }
    });
  }

  constructor() {
    addIcons({
      add,
      createOutline,
      trashOutline,
      pinOutline,
      searchOutline,
      bookOutline,
      closeOutline,
      checkmarkOutline,
      documentTextOutline,
      timeOutline,
      colorPaletteOutline,
      bookmarkOutline,
      bookmark,
      sparklesOutline,
    });
  }

  ngOnInit() {
    const usuarioLogeado = this.authService.currentUser(); 
    
    if (usuarioLogeado && usuarioLogeado.id) {
      this.currentUserId = Number(usuarioLogeado.id);
    }
    
    this.loadNotesFromApi();
  }

  ionViewWillEnter() {
    this.selectedCategory = "Todas"; 
    this.searchTerm = ""; 
    this.loadNotesFromApi(); 
  }

  loadNotesFromApi(event?: any) {
    this.notesService.getNotes(this.currentUserId).subscribe({
      next: (data) => {
        this.notes = data;
        this.cdr.detectChanges();

        if (event) {
          event.target.complete();
        }
      },
      error: (err) => {
        console.error("Error al cargar notas de la API", err);
        this.showToast(
          "Error al cargar las notas desde el servidor.",
          "danger",
        );
        if (event) {
          event.target.complete();
        }
      },
    });
  }

  get filteredNotes(): Note[] {
    return this.notes
      .filter((note) => {
        const matchesCategory =
          this.selectedCategory === 'Todas' || note.category === this.selectedCategory;
        const query = this.searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query) ||
          note.category.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        
        return dateB - dateA;
      });
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  openNewNoteModal() {
    this.isEditing = false;
    this.isSaving = false; 
    this.activeNote = {
      title: "",
      content: "",
      category:
        this.selectedCategory !== "Todas" ? this.selectedCategory : "Personal",
      color: this.availableColors[0],
      user_id: this.currentUserId,
      is_pinned: false,
    };
    this.isModalOpen = true;
  }

  openEditNoteModal(note: Note) {
    this.isEditing = true;
    this.isSaving = false; 
    this.activeNote = { ...note };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.cdr.detectChanges();
  }

  async saveNote() {
    if (this.isSaving) return;

    if (!this.activeNote.content?.trim()) {
      this.showToast("El contenido de la nota es obligatorio.", "warning");
      return;
    }

    this.isSaving = true;

    const noteToSave = this.activeNote as Note;
    noteToSave.title = noteToSave.title?.trim() || "Sin título";
    noteToSave.content = noteToSave.content.trim();
    noteToSave.category = noteToSave.category || "Personal";
    noteToSave.color = noteToSave.color || "#3880ff";

    this.notesService.saveNote(noteToSave).subscribe({
      next: (res: any) => {
        this.isSaving = false;

        if (res.success === true || res.status === "success") {
          this.closeModal();

          setTimeout(() => {
            this.loadNotesFromApi();
            this.showToast(res.message || "Nota guardada.", "success");
          }, 150);
        } else {
          this.showToast(res.message || "Fallo interno en la API.", "danger");
        }
      },
      error: (err) => {
        this.isSaving = false;
        console.error("Error al comunicarse con la API:", err);
        const errorMessage =
          err.error?.message || err.message || "Error de servidor.";
        this.showToast(`Error: ${errorMessage}`, "danger");
      },
    });
  }

  handleRefresh(event: any) {
    this.loadNotesFromApi(event);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: "top",
    });
    await toast.present();
  }

  async confirmDeleteNote(note: Note, event?: Event) {
    if (event) event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: "¿Eliminar nota?",
      message: `¿Estás seguro de que deseas eliminar la nota "${note.title}"?`,
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Eliminar",
          role: "destructive",
          handler: () => {
            if (note.id) {
              this.notesService
                .deleteNote(note.id, this.currentUserId)
                .subscribe({
                  next: (res: any) => {
                    if (res.success === true || res.status === "success") {
                      this.loadNotesFromApi(); 
                      this.showToast("Nota eliminada", "medium");
                    } else {
                      this.showToast(
                        res.message || "No se pudo eliminar la nota.",
                        "danger",
                      );
                    }
                  },
                  error: (err) => {
                    console.error("Error al eliminar", err);
                    this.showToast("Ocurrió un error al eliminar.", "danger");
                  },
                });
            }
          },
        },
      ],
    });

    await alert.present();
  }
}
