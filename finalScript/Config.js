
export default class Config {
    static ROW_HEADER_WIDTH = 50;
    static COL_HEADER_HEIGHT = 24;
    static totalRows = 1000;
    static totalCols = 100;
    static selectionMode = "cell"; // "cell", "row", or "column"

    static isDragging = false;
    static dragStartCell = null;
}