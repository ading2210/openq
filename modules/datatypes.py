import json, re, time
import lxml.html
from modules import exceptions

#class for api request times
class RequestTimer:
  def __init__(self):
    self.start = time.time()*1000
    self.request = self.request_time = self.finish = 0
    self.processing_time = self.total_time = 0
    
  def update_request(self):
    self.request = time.time()*1000
    self.request_time = self.request - self.start
    self.total_time = self.request_time
  
  def update_finished(self):
    self.finish = time.time()*1000
    self.total_time = self.finish - self.start
    self.processing_time = self.finish - self.request
  
  def encode_as_dict(self):
    return {
      "request_time": self.request_time,
      "processing_time": self.processing_time,
      "total_time": self.total_time
    }

#class for data returned from the api
class APIResult:
  def __init__(self, **kwargs):
    for key in kwargs:
      setattr(self, key, kwargs[key])
  
  def encode_as_dict(self):
    return vars(self)

#classes for tables
class TableColumn:
  def __init__(self, id, title):
    self.id = id
    self.title = title

class TableCaption:
  def __init__(self, id, title, content):
    self.id = id
    self.title = title
    self.content = content

class TableHeader:
  def __init__(self, element):
    self.columns = []
    self.ids = []
    
    if element[0].tag == "tr":
      element = element[-1]
    
    self.element = element
    
    for i in range(0, len(element)):
      child = element[i]
      if child.tag == "th":
        label = child[0]
        item = TableColumn(label.get("for"), label.text)
        self.columns.append(item)
      elif child.tag == "td":
        text = "unknown_"+str(i)
        item = TableColumn(text, text)
        self.columns.append(item)

    for column in self.columns:
      self.ids.append(column.id)

class TableRow:
  def __init__(self, header, element):
    self.header = header
    self.element = element
    self.id = element.get("id")
    self.data = {}
    self.data_list = []
    
    for i in range(0, len(header.ids)):
      cell = element[i]
      cell_id = header.ids[i]
      
      data = cell.text or ""
      if len(cell) > 0:
        if cell[0].tag == "img" and cell[0].get("alt") == "checked":
          data = "true"
        else:
          for e in cell.iterchildren():
            data += lxml.html.tostring(e).decode()
      data = data.strip()

      self.data[cell_id] = data
      self.data_list.append(data)

class Table:
  def __init__(self, element, filter_func=None):
    self.element = element
    self.rows = []
    self.caption = None
    self.header_element = None
    
    #find headers
    if element[0].tag in ["thead", "tr"]:
      self.header = TableHeader(element[0])
      self.header_element = element[0]
    else:
      for child in element:
        if child.tag in ["thead", "tr"]:
          self.header = TableHeader(child)
          self.header_element = child
          break
      else:
        raise exceptions.BadGatewayError("Could not find table header in html.")
    
    #parse caption
    if element[0].tag == "caption":
      caption_element = element[0]
      label = caption_element[0]
      id = label.get("for")
      title = label.text
      text = caption_element.text_content().replace(title, "", 1).strip()
      self.caption = TableCaption(id, title, text)
    
    #get start of rows
    if element[-1].tag == "tbody":
      row = element[-1][0]
    else:
      row = self.header_element.getnext();
    
    #iterate through rows and parse
    while True:
      if row == None:
        break
      if len(row) >= len(self.header.columns):
        self.rows.append(TableRow(self.header, row))
      row = row.getnext()
    
    #filter rows
    if filter_func != None:
      self.rows = filter(filter_func, self.rows)
    
  def encode_as_dict(self):
    columns = []
    for column in self.header.columns:
      column_dict = {
        "id": column.id,
        "title": column.title
      }
      columns.append(column_dict)
      
    rows = []
    for row in self.rows:
      row_dict = {
        "id": row.id,
        "data": row.data
      }
      rows.append(row_dict)
    
    caption = None
    if self.caption != None:
      caption = {
        "id": self.caption.id,
        "title": self.caption.title,
        "content": self.caption.content
      }
    
    return {
      "columns": columns,
      "rows": rows,
      "caption": caption
    }

#json encoder for custom classes
class CustomJSONEncoder(json.JSONEncoder):
  def default(self, obj):
    if hasattr(obj, "encode_as_dict"):
      return obj.encode_as_dict()
    else:
      return json.JSONEncoder.default(self, obj)

class DataClass:
  attributes = {}
  def __init__(self, attributes={}, table_data={}):

    for key in self.attributes:
      if key in attributes:
        setattr(self, key, attributes[key])
      else:
        setattr(self, key, None)
          
    if table_data != {}:
      for key in self.attributes:
        header_id = self.attributes[key]
        if header_id in table_data:
          setattr(self, key, table_data[header_id])
        
  def encode_as_dict(self):
    student_dict = {}
    for key in self.attributes:
      if getattr(self, key) != None:
        student_dict[key] = getattr(self, key)
    return student_dict

#class for student data
class Student(DataClass):
  attributes = {
    "id": None,
    "student_id": None,
    "name": "StudentName",
    "grade": "Grade",
    "school": "SchoolName",
    "year": "SchoolYear",
    "birth_date": "BirthDate",
    "advisor": "Advisor",
    "counselor": "Counselor"
  }

class Course(DataClass):
  attributes = {
    "classroom": None,
    "teacher": None,
    "entry": None,
    "exit": None,
    "course": None,
    "course_code": None,
    "term": None,
    "period": None,
    "assignments": None,
    "semester": None,
    "grade": None
  }

class Assignment(DataClass):
  attributes = {
    "title": "assignment",
    "comments": "comments",
    "assigned": "dateassigned",
    "due": "datedue",
    "detail": "detail",
    "extra_credit": "extracredit",
    "graded": "notyetgraded",
    "score_percent": "pctscore",
    "points_possible": "ptspossible",
    "points_earned": "score",
    "scored_as": "scoredas"
  }