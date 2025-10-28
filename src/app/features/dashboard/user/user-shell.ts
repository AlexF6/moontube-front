import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
// import { SubscriptionsTabComponent } from './subscriptions-tab/subscriptions-tab';
import { PaymentsTabComponent } from './payments-tab/payments-tab';
import { ProfilesTabComponent } from './profiles-tab/profile-tab';
// import { WatchlistsTabComponent } from './watchlists-tab/watchlists-tab.component';
import { PlaybacksTabComponent } from './playbacks-tab/playbacks-tab';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    // SubscriptionsTabComponent, 
    PaymentsTabComponent, 
    ProfilesTabComponent, 
    // WatchlistsTabComponent, 
    PlaybacksTabComponent
  ],
  templateUrl: './user-shell.html'
})
export class UserShell implements OnInit {
  activeTab = signal<'subscriptions' | 'payments' | 'profiles' | 'watchlists' | 'playbacks'>('payments');
  
  constructor(public authService: AuthService) {}
  
  ngOnInit(): void {}
  
  setTab(tab: typeof this.activeTab extends infer T ? any : never) { 
    this.activeTab.set(tab); 
  }
}