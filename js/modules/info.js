//===== functions for the sidebar and other

import * as api from "/js/modules/api.js"
import * as utils from "/js/modules/utils.js";

export const elements_list = [
  "selected_student_name", "selected_student_year", "selected_student_img",
  "selected_student", "menu_student_template", "students_menu",
  "arrows_seperate", "arrows_union", "logout_button", "title"
];
export var elements = {};
export var selected_student = null;
export var students = null;
export var on_students_load = null;

export function main() {
  window.addEventListener("load", on_load);
}

export function on_load() {
  elements = utils.get_elements(elements_list);
  
  elements.logout_button.addEventListener("click", function(){
    api.logout();
    console.log("Logged out. Redirecting...");
    window.location.href = "/";
  });
  
  load_students();
}

export function set_students_callback(callback) {
  on_students_load = callback;
}

export function load_students() {
  api.get_students(function(r){
    if (r.success) {
      console.log(`Loaded students from API.`)
      students = r.json.data.students;
      display_student(students[0]);
      populate_students_menu(students);
      elements.selected_student.addEventListener("click", toggle_students_menu);
      
      if (typeof on_students_load == "function") {
        on_students_load(r);
      }
    }
    else {
      console.log("Stored session is not valid. Redirecting...");
      window.location.href = "/";
    }
  });
}

export function select_student(id) {
  api.set_student(id, function(){});
  for (let student of students) {
    if (student.id == id) {
      selected_student = student;
      break;
    }
  }
  toggle_students_menu();
}

export function populate_students_menu(students) {
  for (let i=0; i<students.length; i++) {
    let student = students[i];
    let id_base = `menu_student_${i}`;
    let student_button = elements.menu_student_template.cloneNode(true);
    student_button.id = id_base;
    student_button.style.display = "flex";
    student_button.q_id = student.id;
    
    let student_name = student_button.querySelector("#menu_student_template_name");
    student_name.id = id_base+"_name";
    student_name.innerHTML = student.name;
    
    let student_year = student_button.querySelector("#menu_student_template_year");
    student_year.id = id_base+"_year";
    student_year.innerHTML = student.year;
    
    let student_img = student_button.querySelector("#menu_student_template_img");
    student_year.id = id_base+"_img";
    api.get_student_image(function(r){
      if (r.success) {
        let img = r.json.data.b64;
        student_img.src = img;
        student.image = img;
        
        if (student.id == selected_student.id) {
          elements.selected_student_img.src = img;
        }
      }
    }, {student_id: student.student_id, size: 128});
    
    student_button.addEventListener("click", function(){select_student(student.id)});
    
    elements.students_menu.insertBefore(student_button, elements.logout_button);
  }
}

export function toggle_students_menu() {
  if (elements.students_menu.style.display == "flex") {
    elements.students_menu.style.display = "none";
    elements.arrows_seperate.style.display = "initial";
    elements.arrows_union.style.display = "none";
    elements.selected_student.className = "student_button";
  }
  else {
    elements.students_menu.style.display = "flex";
    elements.arrows_seperate.style.display = "none";
    elements.arrows_union.style.display = "initial";
    elements.selected_student.className += " student_button_menu_open";
  }
}

export function display_student(student) {
  selected_student = student;
  elements.selected_student_name.innerHTML = student.name;
  elements.selected_student_year.innerHTML = student.year;
}