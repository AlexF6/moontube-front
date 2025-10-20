import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth.service';
import { environment } from '../../../enviroments/enviroment';

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  start_date: string;
  end_date: string | null;
  renews_at: string | null;
  canceled_at: string | null;
  plan?: {
    id: string;
    name: string;
    price: string;
    max_profiles: number;
    max_devices: number;
    video_quality: string;
  };
};

type Payment = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paid_at: string | null;
  provider: string | null;
  external_id: string | null;
  created_at: string;
};

type Profile = {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  maturity_rating: string | null;
  created_at: string;
  created_by: string;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  max_profiles: number;
  max_devices: number;
  video_quality: string;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  is_admin: boolean;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
};

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user.html'
})
export class User implements OnInit {
  private base = environment.apiUrl;
  
  // State signals
  activeTab = signal<'profile' | 'subscriptions' | 'payments' | 'profiles'>('profile');
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  // Data signals
  subscriptions = signal<Subscription[]>([]);
  payments = signal<Payment[]>([]);
  userProfiles = signal<Profile[]>([]);
  availablePlans = signal<Plan[]>([]);
  currentUser = signal<UserResponse | null>(null);
  
  // Computed values
  activeSubscription = computed(() => 
    this.subscriptions().find(sub => sub.status === 'ACTIVE')
  );

  // Form models
  passwordChange = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  newProfile = {
    name: '',
    avatar: '',
    maturity_rating: ''
  };

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  setTab(tab: 'profile' | 'subscriptions' | 'payments' | 'profiles') {
    this.activeTab.set(tab);
    this.error.set(null);
    this.success.set(null);
  }

  // Helper method to get non-active subscriptions
  getNonActiveSubscriptions(): Subscription[] {
    return this.subscriptions().filter(sub => sub.status !== 'ACTIVE');
  }

  // ... (keep all other existing methods the same)

