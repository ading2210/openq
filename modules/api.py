import requests, json, re
from modules import utils, exceptions, datatypes
import lxml.html

q_endpoints = {
  "login": "/Home/Login",
  "assignments": "/Home/LoadProfileData/Assignments",
  "main_page": "/Home/PortalMainPage",
  "set_student": "/StudentBanner/SetStudentBanner/{id}",
  "student_image": "/StudentBanner/ShowImage/{student_id}"
}

def debug_response(r):
  headers = dict(r.headers)
  try:
    content = r.json()
  except json.decoder.JSONDecodeError:
    content = r.text
    
  response = {
    "headers": dict(r.headers),
    "content": content,
    "status": r.status_code
  }
  return response

def extract_session(cookie):
  session_regex_1 = r"ASP\.NET_SessionId=([^;^ ]+)"
  session_regex_2 = r"LM_Aequitas=([^;^ ]+)"
  if cookie == None:
    raise exceptions.BadGatewayError("No cookie returned.")

  matches_1 = re.findall(session_regex_1, cookie)
  if len(matches_1) == 0:
    raise exceptions.BadGatewayError("SessionId not present in resposne.")
    
  matches_2 = re.findall(session_regex_2, cookie)
  if len(matches_2) == 0:
    raise exceptions.BadGatewayError("LM_Aequitas not present in resposne.")
  
  session = f"{matches_1[0]}:{matches_2[0]}"
  return session

def construct_cookie(session):
  session_split = session.split(":")
  if len(session_split) != 2:
    raise exceptions.BadRequestError("Session malformed.")
    
  return f"ASP.NET_SessionId={session_split[0]}; LM_Aequitas={session_split[1]}"

#returns the session info after login
def login(endpoint, username, password, headers={}):
  url = endpoint + q_endpoints["login"]
  payload = {
    "Pin": username,
    "Password": password
  }
  r = requests.post(url, data=payload, headers=headers)
  data = r.json()
  
  if data["valid"] == "1":
    return extract_session(r.headers.get("set-cookie"))
  else:
    raise exceptions.ForbiddenError("Username/Password is invalid.")

#get list of students in account
def get_students(endpoint, session, headers={}):
  url = endpoint + q_endpoints["main_page"]
  headers["cookie"] = construct_cookie(session)
  r = requests.get(url, headers=headers)

  document = lxml.html.document_fromstring(r.text)
  table_element = document.get_element_by_id("stuBannerTable")
  
  filter_func = lambda row: "sturow" in row.element.get("class").split()
  table = datatypes.Table(table_element, filter_func=filter_func)

  students = []
  for row in table.rows:
    attributes = {}
    
    student_id_regex = r'"\/StudentPortal\/StudentBanner\/ShowImage\/(\d+)"'
    student_id_matches = re.findall(student_id_regex, row.data["unknown_1"])
    if len(student_id_matches) == 1:
      student_id = student_id_matches[0]
      attributes["student_id"] = int(student_id)
    
    students.append(datatypes.Student(int(row.id), attributes=attributes, table_data=row.data))

  return students

#set the current student so that other data can be fetched
def set_current_student(endpoint, session, student_id, headers={}):
  url = endpoint + q_endpoints["set_student"].format(id=student_id)
  headers["cookie"] = construct_cookie(session)
  r = requests.get(url, headers=headers)
  
  if r.status_code == 304:
    return True
  else:
    raise exceptions.BadGatewayError("Could not set the current student.")

#get a student's image
def get_student_image(endpoint, session, student_id, headers={}):
  url = endpoint + q_endpoints["student_image"].format(student_id=student_id)
  headers["cookie"] = construct_cookie(session)
  r = requests.get(url, headers=headers)
  
  print(r.status_code)
  
  if r.status_code == 200 and r.headers.get("content-type"):
    return r.content, r.headers.get("content-type")
  else:
    raise exceptions.BadGatewayError("Could not get the student image.")