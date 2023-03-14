export const monsterCountFactor = (difficulty:number) => {
    if (difficulty <= 0) {
        return 0.75;
    } else if (difficulty === 1) {
        return 0.9;
    } else if (difficulty === 2) {
        return 1;
    } else {
        return 1.2;
    }
};

export const roomCountFactor = (difficulty:number) => {
    if (difficulty <= 2) {
        return 1;
    } else {
        return 1.2;
    }
};

export const itemNumber = (difficulty:number) => {
    if (difficulty === 0) {
        return 5;
    } else if (difficulty === 1) {
        return 4;
    } else {
        return 3;
    }
}

export const monsterStrengthScale = (difficulty:number):{strength:number, speed:number, health:number} => {
    if (difficulty === 0) {
        return {
            strength: 0.75,
            speed: 0.8,
            health: 0.75
        }
    } else if (difficulty === 1) {
        return {
            strength: 0.9,
            speed: 0.9,
            health: 0.9
        }
    } else if (difficulty === 2) {
        return {
            strength: 1,
            speed: 1,
            health: 1
        }
    } else {
        return {
            strength: 1.2,
            speed: 1.1,
            health: 1
        }
    }
}
