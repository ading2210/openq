//===== abstractions for the html dom =====

import * as utils from "/js/modules/utils.js";


export function create_element(tag, args={}) {
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
  table_container: "w-full overflow-auto p-0.5",
  header: "text-xl mx-1 mb-1 whitespace-nowrap",
  footer: "mx-1 mt-1",
  row: "table_row",
  cell: "table_cell",
  thead: "bg-custom_bg_light",
  thead_row: "font-bold",
  thead_cell: "table_cell min-w-fit"
};

export class TableRow {
  constructor(columns, data) {
    this.data = data;
    this.columns = columns;
    this.element = create_element("tr", {classes: table_classes.row});
    
    for (let key of Object.keys(columns)) {
      let column = columns[key];
      
      let cell = create_element("td", {
        classes: table_classes.cell,
        innerHTML: this.data[key]+""
      });
      
      if (column.classes) {
        cell.className += ` ${column.classes}`;
      }
      
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
      let column = columns[key];
      if (typeof column == "string") {
        column = {text: column};
      }
      
      let col = create_element("td", {
        classes: table_classes.thead_cell,
        innerHTML: column.text+""
      });
      col.setAttribute("abbr", key);
      col.setAttribute("scope", "col");
      
      if (column.classes) {
        col.className += ` ${column.classes}`;
      }
      
      this.thead_row.append(col);
    }
    for (let row of rows) {
      this.add_row(row);
    }
  }
  
  create_row(data) {
    return new TableRow(this.columns, data);
  }

  add_row(row) {
    this.rows.push(row);
    this.tbody.append(row.element);
  }
  
  clear_table() {
    utils.clear_element(this.table.tbody);
    this.rows = [];
  }
  
  static import_table(columns, data=[]) {
    let table = new Table(columns);
    
    for (let item of data) {
      table.import_row(item);
    }
    
    return table;
  }
  
  static add_table(parent, args={}) {
    let defaults = {header: null, footer: null, columns: {}, data: []};
    args = utils.merge_args(defaults, args);
    
    let table = Table.import_table(args.columns, args.data);
    table.container = create_element("div", {
      classes: table_classes.table_container,
    });
    
    if (args.header) {
      table.header = create_element("h2", {
        classes: table_classes.header,
        innerHTML: args.header+""
      });
      table.container.append(table.header);
    }
    table.container.append(table.table);
    if (args.footer) {
      table.footer = create_element("p", {
        classes: table_classes.footer,
        innerHTML: args.footer+""
      });
      table.container.append(table.footer);
    }
    parent.append(table.container);
    
    return table;
  }
}