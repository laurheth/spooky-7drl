import Game from "./Game"
import Item from "./Item"
import Player from "./Player"

const fine = 0.66;
const caution = 0.33

interface SpecialMessageParams {
    headingText: string;
    body: string[];
    button?: string;
    handler?: ()=>void;
}

/**
 * Singleton to handle player UI
 */
export default class UI {
    private static instance: UI;

    status: HTMLParagraphElement;
    holding: HTMLParagraphElement;
    openInventoryButton: HTMLButtonElement;
    closeInventoryButton: HTMLButtonElement;
    inventoryList: HTMLUListElement;
    inventory: HTMLDivElement;
    specialMessageModal: HTMLDivElement;
    specialMessageHeader: HTMLHeadingElement;
    specialMessageContent: HTMLDivElement;
    specialMessageButton: HTMLButtonElement;
    inventoryOpen:boolean = false;
    messageOpen:boolean = false;

    specialMessageButtonHandlers:(()=>void)[] = [];

    private constructor() {
        // Player status related elements
        this.status = document.getElementById("status") as HTMLParagraphElement;
        this.holding = document.getElementById("holding") as HTMLParagraphElement;

        // Inventory related elements
        this.openInventoryButton = document.getElementById("openInventory") as HTMLButtonElement;
        this.closeInventoryButton = document.getElementById("closeInventory") as HTMLButtonElement;
        this.inventoryList = document.getElementById("inventoryList") as HTMLUListElement;
        this.inventory = document.getElementById("inventory") as HTMLDivElement;

        // Elements needed for the special message modal
        this.specialMessageModal = document.getElementById("specialMessageModal") as HTMLDivElement;
        this.specialMessageHeader = document.getElementById("specialMessageHeader") as HTMLHeadingElement;
        this.specialMessageContent = document.getElementById("specialMessageContent") as HTMLDivElement;
        this.specialMessageButton = document.getElementById("specialMessageButton") as HTMLButtonElement;

        this.specialMessageButton.addEventListener("click", () => {
            this.closeSpecialMessageModal();
        });

        // Open the inventory
        this.openInventoryButton.addEventListener("click", () => {
            this.openInventory();
        });

        // Close the inventory
        this.closeInventoryButton.addEventListener("click", () => {
            this.closeInventory();
        });
    }

    showSpecialMessageModal({headingText, body, button = "Close", handler}:SpecialMessageParams) {
        this.messageOpen = true;
        this.updateTickerStatus();

        // Store the handler
        this.specialMessageButtonHandlers.push(handler);

        // Heading and button
        this.specialMessageHeader.textContent = headingText;
        this.specialMessageButton.textContent = button;

        // Clear any prior content
        while (this.specialMessageContent.lastChild) {
            this.specialMessageContent.removeChild(this.specialMessageContent.lastChild);
        }

        // Add in the new content
        body.forEach(line => {
            const paragraph = document.createElement("p");
            paragraph.textContent = line;
            this.specialMessageContent.appendChild(paragraph);
        })

        // Show the modal
        this.specialMessageModal.classList.remove("hide");
    }

    closeSpecialMessageModal() {
        this.messageOpen = false;
        this.updateTickerStatus();
        while(this.specialMessageButtonHandlers.length > 0) {
            const handler = this.specialMessageButtonHandlers.pop();
            handler();
        }
        this.specialMessageModal.classList.add("hide");
    }

    toggleInventory() {
        if (this.inventory.classList.contains("hide")) {
            this.openInventory();
        } else {
            this.closeInventory();
        }
    }

    openInventory() {
        this.inventoryOpen = true;
        this.updateTickerStatus();
        this.inventory.classList.remove("hide");
    }

    closeInventory() {
        this.inventoryOpen = false;
        this.updateTickerStatus();
        this.inventory.classList.add("hide");
    }

    updateTickerStatus() {
        if (!this.inventoryOpen && !this.messageOpen) {
            Game.getInstance().ticker.start();
        } else {
            Game.getInstance().ticker.stop();
        }
    }

    updateStatus(player:Player) {
        const healthFraction = player.getHealthFraction();
        if (healthFraction > fine) {
            this.status.textContent = "Fine";
            this.status.classList.remove("bad", "neutral");
            this.status.classList.add("good");
        } else if (healthFraction > caution) {
            this.status.textContent = "Caution";
            this.status.classList.remove("bad", "good");
            this.status.classList.add("neutral");
        } else if (healthFraction > 0) {
            this.status.textContent = "Danger";
            this.status.classList.remove("good", "neutral");
            this.status.classList.add("bad");
        } else {
            this.status.textContent = "Dead";
            this.status.classList.remove("good", "neutral");
            this.status.classList.add("bad");
            // Player is dead. Might want to adjust inventory too.
            this.updateInventory(player);
        }
    }

    updateInventory(player:Player) {
        const inventory:Item[] = player.inventory;
        const equipped:Item = player.equippedItem
        if (equipped) {
            let conditionMessage:string;
            if (equipped.durability >= 8) {
                conditionMessage = "Good condition";
                this.holding.className = "good";
            }
            else if (equipped.durability >= 6) {
                conditionMessage = "Scratched";
                this.holding.className = "good";
            } else if (equipped.durability > 3) {
                conditionMessage = "Rough shape";
                this.holding.className = "neutral";
            } else {
                conditionMessage = "Almost broken";
                this.holding.className = "bad";
            }
            this.holding.innerText = `${equipped.name} - ${conditionMessage}`;
        } else {
            this.holding.className = null;
            this.holding.innerText = "Nothing";
        }
        while (this.inventoryList.lastChild) {
            this.inventoryList.removeChild(this.inventoryList.lastChild);
        }

        if (inventory.length === 0) {
            const listItem = document.createElement("li");
            listItem.textContent = "Your inventory is empty.";
            this.inventoryList.appendChild(listItem);
        } else {
            inventory.forEach((item, index) => {
                const listItem = document.createElement("li");
                const nameElement = document.createElement("p");
                nameElement.textContent = item.getStatusName();

                const useButton = document.createElement("button");
                
                if (item === equipped) {
                    useButton.textContent = "Unequip";
                    useButton.onclick = () => player.unequip();
                } else if (item.equippable) {
                    useButton.textContent = "Equip";
                    useButton.onclick = () => player.equipItemByIndex(index);
                } else {
                    useButton.textContent = "Use";
                    useButton.onclick = () => player.useItemByIndex(index);
                }
                const dropButton = document.createElement("button");
                dropButton.textContent = "Drop";
                dropButton.onclick = () => player.dropItemByIndex(index);
    
                listItem.appendChild(nameElement);
                if (Game.getInstance().player.active) {
                    listItem.appendChild(useButton);
                    listItem.appendChild(dropButton);
                }
    
                this.inventoryList.appendChild(listItem);
            })
        }

    }

    static getInstance() {
        if (!UI.instance) {
            UI.instance = new UI();
        }
        return UI.instance;
    }
}

