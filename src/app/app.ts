import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Supabase } from './core/services/supabase';
import { ToastComponent } from './shared/components/toast/toast.component';
import { InstallPwaModalComponent } from './shared/components/install-pwa-modal/install-pwa-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, InstallPwaModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('zenith-finance');
  protected connectionStatus = signal<string>('Testing connection...');

  constructor(private supabase: Supabase) {}

  async ngOnInit() {
    console.log('App initialized - Testing Supabase connection...');
    
    // Probar la conexión a Supabase
    const result = await this.supabase.testConnection();
    
    if (result.success) {
      this.connectionStatus.set(result.message);
      console.log('Connection test result:', result);
    } else {
      this.connectionStatus.set(result.message);
      console.error('Connection test failed:', result.error);
    }
  }
}
