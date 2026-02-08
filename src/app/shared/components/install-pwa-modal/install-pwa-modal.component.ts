import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Download, Share, PlusSquare, X } from 'lucide-angular';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-install-pwa-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './install-pwa-modal.component.html',
  styleUrls: ['./install-pwa-modal.component.scss']
})
export class InstallPwaModalComponent implements OnInit {
  private notificationService = inject(NotificationService);
  isVisible = signal(false);
  isIOS = signal(false);
  deferredPrompt: any;

  readonly icons = { Download, Share, PlusSquare, X };

  ngOnInit() {
    this.checkIfInstalled();
    this.detectIOS();
    
    // Listen for the install prompt
    // Note: This event is not supported on iOS
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      this.deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      // Only show if not dismissed recently
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        this.isVisible.set(true);
      }
    });

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      this.isVisible.set(false);
      this.deferredPrompt = null;
      console.log('PWA was installed');
      // Ask for notification permission after install
      this.notificationService.requestPermissions();
    });

    // If iOS and not standalone, show modal after a delay
    if (this.isIOS() && !this.isStandalone()) {
      // Check if user has dismissed it before via localStorage
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
          setTimeout(() => {
            this.isVisible.set(true);
          }, 3000);
      }
    }
  }

  detectIOS() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    this.isIOS.set(/iphone|ipad|ipod/.test(userAgent));
  }

  isStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches) || ((window.navigator as any).standalone === true);
  }

  checkIfInstalled() {
    if (this.isStandalone()) {
      this.isVisible.set(false);
      // Optional: Check permissions here too if needed
    }
  }

  async installPwa() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        this.isVisible.set(false);
        this.notificationService.requestPermissions();
      }
      this.deferredPrompt = null;
    }
  }

  dismiss() {
    this.isVisible.set(false);
    // Dismiss for a session or permanently? Let's say permanently for now or maybe clear on logout if needed.
    // For better UX, we could store a timestamp and show it again after X days.
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  }
}
