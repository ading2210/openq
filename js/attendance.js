import * as info from "/js/modules/info.js";
import * as api from "/js/modules/api.js";
import * as utils from "/js/modules/utils.js";

export const elements_list = ["attendance_summary_table", "attendance_summary_table_body"];
export var elements = {};

export function main() {
  //set up scripts for the sidebar
  info.main();
  
  window.addEventListener("load", on_load);
}

export function on_load() {
  elements = utils.get_elements(elements_list);
  
  if (info.students == null) {
    info.set_students_callback(load_attendance);
  }
  else {
    load_attendance();
  }
}

export function load_attendance() {
  api.get_attendance(function(r) {
    if (r.success) {
      console.log("Loaded attendance info from API.")
    }
  });
}

main();