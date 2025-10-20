import { Routes } from '@angular/router';
import { Home } from '../app/features/home/home';
import { Watch } from './features/watch/watch';
import { Admin } from './features/dashboard/admin/admin';
import { User } from './features/dashboard/user/user';
import { AdminGuard } from './core/guards/admin.guard';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'watch/:id', component: Watch },
  { path: 'dashboard/admin', component: Admin, canActivate: [AuthGuard, AdminGuard] },
  { path: 'dashboard/user', component: User, canActivate: [AuthGuard] }
];
