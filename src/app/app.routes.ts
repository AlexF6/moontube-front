import { Routes } from '@angular/router';
import { Home } from '../app/features/home/home';
import { Watch } from './features/watch/watch';
import { AdminShell } from './features/dashboard/admin/admin-shell';
import { UserShell } from './features/dashboard/user/user-shell';
import { AdminGuard } from './core/guards/admin.guard';
import { AuthGuardActivate } from './core/guards/auth.guard';
import { WatchlistComponent } from './features/watchlist/watchlist';
import { SubscriptionsTabComponent } from './features/subscription/subscriptions-tab';
import { SearchPageComponent } from './features/search/search-page';
import { PlansComponent } from './features/plans/plans';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'watch/:id', component: Watch },
  { path: 'search', component: SearchPageComponent },
  { path: 'dashboard/admin', component: AdminShell, canActivate: [AuthGuardActivate, AdminGuard] },
  { path: 'dashboard/user', component: UserShell, canActivate: [AuthGuardActivate] },
  { path: 'watchlists', component: WatchlistComponent, canActivate: [AuthGuardActivate] },
  { path: 'subscriptions', component: SubscriptionsTabComponent, canActivate: [AuthGuardActivate] },
  { path: 'plans', component: PlansComponent },
];
