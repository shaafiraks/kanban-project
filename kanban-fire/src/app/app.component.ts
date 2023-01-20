import { Component } from '@angular/core';
import { Task } from './task/task';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { TaskDialogComponent } from './task-dialog/task-dialog.component';
import { TaskDialogResult } from './task-dialog/task-dialog.component';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs/internal/Observable';
// import { async } from 'rxjs';
// import { async } from '@angular/core/testing';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'kanban-fire';

  todo = this.store
    .collection('todo')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  inProgress = this.store
    .collection('inProgress')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;
  done = this.store
    .collection('done')
    .valueChanges({ idField: 'id' }) as Observable<Task[]>;

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        if (result.delete) {
          this.store.collection(list).doc(task.id).delete();
        } else {
          this.store.collection(list).doc(task.id).update(task);
        }
      });
  }
  drop(event: CdkDragDrop<Task[]> | any): void {
    if (event.previousContainer === event.container) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    this.store.firestore.runTransaction(() => {
      const promise = Promise.all([
        this.store.collection(event.previousContainer.id).doc(item.id).delete(),
        this.store.collection(event.container.id).add(item),
      ]);
      return promise;
    });
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
  constructor(private dialog: MatDialog, private store: AngularFirestore) {}

  newTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        this.store.collection('todo').add(result.task);
      });
  }
}
