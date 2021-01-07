import {
  showSignals,
  zoomAutoscale,
  zoomFit,
  zoomOut,
  zoomIn,
  removeAllSignals,
  dbg_setEnableUpdateRenderRange,
  dbg_setEnableRender,
  moveCursorTo,
  getCursorTime,
} from './wave.js';

import {
  getTimeAnyTransition
} from './core.js';

import {
  simDB,
} from './core.js';

import {
  waveformDB
} from './core/WaveformDB.js';
import { showTree } from './tree.js';

// TODO should be moved somewhere else.
export var config = {};


$(".demo-file-button").click(function () {
  $.ajax({
    url: "parse-vcd",
    type: "POST",
    data: JSON.stringify({
      fname: $(this).attr('data-file'),
      other_fields: {
        a: 1,
        b: null
      }
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: initShow
  })
});

$("#zoom-fit").click(() => {
  zoomFit();
});

$("#zoom-autoscale").click(() => {
  zoomAutoscale();
});

$("#zoom-in").click(() => {
  zoomIn();
});

$("#zoom-out").click(() => {
  zoomOut();
});

$("#remove-all").click(() => {
  removeAllSignals();
});

$("#cursor-to-0").click(() => {
  moveCursorTo(0);
});

$("#cursor-to-end").click(() => {
  moveCursorTo(simDB.now);
});

$("#cursor-to-prev-transition").click(() => {
  const tCurr = getCursorTime();
  const sig = getActiveSignal();
  const tNew = getTimeAnyTransition(sig.simObj, tCurr, -1);
  moveCursorTo(tNew);
});

$("#cursor-to-next-transition").click(() => {
  const tCurr = getCursorTime();
  const sig = getActiveSignal();
  const tNew = getTimeAnyTransition(sig.simObj, tCurr, +1);
  moveCursorTo(tNew);
});

$( ".resizable-col" ).resizable({
  handles: "e"
  });

$("#dbg_updateRenderRange").click(() => {
  dbg_setEnableUpdateRenderRange($("#dbg_updateRenderRange").is(":checked"));
});

$("#dbg_enableRender").click(() => {
  dbg_setEnableRender($("#dbg_enableRender").is(":checked"));
});

$("#file-open-button").click(() => {
  $("#file-open-shadow").click();
});

$("#fileopenmenu").click(() => {
  $("#file-open-shadow").click();
});

$("#file-open-shadow").on('change', openFile);

function vcdpy2simDb(parsedContent) {
  parsedContent["signals"] = parsedContent["children"];
  delete parsedContent["children"];
  
  return parsedContent;
}

$.ajax({
  url: 'defaults.json',
  dataType: 'json',
  success: function (data) {
    config = data;

    $( ".resizable-col" ).resizable({
      handles: "e"
      });
  },
  error: function (data, textStatus, errorThrown) {
    alert(`While getting defaults.json: ${textStatus} ${errorThrown}`);
  }
})

function initShow(data){
  console.log(data);
  simDB.init(vcdpy2simDb(data));
  waveformDB.addAllWaveSignal();
  simDB.updateDBInitialX();
  showTree();

  console.log(simDB);

  setTimeout(() => {
    showSignals()
  }, 0)
}

function getHighlightedSignals(){
  var sig = d3.selectAll('.signal-name.highlighted-signal').data();
  return sig;
}

function getActiveSignal(){
  var sig = d3.select('.signal-name.active-signal').datum();
  return sig;
}

/**
 * Clear the highlight of a given (or all) signal. The highlighted signal has vivid blue background
 * color, and the cursor will step on this signal's transients.
 * 
 * @param {string} signalID The ID of the signal that has to be de-highlighted or null to de
 * highlight all signals.
 */
export function deHighlightSignal(signalID=undefined){
  if(signalID === undefined){
    d3.selectAll('.highlighted-signal').classed('highlighted-signal', false);
  } else {
    d3.selectAll(`.${signalID}`).classed('highlighted-signal', false);
  }
}

/**
 * Highlight a given signal. The highlighted signal has vivid blue background color, and the cursor
 * will step on this signal's transients.
 * 
 * @param {string} signalID The ID of the signal that has to be highlighted 
 */
export function highlightSignal(signalID, deHighlightOthers=true){
  if(deHighlightOthers){
    deHighlightSignal()
  }
  d3.selectAll(`.${signalID}`).classed('highlighted-signal', true);
  $('#names-col-container-scroll').jstree().select_node(`signal-name-${signalID}`);
}

/**
 * Highlight a given signal. The highlighted signal has vivid blue background color, and the cursor
 * will step on this signal's transients.
 * 
 * @param {string} signalID The ID of the signal that has to be highlighted 
 */
function toggleHighlightSignal(signalID, enableZeroSelection=false){
  const signalDOM = d3.selectAll(`.${signalID}`);
  signalDOM.classed('highlighted-signal', ! signalDOM.classed('highlighted-signal'));

  if(!enableZeroSelection){
    if(document.getElementsByClassName('highlighted-signal').length == 0){
      highlightSignal(signalID);
    }
  }
}

/**
 * Highlight a given signal. The highlighted signal has vivid blue background color, and the cursor
 * will step on this signal's transients.
 * 
 * @param {string} signalID The ID of the signal that has to be highlighted 
 */
function activateSignal(signalID){
  d3.selectAll('.active-signal').classed('active-signal', false);
  d3.selectAll(`.${signalID}`).classed('active-signal', true);
}
  
function openFile(event) {
  var input = event.target;
  var reader = new FileReader();
  reader.readAsText(input.files[0], "UTF-8");
  reader.onload = function (evt) {
    console.log(evt.target.result);
    
    $.ajax({
      url: "parse-vcd",
      type: "POST",
      data: JSON.stringify({
        fname: input.files[0].name,
        content: evt.target.result
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      success: initShow
    })

  }
}


$(function() {
  $.contextMenu({
      selector: '.signal-context-menu, #names-col-container .jstree-node', 
      callback: function(key, options) {
        switch (true) {
          case /remove/.test(key):
            waveformDB.removeRows(getHighlightedSignals())
            showSignals(false);
            break;
          case /radix-.+/.test(key):
            getHighlightedSignals()[0].radix = key.split('-')[1];
            break;
          case /waveStyle-.+/.test(key):
            // getHighlightedSignals()[0].radix = key.split('-')[1];
            break;
          default:
            console.log(`unknown key: ${key}`);
            break;
          } 
      },
      
      build: function($triggerElement, e){
        // The element what has been right-clicked, (which opened the context menu)
        var targ = e.target;
        while(!$(targ).hasClass('signal-highlighter')){
          targ = targ.parentElement;
          if(targ === null){
            console.log('ERROR tarrg is null');
            return {};
          }
        }
        if(getHighlightedSignals().length<=1){
          const waveformRow = d3.select(e.target).datum();
          highlightSignal(waveformRow.id);
        }
        return {
        };
      },
      zIndex: 1100,
      items: {
          "rename": {name: "Rename", icon: "edit"},
          "waveStyle": {
            name: "Wave Style",
            items: {
              "waveStyle-analog": {name: "analog"},
              "waveStyle-bus": {name: "bus"},
            }
          },
          "radix": {
            name: "Radix", 
            items: {
              "radix-bin": {name: "bin"},
              "radix-hex": {name: "hex"},
              "radix-signed": {name: "signed"},
              "radix-unsigned": {name: "unsigned"}
            }
          },
          "sep1": "---------",
          "group": {name: "New Group"},
          "virtualBus": {name: "New Virtual Bus"},
          "divider": {name: "New Divider"},
          "sep2": "---------",
          "remove": {name: "Remove", icon: "delete"}
      }
  });
});


export function updateHighlighterListener() {
  $('.signal-highlighter').click(function (e) {
    var targ = $(this);
    if(targ.hasClass('signal-highlighter')){
      var waveformRow = d3.select(this).datum();
      activateSignal(waveformRow.id);
      if(e.ctrlKey){
        toggleHighlightSignal(waveformRow.id);
      } else{
        highlightSignal(waveformRow.id);
      }
    } else {
      console.log(`undefined target: ${targ}`)
    }
  }
  )
}
