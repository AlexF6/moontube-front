import { Routes } from '@angular/router';
import { Home } from '../app/features/home/home';
import { Watch } from './features/watch/watch';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'watch/:id', component: Watch }
];
