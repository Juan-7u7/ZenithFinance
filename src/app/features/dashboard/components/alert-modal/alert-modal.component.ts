import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, X, Bell, TrendingUp, TrendingDown, Info } from 'lucide-angular';
import { AlertService } from '../../../../core/services/alert.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PortfolioAsset } from '../../../../core/models/asset.model';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.scss']
})
export class AlertModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private toastService = inject(ToastService);

  visible = signal(false);
  isLoading = signal(false);
  alertForm!: FormGroup;
  selectedAsset = signal<PortfolioAsset | null>(null);
  suggestedCondition = signal<'ABOVE' | 'BELOW'>('ABOVE');

  readonly icons = { X, Bell, TrendingUp, TrendingDown, Info };

  ngOnInit() {
    this.alertForm = this.fb.group({
      target_price: ['', [Validators.required, Validators.min(0.01)]],
      condition: ['ABOVE', Validators.required]
    });
  }

  open(asset: PortfolioAsset) {
    this.selectedAsset.set(asset);
    this.visible.set(true);
    
    // Auto-suggest condition based on current price
    const currentPrice = asset.currentPrice;
    this.suggestedCondition.set('ABOVE');
    
    this.alertForm.patchValue({
      target_price: currentPrice,
      condition: 'ABOVE'
    });
  }

  close() {
    this.visible.set(false);
    this.alertForm.reset();
    this.selectedAsset.set(null);
  }

  onPriceChange() {
    const asset = this.selectedAsset();
    if (!asset) return;

    const targetPrice = this.alertForm.get('target_price')?.value;
    if (targetPrice && !isNaN(targetPrice)) {
      const condition = Number(targetPrice) > asset.currentPrice ? 'ABOVE' : 'BELOW';
      this.alertForm.patchValue({ condition }, { emitEvent: false });
      this.suggestedCondition.set(condition);
    }
  }

  onSubmit() {
    if (this.alertForm.invalid || this.isLoading() || !this.selectedAsset()) return;

    this.isLoading.set(true);
    const asset = this.selectedAsset()!;
    const formValue = this.alertForm.value;

    this.alertService.addAlert({
      asset_id: asset.assetId,
      symbol: asset.symbol,
      target_price: Number(formValue.target_price),
      condition: formValue.condition
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastService.show('success', `Alerta creada: ${asset.symbol} ${formValue.condition === 'ABOVE' ? '>' : '<'} $${formValue.target_price}`);
        this.close();
      },
      error: () => {
        this.isLoading.set(false);
        this.toastService.show('error', 'Error al crear la alerta');
      }
    });
  }

  get priceChangePercentage(): number {
    const asset = this.selectedAsset();
    const targetPrice = this.alertForm.get('target_price')?.value;
    
    if (!asset || !targetPrice || isNaN(targetPrice)) return 0;
    
    const change = ((Number(targetPrice) - asset.currentPrice) / asset.currentPrice) * 100;
    return change;
  }
}
