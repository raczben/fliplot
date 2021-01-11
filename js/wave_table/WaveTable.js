import { waveformDB } from "../core/WaveformDB.js";
import { NameCol } from "./NameCol.js";
import { ValueCol } from "./ValueCol.js";
import { Wave } from "./Wave.js";

export class WaveTable {
  constructor() {
    this.nameCol = new NameCol(this);
    this.valueCol = new ValueCol(this);
    this.wave = new Wave(this);
  }

  reload() {

    this.nameCol.init();
    this.valueCol.init();
    this.wave.init();

    this.nameCol.reload();
    this.valueCol.reload();
    this.wave.reload();
  }

  refresh(){
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

  moveRow(rowId, pos) {
    waveformDB.moveRow(rowId, pos);
    this.nameCol.moveRow(rowId, pos);
    this.valueCol.moveRow(rowId, pos);
    this.wave.moveRow(rowId, pos);
  }

  openGroup(rowId) {
    this.nameCol.openGroup(rowId);
    this.valueCol.openGroup(rowId);
    this.wave.openGroup(rowId);
  }

  closeGroup(rowId) {
    this.nameCol.closeGroup(rowId);
    this.valueCol.closeGroup(rowId);
    this.wave.closeGroup(rowId);
  }

  insertRow(rowId, pos = 'last') {
    this.nameCol.insertRow(rowId, pos);
    this.valueCol.insertRow(rowId, pos);
    this.wave.insertRow(rowId, pos);
  }

  removeRow(rowId) {
    waveformDB.removeRow(rowId);
    this.nameCol.removeRow(rowId);
    this.valueCol.removeRow(rowId);
    this.wave.removeRow(rowId);
  }
  
  removeRows(rowIds){
    rowIds.forEach(element => {
        this.removeRow(element);
    });
  }

  getSelectedRows(ids=true) {
    if(ids){
      return this.nameCol.getSelectedRows();
    } else{
      // return rows itself
      return this.nameCol.getSelectedRows().map(
        element => waveformDB.get(element)
      );
    }
  }

  getActiveRow() {
    return this.nameCol.getActiveRow();
  }

  moveCursorTo(time){
    this.wave.moveCursorTo(time);
    this.valueCol.showValuesAt(time);
  }

  getCursorTime() {
    return this.wave.getCursorTime();
  }

  
  zoomFit(){
    this.wave.zoomFit();
  }

  zoomAutoscale(){
    this.wave.zoomAutoscale();
  }
  
  zoomIn(){
    this.wave.zoomIn();
  }

  zoomOut(){
    this.wave.zoomOut();
  }
}

