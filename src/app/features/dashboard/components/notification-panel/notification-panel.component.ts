import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, UserPlus, Bell, Check, Trash2 } from 'lucide-angular';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss']
})
export class NotificationPanelComponent {
  @Input() notifications: AppNotification[] = [];
  @Output() close = new EventEmitter<void>();
  
  private notificationService = inject(NotificationService);
  
  readonly icons = { X, UserPlus, Bell, Check, Trash2 };

  markRead(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllRead();
  }

  onClose(): void {
    this.close.emit();
  }

  deleteNotification(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }
}
