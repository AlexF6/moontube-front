import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { UsersTabComponent } from './users-tab/users-tab';
import { ContentTabComponent } from './content-tab/content-tab';
import { PlansTabComponent } from './plans-tab/plans-tab';
import { SubscriptionsTabComponent } from './subscriptions-tab/subscriptions-tab';
import { PaymentsTabComponent } from './payments-tab/payments-tab';
import { ProfilesTabComponent } from './profiles-tab/profiles-tab';
import { WatchlistsTabComponent } from './watchlists/watchlists-tab';
import { EpisodesTabComponent } from './episodes/episodes-tab';
import { PlaybacksTabComponent } from './playbacks/playbacks-tab';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule,
    UsersTabComponent, ContentTabComponent, PlansTabComponent,
    SubscriptionsTabComponent, PaymentsTabComponent, ProfilesTabComponent, WatchlistsTabComponent,
    EpisodesTabComponent, PlaybacksTabComponent],
  templateUrl: './admin-shell.html'
})
export class AdminShell implements OnInit {
  activeTab = signal<'users' | 'content' | 'plans' | 'subscriptions' | 'payments' | 'profiles' | 'watchlists' | 'episodes' | 'playbacks'>('users');
  constructor(public authService: AuthService) {}
  ngOnInit(): void {}
  setTab(tab: typeof this.activeTab extends infer T ? any : never) { this.activeTab.set(tab); }
}