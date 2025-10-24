// src/app/features/dashboard/admin/plans-tab/plans-tab.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlansService } from '../../../../core/services/plans.service';
import { Plan, PlanList, PlanCreate, PlanUpdate, PlanSubscription } from '../../../../models/plan.model';

interface PlanQueryParams {
  q: string;
  min_price: number | null;
  max_price: number | null;
  video_quality: string | null;
  order_by: 'created_at' | 'name' | 'price';
  order_dir: 'asc' | 'desc';
  limit: number;
  offset: number;
}

@Component({
  selector: 'app-plans-tab',
  templateUrl: './plans-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PlansTabComponent implements OnInit {
  private plansService = inject(PlansService);

  // State signals
  error = signal<string | null>(null);
  items = signal<PlanList[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  editOpen = signal<boolean>(false);
  subscriptionsOpen = signal<boolean>(false);
  
  // Query and form signals
  query = signal<PlanQueryParams>({
    q: '',
    min_price: null,
    max_price: null,
    video_quality: null,
    order_by: 'created_at',
    order_dir: 'desc',
    limit: 50,
    offset: 0
  });

  newPlan = signal<PlanCreate>({
    name: '',
    price: 9.99,
    max_profiles: 1,
    max_devices: 1,
    video_quality: 'HD'
  });

  editing = signal<Plan | null>(null);
  currentSubscriptions = signal<PlanSubscription[]>([]);
  currentPlanId = signal<string | null>(null);

  // Common video quality options
  videoQualities = ['SD', 'HD', 'Full HD', '4K', '8K'];

  ngOnInit() {
    this.loadPlans();
  }

  async loadPlans() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      const response = await this.plansService.getPlans(this.query()).toPromise();
      this.items.set(response || []);
      this.total.set(response?.length || 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  async create() {
    try {
      this.error.set(null);
      await this.plansService.createPlan(this.newPlan()).toPromise();
      
      // Reset form
      this.newPlan.set({
        name: '',
        price: 9.99,
        max_profiles: 1,
        max_devices: 1,
        video_quality: 'HD'
      });
      
      this.loadPlans();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(planId: string) {
    try {
      this.error.set(null);
      const plan = await this.plansService.getPlan(planId).toPromise();
      this.editing.set(plan || null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    try {
      this.error.set(null);
      const editingPlan = this.editing();
      
      if (!editingPlan?.id) return;

      const updateData: PlanUpdate = {
        name: editingPlan.name,
        price: parseFloat(editingPlan.price), // Convert string price back to number
        max_profiles: editingPlan.max_profiles,
        max_devices: editingPlan.max_devices,
        video_quality: editingPlan.video_quality
      };

      await this.plansService.updatePlan(editingPlan.id, updateData).toPromise();
      
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadPlans();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(planId: string) {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      this.error.set(null);
      await this.plansService.deletePlan(planId).toPromise();
      this.loadPlans();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openSubscriptions(planId: string) {
    try {
      this.error.set(null);
      const subscriptions = await this.plansService.getPlanSubscriptions(planId).toPromise();
      this.currentSubscriptions.set(subscriptions || []);
      this.currentPlanId.set(planId);
      this.subscriptionsOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  // Filter methods
  applyFilters() {
    this.query().offset = 0;
    this.loadPlans();
  }

  resetFilters() {
    this.query.set({
      q: '',
      min_price: null,
      max_price: null,
      video_quality: null,
      order_by: 'created_at',
      order_dir: 'desc',
      limit: 50,
      offset: 0
    });
    this.loadPlans();
  }

  // Utility methods
  clearError() {
    this.error.set(null);
  }

  formatPrice(price: string): string {
    return `$${parseFloat(price).toFixed(2)}`;
  }

  formatStatus(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.detail) {
      if (Array.isArray(error.error.detail)) {
        return error.error.detail.map((d: any) => d.msg).join(', ');
      }
      return error.error.detail;
    }
    return error?.message || 'An unexpected error occurred';
  }

  getStatusClass(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'status-active';
    case 'INACTIVE': return 'status-inactive';
    case 'CANCELED': return 'status-canceled';
    case 'EXPIRED': return 'status-expired';
    default: return 'status-inactive';
  }
}
}