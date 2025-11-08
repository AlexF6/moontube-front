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
  { path: '', loadComponent: () => import('./features/home/home').then(m => m.Home) },
  { path: 'watch/:id', loadComponent: () => import('./features/watch/watch').then(m => m.Watch) },
  { path: 'search', loadComponent: () => import('./features/search/search-page').then(m => m.SearchPageComponent) },

  {
    path: 'dashboard/admin',
    component: AdminShell,
    canActivate: [AuthGuardActivate, AdminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },

      {
        path: 'users',
        loadComponent: () =>
          import('./features/dashboard/admin/users-tab/users-tab')
            .then(m => m.UsersTabComponent),
      },
      {
        path: 'content',
        loadComponent: () =>
          import('./features/dashboard/admin/contents-tab/content-tab')
            .then(m => m.ContentTabComponent),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/dashboard/admin/plans-tab/plans-tab')
            .then(m => m.PlansTabComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/dashboard/admin/subscriptions-tab/subscriptions-tab')
            .then(m => m.SubscriptionsTabComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/dashboard/admin/payments-tab/payments-tab')
            .then(m => m.PaymentsTabComponent),
      },
      {
        path: 'profiles',
        loadComponent: () =>
          import('./features/dashboard/admin/profiles-tab/profiles-tab')
            .then(m => m.ProfilesTabComponent),
      },
      {
        path: 'watchlists',
        loadComponent: () =>
          import('./features/dashboard/admin/watchlists-tab/watchlists-tab')
            .then(m => m.WatchlistsTabComponent),
      },
      {
        path: 'episodes',
        loadComponent: () =>
          import('./features/dashboard/admin/episodes-tab/episodes-tab')
            .then(m => m.EpisodesTabComponent),
      },
      {
        path: 'playbacks',
        loadComponent: () =>
          import('./features/dashboard/admin/playbacks-tab/playbacks-tab')
            .then(m => m.PlaybacksTabComponent),
      },
    ],
  },

  {
    path: 'dashboard/user',
    component: UserShell,
    canActivate: [AuthGuardActivate],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'account' },
      {
        path: 'account',
        loadComponent: () =>
          import('./features/dashboard/user/users-tab/user-tab')
            .then(m => m.UserTabComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/dashboard/user/payments-tab/payments-tab')
            .then(m => m.PaymentsTabComponent),
      },
      {
        path: 'profiles',
        loadComponent: () =>
          import('./features/dashboard/user/profiles-tab/profile-tab')
            .then(m => m.ProfilesTabComponent),
      },
      {
        path: 'playbacks',
        loadComponent: () =>
          import('./features/dashboard/user/playbacks-tab/playbacks-tab')
            .then(m => m.PlaybacksTabComponent),
      },
    ],
  },

  { path: 'watchlists', component: WatchlistComponent, canActivate: [AuthGuardActivate] },
  { path: 'subscriptions', component: SubscriptionsTabComponent, canActivate: [AuthGuardActivate] },
  { path: 'plans', component: PlansComponent },

  { path: '**', redirectTo: '/' },
];
