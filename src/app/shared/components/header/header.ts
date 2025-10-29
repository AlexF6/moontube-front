// src/app/shared/components/header/header.ts
import { Component, OnDestroy } from '@angular/core';
import { UiStateService } from "../../../core/ui-state.service";
import { AuthUiService } from "../../../core/auth-ui.service";
import { AuthService } from '../../../core/auth.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ["./header.scss"]
})
export class Header implements OnDestroy {
  query = '';
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    public ui: UiStateService, 
    public authUi: AuthUiService, 
    public auth: AuthService, 
    private router: Router
  ) {
    // Setup real-time search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.updateUrl(query);
    });
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this.searchSubject.next(value);
  }

  onSearch() {
    // Immediate search when pressing enter
    this.searchSubject.next(this.query);
    this.ui.close();
  }

  private updateUrl(query: string) {
    const q = query.trim();
    if (q) {
      this.router.navigate(['/search'], { 
        queryParams: { q },
        replaceUrl: true 
      });
    } else {
      // Clear search when input is empty
      this.router.navigate(['/search']);
    }
  }

  clearSearch() {
    this.query = '';
    this.updateUrl('');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
