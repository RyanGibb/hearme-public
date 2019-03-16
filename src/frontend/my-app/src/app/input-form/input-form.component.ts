import { Component, OnInit } from '@angular/core';
import { ConnectionData } from '../connection_data'

let wsUrl = "ws://" + location.hostname + ":" + location.port;
let ws = new WebSocket(wsUrl);

@Component({
  selector: 'app-input-form',
  templateUrl: './input-form.component.html',
  styleUrls: ['./input-form.component.css']
})
export class InputFormComponent implements OnInit {

  model = new ConnectionData('call', '', '');
  submitted = false;


  onSubmit(messageString) {
    this.submitted = true;
    console.log("-> tx " + JSON.stringify(messageString));
    ws.send(JSON.stringify(messageString));
  }

  get diagnostic() { return JSON.stringify(this.model); }

  ngOnInit() {
  }

}
