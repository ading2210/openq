//===== abstractions for the html dom =====

import * as utils from "/js/modules/utils.js";

export function create_element(tag, args) {
  let defaults = {id: null, classes: null, innerHTML: null};
  args = utils.merge_args(defaults, args);
  
  let element = document.createElement(tag);

  if (args.id) {element.id = args.id}
  if (args.classes) {element.className = args.classes}
  if (args.innerHTML) {element.innerHTML = args.innerHTML}
  
  return element;
}

export const table_classes = {
  table: "table",
  cell: "table_cell",
  thead: "bg-custom_bg_light w-fit",
  thead_row: "text-left font-bold",
  row: "table_row"
};

export class TableRow {
  constructor(columns, data) {
    this.data = data;
    this.columns = columns;
    this.element = create_element("tr", {classes: table_classes.row});
    
    for (let key of Object.keys(columns)) {
      let cell = create_element("td", {
        classes: table_classes.cell,
        innerHTML: this.data[key]
      });
      this.element.append(cell);
    }
  }
}

export class Table {
  constructor(columns, rows=[]) {
    this.table = create_element("table", {classes: table_classes.table});
    this.thead = create_element("thead", {classes: table_classes.thead});
    this.thead_row = create_element("tr", {classes: table_classes.thead_row});
    this.tbody = create_element("tbody", {classes: table_classes.tbody});
  
    this.table.append(this.thead, this.tbody);
    this.thead.append(this.thead_row);
    
    this.columns = columns;
    this.rows = [];
    
    for (let key of Object.keys(columns)) {
      let col = create_element("td", {
        classes: table_classes.cell,
        innerHTML: columns[key]
      });
      col.setAttribute("abbr", key);
      col.setAttribute("scope", "col");
      this.thead_row.append(col);
    }
    for (let row of rows) {
      this.add_row(row);
    }
  }
  
  create_row(data) {
    return new TableRow(this.columns, data)
  }

  add_row(row) {
    this.rows.push(row);
    this.tbody.append(row.element);
  }
  
  static import_table(columns, data=[]) {
    let table = new Table(columns);
    
    for (let item of data) {
      table.import_row(item);
    }
    
    return table;
  }
}