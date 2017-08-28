declare namespace NodeJS {
	interface Global {
		Client: any
		Commands: any
		Config: any
		Games: any
		MessageParser: any
		Plugins: Array<any> | undefined
		Rooms: any
		Storage: any
		Tools: any
		Tournaments: any
		Users: any
    }
}
