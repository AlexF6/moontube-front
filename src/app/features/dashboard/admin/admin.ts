import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth.service';
import { environment } from '../../../enviroments/enviroment';

type User = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type Content = {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES';
  description: string;
  release_year: number;
  duration_minutes: number;
  age_rating: string;
  genres: string;
  created_at: string;
  updated_at: string;
};

type Plan = {
  id: string;
  name: string;
  price: string;
  max_profiles: number;
  max_devices: number;
  video_quality: string;
  created_at: string;
  updated_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  start_date: string;
  end_date: string;
  renews_at: string;
  canceled_at: string | null;
  user?: User;
  plan?: Plan;
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
};

type Profile = {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  maturity_rating: string | null;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin.html'
})
export class Admin implements OnInit {
  private base = environment.apiUrl;
  
  // State signals
  activeTab = signal<'users' | 'content' | 'plans' | 'subscriptions' | 'payments' | 'profiles'>('users');
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Data signals
  users = signal<User[]>([]);
  content = signal<Content[]>([]);
  plans = signal<Plan[]>([]);
  subscriptions = signal<Subscription[]>([]);
  payments = signal<Payment[]>([]);
  profiles = signal<Profile[]>([]);
  
  // Computed values
  totalUsers = computed(() => this.users().length);
  totalContent = computed(() => this.content().length);
  totalPlans = computed(() => this.plans().length);
  activeSubscriptions = computed(() => 
    this.subscriptions().filter(sub => sub.status === 'ACTIVE').length
  );

  // Form models
  newUser = {
    name: '',
    email: '',
    password: '',
    is_admin: false,
    active: true
  };

  newContent = {
    title: '',
    type: 'MOVIE' as 'MOVIE' | 'SERIES',
    description: '',
    release_year: new Date().getFullYear(),
    duration_minutes: 0,
    age_rating: 'PG',
    genres: ''
  };

  newPlan = {
    name: '',
    price: 0,
    max_profiles: 1,
    max_devices: 1,
    video_quality: 'HD'
  };

  newProfile = {
    user_id: '',
    name: '',
    avatar: '',
    maturity_rating: ''
  };

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  setTab(tab: 'users' | 'content' | 'plans' | 'subscriptions' | 'payments' | 'profiles') {
    this.activeTab.set(tab);
    this.error.set(null);
    
    switch(tab) {
      case 'users':
        this.loadUsers();
        break;
      case 'content':
        this.loadContent();
        break;
      case 'plans':
        this.loadPlans();
        break;
      case 'subscriptions':
        this.loadSubscriptions();
        break;
      case 'payments':
        this.loadPayments();
        break;
      case 'profiles':
        this.loadProfiles();
        break;
    }
  }

