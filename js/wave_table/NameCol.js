import { waveformDB } from "../core/WaveformDB.js";

export class NameCol {
  constructor() {
    this.containerName = '#names-col-container-scroll';

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
    }).on('move_node.jstree', function (e, data, d) {
      openSignalGroup(data.node.data);
    }).on('open_node.jstree', function (e, data) {
      waveformDB.openGroup(data.node.data);
      // openSignalGroup(data.node.data);
    }).on('close_node.jstree', function (e, data) {
      waveformDB.closeGroup(data.node.data);
      // closeSignalGroup(data.node.data);
    }).on('changed.jstree', function (evt, data) {
      // waveformDB.selectionChanged(data.node.data);

      data.changed.selected.forEach(element => {
        const data = $(this.containerName).jstree().get_node(element).data;
        highlightSignal(data, false);
      });
      data.changed.deselected.forEach(element => {
        const data = $(this.containerName).jstree().get_node(element).data;
        deHighlightSignal(data, false);
      });
    });

    this.reload();

  }

  reload() {
    const tree = []
    waveformDB.rows.forEach(row => {
      var treeObj = {};
      treeObj['id'] = `signal-name-${row.id}`;
      treeObj['parent'] = '#';
      treeObj['text'] = row.name;
      treeObj['data'] = row.id;
      tree.push(treeObj)
      if (row.waveStyle == 'bus') {
        for (var idx = 0; idx < row.simObj.signal.width; idx++) {
          treeObj = {};
          treeObj['id'] = `signal-name-${row.id}.${idx}`;
          treeObj['parent'] = `signal-name-${row.id}`;
          treeObj['text'] = `[${idx}]`;
          treeObj['data'] = row.id;
          tree.push(treeObj)
        }
      }
    });

    $(this.containerName).jstree(true).settings.core.data = tree;
    this.refresh();
  }

  refresh(){
    $(this.containerName).jstree(true).refresh();
  }

  clearAll() {
    $(this.containerName).jstree("destroy").empty();
    // d3.select(this.containerName).selectAll("*").remove();
  }

  selectRow(rowId) {
    $(this.containerName).jstree().select_node(`signal-name-${rowId}`);
  }

  deSelectRow(rowId) {
    $(this.containerName).jstree().deselect_node(`signal-name-${rowId}`);
  }

  moveRow(rowId, pos) {
    this.reload();
  }

  openGroup(rowId) {
    $(this.containerName).jstree().open_node(`signal-name-${rowId}`);
  }

  closeGroup(rowId) {
    $(this.containerName).jstree().select_node(`signal-name-${rowId}`);
  }

  insertRow(rowId, pos = 'last') {
    const tree = [];
    const row = waveformDB.get(rowId)
    var treeObj = {};
    treeObj['id'] = `signal-name-${row.id}`;
    // treeObj['parent'] = '#';
    treeObj['text'] = row.name;
    treeObj['data'] = row.id;
    // tree.push(treeObj)
    $(this.containerName).jstree().create_node('#', treeObj, pos);
    if (row.waveStyle == 'bus') {
      for (var idx = 0; idx < row.simObj.signal.width; idx++) {
        treeObj = {};
        treeObj['id'] = `signal-name-${row.id}.${idx}`;
        treeObj['parent'] = `signal-name-${row.id}`;
        treeObj['text'] = `[${idx}]`;
        treeObj['data'] = row.id;
        $(this.containerName).jstree().create_node(`signal-name-${row.id}`, treeObj, pos);
      }
    }
  }

  removeRow(rowId) {
  }

  getSelectedRows() {
    return $(this.containerName).jstree.get_selected(true).map(
      element => waveformDB.get(element.data)
    );
  }

  getActiveRow() {
    return waveformDB.get($(this.containerName).get_selected(true)[0].data);
  }

  rename(rowId, name) {
    $('##names-col-container-scroll').jstree().rename_node(`signal-name-${rowId}`, name);
  }
}
