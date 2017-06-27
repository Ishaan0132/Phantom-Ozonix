interface Command {
	(this: typeof MessageParser.globalContext, target: string, room: typeof Rooms.globalRoom | typeof Users.self, user: typeof Users.self, cmd?: string, time?: number): void;
}
