import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityService, LeaderboardUser } from '../../../../core/services/community.service';
import { UserCardComponent } from '../../../../shared/components/user-card/user-card.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, UserCardComponent, LucideAngularModule],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit {
  private communityService = inject(CommunityService);

  leaders = signal<LeaderboardUser[]>([]);
  isLoading = signal(true);
  timeframe = signal<'24h' | 'total'>('total');

  ngOnInit() {
    this.loadLeaderboard();
  }

  setTimeframe(tf: '24h' | 'total') {
      this.timeframe.set(tf);
      this.loadLeaderboard();
  }

  loadLeaderboard() {
      this.isLoading.set(true);
      this.communityService.getLeaderboard(this.timeframe()).subscribe(data => {
          this.leaders.set(data);
          this.isLoading.set(false);
      });
  }
}
