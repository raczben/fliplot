import $ from "jquery";
import { WaveTable } from "./WaveTable.js";

export class ValueCol {
  constructor(waveTable, init = true) {
    /**  @type {String} */
    this.domContainerName = "#values-col-container-scroll";
    /**  @type {String} */
    this.domContainer = $(this.domContainerName);
    if (this.domContainer.length == 0) {
      throw `ValueCol: Cannot find container ${this.domContainerName}`;
    }
    /**  @type {WaveTable} */
    this.waveTable = waveTable;

    if (init) {
      this.init();
    }
  }

  init() {
    this.domContainer.unbind();

    this.domContainer.on("click", ".value-col-item", (event) => {
      const rowId = $(event.currentTarget).data("row-id");
      const ctrlkey = event.ctrlKey || event.metaKey;
      const shiftkey = event.shiftKey;
      this.waveTable.rowClicked(rowId, shiftkey, ctrlkey);
    });
  }

  reload() {
    this.domContainer.empty();
    this.waveTable.getRows({ hidden: false }).forEach((row) => {
      var id = this.toId(row.id);
      var val = "asd";
      var data = row.id;

      // add a new div to domContainer
      this.domContainer.append(
        `<div id="${id}" class="value-col-item" data-row-id="${data}">${val}</div>`
      );
    });
    this.showValuesAt();
  }

  clearAll() {
    this.reload();
  }

  selectRow(rowId) {
    this.getDomItem(rowId).addClass("value-col-item-selected");
  }

  deSelectRow(rowId) {
    this.getDomItem(rowId).removeClass("value-col-item-selected");
  }

  deSelectAll(rowId) {
    $(".value-col-item").removeClass("value-col-item-selected");
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    this.reload();
  }

  closeGroup(rowId) {
    this.reload();
  }

  insertRow(rowId, parent, pos = "last") {
    this.reload();
  }

  removeRow(rowId) {
    this.reload();
  }

  removeRows(rowIds) {
    this.reload();
  }

  getSelectedRows() {
    return this.waveTable.getSelectedRows();
  }

  getActiveRow() {
    return this.waveTable.getActiveRow();
  }

  showValuesAt(time) {
    if (time === undefined) {
      time = this.waveTable.getCursorTime();
    }
    this.waveTable.getRows().forEach((row) => {
      this.getDomItem(row.id).text(row.getValueAt(time));
    });
  }

  toId(rowId) {
    return `signal-value-${rowId}`;
  }

  getDomItem(rowId) {
    return $(`#${this.toId(rowId)}`);
  }

  setRadix(rowId) {
    this.showValuesAt();
  }
}
