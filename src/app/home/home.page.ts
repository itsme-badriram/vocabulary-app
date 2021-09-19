import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  database = [];
  private _jsonURL = 'assets/database.json';
  constructor(private http: HttpClient, private storage: Storage) {
    this.getJSON().subscribe(data => {
     console.log(data);
     this.database = data;
    });
  }
  public getJSON(): Observable<any> {
    return this.http.get(this._jsonURL);
  }
  ionViewWillEnter() {
    this.storage.get('profile').then((val) => {
      let profileDb;
        for(let d of this.database) {
          if(val) {
            profileDb = val.filter((v) => v.dbLevel == d.level)[0];
            if(profileDb) {
              console.log(profileDb)
              let count = 0;
              for(let l of profileDb.levels) {

                  if(l.words.length == 0) {
                    count++;
                    console.log(l)
                  }
                else {

                }
              }
              d.completed = count;
            }
            else {
              d.completed = 0;
            }
        console.log(val);
          }
          else {
            d.completed = 0;
          }
        }
    });
  }
  ngOnInit() {
  }
  findWords(section: any) {
    let count = 0;
    for (let s of section) {
      count = count + s.words.length;
    }
    return count;

  }
}
