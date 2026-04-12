// ===== ITEMS SYSTEM =====
const ITEMS = {
    health_potion: {
        name: 'Poción de Vida',
        icon: '❤️',
        description: 'Restaura 30 HP',
        type: 'consumable',
        effect: (player) => { player.heal(30); },
        stackable: true
    },
    mana_potion: {
        name: 'Poción de Maná',
        icon: '💙',
        description: 'Restaura 25 MP',
        type: 'consumable',
        effect: (player) => { player.restoreMana(25); },
        stackable: true
    },
    iron_sword: {
        name: 'Espada de Hierro',
        icon: '⚔️',
        description: 'ATK +5',
        type: 'weapon',
        atkBonus: 5,
        stackable: false
    },
    steel_sword: {
        name: 'Espada de Acero',
        icon: '🗡️',
        description: 'ATK +12',
        type: 'weapon',
        atkBonus: 12,
        stackable: false
    },
    augusto_blade: {
        name: 'Hoja de Augusto',
        icon: '✨',
        description: 'ATK +20 - La espada legendaria',
        type: 'weapon',
        atkBonus: 20,
        stackable: false
    },
    leather_armor: {
        name: 'Armadura de Cuero',
        icon: '🛡️',
        description: 'DEF +3',
        type: 'armor',
        defBonus: 3,
        stackable: false
    },
    knight_armor: {
        name: 'Armadura de Caballero',
        icon: '🏰',
        description: 'DEF +8',
        type: 'armor',
        defBonus: 8,
        stackable: false
    },
    gold_coin: {
        name: 'Monedas de Oro',
        icon: '💰',
        description: 'Monedas brillantes',
        type: 'currency',
        value: 10,
        stackable: true
    },
    ancient_key: {
        name: 'Llave Antigua',
        icon: '🗝️',
        description: 'Abre puertas antiguas',
        type: 'key',
        stackable: false
    },
    augusto_amulet: {
        name: 'Amuleto de Augusto',
        icon: '📿',
        description: 'Un amuleto con tu nombre grabado. ATK+3, DEF+3',
        type: 'accessory',
        atkBonus: 3,
        defBonus: 3,
        stackable: false
    }
};

// Loot tables for chests per map
const CHEST_LOOT = {
    village: ['health_potion', 'health_potion', 'gold_coin', 'augusto_amulet'],
    forest: ['iron_sword', 'health_potion', 'mana_potion', 'leather_armor', 'gold_coin'],
    dungeon: ['steel_sword', 'knight_armor', 'health_potion', 'mana_potion', 'health_potion', 'augusto_blade'],
    bossRoom: ['health_potion', 'mana_potion']
};

class Inventory {
    constructor() {
        this.slots = []; // { itemId, count }
        this.maxSlots = 15;
        this.equipped = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }

    addItem(itemId, count = 1) {
        const item = ITEMS[itemId];
        if (!item) return false;

        if (item.stackable) {
            const existing = this.slots.find(s => s.itemId === itemId);
            if (existing) {
                existing.count += count;
                return true;
            }
        }

        if (this.slots.length < this.maxSlots) {
            this.slots.push({ itemId, count });
            return true;
        }
        return false;
    }

    useItem(index, player) {
        if (index < 0 || index >= this.slots.length) return;
        const slot = this.slots[index];
        const item = ITEMS[slot.itemId];

        if (item.type === 'consumable') {
            item.effect(player);
            slot.count--;
            if (slot.count <= 0) this.slots.splice(index, 1);
        } else if (item.type === 'weapon') {
            this.equipped.weapon = slot.itemId;
        } else if (item.type === 'armor') {
            this.equipped.armor = slot.itemId;
        } else if (item.type === 'accessory') {
            this.equipped.accessory = slot.itemId;
        }
    }

    getATKBonus() {
        let bonus = 0;
        if (this.equipped.weapon && ITEMS[this.equipped.weapon]) bonus += ITEMS[this.equipped.weapon].atkBonus || 0;
        if (this.equipped.accessory && ITEMS[this.equipped.accessory]) bonus += ITEMS[this.equipped.accessory].atkBonus || 0;
        return bonus;
    }

    getDEFBonus() {
        let bonus = 0;
        if (this.equipped.armor && ITEMS[this.equipped.armor]) bonus += ITEMS[this.equipped.armor].defBonus || 0;
        if (this.equipped.accessory && ITEMS[this.equipped.accessory]) bonus += ITEMS[this.equipped.accessory].defBonus || 0;
        return bonus;
    }
}
