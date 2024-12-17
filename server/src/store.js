export class Room {
  constructor(name) {
    this.id = name;
    this.users = [];
    this.wss_clients = {};
    this.states = {};
    this.seed = (Math.random()*2**32)>>>0;
    this.roomState = "waiting"; // waiting, playing, gameover, paused
  }
}

export const rooms = {};

export class wss_clients {
}