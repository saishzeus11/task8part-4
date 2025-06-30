import Config from "./Config.js";

export class Command {
    execute() { }
    undo() { }
}

export class CellEditCommand extends Command {
    constructor(cell, newValue) {
        super();
        this.cell = cell;
        this.row = cell.row;
        this.col = cell.col;
        this.oldValue = cell.value;
        this.newValue = newValue;
    }

    execute() {
        this.cell.setValue(this.newValue);
    }

    undo() {
        this.cell.setValue(this.oldValue);
    }
}

export class ResizeCommand extends Command {
    constructor(type, manager, index, oldSize, newSize) {
        super();
        this.type = type; // "row" or "col"
        this.manager = manager;
        this.index = index;
        this.oldSize = oldSize;
        this.newSize = newSize;
    }

    execute() {
        if (this.type === "row") {
            this.manager.setHeight(this.index, this.newSize);
        } else {
            this.manager.setWidth(this.index, this.newSize);
        }
    }

    undo() {
        if (this.type === "row") {
            this.manager.setHeight(this.index, this.oldSize);
        } else {
            this.manager.setWidth(this.index, this.oldSize);
        }
    }
}

export class InsertRowCommand extends Command {
    constructor(rowManager, cellMap, index, position = "top") {
        super();
        this.rowManager = rowManager;
        this.cellMap = cellMap;
        this.index = index;
        this.position = position; // "top" or "bottom"
        this.savedCells = new Map();
    }

    execute() {
        const insertIndex = this.position === "bottom" ? this.index + 1 : this.index;

        // Save all affected cells
        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(',').map(Number);
            if (row >= insertIndex) {
                this.savedCells.set(`${row},${col}`, cell);
            }
        }

        // Shift rows downward
        const newMap = new Map();
        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(',').map(Number);
            const newRow = row >= insertIndex ? row + 1 : row;
            newMap.set(`${newRow},${col}`, cell);
        }

        this.cellMap.clear();
        newMap.forEach((v, k) => this.cellMap.set(k, v));

        this.rowManager.insertRow(insertIndex);
        Config.totalRows++;
    }

    undo() {
        const insertIndex = this.position === "bottom" ? this.index + 1 : this.index;

        // Shift rows upward to undo
        const newMap = new Map();
        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(',').map(Number);
            if (row > insertIndex) {
                newMap.set(`${row - 1},${col}`, cell);
            } else if (row < insertIndex) {
                newMap.set(`${row},${col}`, cell);
            }
        }

        this.cellMap.clear();
        newMap.forEach((v, k) => this.cellMap.set(k, v));

        this.rowManager.removeRow(insertIndex);
        Config.totalRows--;
    }
}

export class InsertColumnCommand extends Command {
    constructor(colManager, cellMap, index, position = "right") {
        super();
        this.colManager = colManager;
        this.cellMap = cellMap;
        this.index = index;
        this.position = position; // "left" or "right"
        this.savedCells = new Map();
    }

    execute() {
        const insertIndex = this.position === "right" ? this.index + 1 : this.index;

        // Save all affected cells
        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(',').map(Number);
            if (col >= insertIndex) {
                this.savedCells.set(`${row},${col}`, cell);
            }
        }

        // Shift columns to the right
        const newMap = new Map();
        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(',').map(Number);
            const newCol = col >= insertIndex ? col + 1 : col;
            newMap.set(`${row},${newCol}`, cell);
        }

        this.cellMap.clear();
        newMap.forEach((v, k) => this.cellMap.set(k, v));

        this.colManager.insertColumn(insertIndex);
        Config.totalCols++;
    }

    undo() {
        const insertIndex = this.position === "right" ? this.index + 1 : this.index;

        // Shift columns to the left to undo
        const newMap = new Map();
        for (let [key, cell] of this.cellMap.entries()) {
            const [row, col] = key.split(',').map(Number);
            if (col > insertIndex) {
                newMap.set(`${row},${col - 1}`, cell);
            } else if (col < insertIndex) {
                newMap.set(`${row},${col}`, cell);
            }
        }

        this.cellMap.clear();
        newMap.forEach((v, k) => this.cellMap.set(k, v));

        this.colManager.removeColumn(insertIndex);
        Config.totalCols--;
    }
}


export class CommandHistory {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    execute(cmd) {
        cmd.execute();
        this.undoStack.push(cmd);
        this.redoStack = [];
    }

    undo() {
        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo();
            this.redoStack.push(cmd);
        }
    }

    redo() {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.execute();
            this.undoStack.push(cmd);
        }
    }
}
