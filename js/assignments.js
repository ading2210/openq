import * as info from "/js/modules/info.js";
import * as api from "/js/modules/api.js";
import * as utils from "/js/modules/utils.js";

export const elements_list = ["grades_summary_table", "semester_text"];
export var elements = {};

export function main() {
  //set up scripts for the sidebar
  info.main();
  
  window.addEventListener("load", on_load);
}

export function on_load() {
  elements = utils.get_elements(elements_list);
  
  if (info.students == null) {
    info.set_students_callback(load_assignments);
  }
  else {
    load_assignments();
  }
}

export function load_assignments() {
  api.get_assignments(function(r) {
    if (r.success) {
      populate_assignments(r.json.data);
    }
  });
}

export function populate_assignments(assignments) {
  elements.semester_text.innerHTML = assignments.classes[0].semester;
}

main();