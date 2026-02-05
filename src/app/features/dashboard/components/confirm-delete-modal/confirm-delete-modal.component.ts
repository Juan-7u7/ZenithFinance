import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, Trash2 } from 'lucide-angular';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="modal-overlay fade-in" (click)="onCancel()">
      <div class="modal-container glass-card slide-up" (click)="$event.stopPropagation()">
        <div class="modal-body delete-content">
          <div class="warning-icon">
            <lucide-icon [img]="icons.AlertTriangle" size="48"></lucide-icon>
          </div>
          <h3>¿Eliminar {{ assetName }}?</h3>
          <p>Esta acción eliminará el activo de tu portafolio y no se puede deshacer.</p>
          
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="onCancel()">Cancelar</button>
            <button class="btn btn-danger" (click)="onConfirm()" [disabled]="isLoading">
              @if (isLoading) {
                <span>Eliminando...</span>
              } @else {
                <lucide-icon [img]="icons.Trash2" size="18"></lucide-icon>
                Eliminar
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../add-asset-modal/add-asset-modal.component.scss'],
  styles: [`
    .delete-content {
      text-align: center;
      align-items: center;
      padding: 2rem;
    }
    .warning-icon {
      color: var(--error);
      background: rgba(244, 67, 54, 0.1);
      padding: 1rem;
      border-radius: 50%;
      margin-bottom: 1rem;
    }
    .btn-danger {
      background-color: var(--error);
      color: white;
      border: none;
      &:hover { background-color: #d32f2f; }
    }
  `]
})
export class ConfirmDeleteModalComponent {
  @Input({ required: true }) assetName!: string;
  @Input() isLoading = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly icons = { AlertTriangle, Trash2 };

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
