import requests, json, re, time
from modules import utils, exceptions, datatypes
import lxml.html

q_endpoints = {
  "login": "/Home/Login",
  "assignments": "/Home/LoadProfileData/Assignments",
  "main_page": "/Home/PortalMainPage",
  "set_student": "/StudentBanner/SetStudentBanner/{q_id}",
  "student_image": "/StudentBanner/ShowImage/{student_id}",
  "student_image_alt": "/Home/ShowPhoto",
  "demographics": "/Home/LoadProfileData/Demographics",
  "attendance" : "/Home/LoadProfileData/Attendance"
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

#extract session from response
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

#construct cookie string from session
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
  timer = datatypes.RequestTimer()
  r = requests.post(url, data=payload, headers=headers)
  timer.update_request()
  data = r.json()
  
  if data["valid"] == "1":
    session = extract_session(r.headers.get("set-cookie"))
    timer.update_finished()
    return datatypes.APIResult(session=session, success=True, timer=timer)
  else:
    raise exceptions.ForbiddenError("Username/Password is invalid.")

#get list of students in account
def get_students(endpoint, session, headers={}):
  url = endpoint + q_endpoints["main_page"]
  headers["cookie"] = construct_cookie(session)
  timer = datatypes.RequestTimer()
  r = requests.get(url, headers=headers)
  timer.update_request()

  document = lxml.html.document_fromstring(r.text)
  table_element = document.get_element_by_id("stuBannerTable")
  
  filter_func = lambda row: "sturow" in row.element.get("class").split()
  table = datatypes.Table(table_element, filter_func=filter_func)

  students = []
  for row in table.rows:
    attributes = {
      "id": int(row.id)
    }
    
    student_id_regex = r'"\/StudentPortal\/StudentBanner\/ShowImage\/(\d+)"'
    student_id_matches = re.findall(student_id_regex, row.data["unknown_1"])
    if len(student_id_matches) == 1:
      student_id = student_id_matches[0]
      attributes["student_id"] = int(student_id)
    
    students.append(datatypes.Student(attributes=attributes, table_data=row.data))
  
  timer.update_finished()
  return datatypes.APIResult(students=students, timer=timer)

#set the current student so that other data can be fetched
def set_current_student(endpoint, session, q_id, headers={}):
  url = endpoint + q_endpoints["set_student"].format(q_id=q_id)
  headers["cookie"] = construct_cookie(session)
  timer = datatypes.RequestTimer()
  r = requests.get(url, headers=headers, allow_redirects=False)
  timer.update_request()

  if r.status_code == 302:
    return datatypes.APIResult(success=True, timer=timer)
  else:
    raise exceptions.BadGatewayError(f"Could not set the current student. Endpoint returned status code {r.status_code}.")

#get a student's image
def get_student_image(endpoint, session, student_id=None, headers={}):
  if student_id:
    url = endpoint + q_endpoints["student_image"].format(student_id=student_id)
  else:
    url = endpoint + q_endpoints["student_image_alt"]
  headers["cookie"] = construct_cookie(session)
  
  timer = datatypes.RequestTimer()
  r = requests.get(url, headers=headers)
  timer.update_request()
  
  if r.status_code == 200 and r.headers.get("content-type"):
    content_type = r.headers.get("content-type")
    image_size = len(r.content)
    return datatypes.APIResult(data=r.content, image_size=image_size, timer=timer, content_type=content_type)
  else:
    raise exceptions.BadGatewayError("Could not get the student image.")

#get all assignments
def get_assignments(endpoint, session, headers={}, courses_only=False):
  url = endpoint + q_endpoints["assignments"]
  headers["cookie"] = construct_cookie(session)
  
  timer = datatypes.RequestTimer()
  r = requests.get(url, headers=headers)
  timer.update_request()
  
  if r.status_code != 200:
    raise exceptions.BadGatewayError(f"Could not fetch assignments. Endpoint returned status code {r.status_code}.")
  
  #parse html
  document = lxml.html.document_fromstring(r.text)
  
  courses = []
  counter = 0
  while True:
    counter += 1
    
    try:
      table_element = document.get_element_by_id(f"tblassign_{counter}")
    except KeyError:
      break
    table = datatypes.Table(table_element)
    
    #iterate through rows and process data
    assignments = []
    if not courses_only:
      for row in table.rows:
        table_data = row.data
        attributes = {}
        
        attributes["graded"] = not table_data["notyetgraded"]
        del table_data["notyetgraded"]
        attributes["extra_credit"] = bool(table_data["extracredit"])
        del table_data["extracredit"]
        
        assignment = datatypes.Assignment(attributes=attributes, table_data=table_data)
        assignments.append(assignment)
      
    #extract class data
    for child in table.element:
      if child.tag == "thead":
        thead = child
        break
    else:
      raise exceptions.BadGatewayError("Could not extract class metadata.")
    class_row = lxml.html.tostring(thead[0]).decode()
    
    #regex magic
    def run_regex(pattern, replace="", regex_flags=[]):
      matches = re.findall(pattern, class_row, *regex_flags)
      if len(matches) > 0:
        match = matches[0].strip().replace(replace, "")
        return match
      return None
      
    semester_regex = r'<label for="current" id="lblcurrent">Current</label>(.*?)<'
    semester = run_regex(semester_regex, replace="&#160;")
    
    grade_regex = r'<label for="grade" id="lblgrade">Grade</label>: </b>(.*?)[\s|<>]'
    grade = run_regex(grade_regex)
    
    progress_regex = r'<a href="JavaScript:OpenProgress\((\d+)\);" id="lnk\d+" title="Student Progress Report" style="color:#FFFFFF;">'
    progress_reports_id = run_regex(progress_regex)
    
    teacher_regex = r'<label for="teacher" id="lblteacher">Teacher</label>: </b>(.*?)<'
    teacher = run_regex(teacher_regex, regex_flags=[re.S])
    
    course_code_regex = r': (\S+)\s+(.+) \((\d+)\)'
    match = re.match(course_code_regex, table.caption.content);
    if match:
      period, course, course_code = match.groups()
      course_code = int(course_code)
    else:
      period = course = course_code = None
    
    #create class object
    attributes = {
      "teacher": teacher,
      "course": course,
      "course_code": course_code,
      "period": period,
      "semester": semester,
      "assignments": assignments,
      "grade": grade
    }
    courses.append(datatypes.Course(attributes=attributes))
    
  timer.update_finished()
  return datatypes.APIResult(courses=courses, timer=timer)

#get student demographics
def get_demographics(endpoint, session, headers={}):
  url = endpoint + q_endpoints["demographics"]
  headers["cookie"] = construct_cookie(session)
  
  timer = datatypes.RequestTimer()
  r = requests.get(url, headers=headers)
  timer.update_request()
  
  #parse document and table
  document = lxml.html.document_fromstring(r.text)
  table_element = document.xpath("//table[@aria-label='Demographics']")[0]
  
  table_data = {}
  for row in table_element:
    cell = row[0]
    while cell is not None and cell.xpath("child::*/label"):
      label = cell.xpath("child::*/label")[0]
      key = label.get("for")
      
      value_cell = cell.getnext()
      if value_cell is None:
        break
      
      text = value_cell.text
      if text is not None:
        text = text.strip()
      table_data[key] = text
      
      cell = value_cell.getnext()
  
  #create demographics object
  demographics = datatypes.Demographics(table_data=table_data)
  
  timer.update_finished()
  return datatypes.APIResult(demographics=demographics, timer=timer)
  
#get student attendance data
def get_attendance(endpoint, session, headers={}):
  url = endpoint + q_endpoints["attendance"]
  headers["cookie"] = construct_cookie(session)
  timer = datatypes.RequestTimer()
  r = requests.get(url, headers=headers)
  timer.update_request()
  
  #parse document and tables
  document = lxml.html.document_fromstring(r.text)
  summary_reason_element = document.get_element_by_id("SP-AttendanceByReason")
  summary_class_element = document.get_element_by_id("SP-AttendanceByClass")
  detailed_element = document.get_element_by_id("SP-AttendanceDetail")
  
  summary_reason_table = datatypes.Table(summary_reason_element)
  summary_class_table = datatypes.Table(summary_class_element)
  detailed_table = datatypes.Table(detailed_element)
  
  #get attendance data by reason
  attendance_reasons = {}
  for row in summary_reason_table.rows:
    key = row.data["attendanceitem"]
    value = int(row.data["periodcount"])
    attendance_reasons[key] = value
  summary_reason = datatypes.AttendanceReasons(table_data=attendance_reasons)

  #get attendance data by class
  summary_classes = []
  for row in summary_class_table.rows:
    course = datatypes.Course(attributes=row.data)
    course.tardy = int(course.tardy)
    course.excused = int(course.excused)
    course.unexcused = int(course.unexcused)
    summary_classes.append(course)
  
  #get detailed attendance data
  attendance_items = []
  for row in detailed_table.rows:
    reason_pretty = row.data["attendance"]
    reason = summary_reason.attributes_inverted[reason_pretty]
    
    course_regex = r'(\d+)-(\d+) (.+)'
    match = re.match(course_regex, row.data["course"])
    course_code, course_section, course = match.groups()
    
    item_attributes = {
      "reason": reason,
      "course_code": course_code,
      "course": course
    }
    attendance_item = datatypes.AttendanceItem(attributes=item_attributes, table_data=row.data)
    attendance_items.append(attendance_item)
  
  #create attendance object
  attributes = {
    "summary_classes": summary_classes,
    "summary_reason": attendance_reasons,
    "attendance_items": attendance_items
  }
  attendance = datatypes.Attendance(attributes=attributes)
  
  timer.update_finished()
  return datatypes.APIResult(attendance=attendance, timer=timer)