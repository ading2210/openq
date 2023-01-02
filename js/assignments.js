//===== module for displaying the assignments overview =====

import * as info from "/js/modules/info.js";
import * as api from "/js/modules/api.js";
import * as dom from "/js/modules/dom.js";

export const elements = {};

export function main() {
  setup_document();
  
  if (info.students == null) {
    info.set_students_callback(load_assignments);
  }
  else {
    load_assignments();
  }
}

export function setup_document() {
  elements.main_div = document.getElementById("main_div");
  
  elements.table_title = dom.create_element("h2", {
    classes: "text-xl",
    innerHTML: "Assignments Overview:"
  });
  elements.main_div.append(elements.table_title);
  
  let columns = {
    period: "Period",
    course: "Course",
    teacher: "Teacher",
    grade: "Grade"
  };
  elements.summary_table = dom.Table.import_table(columns);
  elements.main_div.append(elements.summary_table.table);
  
  elements.table_description = dom.create_element("p", {
    innerHTML: "Click on a row to view detailed information."
  });
  elements.main_div.append(elements.table_description);
}

export function load_assignments() {
  api.get_courses(function(r) {
    if (r.success) {
      console.log("Loaded courses from API.");
      populate_overview(r.json.data);
    }
  });
}

export function populate_overview(courses) {
  for (let course of courses.courses) {
    let row = elements.summary_table.create_row(course);
    row.element.addEventListener("click", function(){
      window.location.href = `/assignments/${course.course_code}`;
    });
    elements.summary_table.add_row(row);
  }
}