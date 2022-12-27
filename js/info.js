import * as api from "/js/api.js"
import * as utils from "/js/utils.js";

export const elements_list = [
  "selected_student_name", "selected_student_year", "selected_student_img",
  "selected_student", "menu_student_template", "students_menu",
  "arrows_seperate", "arrows_union", "logout_button"
];
export const elements = {};
export var selected_student = null;
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
  
  elements.logout_button.addEventListener("click", function(){
    api.logout();
    console.log("Logged out. Redirecting...");
    window.location.href = "/";
  })
  
  console.log("Loading students...")
  load_students();
}

function load_students() {
  api.get_students(function(r){
    if (r.success) {
      students = r.json.data.students;
      display_student(students[0]);
      populate_students_menu(students);
      elements.selected_student.addEventListener("click", toggle_students_menu);
    }
    else {
      console.log("Stored session is not valid. Redirecting...");
      window.location.href = "/";
    }
  });
}

function select_student(student_id) {
  api.set_student(student_id, function(){});
  toggle_students_menu();
}

function populate_students_menu(students) {
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
    api.get_student_image(student.student_id, function(r){
      if (r.success) {
        let img = r.json.data.b64;
        student_img.src = img;
        student.image = img;
        
        if (student.id == selected_student.id) {
          elements.selected_student_img.src = img;
        }
      }
    });
    
    student_button.addEventListener("click", function(){select_student(student.id)});
    
    elements.students_menu.insertBefore(student_button, elements.logout_button);
  }
}

function toggle_students_menu() {
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

function display_student(student) {
  selected_student = student;
  elements.selected_student_name.innerHTML = student.name;
  elements.selected_student_year.innerHTML = student.year;
}

main();