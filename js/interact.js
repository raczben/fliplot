import $ from "jquery";
import "jquery-ui/dist/jquery-ui"; // https://stackoverflow.com/a/75920162/2506522
import "jquery-ui/ui/widgets/resizable";
import "jquery-contextmenu";
import { VCDParser } from "./core/VCDParser.js";
import { SimDB } from "./core/SimDB.js";

import { ObjectTree } from "./ObjectTree.js";
import { WaveTable } from "./wave_table/WaveTable.js";

// TODO should be moved somewhere else.
export var config = {};

export var simDB = new SimDB();

$(function () {
  window.waveTable = new WaveTable(simDB);
});

function showSignals() {
  window.waveTable.wave.init();
  window.waveTable.reload();

  setTimeout(() => {
    window.waveTable.moveCursorTo(0);
    window.waveTable.wave.render();
  }, 0);
}
/**
 *  Fetch the demo file from the server, parse it with VCDParser,
 * and call initShow() to plot the signals.
 */
$(".demo-file-button").on("click", function () {
  const fname = $(this).attr("data-file");
  console.log(`Fetching demo file: ${fname}`);
  $.ajax({
    url: `./${fname}`,
    type: "GET",
    dataType: "text",
    // ajax get XML Parsing Error: not well-formed
    // https://stackoverflow.com/a/56521064/2506522
    beforeSend: (xhr) => {
      xhr.overrideMimeType("text/plain; charset=x-user-defined");
    },
    success: parseInitShow,
    error: function (xhr, status, error) {
      alert(`Error fetching demo file ${fname}: ${error}`);
    }
  });
});

$("#zoom-fit").on("click", () => {
  window.waveTable.zoomFit();
});

$("#zoom-autoscale").on("click", () => {
  window.waveTable.zoomAutoscale();
});

$("#zoom-in").on("click", () => {
  window.waveTable.zoomIn();
});

$("#zoom-out").on("click", () => {
  window.waveTable.zoomOut();
});

$("#remove-all").on("click", () => {
  window.waveTable.clearAll();
});

$("#cursor-to-0").on("click", () => {
  window.waveTable.moveCursorTo(0);
});

$("#cursor-to-end").on("click", () => {
  window.waveTable.moveCursorTo(simDB.now);
});

$("#cursor-to-prev-transition").on("click", () => {
  const tCurr = window.waveTable.getCursorTime();
  const sig = window.waveTable.getActiveRow(false);
  const tNew = sig.simObj.getTransitionTimeAny(tCurr, -1);
  window.waveTable.moveCursorTo(tNew);
});

$("#cursor-to-next-transition").on("click", () => {
  const tCurr = window.waveTable.getCursorTime();
  const sig = window.waveTable.getActiveRow(false);
  const tNew = sig.simObj.getTransitionTimeAny(tCurr, +1);
  window.waveTable.moveCursorTo(tNew);
});

$("#cursor-to-next-rise").on("click", () => {
  const tCurr = window.waveTable.getCursorTime();
  const sig = window.waveTable.getActiveRow(false);
  const tNew = sig.simObj.getTransitionTimeRising(tCurr, +1);
  window.waveTable.moveCursorTo(tNew);
});

$("#cursor-to-prev-rise").on("click", () => {
  const tCurr = window.waveTable.getCursorTime();
  const sig = window.waveTable.getActiveRow(false);
  const tNew = sig.simObj.getTransitionTimeRising(tCurr, -1);
  window.waveTable.moveCursorTo(tNew);
});

$("#cursor-to-next-fall").on("click", () => {
  const tCurr = window.waveTable.getCursorTime();
  const sig = window.waveTable.getActiveRow(false);
  const tNew = sig.simObj.getTransitionTimeFalling(tCurr, +1);
  window.waveTable.moveCursorTo(tNew);
});

$("#cursor-to-prev-fall").on("click", () => {
  const tCurr = window.waveTable.getCursorTime();
  const sig = window.waveTable.getActiveRow(false);
  const tNew = sig.simObj.getTransitionTimeFalling(tCurr, -1);
  window.waveTable.moveCursorTo(tNew);
});

$(".resizable-col").resizable({
  handles: "e"
});

$("#file-open-button").on("click", () => {
  // For multiple source there is a shadow button
  // trigger it to open a file:
  $("#file-open-shadow").trigger("click");
});

$("#file-open-shadow").on("change", openFile);

$.ajax({
  url: "defaults.json",
  dataType: "json",
  success: function (data) {
    config = data;

    $(".resizable-col").resizable({
      handles: "e"
    });
  },
  error: function (data, textStatus, errorThrown) {
    alert(`While getting defaults.json: ${textStatus} ${errorThrown}`);
  }
});

function initShow(data) {
  console.log(data);
  simDB.init(data);
  // TODO: I would like to remove it:
  // Adds fantom 0th elements which are not present in the VCD file.
  simDB.updateDBInitialX();
  window.waveTable.addAllWaveSignal();
  const tree = new ObjectTree(window.waveTable);
  tree.showTree();

  console.log(simDB);

  setTimeout(() => {
    showSignals();
  }, 0);
}

/**
 *
 * @param {text} vcdcontent
 */
