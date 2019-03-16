import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Hear Me';
}

@Component({
  selector: 'app-input-form',
  template: `
    <form>
    Enter what you'd like to say in the phone call.<br>
    <input type="text" name="UserInput"><br>`
})
export class InputForm {
}

@Component({
  selector: 'app-output-form',
  template: `
    <form>
    Caller's response:<br>
    <input type="text" name="CallerResponse"><br>`
})
export class OutputForm {
}

@Component({
  selector: 'app-click-me',
  template: `
    <button (click)="onClickMe()">Click me!</button>
    {{clickMessage}}`
})
export class ClickMeComponent {
  clickMessage = '';

  onClickMe() {
    this.clickMessage = 'You are my hero!';
  }
}


