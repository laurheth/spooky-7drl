import Game from "./Game"
import Item from "./Item"

/**
 * Singleton to handle player UI
 */
export default class UI {
    private static instance: UI;

    status: HTMLParagraphElement;
    holding: HTMLUListElement;
    openInventoryButton: HTMLButtonElement;
    closeInventoryButton: HTMLButtonElement;
    inventoryList: HTMLUListElement;
    inventory: HTMLDivElement;

    private constructor() {
        this.status = document.getElementById("status") as HTMLParagraphElement;
        this.holding = document.getElementById("holding") as HTMLUListElement;
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

    updateInventory(inventory:Item[]) {
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
                nameElement.textContent = item.name;
                const useButton = document.createElement("button"); // TODO
                useButton.textContent = "Use";
                const dropButton = document.createElement("button");
                dropButton.textContent = "Drop";
                dropButton.onclick = () => {
                    if (Game.getInstance().player) {
                        Game.getInstance().player.dropItemByIndex(index);
                    }
                }
    
                listItem.appendChild(nameElement);
                listItem.appendChild(useButton);
                listItem.appendChild(dropButton);
    
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

