import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Storage } from '@ionic/storage';
@Component({
  selector: 'app-questions',
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.scss'],
})
export class QuestionsPage implements OnInit {
  completed = false;
  showQuestion = true;
  showAnswer = false;
  messages = [
    {
      id: 'NEW',
      msg: 'New Word',
      subMsg: 'Choose the best definition',
    },
    {
      id: 'INCORRECT',
      msg: 'Learning',
      subMsg: "You didn't know this definition last time",
    },
    {
      id: 'REVIEW',
      msg: 'Reviewing',
      subMsg: 'Get this word correct one more time',
    },
  ];
  private _jsonURL = 'assets/database.json';
  database = [];
  dbLevel: number;
  level: number;
  review = [];
  incorrect = [];
  correct = [];
  words = [];
  currentQuestion: any = {
    id: 0,
    word: '',
    synonyms: [],
    antonyms: [],
    options: [],
    msg: '',
    subMsg: '',
    answer: '',
  };
  currentAnswer: any = {
    msg: '',
    subMsg: '',
  };
  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    private storage: Storage
  ) {}
  public getJSON(): Observable<any> {
    return this.http.get(this._jsonURL);
  }
  getFillUps(word, rands) {
    let string = '';
    for (let i = 0; i < word.length; i++) {
      if (rands.filter((r) => r === i)[0] != undefined) {
        string += word[i];
      } else {
        string += '_';
      }

      if (i != word.length - 1) {
        string += ' ';
      }
    }
    return string;
  }
  filterWordBlanks(word) {
    let rands = [];
    for (let i = 0; i < word.length; i += 3) {
      rands.push(this.randomNumber(i, i + 3));
    }
    if (word.length % 3 != 0) {
      let mod = word.length % 3;
      let n = word.length,
        i = 0;
      while (mod >= 0) {
        rands.push(n--);
        mod = mod - 1;
      }
    }
    console.log(rands);
    return this.getFillUps(word, rands);
  }
  shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  getOption(words) {
    let r = this.randomNumber(0, words.length);
    let meanings = words[r].synonyms;
    r = this.randomNumber(0, meanings.length);
    return meanings[r];
  }
  onBack() {}
  pickOptions(answer: string) {
    const dbLevel = this.database.filter((d: any) => d.level == this.dbLevel)[0]
      .section;
    let levels = [];
    for (let i = 0; i < dbLevel.length; i++) {
      if (i + 1 == this.level) {
        continue;
      }
      levels.push(dbLevel[i]);
    }

    levels = this.shuffle(levels);
    levels.pop();
    levels.pop();
    let options = [];
    for (let l of levels) {
      let option = this.getOption(l.words);
      options.push(option);
    }
    options.push(answer);
    return this.shuffle(options);
  }
  pickQuestion() {
    console.log(this.words);
    let word;
    this.words = this.shuffle(this.words);
    word = this.words[0];
    let message = this.messages.filter((m) => m.id == word.status)[0];
    this.currentQuestion.id = word.status;
    this.currentQuestion.word = word.word;
    this.currentQuestion.synonyms = [...word.synonyms];
    this.currentQuestion.antonyms = [...word.antonyms];
    this.currentQuestion.msg = message.msg;
    this.currentQuestion.subMsg = message.subMsg;
    this.currentQuestion.answer = [...this.shuffle(word.synonyms)].pop();
    this.currentQuestion.options = this.pickOptions(
      this.currentQuestion.answer
    );
    this.currentQuestion.display = this.filterWordBlanks(word.word);
    this.currentQuestion.result = '';

    console.log(this.currentQuestion);
  }
  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const dblevel = +params['dblevel'];
      const level = +params['level'];

      this.dbLevel = dblevel;
      this.level = level;

      this.getJSON().subscribe((data) => {
        this.database = data;
        data = data
          .filter((d: any) => d.level == this.dbLevel)[0]
          .section.filter((s: any) => s.level == this.level)[0];
        for (let w of data.words) {
          const word = {
            word: w.word,
            synonyms: w.synonyms,
            antonyms: w.antonyms,
            status: 'NEW',
          };
          this.words.push(word);
        }
        this.storage.get('profile').then((val) => {
          let profileDb;
          console.log(val);
          if (!val) {
            this.pickQuestion();
            return;
          }
          profileDb = val.filter((v) => v.dbLevel == this.dbLevel)[0];
          if (profileDb) {
            let profileLevel = profileDb.levels.filter(
              (p) => p.level == this.level
            )[0];
            if (profileLevel) {
              if (profileLevel.words.length != 0) {
                this.words = profileLevel.words;
                console.log(this.words);
              }
            }
            this.pickQuestion();
          } else {
            this.pickQuestion();
          }
        });
      });
    });
  }
  updateProfile() {
    this.storage.get('profile').then((val) => {
      if (!val) {
        console.log('Destroyed');
        let profile = {
          dbLevel: this.dbLevel,
          levels: [],
        };
        let l = {
          level: this.level,
          words: this.words,
        };
        profile.levels.push(l);
        let profiles = [];
        profiles.push(profile);
        this.storage.set('profile', profiles);
        return;
      }
      let profileDb = val.filter((v) => v.dbLevel == this.dbLevel)[0];
      if (!profileDb) {
        let profile = {
          dbLevel: this.dbLevel,
          levels: [],
        };
        let l = {
          level: this.level,
          words: this.words,
        };
        profile.levels.push(l);
        val.push(profile);
        this.storage.set('profile', val);
      } else {
        let l = {
          level: this.level,
          words: this.words,
        };
        let profileLevel = profileDb.levels.filter(
          (p) => p.level == this.level
        )[0];
        if (profileLevel) {
          profileLevel.words = this.words;
        } else {
          profileDb.levels.push(l);
        }
        this.storage.set('profile', val);
      }
    });
  }
  onCheckFillups(answer: string) {
    const word = this.words.filter(
      (w) => w.word === this.currentQuestion.word
    )[0];
    if (answer == this.currentQuestion.word) {
      let subMsg = "You won't see this word for a while.";
      if (word.status == 'INCORRECT') {
        subMsg = 'You will see this word one more time';
      }
      if (word.status == 'NEW' || word.status == 'INCORRECT') {
        word.status = 'REVIEW';
      } else if (word.status == 'REVIEW') {
        this.words = this.words.filter((w) => w.word != word.word);
      }

      this.currentAnswer.msg = 'Correct!';
      this.currentAnswer.subMsg = subMsg;
      this.review.push(this.currentQuestion);
    } else if (answer == 'Not Sure') {
      this.currentAnswer.msg = 'Not Sure';
      this.currentAnswer.subMsg = 'Try to remember the definition below.';
      word.status = 'INCORRECT';
    } else {
      this.currentAnswer.msg = 'Incorrect';
      this.currentAnswer.subMsg = 'You will see this word again soon.';
      word.status = 'INCORRECT';
    }
    this.showQuestion = false;
    this.showAnswer = true;
  }
  onCheckAnswer(answer: string) {
    const word = this.words.filter(
      (w) => w.word === this.currentQuestion.word
    )[0];
    if (answer == this.currentQuestion.answer) {
      let subMsg = "You won't see this word for a while.";
      if (word.status == 'INCORRECT') {
        subMsg = 'You will see this word one more time';
      }
      if (word.status == 'NEW' || word.status == 'INCORRECT') {
        word.status = 'REVIEW';
      } else if (word.status == 'REVIEW') {
        this.words = this.words.filter((w) => w.word != word.word);
      }

      this.currentAnswer.msg = 'Correct!';
      this.currentAnswer.subMsg = subMsg;
      this.review.push(this.currentQuestion);
    } else if (answer == 'Not Sure') {
      this.currentAnswer.msg = 'Not Sure';
      this.currentAnswer.subMsg = 'Try to remember the definition below.';
      word.status = 'INCORRECT';
    } else {
      this.currentAnswer.msg = 'Incorrect';
      this.currentAnswer.subMsg = 'You will see this word again soon.';
      word.status = 'INCORRECT';
    }
    this.showQuestion = false;
    this.showAnswer = true;
  }
  onNext() {
    this.updateProfile();
    this.showQuestion = true;
    this.showAnswer = false;
    if (this.words.length == 0) {
      this.showQuestion = false;
      this.showAnswer = false;
      this.completed = true;
      return;
    }
    this.pickQuestion();
  }
}
