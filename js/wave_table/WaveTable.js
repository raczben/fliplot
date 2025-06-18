import { SimDB } from "../core/SimDB.js";
import { SimulationObject } from "../core/SimulationObject.js";
import { Tree } from "../core/tree.js";
import { WaveformRow } from "../core/WaveformRow.js";
import { NameCol } from "./NameCol.js";
import { ValueCol } from "./ValueCol.js";
import { WaveCanvas } from "./WaveCanvas.js";

export class WaveTable {
  constructor(simDB) {
    if (simDB.constructor != SimDB) {
      throw "ERROR";
    }
    this.simDB = simDB;
    /**  @type {Tree} */
    this.tree = new Tree();
    this.nameCol = new NameCol(this);
    this.valueCol = new ValueCol(this);
    this.wave = new WaveCanvas(this);

    this.mainContainerScrolly = document.getElementById('main-container-scroll-y');
    const waveAxisContainer = document.getElementById('wave-axis-container');

    // Connect event listeners.
    if (this.mainContainerScrolly) {
      this.mainContainerScrolly.addEventListener('scroll', () => this.handleVerticalScroll());
    }
    if (waveAxisContainer) {
      waveAxisContainer.addEventListener('scroll', () => this.handleHorizontalScroll());
    }
    if (waveAxisContainer) {
      const resizeObserver = new ResizeObserver(() => this.handleWaveAxisContainerResize());
      resizeObserver.observe(waveAxisContainer);
      this._waveAxisResizeObserver = resizeObserver;
    }
    this.attachZoomHandler();
  }

  /**
   * Handles resize events for the wave-axis-container.
   * Note: The wave-axis-container will be resized also when values-col or names-col are resized.
   */
  handleWaveAxisContainerResize() {
    console.log("handleWaveAxisContainerResize");
    const container = document.getElementById('wave-axis-container');
    if (!container) return;
    // Throttle resize handling to avoid excessive calls
    if (this._resizeTimeout) {
      clearTimeout(this._resizeTimeout);
    }
    this._resizeTimeout = setTimeout(() => {
      this.wave.setSize(container.clientWidth, container.clientHeight);
      this.wave.render();
      this._resizeTimeout = null;
    }, 100);
    return;
  }

  /**
   * Handles scroll events for the wave-axis-container.
   */
  handleHorizontalScroll() {
    const container = document.getElementById('wave-axis-container');
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    setTimeout(() => {
      this.wave.setLeftOffset(scrollLeft);
      this.wave.render();
    }, 0);
  }

  handleVerticalScroll() {
    console.log("handleVerticalScroll");
    // getting the scroll position
    const scrollTop = this.mainContainerScrolly.scrollTop;
    setTimeout(() => {
      this.wave.setScrollTop(scrollTop);
      this.wave.render();
    }, 0);
  }

