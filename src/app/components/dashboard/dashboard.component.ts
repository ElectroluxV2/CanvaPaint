import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public boards = [];

  constructor() {
    for (let i = 0; i < 2; i++) {
      this.boards.push({
        title: 'Jestem zajebisty',
        src: 'https://placekitten.com/800/600'
      });
    }
  }


}
