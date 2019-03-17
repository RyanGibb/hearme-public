import { Component, OnInit } from '@angular/core';
import { ConnectionData } from '../connection_data'

let wsUrl = "ws://" + location.hostname + ":" + location.port;
let wss = new WebSocket(wsUrl);

@Component({
  selector: 'app-input-form',
  templateUrl: './input-form.component.html',
  styleUrls: ['./input-form.component.css']
})
export class InputFormComponent implements OnInit {

  model = new ConnectionData('call', '', '');
  submitted = false;
  enabled = 'true';


  onSubmit(messageString) {
    if (!this.submitted) {
      this.submitted = true;
      console.log("-> tx " + JSON.stringify(messageString));
      wss.send(JSON.stringify(messageString));
    } else {
      console.log("-> tx " + JSON.stringify(messageString));
      wss.send(JSON.stringify(messageString));
    }
  }

  isValid() {
    if(this.submitted) {
        this.enabled = 'disabled'
    } else {
        this.enabled = 'enabled'
    }
  }

  get diagnostic() { return JSON.stringify(this.model); }

  ngOnInit() {
  }

}
