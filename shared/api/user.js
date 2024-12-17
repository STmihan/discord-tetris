export const USER_STATES = {
    SPECTATOR: "spectator",
    PLAYER: "player",
}

export class User {
    constructor(name) {
        this.id = name;
        this.userState = USER_STATES.SPECTATOR
    }
}
