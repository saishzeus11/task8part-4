import Config from "./Config.js";
export default class RowManager {
    constructor(defaultHeight = 24) {
        this.heights = new Map();
        this.defaultHeight = defaultHeight;
    }

    getHeight(row) {
        return this.heights.get(row) ?? this.defaultHeight;
    }

    setHeight(row, height) {
        this.heights.set(row, height);
    }

    getOffset(row) {
        let offset = 0;
        for (let i = 0; i < row; i++) {
            offset += this.getHeight(i);
        }
        return offset;
    }

    insertRow(index) {
        const newHeights = new Map();

        for (const [row, height] of this.heights.entries()) {
            const rowIndex = Number(row);
            if (rowIndex >= index) {
                newHeights.set(rowIndex + 1, height); // shift down
            } else {
                newHeights.set(rowIndex, height); // keep as-is
            }
        }

        this.heights = newHeights;
    }
    removeRow(index) {
        const newHeights = new Map();

        for (const [row, height] of this.heights.entries()) {
            const rowIndex = Number(row);

            if (rowIndex < index) {
                newHeights.set(rowIndex, height); // keep as-is
            } else if (rowIndex > index) {
                newHeights.set(rowIndex - 1, height); // shift up
            }
            // else: skip the row at 'index' to delete it
        }

        this.heights = newHeights;
    }

    getRowIndexAt(y) {
        let ry = 0;
        let row = 0;
        while (ry < y && row < Config.totalRows) {
            const h = this.getHeight(row);
            if (ry + h > y) return row;
            ry += h;
            row++;
        }
        return Math.min(row, Config.totalRows - 1);
    }

    getTotalHeight() {
        let total = 0;
        for (let i = 0; i < Config.totalRows; i++) {
            total += this.getHeight(i);
        }
        return total;
    }
}