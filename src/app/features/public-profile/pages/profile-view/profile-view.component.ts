import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService, UserProfile, PublicAsset } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommunityService } from '../../../../core/services/community.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LucideAngularModule, Share2, Lock, Shield, ArrowLeft, Users, TrendingUp, Briefcase, Plus, Check } from 'lucide-angular';
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
  private authService = inject(AuthService);
  private communityService = inject(CommunityService);
  private toastService = inject(ToastService);
  private location = inject(Location);

  profile = signal<UserProfile | null>(null);
  assets = signal<PublicAsset[]>([]);
  isGeneratingSnapshot = signal(false);
  isFollowing = signal(false);
  isProcessingFollow = signal(false);

  currentUser = signal(this.authService.getCurrentUser());
  isOwnProfile = computed(() => {
    const prof = this.profile();
    const me = this.currentUser();
    return prof && me && prof.id === me.id;
  });

  readonly icons = { Share2, Lock, Shield, ArrowLeft, Users, TrendingUp, Briefcase, Plus, Check };

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
               this.checkFollowingStatus(p.id);
             }
           })
        );
      })
    ).subscribe();
  }

  checkFollowingStatus(userId: string) {
    if (this.isOwnProfile()) return;
    this.communityService.checkIsFollowing(userId).subscribe(isFollowing => {
      this.isFollowing.set(isFollowing);
    });
  }

  toggleFollow() {
    const prof = this.profile();
    if (!prof || this.isProcessingFollow()) return;

    this.isProcessingFollow.set(true);
    if (this.isFollowing()) {
      this.communityService.unfollowUser(prof.id).subscribe(() => {
        this.isFollowing.set(false);
        this.isProcessingFollow.set(false);
        this.toastService.info(`Ya no sigues a ${prof.name}`);
      });
    } else {
      this.communityService.followUser(prof.id).subscribe(() => {
        this.isFollowing.set(true);
        this.isProcessingFollow.set(false);
        this.toastService.success(`Ahora sigues a ${prof.name}`);
      });
    }
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
