import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, X, Search, Save, CircleDollarSign } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MarketService } from '../../../../core/services/market.service';
import { PortfolioService } from '../../../../core/services/portfolio.service';
import { DatabaseAsset, Asset } from '../../../../core/models/asset.model';

@Component({
  selector: 'app-add-asset-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './add-asset-modal.component.html',
  styleUrl: './add-asset-modal.component.scss'
})
export class AddAssetModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() assetAdded = new EventEmitter<DatabaseAsset>();

  private fb = inject(FormBuilder);
  private marketService = inject(MarketService);
  private portfolioService = inject(PortfolioService);

  readonly icons = { X, Search, Save, CircleDollarSign };
  
  assetForm: FormGroup;
  searchResults = signal<Partial<Asset>[]>([]);
  isSearching = signal(false);
  selectedAsset = signal<Partial<Asset> | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.assetForm = this.fb.group({
      searchQuery: [''],
      amount: [1, [Validators.required, Validators.min(0.00000001)]],
      purchasePrice: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]]
    });

    this.setupSearch();
  }

  private setupSearch(): void {
    const searchControl = this.assetForm.get('searchQuery');
    
    if (searchControl) {
      searchControl.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        filter(query => typeof query === 'string' && query.length >= 2),
        tap(() => this.isSearching.set(true)),
        switchMap(query => this.marketService.searchAssets(query).pipe(
          catchError(() => {
            this.isSearching.set(false);
            return of([]);
          })
        )),
        tap(() => this.isSearching.set(false))
      ).subscribe(results => {
        this.searchResults.set(results);
      });
    }
  }

  selectAsset(asset: Partial<Asset>): void {
    this.selectedAsset.set(asset);
    this.searchResults.set([]); // Clear results
    this.assetForm.get('searchQuery')?.setValue(asset.name + ' (' + asset.symbol?.toUpperCase() + ')', { emitEvent: false });
    
    // Fetch current price to populate purchase price
    if (asset.id) {
      this.isSearching.set(true);
      this.marketService.getAssetDetails(asset.id).subscribe({
        next: (details) => {
          this.assetForm.get('purchasePrice')?.enable();
          this.assetForm.get('purchasePrice')?.setValue(details.market_data.current_price.usd);
          this.isSearching.set(false);
        },
        error: () => {
          this.isSearching.set(false);
          this.assetForm.get('purchasePrice')?.enable();
        }
      });
    }
  }

  onSubmit(): void {
    if (this.assetForm.invalid || !this.selectedAsset()) {
      this.assetForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedAsset()!;
    const formValue = this.assetForm.getRawValue(); // raw value to get disabled fields too

    const newAsset: DatabaseAsset = {
      asset_id: selected.id!, // CoinGecko ID
      user_id: '', // Will be set by service
      symbol: selected.symbol!,
      asset_name: selected.name!,
      amount: formValue.amount,
      purchase_price: formValue.purchasePrice
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.portfolioService.addAsset(newAsset as any).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.assetAdded.emit(newAsset);
        this.close.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al guardar el activo. Inténtalo de nuevo.');
        console.error(err);
      }
    });
  }

  onCancel(): void {
    this.close.emit();
  }
}
