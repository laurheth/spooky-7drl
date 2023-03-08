import Game from "./Game"
import Item from "./Item"
import Player from "./Player"

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

    updateInventory(player:Player) {
        const inventory:Item[] = player.inventory;
        const equipped:Item = player.equippedItem
        if (equipped) {
            this.holding.innerText = equipped.name;
        } else {
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
                nameElement.textContent = item.name;

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

