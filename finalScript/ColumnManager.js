import Config from "./Config.js";
export default class ColumnManager {
    constructor(defaultWidth = 100) {
        this.widths = new Map();
        this.defaultWidth = defaultWidth;
    }

    getWidth(col) {
        return this.widths.get(col) ?? this.defaultWidth;
    }

    setWidth(col, width) {
        this.widths.set(col, width);
    }

    getOffset(col) {
        let offset = 0;
        for (let i = 0; i < col; i++) {
            offset += this.getWidth(i);
        }
        return offset;
    }

    insertColumn(index) {
        const newWidths = new Map();

        for (const [col, width] of this.widths.entries()) {
            const colIndex = Number(col);
            if (colIndex >= index) {
                newWidths.set(colIndex + 1, width); // shift right
            } else {
                newWidths.set(colIndex, width); // keep as-is
            }
        }

        this.widths = newWidths;
    }
    removeColumn(index) {
        const newWidths = new Map();

        for (const [col, width] of this.widths.entries()) {
            const colIndex = Number(col);
            if (colIndex < index) {
                newWidths.set(colIndex, width); // keep as-is
            } else if (colIndex > index) {
                newWidths.set(colIndex - 1, width); // shift left
            }
            // else: skip the one we're removing
        }

        this.widths = newWidths;
    }

    getColIndexAt(x) {
        let cx = 0;
        let col = 0;
        while (cx < x && col < Config.totalCols) {
            const w = this.getWidth(col);
            if (cx + w > x) return col;
            cx += w;
            col++;
        }
        return Math.min(col, Config.totalCols - 1);
    }

    getTotalWidth() {
        let total = 0;
        for (let i = 0; i < Config.totalCols; i++) {
            total += this.getWidth(i);
        }
        return total;
    }
}