function parseInitShow(vcdcontent) {
  console.log("Parsing VCD content");
  const vcdparser = new VCDParser({ vcdcontent: vcdcontent });
  const vcddata = vcdparser.getData();
  initShow(vcddata);
}

/**
 * Clear the highlight of a given (or all) signal. The highlighted signal has vivid blue background
 * color, and the cursor will step on this signal's transients.
 *
 * @param {string} signalID The ID of the signal that has to be de-highlighted or null to de
 * highlight all signals.
 */
function deHighlightSignal(signalID = undefined) {
  if (signalID === undefined) {
    window.waveTable.getSelectedRows().forEach((rowid) => {
      deHighlightSignal(rowid);
    });
  } else {
    $("#names-col-container-scroll").jstree().deselect_node(`signal-name-${signalID}`);
    $("#values-col-container").jstree().deselect_node(`signal-value-${signalID}`);
    d3.selectAll(`.${signalID}`).classed("highlighted-signal", false);

    setTimeout(() => {
      if (window.waveTable.getSelectedRows().length == 0) {
        highlightSignal(signalID, false);
      }
    }, 10);
  }
}

/**
 * Highlight a given signal. The highlighted signal has vivid blue background color, and the cursor
 * will step on this signal's transients.
 *
 * @param {string} signalID The ID of the signal that has to be highlighted
 */
function highlightSignal(signalID, deHighlightOthers = true) {
  if (deHighlightOthers) {
    deHighlightSignal();
  }
  d3.selectAll(`.${signalID}`).classed("highlighted-signal", true);
  $("#names-col-container-scroll").jstree().select_node(`signal-name-${signalID}`);
  $("#values-col-container").jstree().select_node(`signal-value-${signalID}`);
}

/**
 * Highlight a given signal. The highlighted signal has vivid blue background color, and the cursor
 * will step on this signal's transients.
 *
 * @param {string} signalID The ID of the signal that has to be highlighted
 */
function toggleHighlightSignal(signalID, enableZeroSelection = false) {
  if (window.waveTable.getSelectedRows().includes(window.waveTable.get(signalID))) {
    deHighlightSignal(signalID);
  } else {
    highlightSignal(signalID, false);
  }
}

/**
 * Open a file from file input check the size (gives an alert above 1MB)
 * The reads the content of the file and call the parseInitShow() function.
 *
 * @param {*} event
 */
function openFile(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log("No file selected");
    return;
  }

  if (file.size > 1024 * 1024) {
    if (
      !confirm(
        "The selected file is larger than 1MB. Do you want to continue parsing this potentially huge file?"
      )
    ) {
      return;
    }
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    parseInitShow(content);
  };

  reader.onerror = function (e) {
    alert(`Error reading file: ${e.target.error.message}`);
  };

  reader.readAsText(file);
}

$(function () {
  $.contextMenu({
    selector:
      ".signal-context-menu, #names-col-container .jstree-node, #values-col-container .jstree-node",
    callback: function (key, options) {
      switch (true) {
        case /rename/.test(key):
          setTimeout(() => {
            window.waveTable.nameCol.editName(window.waveTable.getActiveRow());
          }, 0);
          break;
        case /remove/.test(key):
          setTimeout(() => {
            window.waveTable.removeRows();
          }, 0);
          break;
        case /radix-.+/.test(key):
          setTimeout(() => {
            window.waveTable.setRadix(key.split("-")[1]);
          }, 0);
          break;
        case /waveStyle-.+/.test(key):
          // window.waveTable.getSelectedRows()[0].radix = key.split('-')[1];
          break;
        default:
          console.log(`unknown key: ${key}`);
          break;
      }
    },

    build: function ($triggerElement, e) {
      // The element what has been right-clicked, (which opened the context menu)
      var targ = e.target;
      while (!$(targ).hasClass("signal-highlighter")) {
        targ = targ.parentElement;
        if (targ === null) {
          console.log("ERROR tarrg is null");
          return {};
        }
      }
      if (window.waveTable.getSelectedRows().length <= 1) {
        const waveformRow = d3.select(e.target).datum();
        highlightSignal(waveformRow.id);
      }
      return {};
    },
    zIndex: 1100,
    items: {
      rename: { name: "Rename", icon: "edit" },
      waveStyle: {
        name: "Wave Style",
        items: {
          "waveStyle-analog": { name: "analog" },
          "waveStyle-bus": { name: "bus" }
        }
      },
      radix: {
        name: "Radix",
        items: {
          "radix-bin": { name: "bin" },
          "radix-hex": { name: "hex" },
          "radix-signed": { name: "signed" },
          "radix-unsigned": { name: "unsigned" },
          // Add floating point option conditionally:
          // only a 32 bit signal can be set to float
          "radix-float": {
            name: "float",
            visible: function () {
              const row = window.waveTable.getActiveRow(false);
              return row && row.simObj.getWidth() === 32;
            }
          }
        }
      },
      sep1: "---------",
      group: { name: "New Group" },
      virtualBus: { name: "New Virtual Bus" },
      divider: { name: "New Divider" },
      sep2: "---------",
      remove: { name: "Remove", icon: "delete" }
    }
  });
});
