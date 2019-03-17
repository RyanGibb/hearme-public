export class ConnectionData {
    constructor (
        public request : string,
        public number : string,
        public message: string
    ) { }

    /**
     * clear_message
     */
    public clear_message() {
        this.message = ""
    }

    public conversation() {
        
    }
}