import * as api from "/js/api.js";
import * as utils from "/js/utils.js";

export var elements = {};
export var elements_list = [
  "password_input", "username_input", "login_form",
  "error_text", "username_error_text", "password_error_text"
];

function main() {
  //load q endpoint and session
  if (api.load_q_endpoint() == null) {
    api.retrieve_default_endpoint(true);
  }
  api.load_session();
  
  //check if we're already logged in
  if (api.session != "") {
    api.validate_session(function(r){
      if (r.getResponseHeader("success") == "true") {
        elements.error_text.innerHTML = "";
        console.log("Already logged in. Redirecting...")
        window.location.href = "/assignments";
      }
      else {
        console.log("Stored session is not valid.");
      }
    });
  }
  
  window.onload = onload;
}

function onload() {
  for (let id of elements_list) {
    let element = document.getElementById(id);
    elements[id] = element;
  }
  
  let events = ["blur", "keyup", "keydown"];
  for (let event of events) {
    elements.username_input.addEventListener(event, validate_username);
    elements.password_input.addEventListener(event, validate_password);
  }
  
  elements.login_form.onsubmit = submit_login;
}

function toggle_visibility() {
  if (elements.password_input.type == "password") {
    elements.password_input.type = "text";
  } else {
    elements.password_input.type = "password";
  }
}

function login_callback(r) {
  if (r.success) {
    let new_session = r.json["session"];
    window.localStorage.setItem("session", new_session);
    
    window.location.href = "/assignments";
  }
  else {
    elements.error_text.innerHTML = r.json.message;
  }
}

function submit_login(){
  let password = elements.password_input.value;
  let username = elements.username_input.value;
  
  api.login(username, password, login_callback);
  elements.error_text.innerHTML = "";
  
  return false;
}

function validate_username() {
  if (elements.username_input.value == "") {
    elements.username_error_text.innerHTML = "Username cannot be blank.";
  }
  else {
    elements.username_error_text.innerHTML = "&nbsp;";
  }
}

function validate_password() {
  if (elements.password_input.value == "") {
    elements.password_error_text.innerHTML = "Password cannot be blank.";
  }
  else {
    elements.password_error_text.innerHTML = "&nbsp;";
  }
}

main();