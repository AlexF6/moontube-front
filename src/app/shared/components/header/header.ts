import { Component } from '@angular/core';
import { UiStateService } from "../../../core/ui-state.service";
@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: "./header.scss"
})
export class Header {
  constructor(public ui: UiStateService) {}
}