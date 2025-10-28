import { Routes } from '@angular/router';
import { Home } from '../app/features/home/home';
import { Watch } from './features/watch/watch';
import { AdminShell } from './features/dashboard/admin/admin-shell';
import { UserShell } from './features/dashboard/user/user-shell';
import { AdminGuard } from './core/guards/admin.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { WatchlistComponent } from './features/watchlist/watchlist';
import { SubscriptionsTabComponent } from './features/subscription/subscriptions-tab';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'watch/:id', component: Watch },
  { path: 'dashboard/admin', component: AdminShell, canActivate: [AuthGuard, AdminGuard] },
  { path: 'dashboard/user', component: UserShell, canActivate: [AuthGuard] },
  { path: 'playlist', component: WatchlistComponent, canActivate: [AuthGuard] },
  { path: 'subscriptions', component: SubscriptionsTabComponent, canActivate: [AuthGuard] },
];
