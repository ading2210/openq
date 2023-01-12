//===== main js files =====

import * as api from "/js/modules/api.js";
import * as utils from "/js/modules/utils.js";
import * as dom from "/js/modules/dom.js";

export const elements_list = [
  "selected_student_name", "selected_student_year", "selected_student_img",
  "selected_student", "menu_student_template", "students_menu",
  "arrows_seperate", "arrows_union", "logout_button", "title", 
  "main_div", "menu_nav_links"
];
export var elements = {};
export var nav_links = {};
export var selected_student = null;
export var students = null;

export const module_paths = {
  assignments: {
    name: "Assignments", 
    url: "/js/pages/assignments.js",
  },
  demographics: {
    name: "Demographics", 
    url: "/js/pages/demographics.js"
  },
  attendance: {
    name: "Attendance", 
    url: "/js/pages/attendance.js"
  }
};

export const error_messages = {
  student_not_selected: {
    title: "Error:",
    body: "Student not selected."
  }
};

export var modules = {};
export var current_page = null;

//switch the current page and load the relavent scripts
export function switch_page(page) {
  console.log(`Loading page: ${page}`);

  //highlight link to selected page
  nav_links[current_page].className = "sidebar_button";
  nav_links[page].className = "sidebar_button_selected"; 
  
  //load selected module
  let module_path = module_paths[page].url;
  load_module(page, module_path);
  
  window.history.pushState({}, null, `/${page}`);
  current_page = page;
}

//load an es6 module and run it
export function load_module(module_name, module_path) {
  //import and run module
  if (typeof modules[module_name] == "undefined") {
    import(module_path)
      .then(function(module) {
        console.log(`Loaded module: ${module_path}`);
        modules[module_name] = module;
        utils.clear_element(elements.main_div);
        modules[module_name].main();
      })
      .catch(function(error) {
        console.error(error);
      });
  }
  else {
    utils.clear_element(elements.main_div);
    modules[module_name].main();
  }
}

//display an error message
export function display_error(title, body, traceback=null, r=null) {
  utils.clear_element(elements.main_div);
  
  let error_title = dom.create_element("h2", {
    classes: "text-xl",
    innerHTML: title
  });
  let error_text = dom.create_element("p", {
    innerHTML: body
  });
  elements.main_div.append(error_title, error_text);
  
  if (r) {
    let endpoint_text = dom.create_element("p", {
      innerHTML: `Endpoint: ${r.responseURL}`
    });
    elements.main_div.append(endpoint_text);
  }

  if (traceback) {
    let traceback_header = dom.create_element("p", {
      innerHTML: "Traceback:"
    });
    let traceback_text = dom.create_element("code", {
      classes: "bg-custom_bg_dark text-sm whitespace-pre overflow-x-auto p-4",
      innerHTML: traceback
    });
    elements.main_div.append(traceback_header, traceback_text);
  }
  
  let server_text = dom.create_element("p", {
    innerHTML: `Server: ${api.server}`
  });
  
  elements.main_div.append(server_text);
}

//handle api errors
export function handle_error(r) {
  let error = r.json;
  let title = `HTTP Error ${r.status}: ${error.error}`;
  let body = `Message: ${error.message}`;

  display_error(title, body, error.traceback, r);
}

//set the page title
export function set_title(title) {
  elements.title.innerHTML = title;
}

//load students from api
export function load_students() {
  api.get_students(function(r){
    if (r.success) {
      console.log(`Loaded students from API.`);
      students = r.json.data.students;
      display_student(students[0]);
      populate_students_menu(students);
      elements.selected_student.addEventListener("click", toggle_students_menu);
      
      if (!r.json.data.selected) {
        console.log("Student not selected.");
        let msg = error_messages.student_not_selected;
        display_error(msg.title, msg.body);
      }
    }
    else {
      console.log("Stored session is not valid. Redirecting...");
      //window.location.href = "/";
    }
  });
}

//select a student based on their id
export function select_student(id) {
  api.set_student(id, function(){});
  for (let student of students) {
    if (student.id == id) {
      selected_student = student;
      display_student(student);
      switch_page(current_page);
      break;
    }
  }
  toggle_students_menu();
}

//populate the students menu
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
    student_img.id = id_base+"_img";
    
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

//toggle the students button
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

//display a student
export function display_student(student) {
  selected_student = student;
  elements.selected_student_name.innerHTML = student.name;
  elements.selected_student_year.innerHTML = student.year;
  if (student.image) {
    elements.selected_student_img.src = student.image;
  }
}

//===== main functions =====

export function main(page) {
  if (page) {
    current_page = page;
  }
  
  if (api.load_q_endpoint() == null) {
    api.retrieve_default_endpoint(true);
  }
  api.load_session();
  
  window.addEventListener("DOMContentLoaded", on_load);
}

export function on_load() {
  elements = utils.get_elements(elements_list);
  
  elements.logout_button.addEventListener("click", function(){
    api.logout();
    console.log("Logged out. Redirecting...");
    window.location.href = "/";
  });
  
  for (let page of Object.keys(module_paths)) {
    let module = module_paths[page];
    let page_link = dom.create_element("button", {
      classes: "sidebar_button",
      innerHTML: module.name
    });
    page_link.addEventListener("click", function(){
      switch_page(page);
    });
    
    elements.menu_nav_links.append(page_link);
    nav_links[page] = page_link;
  }
  
  load_students();
  
  switch_page(current_page);
}
