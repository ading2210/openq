import * as api from "/js/api.js"

api.set_q_endpoint("https://sis.pleasantonusd.net/StudentPortal");

var password_input, username_input, login_form;

function toggle_visibility() {
  if (password_input.type == "password") {
    password_input.type = "text";
  } else {
    password_input.type = "password";
  }
}

function submit_login(){
  let password = password_input.value;
  let username = username_input.value;
  
  api.login(username, password, function(){});
  
  return false;
}

window.onload = function() {
  password_input = document.getElementById("password_input");
  username_input = document.getElementById("username_input");
  login_form = document.getElementById("login_form");
  
  login_form.onsubmit = submit_login;
}