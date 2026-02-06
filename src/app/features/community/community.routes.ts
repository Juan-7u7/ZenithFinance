import { Routes } from '@angular/router';
import { UserListComponent } from './pages/user-list/user-list.component';

export const COMMUNITY_ROUTES: Routes = [
  {
    path: '',
    component: UserListComponent
  }
];
