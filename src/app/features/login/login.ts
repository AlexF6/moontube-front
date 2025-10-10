import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})

export class Login {
  form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Login data:', this.form.value);
    }
  }

  cancel() {
    this.form.reset();
  }
}
