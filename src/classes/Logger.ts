interface MessageOptions {
    important?: boolean;
    tone?: "good" | "bad" | "neutral"
}

/**
 * Singleton to handle messages to the player
 */
export default class Logger {
    private static instance: Logger;

    // ul element to hold all messages
    messageBox:HTMLUListElement;

    private constructor() {
        this.messageBox = document.getElementById("messages") as HTMLUListElement;
        while(this.messageBox.lastChild) {
            this.messageBox.removeChild(this.messageBox.lastChild);
        }
    }

    sendMessage(message:string, {important = false, tone = "neutral"}:MessageOptions = {}) {
        const newMessage = document.createElement("li");
        newMessage.textContent = message;
        newMessage.classList.add(tone);
        if (important) {
            newMessage.classList.add("important");
        }

        const existingChildren = this.messageBox.childNodes;
        if (existingChildren.length >= 10 && this.messageBox.lastChild) {
            this.messageBox.removeChild(this.messageBox.lastChild);
        }
        this.messageBox.prepend(newMessage);
    }

    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
}

