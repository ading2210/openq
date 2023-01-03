//===== module for displaying the assignments overview =====

import * as app from "/js/app.js";
import * as api from "/js/modules/api.js";
import * as dom from "/js/modules/dom.js";

export const elements = {};

export function main() {
  app.set_title("Assignments - OpenQ");
  setup_document();
  
  if (app.students == null) {
    app.set_students_callback(load_assignments);
  }
  else {
    load_assignments();
  }
}

export function setup_document() {
  elements.summary_table = dom.Table.add_table(app.elements.main_div, {
    columns: {
      period: {text: "Period", classes: "text-center"},
      course: {text: "Course"},
      teacher: {text: "Teacher"},
      grade: {text: "Grade", classes: "text-center"}
    },
    header: "Assignments Overview:",
    footer: "Click on a row to view detailed information."
  });
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