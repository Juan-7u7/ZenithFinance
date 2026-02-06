import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService, UserProfile, PublicAsset } from '../../../../core/services/user.service';
import { LucideAngularModule, Share2, Lock, Shield, ArrowLeft } from 'lucide-angular';
import { switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss']
})
export class ProfileViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private location = inject(Location);

  profile = signal<UserProfile | null>(null);
  assets = signal<PublicAsset[]>([]);
  isGeneratingSnapshot = signal(false);

  readonly icons = { Share2, Lock, Shield, ArrowLeft };

  ngOnInit() {
    this.route.paramMap.pipe(
      switchMap(params => {
        const username = params.get('username');
        if (!username) return of(null);
        return this.userService.getProfileByUsername(username).pipe(
           tap(p => {
             if (p) {
               this.profile.set(p);
               this.loadPublicPortfolio(p.username!);
             }
           })
        );
      })
    ).subscribe();
  }

  loadPublicPortfolio(username: string) {
    this.userService.getPublicPortfolio(username).subscribe(data => {
      this.assets.set(data);
    });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }

  generateSnapshot() {
    this.isGeneratingSnapshot.set(true);
    
    // Dynamically import html2canvas to optimize initial bundle
    import('html2canvas').then(h2c => {
      // Wait for DOM to render the snapshot-area
      setTimeout(() => {
        const element = document.getElementById('snapshot-area');
        if (element) {
          h2c.default(element, { backgroundColor: null, scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = `zenith-story-${this.profile()?.username}.png`;
            link.href = canvas.toDataURL();
            link.click();
            this.isGeneratingSnapshot.set(false);
          }).catch(err => {
             console.error('Snapshot failed', err);
             this.isGeneratingSnapshot.set(false);
          });
        }
      }, 500); // Wait for modal animation/render
    });
  }

  goBack(): void {
    this.location.back();
  }
}