  loadUserData() {
    this.isLoading.set(true);
    
    // Load current user details
    this.http.get<UserResponse>(`${this.base}/auth/me`, { 
      withCredentials: true 
    }).subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (error) => {
        console.error('Failed to load user details:', error);
      }
    });

    // Load subscriptions
    this.http.get<Subscription[]>(`${this.base}/subscriptions/me`, { 
      withCredentials: true 
    }).subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.loadPayments();
      },
      error: (error) => {
        this.error.set('Failed to load subscriptions');
        this.isLoading.set(false);
      }
    });

    // Load profiles for current user
    this.loadUserProfiles();

    // Load available plans (for information)
    this.http.get<Plan[]>(`${this.base}/plans`, { 
      withCredentials: true 
    }).subscribe({
      next: (plans) => {
        this.availablePlans.set(plans);
      },
      error: (error) => {
        console.error('Failed to load plans:', error);
      }
    });
  }

  loadUserProfiles() {
    // Use the profiles endpoint with user_id filter to get current user's profiles
    const userId = this.authService.user()?.id;
    if (userId) {
      this.http.get<Profile[]>(`${this.base}/profiles?user_id=${userId}`, { 
        withCredentials: true 
      }).subscribe({
        next: (profiles) => {
          this.userProfiles.set(profiles);
        },
        error: (error) => {
          console.error('Failed to load profiles:', error);
        }
      });
    }
  }

  loadPayments() {
    this.http.get<Payment[]>(`${this.base}/payments/me`, { 
      withCredentials: true 
    }).subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load payments');
        this.isLoading.set(false);
      }
    });
  }

  changePassword() {
    if (this.passwordChange.new_password !== this.passwordChange.confirm_password) {
      this.error.set('New passwords do not match');
      return;
    }

    if (this.passwordChange.new_password.length < 6) {
      this.error.set('New password must be at least 6 characters long');
      return;
    }

    this.isLoading.set(true);
    this.http.post(`${this.base}/users/me/change-password`, {
      current_password: this.passwordChange.current_password,
      new_password: this.passwordChange.new_password
    }, { 
      withCredentials: true,
      responseType: 'text' // Expect no JSON response (204 No Content)
    }).subscribe({
      next: () => {
        this.success.set('Password changed successfully');
        this.resetPasswordForm();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(this.getErrorMessage(error) || 'Failed to change password');
        this.isLoading.set(false);
      }
    });
  }

  createProfile() {
    if (!this.newProfile.name) {
      this.error.set('Profile name is required');
      return;
    }

    if (!this.newProfile.name.trim()) {
      this.error.set('Profile name cannot be empty');
      return;
    }

    const userId = this.authService.user()?.id;
    if (!userId) {
      this.error.set('User not found');
      return;
    }

    this.isLoading.set(true);
    this.http.post<Profile>(`${this.base}/profiles`, {
      user_id: userId,
      name: this.newProfile.name.trim(),
      avatar: this.newProfile.avatar?.trim() || null,
      maturity_rating: this.newProfile.maturity_rating?.trim() || null
    }, { 
      withCredentials: true 
    }).subscribe({
      next: (profile) => {
        this.userProfiles.update(profiles => [...profiles, profile]);
        this.success.set('Profile created successfully');
        this.resetProfileForm();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(this.getErrorMessage(error) || 'Failed to create profile');
        this.isLoading.set(false);
      }
    });
  }

  updateProfile(profileId: string, updates: Partial<Profile>) {
    this.http.put<Profile>(`${this.base}/profiles/${profileId}`, updates, { 
      withCredentials: true 
    }).subscribe({
      next: (updatedProfile) => {
        this.userProfiles.update(profiles => 
          profiles.map(p => p.id === profileId ? updatedProfile : p)
        );
        this.success.set('Profile updated successfully');
      },
      error: (error) => {
        this.error.set(this.getErrorMessage(error) || 'Failed to update profile');
      }
    });
  }

  deleteProfile(profileId: string) {
    if (confirm('Are you sure you want to delete this profile?')) {
      this.http.delete(`${this.base}/profiles/${profileId}`, { 
        withCredentials: true 
      }).subscribe({
        next: () => {
          this.userProfiles.update(profiles => 
            profiles.filter(p => p.id !== profileId)
          );
          this.success.set('Profile deleted successfully');
        },
        error: (error) => {
          this.error.set(this.getErrorMessage(error) || 'Failed to delete profile');
        }
      });
    }
  }

  cancelSubscription(subscriptionId: string) {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      this.http.post<Subscription>(`${this.base}/subscriptions/${subscriptionId}/cancel`, {}, { 
        withCredentials: true 
      }).subscribe({
        next: (updatedSubscription) => {
          this.subscriptions.update(subs => 
            subs.map(s => s.id === subscriptionId ? updatedSubscription : s)
          );
          this.success.set('Subscription cancelled successfully');
        },
        error: (error) => {
          this.error.set(this.getErrorMessage(error) || 'Failed to cancel subscription');
        }
      });
    }
  }

  // Utility methods
  private resetPasswordForm() {
    this.passwordChange = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    };
  }

  private resetProfileForm() {
    this.newProfile = {
      name: '',
      avatar: '',
      maturity_rating: ''
    };
  }

  private getErrorMessage(error: any): string {
    if (error.error?.detail) {
      if (typeof error.error.detail === 'string') {
        return error.error.detail;
      } else if (Array.isArray(error.error.detail)) {
        return error.error.detail.map((d: any) => d.msg).join(', ');
      }
    }
    return error.message || 'An error occurred';
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: string, currency: string = 'USD'): string {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return `$${amount}`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numericAmount);
  }

  clearMessages() {
    this.error.set(null);
    this.success.set(null);
  }

  getPlanName(planId: string): string {
    const plan = this.availablePlans().find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  }

  // Get user info for display
  getUserInfo() {
    return this.currentUser() || this.authService.user();
  }
}