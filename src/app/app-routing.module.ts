import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PaintComponent } from './components/paint/paint.component';

const routes: Routes = [{
  path: '',
  component: DashboardComponent
}, {
  path: '**',
  component: PaintComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
