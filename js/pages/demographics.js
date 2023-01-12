import * as app from "/js/app.js";
import * as api from "/js/modules/api.js";
import * as dom from "/js/modules/dom.js";

export const elements = {};

export function main() {
  app.set_title("Demographics - OpenQ");
  setup_document();
  load_demographics();
}

export function setup_document() {
  elements.demographics_table = dom.Table.add_table(app.elements.main_div, {
    columns: {
      key: {text: "Key", classes: "text-center capitalize"},
      info: {text: "Value", classes: "min-w-[12rem]"}
    },
    header: "Demographics"
  });
}

export function load_demographics() {
  api.get_demographics(function(r) {
    if (r.success) {
      console.log("Loaded demographics data from API.");
      populate_tables(r.json.data);
    }
    else {
      app.handle_error(r);
    }
  });
}

export function populate_tables(data) {
  for (let key of data.order){
    let info = data.demographics[key];
    if (info == null) {
      info = "";
    }
    
    let key_pretty = key.split("_").join(" ");
    let row  = elements.demographics_table.create_row({key: key_pretty, info: info});
    elements.demographics_table.add_row(row);
  }
}