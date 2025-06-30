import SelectionManager from "./SelectionManager.js";
import Config from "./Config.js";
export default class Cell {
    constructor(value = '', options = {}) {
        this.value = value;
        this.bold = options.bold ?? false;
        this.italic = options.italic ?? false;
        this.background = options.background ?? '#fff';
        this.computedValue = value;
        this.selectionManager = new SelectionManager();
    }

    setValue(val) {
        this.value = val;
        this.compute(); // Recompute on value set
    }

    getValue() {
        return this.computedValue;
    }
    compute(cellMap = new Map()) {
        if (typeof this.value !== 'string' || !this.value.startsWith('=')) {
            this.computedValue = this.value;
            return;
        }
        let expr = this.value.slice(1).toUpperCase();
        // Replace cell references with actual values
        expr = expr.replace(/[A-Z]+[0-9]+/g, ref => {
            const col = ref.charCodeAt(0) - 65; // A=0, B=1...
            const row = parseInt(ref.slice(1), 10) - 1; // A1 -> row 0

            const key = `${row},${col}`;
            const cell = cellMap.get(key);
            const val = cell?.getValue();

            return isNaN(val) ? '0' : val;
        });

        try {
            this.computedValue = eval(expr);
        } catch (e) {
            this.computedValue = 'ERR';
        }
    }

    draw(ctx, x, y, width, height) {
        ctx.fillStyle = this.background;
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = '#000';
        ctx.font = `${this.bold ? 'bold ' : ''}12px Arial`;
        ctx.fillText(this.getValue(), x + 5, y + height / 2 + 4);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x, y, width, height);
    }
    getCellAtPosition(x, y, rowManager, colManager, scrollManager) {
        const adjustedX = x - Config.ROW_HEADER_WIDTH + scrollManager.scrollX;
        const adjustedY = y - Config.COL_HEADER_HEIGHT + scrollManager.scrollY;

        // Top-left corner
        if (x < Config.ROW_HEADER_WIDTH && y < Config.COL_HEADER_HEIGHT) {
            return { headerType: "corner" };
        }

        // Column header
        if (y < Config.COL_HEADER_HEIGHT && x >= Config.ROW_HEADER_WIDTH) {
            const col = colManager.getColIndexAt(adjustedX);
            return { headerType: "column", col };
        }

        // Row header
        if (x < Config.ROW_HEADER_WIDTH && y >= Config.COL_HEADER_HEIGHT) {
            const row = rowManager.getRowIndexAt(adjustedY);
            return { headerType: "row", row };
        }

        // Regular cell
        const col = colManager.getColIndexAt(adjustedX);
        const row = rowManager.getRowIndexAt(adjustedY);
        if (row >= Config.totalRows || col >= Config.totalCols) return null;
        return { row, col };
    }




}

