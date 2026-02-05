import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, X, Save } from 'lucide-angular';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { DatabaseAsset, PortfolioAsset } from '../../../../core/models/asset.model';

@Component({
  selector: 'app-edit-asset-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './edit-asset-modal.component.html',
  styleUrls: ['../add-asset-modal/add-asset-modal.component.scss'] // Reuse styles
})
export class EditAssetModalComponent implements OnInit {
  @Input({ required: true }) asset!: PortfolioAsset; // The UI asset (enriched)
  @Input({ required: true }) databaseId!: string; // The backend ID from user_assets (mapped)

  @Output() close = new EventEmitter<void>();
  @Output() assetUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private portfolioService = inject(PortfolioService);

  readonly icons = { X, Save };
  
  editForm!: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.editForm = this.fb.group({
      amount: [this.asset.quantity, [Validators.required, Validators.min(0.00000001)]],
      purchasePrice: [this.asset.averageBuyPrice, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.getRawValue();

    // Prepare DatabaseAsset for update
    // We only send the fields we want to update + ID
    const updatedAsset: Partial<DatabaseAsset> = {
      id: this.databaseId,
      amount: formValue.amount,
      purchase_price: formValue.purchasePrice
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.portfolioService.updateAsset(updatedAsset as DatabaseAsset).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.assetUpdated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al actualizar el activo. Inténtalo de nuevo.');
        console.error(err);
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
