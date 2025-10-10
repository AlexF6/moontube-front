import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { AuthUiService } from '../../core/auth-ui.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
})
export class Register {
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  form: FormGroup;
  loading = false;
  

  constructor(private fb: FormBuilder, public authUi: AuthUiService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      passwords: this.fb.group({
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', [Validators.required]],
      }, { validators: matchPasswords })
    });
  }

  ngAfterViewInit() {
    queueMicrotask(() => this.nameInput?.nativeElement?.focus());
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.authUi.closeRegister(); }

  get pwGroup() { return this.form.get('passwords') as FormGroup; }
  
  get passwordControl() {
      return this.pwGroup.get('password') as FormControl;
    }

  get confirmControl() {
    return this.pwGroup.get('confirm') as FormControl;
  }
  
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email } = this.form.value;
    const { password } = this.pwGroup.value;
    console.log('Register data:', { name, email, password });
    this.authUi.closeRegister();
  }
}
