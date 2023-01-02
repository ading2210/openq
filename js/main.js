//===== main js file =====

/* global current_module, selected_page */
import * as info from "/js/modules/info.js";
import * as api from "/js/modules/api.js";
import * as utils from "/js/modules/utils.js";

export const modules = {};

export const module_paths = {
  assignments: "/js/assignments.js",
  attendance: "/js/attendance.js"
};

export function main() {
  if (api.load_q_endpoint() == null) {
    api.retrieve_default_endpoint(true);
  }
  api.load_session();
  
  info.main();
  window.addEventListener("load", on_load);
}

export function on_load() {
  //load selected module
  if (current_module) {
    let module_path = module_paths[current_module];
    load_module(current_module, module_path);
  }
  //highlight link to selected page
  let selected_link = document.getElementById(selected_page);
  if (selected_link != null) {
    selected_link.className = "sidebar_button_selected"; 
  }
}

export function load_module(module_name, module_path) {
  //import and run module
  import(module_path)
    .then(function(module) {
      console.log(`Loaded module: ${module_path}`);
      modules[module_name] = module;
      modules[module_name].main();
    })
    .catch(function(error) {
      console.error(error);
    });
}

main();