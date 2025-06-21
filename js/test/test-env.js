import $ from "jquery";
// import 'jquery-ui/themes/base/resizable.css';

window.jQuery = $;
require('jquery-ui/ui/version');
require('jquery-ui/ui/plugin');
require('jquery-ui/ui/widget');
require('jquery-ui/ui/widgets/mouse');
require('jquery-ui/ui/widgets/resizable');

// Ensure jsdom is set up (Jest does this by default, but this is a safe place for global test setup)
if (typeof window === 'undefined') {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
}

console.log(`============ env-setup Loaded ===========`);
