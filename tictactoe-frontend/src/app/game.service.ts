import { Injectable } from '@angular/core'
import { webSocket } from 'rxjs/webSocket'
import { environment } from '../environments/environment'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'

interface Message {
  type: string
  message?: any
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  public ws = webSocket({
    url: environment.wsUrl,
    protocol: environment.wsProtocol
  })
  public userName: string
  public users: string[] = []
  public games: Array<any> = []
  public challenges: string[] = []
  public challengers: string[] = []
  public board: Array<string | number>
  public status: string = ''
  public player: string
  public locked: boolean = false

  constructor(private http: HttpClient, private router: Router) {
    this.ws.subscribe(
      (message: Message) => this.handleMessage(message),
      err => console.log(err),
      () => console.log('complete')
    )
  }

  private handleMessage(message: Message): void {
    let { message: msg } = message
    switch (message.type) {
      case 'users':
        this.users = msg
        break
      case 'games':
        this.updateChallenges(msg)
        this.games = msg
        break
      case 'challenge':
        this.challengers.push(msg)
        break
      case 'cancelChallenge':
        this.challengers = this.challengers.filter(user => user !== msg)
        break
      case 'declineChallenge':
        this.challenges = this.challenges.filter(user => user !== msg)
        break
      case 'acceptChallenge':
        this.startGame('X')
        break
      case 'leaveGame':
        this.status = 'Your opponent has left the game!'
        break
      case 'turn':
        this.board = msg.board
        if (msg.winner) {
          if (msg.winner == this.player) {
            this.status = 'You won!'
          } else if (msg.winner == 'Tie') {
            this.status = 'Tie!'
          } else {
            this.status = 'You lost!'
          }
        } else {
          this.locked = msg.next !== this.player
        }
        break
      default:
        break
    }
  }

  public login(name: string): Promise<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(environment.apiUrl + '/login', { name })
      .toPromise()
  }

  public enterLobby(name: string): void {
    this.userName = name
    this.ws.next({ type: 'enterLobby', name })
  }

  public leaveLobby() {
    this.ws.next({ type: 'leaveLobby' })
  }

  public challenge(user: string) {
    if (this.challenges.indexOf(user) > -1) return
    this.ws.next({ type: 'challenge', from: this.userName, to: user })
    this.challenges.push(user)
  }

  public cancelChallenge(user: string) {
    this.challenges = this.challenges.filter(challenge => challenge !== user)
    this.ws.next({ type: 'cancelChallenge', from: this.userName, to: user })
  }

  public declineChallenge(user: string) {
    this.challengers = this.challengers.filter(
      challenger => challenger !== user
    )
    this.ws.next({ type: 'declineChallenge', from: this.userName, to: user })
  }

  public acceptChallenge(user: string) {
    this.ws.next({ type: 'acceptChallenge', from: this.userName, to: user })
    this.startGame('O')
  }

  public updateChallenges(games): void {
    for (let game of games) {
      this.challenges = this.challenges.filter(
        item => item !== game.O && item !== game.X
      )
      this.challengers = this.challengers.filter(
        item => item !== game.O && item !== game.X
      )
    }
  }

  private startGame(player: string): void {
    this.challengers = []
    this.challenges = []
    this.board = Array.from(Array(9).keys())
    this.player = player
    this.status = ''
    this.locked = false
    this.router.navigateByUrl('/board')
  }

  public leaveGame(): void {
    this.ws.next({ type: 'leaveGame', name: this.userName })
  }

  public getCell(index: number): string | number {
    return typeof this.board[index] === 'number' ? '' : this.board[index]
  }

  public turnClick(e) {
    if (this.locked) return
    let { id } = e.target
    if (typeof this.board[id] == 'number') {
      this.board[id] = this.player
      this.locked = true
      this.ws.next({ type: 'turn', player: this.player, board: this.board })
    }
  }
}
