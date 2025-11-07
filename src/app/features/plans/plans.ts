import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { PlansService } from '../../core/services/plans.service';
import { SubscriptionsService } from '../../core/services/subscriptions.service';
import { AuthService } from '../../core/auth.service';
import { AuthUiService } from '../../core/auth-ui.service';

import type { PlanList } from '../../models/plan.model';
import type { Subscription, SubscriptionListItem } from '../../models/subscription.model';

interface PlanQueryParams {
  q?: string;
  min_price?: number;
  max_price?: number;
  video_quality?: string;
  order_by?: 'price' | 'name' | 'created_at';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans.html'
})
export class PlansComponent implements OnInit {
  private plansService = inject(PlansService);
  private subsService = inject(SubscriptionsService);
  private authService = inject(AuthService);
  private authUi = inject(AuthUiService);
  private router = inject(Router);

  // Lists / filters
  plans = signal<PlanList[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  selectedQuality = signal<'all' | 'SD' | 'HD' | 'FHD' | 'UHD'>('all');
  sortBy = signal<'price' | 'name' | 'created_at'>('price');
  sortDir = signal<'asc' | 'desc'>('asc');

  // My subscription
  myCurrent = signal<Subscription | null>(null);
  mySubLoading = signal<boolean>(false);
  mySubError = signal<string | null>(null);

  // UI action state
  actionPlanId = signal<string | null>(null); // plan que está en proceso (spinner)

  private searchTimeout?: ReturnType<typeof setTimeout>;

  get user() {
    return this.authService.user();
  }

  // Helpers derivados
  readonly myCurrentPlanId = computed(() => this.myCurrent()?.plan_id ?? null);

  ngOnInit() {
    // Carga en paralelo
    this.loadMyCurrent();
    this.loadPlans();
  }

  // ---------- Loaders ----------
  async loadPlans() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const params: PlanQueryParams = {
        q: this.searchQuery().trim() || undefined,
        order_by: this.sortBy(),
        order_dir: this.sortDir(),
        limit: 50
      };

      if (this.selectedQuality() !== 'all') {
        params.video_quality = this.selectedQuality();
      }

      const resp = await firstValueFrom(this.plansService.listMe(params));
      this.plans.set(resp ?? []);
    } catch (err: unknown) {
      const msg =
        (err as any)?.error?.detail ??
        (err as any)?.message ??
        'Failed to load plans. Please try again.';
      this.error.set(String(msg));
    } finally {
      this.loading.set(false);
    }
  }

  async loadMyCurrent() {
    // Si no está logueado, no intentes
    if (!this.user) {
      this.myCurrent.set(null);
      return;
    }

    this.mySubLoading.set(true);
    this.mySubError.set(null);
    try {
      const sub = await firstValueFrom(this.subsService.getMyCurrent());
      this.myCurrent.set(sub ?? null);
    } catch (err: any) {
      // Si backend devuelve 404 cuando no hay suscripción actual, lo tratamos como "no hay"
      if (err?.status === 404) {
        this.myCurrent.set(null);
      } else {
        this.mySubError.set(
          err?.error?.detail ?? err?.message ?? 'Failed to load current subscription.'
        );
      }
    } finally {
      this.mySubLoading.set(false);
    }
  }

  // ---------- Filters ----------
  onSearchChange(query: string) {
    this.searchQuery.set(query);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadPlans(), 500);
  }

  onQualityChange(quality: string) {
    this.selectedQuality.set((quality as any) || 'all');
    this.loadPlans();
  }

  onSortChange(sortBy: string) {
    this.sortBy.set((sortBy as any) || 'price');
    this.loadPlans();
  }

  onSortDirChange(sortDir: string) {
    this.sortDir.set((sortDir as any) || 'asc');
    this.loadPlans();
  }

  // ---------- View helpers ----------
  getPlanPrice(plan: PlanList): string {
    const n = Number(plan.price);
    return Number.isFinite(n) ? `$${n.toFixed(2)}` : `$${plan.price}`;
  }

  getQualityBadgeClass(quality: string): string {
    const classes: Record<string, string> = {
      SD: 'bg-gray-500/20 text-gray-300 border-gray-500',
      HD: 'bg-blue-500/20 text-blue-300 border-blue-500',
      FHD: 'bg-purple-500/20 text-purple-300 border-purple-500',
      UHD: 'bg-orange-500/20 text-orange-300 border-orange-500'
    };
    return classes[quality] ?? 'bg-gray-500/20 text-gray-300 border-gray-500';
  }

  isCurrentPlan(plan: PlanList): boolean {
    return (this.myCurrentPlanId() ?? '') === plan.id;
  }

  getPlanFeatures(plan: PlanList): string[] {
    const features: Record<string, string[]> = {
      SD: ['Standard Definition', 'Basic streaming', 'Single device'],
      HD: ['High Definition', 'HD streaming', '2 devices simultaneously'],
      FHD: ['Full HD 1080p', 'Crystal clear streaming', '4 devices simultaneously', 'Offline downloads'],
      UHD: ['4K Ultra HD', 'Best quality streaming', '6 devices simultaneously', 'Offline downloads', 'Priority support']
    };
    return features[plan.video_quality] ?? features['SD'];
  }

  getPopularityBadge(plan: PlanList): string {
    const price = Number(plan.price);
    if (!Number.isFinite(price)) return '';
    if (price >= 15) return 'Most Popular';
    if (price >= 10) return 'Popular';
    return '';
  }

  // ---------- Subscribe / Switch ----------
  async handleSubscribe(plan: PlanList) {
    // Requiere login
    if (!this.user) {
      this.authUi.openLogin();
      return;
    }

    // Evita clics múltiples en el mismo plan
    if (this.actionPlanId() === plan.id) return;

    this.actionPlanId.set(plan.id);

    try {
      // Si ya está en este plan, no hacemos nada
      if (this.isCurrentPlan(plan)) {
        this.actionPlanId.set(null);
        return;
      }

      // ¿Tiene suscripción actual?
      const current = this.myCurrent();

      if (!current) {
        // Crear nueva suscripción: POST /me/subscriptions
        await firstValueFrom(this.subsService.createMy({ plan_id: plan.id }));
      } else {
        // Cambiar plan: POST /me/subscriptions/:id/switch-plan
        // Ajusta la clave si tu backend espera { plan_id } en vez de { new_plan_id }
        await firstValueFrom(
          this.subsService.switchMyPlan(current.id, { plan_id: plan.id } as any)
        );
      }

      // Refresca suscripción actual para reflejar UI
      await this.loadMyCurrent();

    } catch (err: any) {
      console.error('Subscription action failed', err);

      const message =
        err?.error?.detail ??
        err?.message ??
        'Subscription failed. Please try again.';

      this.error.set(message);
    } finally {
      this.actionPlanId.set(null);
    }
  }

  // Texto del botón por plan
  buttonLabel(plan: PlanList): string {
    if (this.isCurrentPlan(plan)) return 'Current Plan';
    if (this.actionPlanId() === plan.id) return 'Processing...';
    return this.myCurrent() ? 'Switch to this plan' : 'Subscribe Now';
  }

  // Deshabilitar botón
  buttonDisabled(plan: PlanList): boolean {
    return this.isCurrentPlan(plan) || this.actionPlanId() === plan.id || this.mySubLoading();
  }
}
