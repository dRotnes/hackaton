const fs = require('fs');

const BASE_QUANTITY_PER_ITEM = {
    'Camisola':  {
        TECIDO: 0.5,
        ALGODAO: 0.35,
        FIO: 0.5,
        POLYESTER: 0.5,
    },
    'Tshirt':  {
        TECIDO: 1,
        ALGODAO: 0.8,
        FIO: 0.4,
        POLYESTER: 1,
    },
    'Calcoes':  {
        TECIDO: 0.8,
        ALGODAO: 0.7,
        FIO: 0.4,
        POLYESTER: 0.8,
    },
    'Calcas':  {
        TECIDO: 1.2,
        ALGODAO: 0.95,
        FIO: 0.35,
        POLYESTER: 1.2,
    },
}

const RATIO_PER_SIZE = {
    XS: 0.5,
    S: 0.75,
    M: 1,
    L: 1.5,
    XL: 2
}

const PRICE_PER_MATERIAL = {
    TECIDO: 7,
    ALGODAO: 5.5,
    FIO: 4.5,
    POLYESTER: 10,
}

const INITIAL_STOCK_VALUES = {
    TECIDO: 2200,
    ALGODAO: 2200,
    FIO: 2200,
    POLYESTER: 2200,
}

const GLOBAL_CONSTANTS = {
    DAILY_SEARCH: 137,
    ECONOMICAL_QUANTITY: 1196,
    SECURITY_STOCK: 1000,
    ORDER_POINT: 1960,
    DELIVERY_TIME: 7,
} 
// Global date variable
let globalDate = new Date('2024-10-25'); // Set to the current date
let orderId = 0;

let tecidoInfo = {
    LAST_RESUPPLY_ORDER: '2024-10-25',
    NEXT_SUPPLY_RECEIVEMENT: '2024-10-25',
};
let fioInfo = {
    LAST_RESUPPLY_ORDER: '2024-10-25',
    NEXT_SUPPLY_RECEIVEMENT: '2024-10-25',
};
let algodaoInfo = {
    LAST_RESUPPLY_ORDER: '2024-10-25',
    NEXT_SUPPLY_RECEIVEMENT: '2024-10-25',
};
let polyesterInfo = {
    LAST_RESUPPLY_ORDER: '2024-10-25',
    NEXT_SUPPLY_RECEIVEMENT: '2024-10-25',
};

let STOCK = {
    '2024-10-25': {
        TECIDO: 2200,
        ALGODAO: 2200,
        FIO: 2200,
        POLYESTER: 2200
    }
}


function generateId() {
    return ++orderId;
}

function detectFormat(content) {
    if (content.includes('\n')) {
        if (content.includes("do tamanho")) return 'format3';
        else return 'format1';
    } 
    // If all in one line and no newlines, assume second format
    return 'format2';
}

function parseFormat1(content) {
    return content.trim().split('\n').map(line => {
        const match = line.match(/(\d+)\s+(\w+)\s+(\w+)/);
        return {
            quantity: parseInt(match[1], 10),
            item: match[2],
            size: match[3]
        };
    });
}

function parseFormat2(content) {
    const orders = [];
    const regex = /(\d+)([A-Z][a-z]+)([A-Za-z]+)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        orders.push({
            quantity: parseInt(match[1], 10),
            item: match[2],
            size: match[3]
        });
    }
    return orders;
}
function parseFormat3(content) {
    const orders = [];
    const regex = /(\d+)\s+(\w+)\s+do tamanho\s+(\w+)/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        orders.push({
            quantity: parseInt(match[1], 10),
            item: match[2],
            size: match[3]
        });
    }
    return orders;
}

function parseOrderFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    const format = detectFormat(content);
    const orders = [];

    switch (format) {
        case 'format1':
            orders.push(...parseFormat1(content));
            break;
        case 'format2':
            orders.push(...parseFormat2(content));
            break;
        case 'format3':
            orders.push(...parseFormat3(content));
            break;
        default:
            throw new Error('Invalid format');
    }

    // Add timestamp and ID to each order
    const processedOrders = orders.map((order) => {
        // Add the index to the day
        globalDate.setDate(globalDate.getDate() + 1);
        // Convert to ISO string format
        const timestamp = globalDate.toISOString();
        return {
            ...order,
            timestamp,
            id: generateId(), // Assign a unique ID
        }
    });

    return processedOrders;
}

