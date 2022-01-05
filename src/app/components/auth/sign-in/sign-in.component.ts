import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';


interface LoginFormData {
  email: string;
  password: string;
}


@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})


export class SignInComponent implements OnInit {

  params: any;

  form: FormGroup;

  signInFormData: LoginFormData = {
    email: '',
    password: '',
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group(
      {
        email: ['', [
          Validators.required,
          Validators.email
        ]],
        password: ['', [
          Validators.required,
          Validators.minLength(4),
          Validators.minLength(15)
        ]],
      },
    );
  }


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.params = params;
    });
  }

  get f() {
    return this.form.controls;
  }

  signIn() {
    // console.log(this.signInFormData);
    this.authService.signIn(this.signInFormData).subscribe(
      (data: any) => {
        if (data.message != null && data.message != '') {
          console.log(data.message);
        }
        alert('successfully signed in');
        console.log(this.params)
        // this.router.navigateByUrl(this.params.params)
        this.router.navigate([`${this.params.params}`]);
      },
      err => {
        console.log(err.error);
        alert('failed to sign In');
      }
    )
  }

}

