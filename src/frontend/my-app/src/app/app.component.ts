import { Component } from '@angular/core';
let wsUrl = "ws://" + location.hostname + ":" + location.port;
let ws = new WebSocket(wsUrl);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Hear Me';
}

@Component({
  selector: 'app-output-form',
  template: `
  <label for="OutputArea">Caller Response</label>
  <textarea class="form-control" id="OutputArea" rows="6"></textarea>`
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

ws.onopen = function() {
  // Do nothing
}