import $ from 'jquery';
import 'jstree'; // extend jQuery with .jstree()
import { WaveTable } from "./WaveTable.js";

export class NameCol {
  constructor(waveTable, init=true) {
    /** @type {string} */
    this.containerName = '#names-col-container-scroll';
    /** @type {WaveTable} */
    this.waveTable = waveTable;

    this.ready = false;

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
    }).on('move_node.jstree', function (e, data) {
      self.waveTable.moveRow(data.node.data, data.position);
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
    }, 0);

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
      treeObj['text'] = row.data.name;
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
    this._getTree().select_node(this.toId(rowId));
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
      element => element.data
    );
  }

  getActiveRow() {
    return this._getTree().get_selected(true)[0].data;
  }

  rename(rowId, name) {
    this._getTree().rename_node(this.toId(rowId), name);
  }

  toId(rowId){
    return `signal-name-${rowId}`;
  }

  _getTree(arg = true){
    return $(this.containerName).jstree(arg);
  }

  get_node(rowId){
    return this._getTree().get_node(this.toId(rowId));
  }

  editName(rowId){
    const nameEditorId="nameeditorinput";
    const nameEditorId2=`#${nameEditorId}`;
    const li = $(`#${this.toId(rowId)}`);
    li.find('a').toggle();
    li.find('div').toggle();
    const input = $("<input></input>")
      .attr('id', nameEditorId)
      .val(this.get_node(rowId).text)
      .keypress(e => {
        if (e.which == 13) {
          this.editNameEnd(rowId);
        }
        if(e.which == 27){
          this.editNameEnd(rowId, false);
        }
      })
      .focusout( e=>{
        this.editNameEnd(rowId, false);
      } );
    li.append(input);
    input.focus();
    input[0].setSelectionRange(0, 1000);
  }
  

  editNameEnd(rowId, accept=true){
    const li = $(`#${this.toId(rowId)}`);
    const input = li.find('input');
    const val = input.val();
    input.remove();
    li.find('a').toggle();
    li.find('div').toggle();
    if(accept){
      this.waveTable.rename(rowId, input.val());
    }
  }
}
