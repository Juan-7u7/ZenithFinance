import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserService, UserProfile, PublicAsset } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CommunityService } from '../../../../core/services/community.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LucideAngularModule, Share2, Lock, Shield, ArrowLeft, Users, TrendingUp, Briefcase, Plus, Check, Download, Share, ExternalLink } from 'lucide-angular';
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
  followerCount = signal(0);
  isGeneratingSnapshot = signal(false);
  isFollowing = signal(false);
  isProcessingFollow = signal(false);

  currentUser = signal(this.authService.getCurrentUser());
  isOwnProfile = computed(() => {
    const prof = this.profile();
    const me = this.currentUser();
    return prof && me && prof.id === me.id;
  });

  readonly icons = { Share2, Lock, Shield, ArrowLeft, Users, TrendingUp, Briefcase, Plus, Check, Download, Share, ExternalLink };

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
               this.loadFollowerCount(p.id);
             }
           })
        );
      })
    ).subscribe();
  }

  loadFollowerCount(userId: string) {
    this.communityService.getFollowerCount(userId).subscribe(count => {
      this.followerCount.set(count);
    });
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
    const wasFollowing = this.isFollowing();

    if (wasFollowing) {
      this.communityService.unfollowUser(prof.id).subscribe(() => {
        this.isFollowing.set(false);
        this.followerCount.update(c => Math.max(0, c - 1));
        this.isProcessingFollow.set(false);
        this.toastService.info(`Ya no sigues a ${prof.name}`);
      });
    } else {
      this.communityService.followUser(prof.id).subscribe(() => {
        this.isFollowing.set(true);
        this.followerCount.update(c => c + 1);
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

  showShareOptions = signal(false);

  toggleShareOptions() {
    this.showShareOptions.update(v => !v);
  }

  async generateProfileCard() {
    if (this.isGeneratingSnapshot()) return;
    
    // Ensure we have the element
    const element = document.getElementById('share-card-template');
    if (!element) return;

    this.isGeneratingSnapshot.set(true);
    
    try {
      const h2c = (await import('html2canvas')).default;
      const canvas = await h2c(element, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      });

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ZenithProfile_${this.profile()?.username}.png`;
      link.href = url;
      link.click();
      
      this.toastService.success('Imagen de perfil generada');
    } catch (error) {
      console.error('Error generating image:', error);
      this.toastService.error('Error al generar la imagen');
    } finally {
      this.isGeneratingSnapshot.set(false);
      this.showShareOptions.set(false);
    }
  }

  async shareProfile() {
    const url = window.location.href;
    const text = `¡Mira mi portafolio de inversiones en Zenith Finance! 🚀 Sigue mi progreso aquí:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Zenith Finance - ${this.profile()?.name}`,
          text: text,
          url: url
        });
        this.toastService.success('¡Enlace compartido!');
      } catch (error) {
        console.warn('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(`${text} ${url}`);
      this.toastService.info('Enlace copiado al portapapeles');
    }
    this.showShareOptions.set(false);
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }

  goBack(): void {
    this.location.back();
  }
}
