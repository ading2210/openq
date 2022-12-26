import requests, json, re
from modules import utils, exceptions, datatypes
import lxml.html

q_endpoints = {
  "login": "/Home/Login",
  "assignments": "/Home/LoadProfileData/Assignments",
  "main_page": "/Home/PortalMainPage"
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

def parse_table(table):
  pass
  
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
    students.append(datatypes.Student(row.id, **row.data))
  
  return students

#set the current student so that other data can be fetched
def set_current_student(endpoint, session, student_id):
  pass