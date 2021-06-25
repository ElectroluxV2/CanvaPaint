import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PaintComponent } from './components/paint/paint.component';
import { SavedCanvasResolver } from './paint/saved-canvas.resolver';

const routes: Routes = [{
  path: '',
  component: DashboardComponent
}, {
  path: ':id',
  component: PaintComponent,
  resolve: {
    canvas: SavedCanvasResolver
  }
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
