'use strict';

// Mock WaveTable
const mockWaveTable = {
  getRows: jest.fn().mockReturnValue([
    { id: 'a_bit-id', parent: { id: '#' }, data: { name: 'a_bit' } },
    { id: 'b_bit-id', parent: { id: '#' }, data: { name: 'b_bit' } },
    { id: 'bus8-id', parent: { id: '#' }, data: { name: 'bus8' } },
    { id: 'bus8[0]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[0]' } },
    { id: 'bus8[1]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[1]' } },
    { id: 'bus8[2]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[2]' } },
    { id: 'bus8[3]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[3]' } },
    { id: 'bus8[4]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[4]' } },
    { id: 'bus8[5]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[5]' } },
    { id: 'bus8[6]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[6]' } },
    { id: 'bus8[7]-id', parent: { id: 'bus8-id' }, data: { name: 'bus8[7]' } }
  ]),
  moveRow: jest.fn(),
  openGroup: jest.fn(),
  closeGroup: jest.fn(),
  selectRow: jest.fn(),
  deSelectRow: jest.fn(),
  rename: jest.fn(),
};

console.log("Mocking has finished---")

describe('NameCol', () => {
  let nameCol;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {

    // Add a container element to the document body for jsTree
    document.body.innerHTML = '<div id="epic-container">\
    <div id="structure-col" class="wave-table resizable-col">\
      <input id="structure-search" type="text" placeholder="Filter tree">\
      <div id="structure-container-scroll-y">\
        <div id="main-container-tree">\
          <div id="object-tree"></div>\
        </div>\
      </div>\
    </div>\
    <div id="main-container-scroll-y">\
      <div id="names-col-container" class="wave-table resizable-col">\
        <div id="names-col-container-scroll">\
        </div>\
        <div id="names-col-placeholder"></div>\
      </div>\
      <div id="values-col-container" class="wave-table resizable-col">\
        <div id="values-col-container-scroll">\
          <ul id="values-col" class="wave-table">\
          </ul>\
        </div>\
        <div id="values-col-placeholder"></div>\
      </div>\
      <div id="wave-axis-container" class="wave-table">\
        <div id="wave-time-placeholder">\
          <canvas id="wave-axis-canvas"></canvas>\
        </div>\
      </div>\
    </div>\
  </div>';
    // jest.mock('jstree', () => ({})); // Mock the jstree module before requiring NameCol.js
    // Patch NameCol to use mockWaveTable instead of requiring the real WaveTable
    jest.doMock('./WaveTable.js', () => ({
      WaveTable: jest.fn(() => mockWaveTable)
    }));
    const { NameCol } = require('./NameCol.js');
    jest.clearAllMocks();
    nameCol = new NameCol(mockWaveTable, false); // prevent auto-init
  });

  test('constructor sets properties', () => {
    expect(nameCol.containerName).toBe('#names-col-container-scroll');
    expect(nameCol.waveTable).toBe(mockWaveTable);
  });

  test('init initializes jstree and calls reload', () => {
    nameCol.init();
    // wait 120ms for the setTimeout in init
    jest.advanceTimersByTime(120);
    // Check if jsTree elements are present in the DOM
    const treeElement = document.querySelector('#names-col-container-scroll');
    const ul = treeElement.querySelector('ul');
    expect(ul).not.toBeNull();
    const liChildren = ul.querySelectorAll('li');
    expect(liChildren.length).toBe(3);
  });


  test('clearAll destroys and empties jstree', () => {
    nameCol.init();
    // wait 120ms for the setTimeout in init
    jest.advanceTimersByTime(120);
    // Check if jsTree elements are present in the DOM
    const treeElement = document.querySelector('#names-col-container-scroll');
    const ul = treeElement.querySelector('ul');
    expect(ul).not.toBeNull();
    const liChildren = ul.querySelectorAll('li');
    expect(liChildren.length).toBe(3);
    nameCol.clearAll()
    jest.advanceTimersByTime(120);
    expect(liChildren.length).toBe(0);
  });

  test('selectRow and deSelectRow call jstree', () => {
    const selectMock = jest.fn();
    const deselectMock = jest.fn();
    nameCol._getTree = jest.fn().mockReturnValue({ select_node: selectMock, deselect_node: deselectMock });
    nameCol.selectRow('row1');
    expect(selectMock).toHaveBeenCalled();
    nameCol.deSelectRow('row1');
    expect(deselectMock).toHaveBeenCalled();
  });

  test('moveRow calls reload', () => {
    nameCol.reload = jest.fn();
    nameCol.moveRow('row1', 0);
    expect(nameCol.reload).toHaveBeenCalled();
  });

  test('openGroup and closeGroup call jstree', () => {
    const openMock = jest.fn();
    const selectMock = jest.fn();
    nameCol._getTree = jest.fn().mockReturnValue({ open_node: openMock, select_node: selectMock });
    nameCol.openGroup('row1');
    expect(openMock).toHaveBeenCalled();
    nameCol.closeGroup('row1');
    expect(selectMock).toHaveBeenCalled();
  });

  test('insertRow calls reload', () => {
    nameCol.reload = jest.fn();
    nameCol.insertRow('row1', '#');
    expect(nameCol.reload).toHaveBeenCalled();
  });

  test('removeRow and removeRows call jstree delete_node', () => {
    const deleteMock = jest.fn();
    nameCol._getTree = jest.fn().mockReturnValue({ delete_node: deleteMock });
    nameCol.removeRow('row1');
    expect(deleteMock).toHaveBeenCalled();
    nameCol.removeRows('row1');
    expect(deleteMock).toHaveBeenCalled();
  });

  test('getSelectedRows returns selected data', () => {
    nameCol._getTree = jest.fn().mockReturnValue({ get_selected: jest.fn().mockReturnValue([{ data: 'row1' }, { data: 'row2' }]) });
    expect(nameCol.getSelectedRows()).toEqual(['row1', 'row2']);
  });

  test('getActiveRow returns first selected data', () => {
    nameCol._getTree = jest.fn().mockReturnValue({ get_selected: jest.fn().mockReturnValue([{ data: 'row1' }]) });
    expect(nameCol.getActiveRow()).toBe('row1');
  });

  test('rename calls jstree rename_node', () => {
    const renameMock = jest.fn();
    nameCol._getTree = jest.fn().mockReturnValue({ rename_node: renameMock });
    nameCol.rename('row1', 'NewName');
    expect(renameMock).toHaveBeenCalledWith('signal-name-row1', 'NewName');
  });

  test('toId returns correct id', () => {
    expect(nameCol.toId('row1')).toBe('signal-name-row1');
  });
});