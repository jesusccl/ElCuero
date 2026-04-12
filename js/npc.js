// ===== NPC SYSTEM =====
const NPC_DATA = {
    village: [
        {
            id: 'elder',
            x: 12, y: 10,
            sprite: '👴',
            name: 'Anciano Sabio',
            dialogs: [
                "¡Bienvenido, Sir Augusto! Eres el caballero elegido por la profecía.",
                "El Cuero ha despertado en la Guarida más allá de la Mazmorra de Huesos...",
                "Ve al este, cruza el Bosque Oscuro y encontrarás la entrada a la mazmorra.",
                "¡Ten cuidado! El Cuero controla criaturas oscuras por todo el camino.",
                "¡Que la luz te guíe, valiente Augusto!"
            ]
        },
        {
            id: 'merchant',
            x: 22, y: 12,
            sprite: '🧙',
            name: 'Mago Mercader',
            dialogs: [
                "¡Hola, joven caballero! He oído hablar de ti, Augusto.",
                "Toma este consejo: busca cofres en tu camino, contienen tesoros útiles.",
                "Y recuerda, usa tus pociones sabiamente contra El Cuero."
            ]
        },
        {
            id: 'kid',
            
