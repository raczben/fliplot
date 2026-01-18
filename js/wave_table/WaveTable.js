import { SimDB } from "../core/SimDB.js";
import { SimulationObject } from "../core/SimulationObject.js";
import { Node } from "../core/tree.js";
import { WaveformRow } from "./WaveformRow.js";
import { NameCol } from "./NameCol.js";
import { ValueCol } from "./ValueCol.js";
import { WaveCanvas } from "./WaveCanvas.js";

export class WaveTable {
  constructor(simDB) {
    if (simDB.constructor != SimDB) {
      throw "ERROR";
    }
    /**  @type {SimDB} */
    this.simDB = simDB;
    /**  @type {Node} */
    this.tree = Node.createRoot();
    /**  @type {NameCol} */
    this.nameCol = new NameCol(this);
    /**  @type {ValueCol} */
    this.valueCol = new ValueCol(this);
    /**  @type {WaveCanvas} */
    this.wave = new WaveCanvas(this);

    /**  @type {HTMLElement} */
    this.mainContainerScrolly = document.getElementById("main-container-scroll-y");
    /**  @type {HTMLElement} */
    this.waveAxisContainer = document.getElementById("wave-axis-container");
    if (!this.mainContainerScrolly || !this.waveAxisContainer) {
      throw new Error("WaveTable: mainContainerScrolly or waveAxisContainer not found");
    }

    // Connect event listeners.
    this.mainContainerScrolly.addEventListener("scroll", () => this.handleVerticalScroll());
    this.waveAxisContainer.addEventListener("scroll", () => this.handleHorizontalScroll());
    const resizeObserver = new ResizeObserver(() => this.handleWaveAxisContainerResize());
    resizeObserver.observe(this.waveAxisContainer);
    this._waveAxisResizeObserver = resizeObserver;
    this.attachZoomHandler();
    this.waveAxisContainer.addEventListener("click", (event) => this.handleClickOnWaveAxis(event));
  }

