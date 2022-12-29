import * as info from "/js/modules/info.js";
import * as api from "/js/modules/api.js";
import * as utils from "/js/modules/utils.js";

export const elements_list = ["grades_summary_table", "grades_summary_table_body"];
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
  api.get_courses(function(r) {
    if (r.success) {
      console.log("Loaded courses from API.")
      populate_overview(r.json.data);
    }
  });
}

export function populate_overview(courses) {
  let tbody = elements.grades_summary_table_body;
  for (let user_class of courses.courses) {
    let row = document.createElement("tr");
    row.className = "table_row";
    
    let cell_data = ["period", "course", "teacher", "grade"];
    for (let cell_key of cell_data) {
      let cell_text = user_class[cell_key];
      let cell = document.createElement("td");
      cell.className = "table_cell";
      cell.innerHTML = cell_text;
      row.appendChild(cell);
    }
    
    row.addEventListener("click", function(){
      window.location.href = `/assignments/${user_class.course_code}`;
    })
    
    tbody.appendChild(row);
  }
}

main();