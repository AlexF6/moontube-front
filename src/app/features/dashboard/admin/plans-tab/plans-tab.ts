import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PlansService } from '../../../../core/services/plans.service';
import {
  Plan, PlanList, PlanCreate, PlanUpdate, PlanSubscription, PlanQueryParams,
} from '../../../../models/plan.model';

@Component({
  selector: 'app-plans-tab',
  templateUrl: './plans-tab.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Query & forms
  query = signal<Required<PlanQueryParams>>({
    q: '',
    min_price: null,
    max_price: null,
    video_quality: null,
    order_by: 'created_at',
    order_dir: 'desc',
    limit: 50,
    offset: 0,
  });

  newPlan = signal<PlanCreate>({
    name: '',
    price: 9.99,
    max_profiles: 1,
    max_devices: 1,
    video_quality: 'HD',
  });

  editing = signal<Plan | null>(null);
  currentSubscriptions = signal<PlanSubscription[]>([]);
  currentPlanId = signal<string | null>(null);

  videoQualities = ['SD', 'HD', 'Full HD', '4K', '8K'];

  ngOnInit() {
    this.loadPlans();
  }

  async loadPlans() {
    try {
      this.isLoading.set(true);
      this.error.set(null);
      const res = await firstValueFrom(this.plansService.list(this.query()));
      this.items.set(res ?? []);
      this.total.set(res?.length ?? 0);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  // Immutable updates for query signal
  onQueryChange(patch: Partial<Required<PlanQueryParams>>) {
    this.query.update(q => ({ ...q, ...patch }));
  }

  applyFilters() {
    this.query.update(q => ({ ...q, offset: 0 }));
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
      offset: 0,
    });
    this.loadPlans();
  }

  async create() {
    try {
      this.error.set(null);
      const payload = this.newPlan();
      await firstValueFrom(this.plansService.create(payload));

      // reset form
      this.newPlan.set({
        name: '',
        price: 9.99,
        max_profiles: 1,
        max_devices: 1,
        video_quality: 'HD',
      });

      this.loadPlans();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openEdit(planId: string) {
    try {
      this.error.set(null);
      const plan = await firstValueFrom(this.plansService.get(planId));
      this.editing.set(plan ?? null);
      this.editOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async saveEdits() {
    const editingPlan = this.editing();
    if (!editingPlan?.id) return;
    try {
      this.error.set(null);
      const patch: PlanUpdate = {
        name: editingPlan.name,
        price: parseFloat(editingPlan.price),
        max_profiles: editingPlan.max_profiles,
        max_devices: editingPlan.max_devices,
        video_quality: editingPlan.video_quality,
      };
      await firstValueFrom(this.plansService.update(editingPlan.id, patch));
      this.editOpen.set(false);
      this.editing.set(null);
      this.loadPlans();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async remove(planId: string) {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    try {
      this.error.set(null);
      await firstValueFrom(this.plansService.delete(planId));
      this.loadPlans();
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  async openSubscriptions(planId: string) {
    try {
      this.error.set(null);
      const subs = await firstValueFrom(this.plansService.getPlanSubscriptions(planId));
      this.currentSubscriptions.set(subs ?? []);
      this.currentPlanId.set(planId);
      this.subscriptionsOpen.set(true);
    } catch (err) {
      this.error.set(this.getErrorMessage(err));
    }
  }

  // Utilities
  clearError() {
    this.error.set(null);
  }

  formatPrice(price: string): string {
    return `$${Number.parseFloat(price).toFixed(2)}`;
  }

  formatStatus(status: string): string {
    return status.charAt(0) + status.slice(1).toLowerCase();
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

  private getErrorMessage(error: any): string {
    if (error?.error?.detail) {
      if (Array.isArray(error.error.detail)) {
        return error.error.detail.map((d: any) => d.msg).join(', ');
      }
      return error.error.detail;
    }
    return error?.message || 'An unexpected error occurred';
  }
}
