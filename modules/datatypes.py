import json
import lxml.html

#classes for tables
class TableColumn:
  def __init__(self, id, title):
    self.id = id
    self.title = title

class TableHeader:
  def __init__(self, element):
    self.columns = []
    self.ids = []
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
      
      text = cell.text or ""
      if len(cell) > 0:
        for e in cell.iterchildren():
          text += lxml.html.tostring(e).decode()
      self.data[cell_id] = text
      self.data_list.append(text)

class Table:
  def __init__(self, element, filter_func=None):
    self.element = element
    self.header = TableHeader(element[0])
    self.rows = []
    
    for i in range(1, len(element)):
      row = element[i]
      if len(row) >= len(self.header.columns):
        self.rows.append(TableRow(self.header, row))
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
    
    return {
      "columns": columns,
      "rows": rows
    }

#json encoder for custom classes
class CustomJSONEncoder(json.JSONEncoder):
  def default(self, obj):
    if hasattr(obj, "encode_as_dict"):
      return obj.encode_as_dict()
    else:
      return json.JSONEncoder.default(self, obj)

#class for student data
class Student:
  attributes = {
    "id": None,
    "name": "StudentName",
    "grade": "Grade",
    "school": "SchoolName",
    "year": "SchoolYear",
    "birth_date": "BirthDate",
    "advisor": "Advisor",
    "counselor": "Counselor"
  }
  
  def __init__(self, id, **kwargs):
    self.id = id
    
    for key in kwargs:
      if key in self.attributes:
        setattr(self, key, kwargs[key])
    for key in self.attributes:
      value = self.attributes[key]
      if value in kwargs:
        setattr(self, key, kwargs[value])
      else:
        setattr(self, key, None)
        
  def encode_as_dict(self):
    student_dict = {}
    for key in self.attributes:
      student_dict[key] = getattr(self, key)
    return student_dict