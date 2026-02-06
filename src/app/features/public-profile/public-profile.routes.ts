import { Routes } from '@angular/router';
import { ProfileViewComponent } from './pages/profile-view/profile-view.component';

export const PUBLIC_PROFILE_ROUTES: Routes = [
  {
    path: '', 
    component: ProfileViewComponent
  }
];