function formatDateToYYYYMMDD(isoDateString) {
    const date = new Date(isoDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

function calculateNecessaryStockPerOrder(orders){
    orders.forEach((order) => {
        const orderTimestamp = formatDateToYYYYMMDD(order.timestamp);
        // Create a Date object for the order timestamp
        const currentDate = new Date(orderTimestamp);
        // Subtract one day
        currentDate.setDate(currentDate.getDate() - 1);
        // Convert back to ISO string format (and format as YYYY-MM-DD)
        const lastDayStock = currentDate.toISOString().split('T')[0]; // Get only the date part
        // Assign the last day's stock to the current day in STOCK
        STOCK[orderTimestamp] = deepClone(STOCK[lastDayStock]);

        // Get the order timestamp
        checkIfSupplyArrived(orderTimestamp);
        // Necessary stock per material for this order

        const tecidoNecessary = order.quantity * BASE_QUANTITY_PER_ITEM[order.item].TECIDO * RATIO_PER_SIZE[order.size];
        const fioNecessary = order.quantity * BASE_QUANTITY_PER_ITEM[order.item].FIO * RATIO_PER_SIZE[order.size];
        const algodaoNecessary = order.quantity * BASE_QUANTITY_PER_ITEM[order.item].ALGODAO * RATIO_PER_SIZE[order.size];
        const polyesterNecessary = order.quantity * BASE_QUANTITY_PER_ITEM[order.item].POLYESTER * RATIO_PER_SIZE[order.size];

        // Costs in Euro for each material if needed to ask for more just for this delivery
        const tecidoCost = (tecidoNecessary * PRICE_PER_MATERIAL.TECIDO);
        const fioCost = (fioNecessary * PRICE_PER_MATERIAL.FIO);
        const algodaoCost = (algodaoNecessary * PRICE_PER_MATERIAL.ALGODAO);
        const polyesterCost = (polyesterNecessary * PRICE_PER_MATERIAL.POLYESTER);

        // Total price if we needed to ask for everything from the fucking shit to the fornecedor
        const totalPrice = tecidoCost + fioCost + algodaoCost + polyesterCost;

        // Get the current stock projected for that day
        const currentStock = STOCK[orderTimestamp];
        if (!currentStock){
            throw new Error('No Stock available for that day');
        }
        // Create a Date object for the order timestamp
        const newDate = new Date(orderTimestamp);
        // Subtract one day
        newDate.setDate(newDate.getDate() + GLOBAL_CONSTANTS.DELIVERY_TIME);
        
        updateStockValues(orderTimestamp, tecidoNecessary, fioNecessary, algodaoNecessary, polyesterNecessary);
        // Place new order if necessary
        checkAndPlaceNewOrder(orderTimestamp, newDate.toISOString());
    });
    return STOCK;
}

function checkIfSupplyArrived(orderTimestamp){
    const currentStockTecido = STOCK[orderTimestamp].TECIDO;
    const currentStockFio = STOCK[orderTimestamp].FIO;
    const currentStockAlgodao = STOCK[orderTimestamp].ALGODAO;
    const currentStockPolyester = STOCK[orderTimestamp].POLYESTER;

    STOCK[orderTimestamp] = {
        TECIDO: (tecidoInfo.NEXT_SUPPLY_RECEIVEMENT === orderTimestamp) ? currentStockTecido + GLOBAL_CONSTANTS.ECONOMICAL_QUANTITY : currentStockTecido,
        FIO: (fioInfo.NEXT_SUPPLY_RECEIVEMENT === orderTimestamp) ? currentStockFio + GLOBAL_CONSTANTS.ECONOMICAL_QUANTITY: currentStockFio,
        ALGODAO: (algodaoInfo.NEXT_SUPPLY_RECEIVEMENT === orderTimestamp) ? currentStockAlgodao + GLOBAL_CONSTANTS.ECONOMICAL_QUANTITY: currentStockAlgodao,
        POLYESTER: (polyesterInfo.NEXT_SUPPLY_RECEIVEMENT === orderTimestamp) ? currentStockPolyester + GLOBAL_CONSTANTS.ECONOMICAL_QUANTITY: currentStockPolyester,
    }
}

function checkAndPlaceNewOrder(orderTimestamp, newDate){
    const formattedDate = formatDateToYYYYMMDD(newDate);
    currentStock = STOCK[orderTimestamp];

    if (currentStock.TECIDO <= GLOBAL_CONSTANTS.ORDER_POINT && orderTimestamp >= tecidoInfo.NEXT_SUPPLY_RECEIVEMENT) {
        tecidoInfo.NEXT_SUPPLY_RECEIVEMENT = formattedDate;
    }
    if (currentStock.FIO <= GLOBAL_CONSTANTS.ORDER_POINT && orderTimestamp >= fioInfo.NEXT_SUPPLY_RECEIVEMENT) {
        fioInfo.NEXT_SUPPLY_RECEIVEMENT = formattedDate;
    }
    if (currentStock.ALGODAO <= GLOBAL_CONSTANTS.ORDER_POINT && orderTimestamp >= algodaoInfo.NEXT_SUPPLY_RECEIVEMENT) {
        algodaoInfo.NEXT_SUPPLY_RECEIVEMENT = formattedDate;
    }
    if (currentStock.POLYESTER <= GLOBAL_CONSTANTS.ORDER_POINT && orderTimestamp >= polyesterInfo.NEXT_SUPPLY_RECEIVEMENT) {
        polyesterInfo.NEXT_SUPPLY_RECEIVEMENT = formattedDate; 
    }
}

function updateStockValues(orderTimestamp, tecidoNecessary, fioNecessary, algodaoNecessary, polyesterNecessary) {
    // Pra cada data entre o NEXT_SUPPLY_RECEIVEMENT e o last resupply remover o valor do material gasto desde entao
    const currentTecidoStock = STOCK[orderTimestamp].TECIDO;
    const currentFioStock = STOCK[orderTimestamp].FIO;
    const currentAlgodaoStock = STOCK[orderTimestamp].ALGODAO;
    const currentPolyesterStock = STOCK[orderTimestamp].POLYESTER;
 
    STOCK[orderTimestamp].TECIDO = currentTecidoStock - tecidoNecessary;
    STOCK[orderTimestamp].FIO = currentFioStock - fioNecessary;
    STOCK[orderTimestamp].ALGODAO = currentAlgodaoStock - algodaoNecessary;
    STOCK[orderTimestamp].POLYESTER = currentPolyesterStock - polyesterNecessary;
    
    if (STOCK[orderTimestamp].TECIDO <= 0 || STOCK[orderTimestamp].FIO <= 0 || STOCK[orderTimestamp].ALGODAO <= 0 || STOCK[orderTimestamp].POLYESTER <= 0){
        console.log('NO STOCK FOR NEXT DAY')
    }
}

module.exports = {
    parseOrderFromFile: parseOrderFromFile,
    calculateNecessaryStockPerOrder: calculateNecessaryStockPerOrder,
}