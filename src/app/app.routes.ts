import { Routes } from '@angular/router';
import { Home } from '../app/features/home/home';
import { Watch } from './features/watch/watch';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'watch/:id', component: Watch }
];
