interface Command {
	(this: typeof CommandParser.globalContext, target: string, room: typeof Rooms.globalRoom | typeof Users.self, user: typeof Users.self, cmd?: string, time?: number): void;
}
