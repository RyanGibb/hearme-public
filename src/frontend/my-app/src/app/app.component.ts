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

// @Component({
//   selector: 'app-input-form',
//   template: `
//     <form onsubmit = sendMessage(Submit)>
//     Enter what you'd like to say in the phone call.<br>
//     <input type="text" name="UserInput"><br>
//     <input type="submit" value="Submit">
//     </form>`
// })
// export class InputForm {
//   sendMessage(message) {
//     let messageString = JSON.stringify(message);
//     console.log("Message string: " + messageString)
//     console.log("-> tx " + message);
//     ws.send(JSON.stringify(message));
//   }
// }

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

ws.onopen = function() {
  // Do nothing
}