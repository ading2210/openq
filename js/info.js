import * as api from "/js/api.js"
import * as utils from "/js/utils.js";

export const elements_list = [
  "selected_student_name", "selected_student_year", "selected_student_img"
];
export const elements = {};
export var students = [];

function main() {
  //load q endpoint and session
  if (api.load_q_endpoint() == null) {
    api.retrieve_default_endpoint(true);
  }
  api.load_session();
  
  window.onload = onload;
}

function onload() {
  for (let id of elements_list) {
    let element = document.getElementById(id);
    elements[id] = element;
  }
  console.log("Loading students...")
  load_students();
}

function load_students() {
  api.get_students(function(r){
    if (r.success) {
      students = r.json.data.students;
      display_student(students[0]);
    }
    else {
      console.log("Stored session is not valid. Redirecting...");
      window.setTimeout(function(){window.location.href = "/";}, 10000);
    }
  });
}

function display_student(student) {
  elements.selected_student_name.innerHTML = student.name;
  elements.selected_student_year.innerHTML = student.year;
  
  api.get_student_image(student.student_id, function(r){
    if (r.success) {
      elements.selected_student_img.src = r.json.data.b64;
    }
  })
}

main();