  loadUsers() {
    this.isLoading.set(true);
    this.http.get<User[]>(`${this.base}/users`, { 
      withCredentials: true 
    }).subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load users');
        this.isLoading.set(false);
      }
    });
  }

  createUser() {
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password) {
      this.error.set('Please fill all required fields');
      return;
    }

    this.isLoading.set(true);
    this.http.post<User>(`${this.base}/users`, this.newUser, { 
      withCredentials: true 
    }).subscribe({
      next: (user) => {
        this.users.update(users => [...users, user]);
        this.resetUserForm();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.detail || 'Failed to create user');
        this.isLoading.set(false);
      }
    });
  }

  toggleUserActive(user: User) {
    this.http.put<User>(`${this.base}/users/${user.id}`, 
      { active: !user.active }, 
      { withCredentials: true }
    ).subscribe({
      next: (updatedUser) => {
        this.users.update(users => 
          users.map(u => u.id === updatedUser.id ? updatedUser : u)
        );
      },
      error: (error) => {
        this.error.set('Failed to update user');
      }
    });
  }

  deleteUser(userId: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`${this.base}/users/${userId}`, { 
        withCredentials: true 
      }).subscribe({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== userId));
        },
        error: (error) => {
          this.error.set('Failed to delete user');
        }
      });
    }
  }

  // Content management
  loadContent() {
    this.isLoading.set(true);
    this.http.get<Content[]>(`${this.base}/contents`, { 
      withCredentials: true 
    }).subscribe({
      next: (content) => {
        this.content.set(content);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load content');
        this.isLoading.set(false);
      }
    });
  }

  createContent() {
    if (!this.newContent.title) {
      this.error.set('Title is required');
      return;
    }

    this.isLoading.set(true);
    this.http.post<Content>(`${this.base}/contents`, this.newContent, { 
      withCredentials: true 
    }).subscribe({
      next: (content) => {
        this.content.update(contentList => [...contentList, content]);
        this.resetContentForm();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.detail || 'Failed to create content');
        this.isLoading.set(false);
      }
    });
  }

  deleteContent(contentId: string) {
    if (confirm('Are you sure you want to delete this content?')) {
      this.http.delete(`${this.base}/contents/${contentId}`, { 
        withCredentials: true 
      }).subscribe({
        next: () => {
          this.content.update(content => 
            content.filter(c => c.id !== contentId)
          );
        },
        error: (error) => {
          this.error.set('Failed to delete content');
        }
      });
    }
  }

  // Plan management
  loadPlans() {
    this.isLoading.set(true);
    this.http.get<Plan[]>(`${this.base}/plans`, { 
      withCredentials: true 
    }).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load plans');
        this.isLoading.set(false);
      }
    });
  }

  createPlan() {
    if (!this.newPlan.name || this.newPlan.price <= 0) {
      this.error.set('Plan name and price are required');
      return;
    }

    this.isLoading.set(true);
    this.http.post<Plan>(`${this.base}/plans`, this.newPlan, { 
      withCredentials: true 
    }).subscribe({
      next: (plan) => {
        this.plans.update(plans => [...plans, plan]);
        this.resetPlanForm();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.detail || 'Failed to create plan');
        this.isLoading.set(false);
      }
    });
  }

  deletePlan(planId: string) {
    if (confirm('Are you sure you want to delete this plan?')) {
      this.http.delete(`${this.base}/plans/${planId}`, { 
        withCredentials: true 
      }).subscribe({
        next: () => {
          this.plans.update(plans => plans.filter(p => p.id !== planId));
        },
        error: (error) => {
          this.error.set('Failed to delete plan');
        }
      });
    }
  }

  // Subscription management
  loadSubscriptions() {
    this.isLoading.set(true);
    this.http.get<Subscription[]>(`${this.base}/subscriptions`, { 
      withCredentials: true 
    }).subscribe({
      next: (subscriptions) => {
        this.subscriptions.set(subscriptions);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load subscriptions');
        this.isLoading.set(false);
      }
    });
  }

  cancelSubscription(subscriptionId: string) {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      this.http.post<Subscription>(`${this.base}/subscriptions/${subscriptionId}/cancel`, {}, { 
        withCredentials: true 
      }).subscribe({
        next: (updatedSubscription) => {
          this.subscriptions.update(subs => 
            subs.map(s => s.id === updatedSubscription.id ? updatedSubscription : s)
          );
        },
        error: (error) => {
          this.error.set('Failed to cancel subscription');
        }
      });
    }
  }

  // Payment management
  loadPayments() {
    this.isLoading.set(true);
    this.http.get<Payment[]>(`${this.base}/payments`, { 
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

  // Profile management
  loadProfiles() {
    this.isLoading.set(true);
    this.http.get<Profile[]>(`${this.base}/profiles`, { 
      withCredentials: true 
    }).subscribe({
      next: (profiles) => {
        this.profiles.set(profiles);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load profiles');
        this.isLoading.set(false);
      }
    });
  }

  createProfile() {
    if (!this.newProfile.user_id || !this.newProfile.name) {
      this.error.set('User ID and name are required');
      return;
    }

    this.isLoading.set(true);
    this.http.post<Profile>(`${this.base}/profiles`, this.newProfile, { 
      withCredentials: true 
    }).subscribe({
      next: (profile) => {
        this.profiles.update(profiles => [...profiles, profile]);
        this.resetProfileForm();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.error?.detail || 'Failed to create profile');
        this.isLoading.set(false);
      }
    });
  }

  deleteProfile(profileId: string) {
    if (confirm('Are you sure you want to delete this profile?')) {
      this.http.delete(`${this.base}/profiles/${profileId}`, { 
        withCredentials: true 
      }).subscribe({
        next: () => {
          this.profiles.update(profiles => profiles.filter(p => p.id !== profileId));
        },
        error: (error) => {
          this.error.set('Failed to delete profile');
        }
      });
    }
  }

  private resetUserForm() {
    this.newUser = {
      name: '',
      email: '',
      password: '',
      is_admin: false,
      active: true
    };
  }

  private resetContentForm() {
    this.newContent = {
      title: '',
      type: 'MOVIE',
      description: '',
      release_year: new Date().getFullYear(),
      duration_minutes: 0,
      age_rating: 'PG',
      genres: ''
    };
  }

  private resetPlanForm() {
    this.newPlan = {
      name: '',
      price: 0,
      max_profiles: 1,
      max_devices: 1,
      video_quality: 'HD'
    };
  }

  private resetProfileForm() {
    this.newProfile = {
      user_id: '',
      name: '',
      avatar: '',
      maturity_rating: ''
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatCurrency(amount: string, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount));
  }

  clearError() {
    this.error.set(null);
  }
}