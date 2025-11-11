import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-shell.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserShell {}