  // Handle zoom (Ctrl + mouse wheel) and allow normal scroll otherwise
  attachZoomHandler() {
    const waveAxisContainer = document.getElementById('wave-axis-container');
    if (!waveAxisContainer) return;
    waveAxisContainer.addEventListener('wheel', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -e.deltaY / 1300 * 3; // deltaY is +/-138
        this.wave.zoomInOut(delta);
        this.wave.render();
      }
      // else: let normal scroll work
    }, { passive: false });
  }

  reload() {
    this.nameCol.init();
    this.valueCol.init();
    this.wave.init();

    this.nameCol.reload();
    this.valueCol.reload();
    this.wave.reload();
  }

  refresh() {
    this.nameCol.refresh();
    this.valueCol.refresh();
    this.wave.refresh();
  }

  clearAll() {
    this.nameCol.clearAll();
    this.valueCol.clearAll();
    this.wave.clearAll();
  }

  selectRow(rowId) {
    this.nameCol.selectRow(rowId);
    this.valueCol.selectRow(rowId);
    this.wave.selectRow(rowId);
  }

  deSelectRow(rowId) {
    this.nameCol.deSelectRow(rowId);
    this.valueCol.deSelectRow(rowId);
    this.wave.deSelectRow(rowId);
  }

  moveRow(rowId, pos, parent) {
    this.tree.move(rowId, pos, parent);
    this.nameCol.moveRow(rowId, pos, parent);
    this.valueCol.moveRow(rowId, pos, parent);
    this.wave.moveRow(rowId, pos, parent);
  }

  openGroup(rowId) {
    this.tree.open(rowId);
    this.nameCol.openGroup(rowId);
    this.valueCol.openGroup(rowId);
    this.wave.openGroup(rowId);
  }

  closeGroup(rowId) {
    this.tree.close(rowId);
    this.nameCol.closeGroup(rowId);
    this.valueCol.closeGroup(rowId);
    this.wave.closeGroup(rowId);
  }

  removeRow(rowId) {
    this.tree.remove(rowId);
    this.nameCol.removeRow(rowId);
    this.valueCol.removeRow(rowId);
    this.wave.removeRow(rowId);
  }

  removeRows(rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach(element => {
      this.removeRow(element);
    });
  }

  /**
   * Insert a new signal to waveform window.
   *
   * @param {string[]} hierarchy
   * @param {number} position
   */
  insertWaveSignal(hierarchy, parent = null, position = -1, busAsBus = true, render = true) {
    /** @type {SimulationObject} obj */
    const obj = this.simDB.getObject(hierarchy);
    /** @type {WaveformRow} rowItem */
    const rowItem = new WaveformRow(obj);

    this.tree.insert(rowItem.id, parent, position, rowItem);

    if (busAsBus && rowItem.waveStyle == "bus") {
      // If the signal is a bus, insert all sub-signals
      for (var i = 0; i < obj.signal.width; i++) {
        const subObj = obj.cloneRange(i);
        const subRowItem = new WaveformRow(subObj);
        this.tree.insert(subRowItem.id, rowItem.id, position, subRowItem);
      }
    }

    if (render) {
      this.nameCol.reload();
      this.valueCol.reload();
    }

    return rowItem.id;
  }

  /**
   * Add all signal from the simDB to the waveform window.
   */
  addAllWaveSignal(clear = true) {
    if (clear) {
      this.tree = new Tree();
    }

    for (var key in this.simDB.objects) {
      if (Object.prototype.hasOwnProperty.call(this.simDB.objects, key)) {
        if (this.simDB.objects[key].type == SimulationObject.Type.SIGNAL) {
          this.insertWaveSignal(
            key.split("."), // hierarchy
            null,           // parent = null
            -1,             // position = -1,
            true,           // busAsBus = true
            false           // render = false
          );
        }
      }
    }
    this.nameCol.reload();
    this.valueCol.reload();
  }

  addObjects(hierarchies) {
    hierarchies.forEach((hier) => this.insertWaveSignal(hier));
  }

  getRows({
    traverse = Tree.Traverse.PREORDER,
    parent = null,
    hidden = true,
    content = false,
  } = {}) {
    var field = content ? "data" : null;
    return this.tree.getChildren(parent, traverse, field, hidden);
  }

  getRow({ id, content = false }) {
    const n = this.get(id);
    return content ? n.data : n;
  }

  getSelectedRows(ids = true) {
    if (ids) {
      return this.nameCol.getSelectedRows();
    } else {
      // return rows itself
      return this.nameCol
        .getSelectedRows()
        .map((element) => this.tree.get(element).data);
    }
  }

  getActiveRow(id = true) {
    const activeId = this.nameCol.getActiveRow();
    if (id) {
      return activeId;
    } else {
      return this.tree.get(activeId).data;
    }
  }

  rename(rowId, name) {
    this.tree.get(rowId).data.name = name;
    this.nameCol.reload();
  }

  setRadix(radix, rowIds) {
    if (rowIds === undefined) {
      rowIds = this.getSelectedRows();
    }
    rowIds.forEach((element) => {
      this.tree.get(element).forEach((n) => {
        n.data.setRadix(radix);
      });
      this.valueCol.setRadix(element);
      this.wave.setRadix(element);
    });
  }

  moveCursorTo(time) {
  }

  getCursorTime() {
    return this.wave.getCursorTime();
  }


  zoomFit() {
    this.wave.zoomFit();
  }

  zoomAutoscale() {
    this.wave.zoomAutoscale();
  }

  zoomIn() {
    this.wave.zoomIn();
  }

  zoomOut() {
    this.wave.zoomOut();
  }
}

