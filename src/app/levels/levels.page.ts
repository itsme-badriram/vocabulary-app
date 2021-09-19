import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage';
@Component({
  selector: 'app-levels',
  templateUrl: './levels.page.html',
  styleUrls: ['./levels.page.scss'],
})
export class LevelsPage implements OnInit {
  database;
  profile;
  private _jsonURL = 'assets/database.json';
  constructor(private activatedRoute: ActivatedRoute,private http: HttpClient, private storage: Storage) {
  }
  public getJSON(): Observable<any> {
    return this.http.get(this._jsonURL);
  }
  getProgressBar(x: number, y: number) {
    if(y == 0) {
      return 0;
    }
    return x/y;

  }
  getButtonState(x: number, y:number) {
    if (x == 0) {
      return "Play"
    }
    if (x == y) {
      return "Replay"
    }
    if (x > 0) {
      return "Continue"
    }
  }
  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const level = +params['dblevel'];
      let profileDb;
      this.storage.get('profile').then((val) => {
        if(val) {
          profileDb = val.filter((v) => v.dbLevel == level)[0];
          this.profile = val;
          console.log(val);
        }

        this.getJSON().subscribe(data => {
          data = data.filter((d: any) => d.level == level)[0]
          for (let d of data.section) {
            if(profileDb) {
            let level = profileDb.levels.filter((p) => p.level == d.level)[0];
            if(level) {
              d.completed = level.words.length;
            }
            else {
              d.completed = d.words.length;
            }
            }
            else {
              d.completed = d.words.length;
            }
          }
          this.database = data;

          console.log(data);
         });
      })


    })

  }

}
