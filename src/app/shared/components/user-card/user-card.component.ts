import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, UserPlus, UserCheck, Eye } from 'lucide-angular';
import { UserProfile } from '../../../core/services/user.service';
import { CommunityService } from '../../../core/services/community.service';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './user-card.component.html',
  styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent implements OnInit {
  private communityService = inject(CommunityService);

  // Inputs using Setter for signal if needed, or simple input
  // Angular 17+ signals inputs are better but let's stick to standard compatibility for now
  @Input({ required: true }) set userData(val: any) { // generic 'any' to accept UserProfile OR LeaderboardUser
     this.user.set(val);
     if (val.roi_total !== undefined) {
         this.roi = parseFloat(val.roi_total);
     }
     if (val.rank_position) {
         this.rank = val.rank_position;
     }
  }

  user = signal<any>(null);
  
  // Optional extra inputs
  @Input() roi?: number;
  @Input() rank?: number;

  isFollowing = signal(false);
  isLoading = signal(false);

  readonly icons = { UserPlus, UserCheck, Eye };

  ngOnInit() {
    if (this.user()?.id) {
       this.checkFollowStatus();
    }
  }

  checkFollowStatus() {
     this.communityService.checkIsFollowing(this.user().id).subscribe(status => {
         this.isFollowing.set(status);
     });
  }

  toggleFollow() {
      if (this.isLoading()) return;
      const targetId = this.user().id;
      this.isLoading.set(true);

      if (this.isFollowing()) {
          this.communityService.unfollowUser(targetId).subscribe(() => {
              this.isFollowing.set(false);
              this.isLoading.set(false);
          });
      } else {
          this.communityService.followUser(targetId).subscribe(() => {
              this.isFollowing.set(true);
              this.isLoading.set(false);
          });
      }
  }
}
