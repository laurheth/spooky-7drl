import Game from "./Game"
import Item from "./Item"
import Player from "./Player"

const fine = 0.66;
const caution = 0.33

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

    private constructor() {
        this.status = document.getElementById("status") as HTMLParagraphElement;
        this.holding = document.getElementById("holding") as HTMLParagraphElement;
        this.openInventoryButton = document.getElementById("openInventory") as HTMLButtonElement;
        this.closeInventoryButton = document.getElementById("closeInventory") as HTMLButtonElement;
        this.inventoryList = document.getElementById("inventoryList") as HTMLUListElement;
        this.inventory = document.getElementById("inventory") as HTMLDivElement;

        // Open the inventory
        this.openInventoryButton.addEventListener("click", () => {
            this.openInventory();
        });

        // Close the inventory
        this.closeInventoryButton.addEventListener("click", () => {
            Game.getInstance().ticker.start();
            this.inventory.classList.add("hide");
        });
    }

    toggleInventory() {
        if (this.inventory.classList.contains("hide")) {
            this.openInventory();
        } else {
            this.closeInventory();
        }
    }

    openInventory() {
        Game.getInstance().ticker.stop();
        this.inventory.classList.remove("hide");
    }

    closeInventory() {
        Game.getInstance().ticker.start();
        this.inventory.classList.add("hide");
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

