import { Injectable } from '@angular/core'
import { webSocket } from 'rxjs/webSocket'
import { environment } from '../environments/environment'
import { HttpClient } from '@angular/common/http'

export interface Message {
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

  constructor(private http: HttpClient) {
    this.ws.subscribe(
      (message: Message) => this.handleMessage(message),
      err => console.log(err),
      () => console.log('complete')
    )
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

  private handleMessage(message: Message): void {
    let { message: msg } = message
    switch (message.type) {
      case 'users':
        console.log(msg)
        this.users = msg
        break

      default:
        break
    }
  }
}
