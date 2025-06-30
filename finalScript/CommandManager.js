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

export class CommandHistory {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
    }

    execute(cmd) {
        cmd.execute();
        this.undoStack.push(cmd);

        console.log(cmd)
        this.redoStack = []; // clear redo stack
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
