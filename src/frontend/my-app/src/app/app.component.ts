import { Component, OnInit } from '@angular/core';
import { interval  } from 'rxjs';

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

export class OutputForm implements OnInit{
  // ws.onmessage () => function(m) {
  //   let messageString = m.data;
  //   console.log("<- rx " + messageString);
  //   let message = JSON.parse(messageString);1
  //   handleMessage(message);
  // }
  ngOnInit() {
    console.log("Running")
    // const subscription = interval(1000);
    // subscription.subscribe(() => {
      ws.onmessage = function(m) {
        console.log("recvv");
        let messageString = m.data;
        console.log("<- rx " + messageString);
        let message = JSON.parse(messageString);
      // handleMessage(message);});
      } 
    // });
  }
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