import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {

  public boards = [];

  constructor(public router: Router) {
    for (let i = 0; i < 2; i++) {
      this.boards.push({
        title: 'Jestem zajebisty',
        src: 'https://placekitten.com/800/600',
        id: Math.random().toString(36).substring(7)
      });
    }
  }


   public settings(boardId: string): void {

   }
}
