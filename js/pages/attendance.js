import * as app from "/js/app.js";
import * as api from "/js/modules/api.js";
import * as dom from "/js/modules/dom.js";

export const elements = {};

export function main() {
  app.set_title("Attendance - OpenQ");
  setup_document();
  load_attendance();
}

export function setup_document() {
  elements.course_table = dom.Table.add_table(app.elements.main_div, {
    columns: {
      period: {text: "Period", classes: "text-center"},
      course: {text: "Course", classes: "min-w-[12rem]"},
      teacher: {text: "Teacher", classes: "w-full min-w-[12rem]"},
      tardy: {text: "Tardy", classes: "text-center"},
      excused: {text: "Excused", classes: "text-center"},
      unexcused: {text: "Unexcused", classes: "text-center"}
    },
    header: "Attendance Summary by Course:"
  });
  
  elements.reason_table = dom.Table.add_table(app.elements.main_div, {
    columns: {
      reason: {text: "Reason", classes: "w-full min-w-[12rem]"},
      count: {text: "Count", classes: "text-center min-w-[6rem]"},
    },
    header: "Attendance Summary by Reason:"
  });
  
  elements.items_table = dom.Table.add_table(app.elements.main_div, {
    columns: {
      date: {text: "Date", classes: "text-center"},
      period: {text: "Period", classes: "text-center"},
      course: {text: "Course", classes: "min-w-[12rem]"},
      teacher: {text: "Teacher", classes: "w-full min-w-[12rem]"},
      attendance: {text: "Attendance", classes: "text-center min-w-[12rem]"}
    },
    header: "Attendance Detail:"
  });
}

export function load_attendance() {
  api.get_attendance(function(r) {
    if (r.success) {
      console.log("Loaded attendance data from API.");
      populate_tables(r.json.data.attendance);
    }
    else {
      app.handle_error(r);
    }
  });
}

export function populate_tables(attendance) {
  let reasons = {
    present: "Present",
    field_trip: "Field Trip",
    sick: "Illness or Sickness",
    absent: "Unexcused Absence",
    tardy: "Unexcuesed Tardy",
    medical: "Medical",
    school_pass: "School Pass",
  };
  
  for (let course of attendance.summary_classes) {
    let row = elements.course_table.create_row(course);
    elements.course_table.add_row(row);
  }
  
  for (let reason of Object.keys(reasons)) {
    let data = {
      "reason": reasons[reason],
      "count": attendance.summary_reason[reason]
    };
    let row = elements.reason_table.create_row(data);
    elements.reason_table.add_row(row);
  }
  
  for (let item of attendance.attendance_items) {
    item["attendance"] = reasons[item["reason"]];
    let row = elements.items_table.create_row(item);
    elements.items_table.add_row(row);
  }
}