  /**
   * Handles resize events for the wave-axis-container.
   * Note: The wave-axis-container will be resized also when values-col or names-col are resized.
   */
  handleWaveAxisContainerResize() {
    console.log("handleWaveAxisContainerResize");
    // Throttle resize handling to avoid excessive calls
    // this is necessary because resize is called multiple times
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
    }
    this._resizeTimeout = setTimeout(() => {
      this.wave.setSize(this.waveAxisContainer.clientWidth, this.waveAxisContainer.clientHeight);
      this.wave.requestRender();
      this._resizeTimeout = null;
    }, 10);
    return;
  }

  /**
   * Handles scroll events for the wave-axis-container.
   */
  handleHorizontalScroll() {
    const scrollLeft = this.waveAxisContainer.scrollLeft;
    this.wave.setLeftOffset(scrollLeft);
    this.wave.requestRender();
  }

  handleVerticalScroll() {
    console.log("handleVerticalScroll");
    // getting the scroll position
    const scrollTop = this.mainContainerScrolly.scrollTop;
    this.wave.setScrollTop(scrollTop);
    this.wave.requestRender();
  }

  // Handle zoom (Ctrl + mouse wheel) and allow normal scroll otherwise
  attachZoomHandler() {
    this.waveAxisContainer.addEventListener(
      "wheel",
      (e) => {
        if (e.ctrlKey) {
          // get the mouse position to choose as fix point for zooming
          const rect = this.waveAxisContainer.getBoundingClientRect();
          const fixPointX = e.clientX - rect.left; // x position within the element

          // prevent default scrolling behavior
          e.preventDefault();
          // calculate zoom delta based on the wheel delta
          const delta = (-e.deltaY / 1300) * 3; // deltaY is +/-138
          this.zoomInOut(delta, fixPointX);
        }
        // else: let normal scroll work
      },
      { passive: false }
    );
  }

  /** handle Click on the wave axis and draw the cursor */
  handleClickOnWaveAxis(event) {
    const rect = this.waveAxisContainer.getBoundingClientRect();

    // The x position determines the time (and the position of the cursor) on the waveform
    const x = event.clientX - rect.left; // x position within the element
    const time = this.wave.getTimeFromX(x);
    this.moveCursorTo(time);

    // The y position gives the signal to be selected (and activated)
    const yBase = event.clientY - rect.top; // y position within the element
    const yAbbs = yBase + this.mainContainerScrolly.scrollTop; // y position within the entire wave axis container
    const rowsToPlot = this.getRows({ hidden: false, content: true });
    var rowBottom = 0;
    for (var row of rowsToPlot) {
      const rowHeight = row.getHeight();
      rowBottom += rowHeight;
      if (yAbbs < rowBottom) {
        // we found the row that was clicked, lets call the rowClicked method
        const ctrlkey = event.ctrlKey || event.metaKey;
        const shiftkey = event.shiftKey;
        const rowId = row.id;
        this.rowClicked(rowId, shiftkey, ctrlkey);
        break;
      }
    }
  }

  /**
   * Zoom in or out based on the wheel delta.
   * Note this calls directly the wave.render() method to update the wave display.
   * @param {number} delta - The zoom delta, positive for zoom in, negative for zoom out.
   * @param {number} fixPointX - The x position within the wave axis container to use as the fix point for zooming.
   *
   */
  zoomInOut(delta = 0.3, fixPointX = -1) {
    let scroll = this.wave.zoomInOut(delta, fixPointX);
    if (scroll < 0) {
      scroll = 0;
    }
    this.wave.requestRender();

    // otherwise, scroll the wave axis container, which will trigger the horizontal scroll event
    // scorll effectively the wave axis container DOM element
    this.waveAxisContainer.scrollTo({ left: scroll });
  }

  reload() {
    this.nameCol.reload();
    this.valueCol.reload();
    this.wave.requestRender();
  }

  clearAll() {
    if (this.tree) {
      this.delete();
    }
    this.tree = Node.createRoot();
    this.nameCol.clearAll();
    this.valueCol.clearAll();
    this.wave.requestRender();
  }

  /**
   * There are three source of the row de/select events: nameCol, ValueCol, and the WaveCanvas.
   * This method handles the select/deselect functionality, modifies the selectedRows and
   * activeRows variables, and calls the appropriate methods on the other components.
   *
   * @param {string} rowId the waveform-row-id in the wavetable.
   * @param {boolean} shiftKey the state of the shift key during the click event.
   * @param {boolean} ctrlKey the state of the ctrl key during the click event.
   */
  rowClicked(rowId, shiftKey, ctrlKey) {
    this.nameCol.rowClicked(rowId, shiftKey, ctrlKey);
  }

  selectRow(rowId, doInNameColToo = true) {
    if (doInNameColToo) {
      this.nameCol.selectRow(rowId);
    }
    this.valueCol.selectRow(rowId);
    this.wave.requestRender();
  }

  deSelectRow(rowId, doInNameColToo = true) {
    if (doInNameColToo) {
      this.nameCol.deSelectRow(rowId);
    }
    this.valueCol.deSelectRow(rowId);
    this.wave.requestRender();
  }

  moveRow(rowId, pos, parent, doInNameColToo = true) {
    let row = this.tree.get(rowId);
    row.move(parent, pos);
    if (doInNameColToo) {
      this.nameCol.moveRow(rowId, pos, parent);
    }
    this.valueCol.moveRow(rowId, pos, parent);
    this.wave.requestRender();
  }

  openGroup(rowId, doInNameColToo = true) {
    let row = this.tree.get(rowId);
    row.open(rowId);
    if (doInNameColToo) {
      this.nameCol.openGroup(rowId);
    }
    this.valueCol.openGroup(rowId);
    this.wave.requestRender();
  }

  closeGroup(rowId, doInNameColToo = true) {
    let row = this.tree.get(rowId);
    row.close(rowId);
    if (doInNameColToo) {
      this.nameCol.closeGroup(rowId);
    }
    this.valueCol.closeGroup(rowId);
    this.wave.requestRender();
  }

  removeRow(rowId) {
    this.tree.get(rowId).delete();
    this.nameCol.removeRow(rowId);
    this.valueCol.removeRow(rowId);
    this.wave.requestRender();
  }

  removeRows(rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach((element) => {
      this.removeRow(element);
    });
  }

  /**
   * Insert a new signal to waveform window.
   *
   * @param {string[]} hierarchy
   * @param {string|null} parent
   * @param {number} position
   * @param {boolean} busAsBus
   * @param {boolean} render
   */
  insertWaveSignal(hierarchy, parent = null, position = -1, busAsBus = true, render = true) {
    /** @type {SimulationObject} obj */
    const obj = this.simDB.getObject(hierarchy);
    /** @type {WaveformRow} rowItem */
    parent = this.tree.get(parent); // validate parent
    const rowItem = new WaveformRow(obj, parent, position, [], false);

    if (busAsBus && rowItem.waveStyle == WaveformRow.WaveStyle.BUS) {
      // If the signal is a bus, insert all sub-signals
      // in reversed: little-endian order.
      for (var i = obj.signal.width - 1; i > -1; i--) {
        const subObj = obj.cloneRange(i);
        new WaveformRow(subObj, rowItem, i, [], false);
      }
    }

    if (render) {
      this.reload();
    }

    return rowItem.id;
  }

  /**
   * Add all signal from the simDB to the waveform window.
   */
  addAllWaveSignal(clear = true, render = true) {
    if (clear) {
      if (this.tree) {
        this.tree.delete();
      }
      this.tree = Node.createRoot();
    }

    for (var key in this.simDB.objects) {
      if (Object.prototype.hasOwnProperty.call(this.simDB.objects, key)) {
        if (this.simDB.objects[key].type == SimulationObject.Type.SIGNAL) {
          this.insertWaveSignal(
            key.split("."), // hierarchy
            null, // parent = null
            -1, // position = -1,
            true, // busAsBus = true
            false // render = false
          );
        }
      }
    }
    if (render) {
      this.reload();
    }
  }

  addObjects(hierarchies) {
    hierarchies.forEach((hier) => this.insertWaveSignal(hier));
  }

  /**
   *
   * @param {[WaveformRow]} wfRows
   * @param {boolean} render
   */
  createGroup(wfRows = null, render = true) {
    if (!wfRows) {
      wfRows = this.getSelectedRows(false);
    }
    const parent = wfRows[0].getParent();
    const rowItem = new WaveformRow(
      {
        type: WaveformRow.Type.GROUP,
        name: "New Group",
        hierarchy: []
      },
      parent,
      wfRows[0].getPosition(), // insert at position of first selected row
      [],
      true  // opened
    );
    wfRows.forEach((r) => {
      this.moveRow(r, -1, rowItem, true);
    });
    if (render) {
      this.reload();
    }
  }

  /**
   *
   * @param {*} param0
   * @returns {Array<WaveformRow>}
   */
  getRows({ traverse = Node.Traverse.PREORDER, parent = null, hidden = true } = {}) {
    return this.tree.get(parent).getChildren(traverse, hidden);
  }

  /**
   *
   * @param {string} id the WaveformRow id
   * @returns {WaveformRow} the WaveformRow object
   */
  getRow(id) {
    // check if id not a waveform-row object already
    if (id instanceof WaveformRow) {
      return id;
    }
    return this.tree.get(id);
  }

  getParent(row) {
    // check if id is a waveform-row
    row = this.getRow(row);
    return row.getParent();
  }

  getPosition(row) {
    // check if id is a waveform-row
    row = this.getRow(row);
    return row.getPosition();
  }

  getSelectedRows(ids = true) {
    if (ids) {
      return this.nameCol.getSelectedRows();
    } else {
      // return rows itself
      return this.nameCol.getSelectedRows().map((element) => this.getRow(element));
    }
  }

  /**
   * Returns if the given row is selected, fetching from the nameCol jsTree structure.
   * @param {string} rowId - The ID of the row to check
   * @returns {boolean} - True if the row is selected, false otherwise
   */
  isSelected(id) {
    return this.nameCol.isSelected(id);
  }

  getActiveRow(id = true) {
    try {
      const activeId = this.nameCol.getActiveRow();
      if (id) {
        return activeId;
      } else {
        return this.getRow(activeId);
      }
    } catch (e) {
      console.warn("No active row found in WaveTable.");
      return null;
    }
  }

  rename(rowId, name) {
    this.getRow(rowId).name = name;
    this.nameCol.reload();
  }

  setRadix(radix, rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach((element) => {
      this.getRow(element).setRadix(radix);
      this.valueCol.setRadix(element);
      this.wave.requestRender();
    });
  }

  setWaveStyle(wstyle, rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach((element) => {
      this.getRow(element).setWaveStyle(wstyle);
      this.wave.requestRender();
    });
  }

  moveCursorTo(time) {
    this.wave.setCursorTime(time);
    this.valueCol.showValuesAt(time);
    this.wave.requestRender();
  }

  getCursorTime() {
    return this.wave.getCursorTime();
  }

  zoomFit() {
    // Zoom to fit the entire waveform in the view.
    // simDB.now should be the at the right edge of the waveform.
    const width = this.waveAxisContainer.clientWidth - 10; // 10px padding
    const timeScale = width / this.simDB.now;
    // Workaround: calculate the delta scale based on the current zoom level
    const currentScale = this.wave.getTimeScale();
    const deltaScale = timeScale / currentScale - 1;
    this.zoomInOut(deltaScale);
  }

  zoomIn() {
    this.zoomInOut(0.3);
  }

  zoomOut() {
    this.zoomInOut(-0.3);
  }
}
