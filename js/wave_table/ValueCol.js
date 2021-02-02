import { WaveTable } from "./WaveTable.js";

export class ValueCol {
  constructor(waveTable, init=true) {
    /**  @type {String} */
    this.containerName = '#values-col-container';
    /**  @type {WaveTable} */
    this.waveTable = waveTable;

    if(init){
      this.init();
    }
  }

  init(){
    const self = this;
    
    $(this.containerName).jstree("destroy").empty();
    $(this.containerName).jstree({
      'plugins': ['wholerow', 'dnd', 'changed'],
      'core': {
        'data': [],
        'animation': false,
        "themes": {
          "icons": false
        },
        "check_callback": function (op, node, par, pos, more) {
          if (more && more.dnd) {
            return more.pos !== "i" && par.id == node.parent;
          }
          return true;
        },
      },
    }).on('open_node.jstree', function (e, data) {
      self.waveTable.openGroup(data.node.data);
    }).on('close_node.jstree', function (e, data) {
      self.waveTable.closeGroup(data.node.data);
    }).on('changed.jstree', function (evt, data) {
      data.changed.selected.forEach(element => {
        const data = self._getTree().get_node(element).data;
        self.waveTable.selectRow(data);
      });
      data.changed.deselected.forEach(element => {
        const data = self._getTree().get_node(element).data;
        self.waveTable.deSelectRow(data);
      });
    });

    setTimeout(() => {
      
      this.reload();
    }, 100);

  }

  reload() {
    const tree = []
    this.waveTable.getRows().forEach(row => {
      var treeObj = {};
      treeObj['id'] = this.toId(row.id);
      if (row.parent.id == '#') {
        treeObj['parent'] = '#';
      } else {
        treeObj['parent'] = this.toId(row.parent.id);
      }
      treeObj['text'] = row.data.getValueAt(0);
      treeObj['data'] = row.id;
      tree.push(treeObj)
    });

    this._getTree().settings.core.data = tree;

    clearTimeout(this.renderTimeout);
    this.renderTimeout = setTimeout(() => {
      this.refresh();
    }, 10);
  }

  refresh(){
    this._getTree().refresh();
  }

  clearAll() {
    $(this.containerName).jstree("destroy").empty();
    // d3.select(this.containerName).selectAll("*").remove();
  }

  selectRow(rowId) {
    this._getTree().select_node(this.toId(rowId));
  }

  deSelectRow(rowId) {
    this._getTree().deselect_node(this.toId(rowId));
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    this._getTree().open_node(this.toId(rowId));
  }

  closeGroup(rowId) {
    this._getTree().close_node(this.toId(rowId));
  }

  insertRow(rowId, parent, pos = 'last') {
    this.reload();
  }

  removeRow(rowId) {
    this.removeRows(rowId);
  }

  removeRows(rowIds) {
    this._getTree().delete_node(this.toId(rowIds));
  }

  getSelectedRows() {
    return this._getTree().get_selected(true).map(
      element => waveTable.get(element.data)
    );
  }

  getActiveRow() {
    return waveTable.get($(this.containerName).get_selected(true)[0].data);
  }

  showValuesAt(time) {
    if(time === undefined){
      time = this.waveTable.getCursorTime();
    }
    this.waveTable.getRows().forEach(row => {
      this._getTree().rename_node(this.toId(row.id), row.data.getValueAt(time));
    });
  }

  toId(rowId){
    return `signal-value-${rowId}`;
  }
  
  _getTree(arg = true){
    return $(this.containerName).jstree(arg);
  }

  setRadix(rowId){
    this.showValuesAt();
  }
  
}
