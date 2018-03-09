type Context = typeof MessageParser.globalContext;
type Player = typeof Games.selfPlayer;
type Room = typeof Rooms.globalRoom;
type User = typeof Users.self;

interface AnyObject {[k: string]: any}

interface Command {
	(this: Context, target: string, room: Room | User, user: User, cmd: string, time: number): void;
}

class BaseGame {
	onSignups?(): void
	onStart?(): void
	onNextRound?(): void
	onEnd?(): void
	onChildEnd?(winners: Map<Player, number>): void
	onJoin?(player: Player, lateJoin?: boolean): void
	onLeave?(player: Player): void
	onRename?(player: Player): void
	setAnswers?(): void
	pointsPerAnswer?(answer: string): number
	filterGuess?(guess: string): boolean
	onGuess?(guess: string, player: Player): void
}