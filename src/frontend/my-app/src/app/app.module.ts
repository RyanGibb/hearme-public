import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent, InputForm, OutputForm} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    InputForm,
    OutputForm
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent, InputForm, OutputForm]
})
export class AppModule { }
