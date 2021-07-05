if (document.getElementById('main_div').innerHTML == '') {
  document.getElementById('main_div').innerHTML = ' ';

  function build_report() {
    function func(subtree, path, values) {
      var found = false;
      for (var i = 0; i < subtree.length; i++) {
        var branch = subtree[i];
        if (branch["name"] == path[0]) {
          found = true
          if (path.length > 1) {
            branch["children"] = func(branch["children"], path.slice(1, path.length), values)
          }
        }
      }
      if (path.length == 1) {
        subtree.push({
          "name": path[0],
          "accuracy": values[0],
          "completion_rate": values[1],
          "time_taken": values[2],
          "size": values[3],
          "section_sort_order": values[4],
          "content_id_sort_order": values[5],
          "question_created_at": values[6],
          "type_code": values[7],
          "templates": values[8],
          "list_created_at": values[9],
          "public_list_id": values[10],
          "number_of_teachers": values[11],
          "abandonment_rate": values[12],
          "accuracy_list_outlier": values[13],
          "completion_rate_list_outlier": values[14],
          "time_taken_list_outlier": values[15]
        })

      } else if (!found) {
        subtree.push({
          "name": path[0],
          "children": func([], path.slice(1, path.length), values)
        })
      }
      return subtree;
    }

    function isFloat(n) {
      return Number(n) === n && n % 1 !== 0;
    }
    if (dataset) {
      console.log(datasets)
      //console.log(datasets.length)
    } else {
      var not_loaded = d3.select("body").append("div");
      not_loaded.style("margin-left", 30 + 'px');
      not_loaded.html('<b>Please run the query again..</b>');
      return;
    }

    // console.log(datasets)

    if (datasets.length != 3) {
      var not_loaded = d3.select("body").append("div");
      not_loaded.style("margin-left", 30 + 'px');
      not_loaded.html('<b>Please run the query again.</b>');
      return;
    }

    var over_sized = datasets.filter(function (d) {
      return d.queryName == "D3 Data";
    })[0].oversized;

    if (over_sized) {
      var over_sized_modules = d3.select("body").append("div");
      over_sized_modules.style("margin-left", 30 + 'px');
      over_sized_modules.html('<b>Data is too large to visualise. Please narrow down your search by adding parameters in the top bar (not filters to the right) and re-running.</b>');
      return;
    }



    var data = datasets.filter(function (d) {
      return d.queryName == "D3 Data";
    })[0].content;
    new_data = data;
    var query_name = '';

    var path_name = "";

    var tree = [];
    for (var i = 0; i < data.length; i++) {
      var row = data[i]

      var path = ['(' + String(row.module_id) + ') ' + row.module_title]
      var folders = row.full_folder_path.slice(1, row.full_folder_path.length - 1).split(('|'))
      if (folders != "") {
        for (var j = 0; j < folders.length; j++) {
          path.push(folders[j])
        }
      }
      path.push(row.list_title)
      var section_type;
      if (row.type_code == 3 || row.type_code == 4 || row.type_code == 6) section_type = 'q';
      else if (row.type_code == 5) section_type = 's';
      else section_type = 'i';
      path.push(row.section_name + ' (' + section_type + ')')
      path.push(row.question_title)

      var query = [];
      query.push(row.avg_accuracy);
      query.push(row.avg_completion_rate);
      query.push(row.avg_time_taken_sec);
      query.push(row.total_unique_attempts);
      query.push(row.section_sort_order);
      query.push(row.content_id_sort_order);
      query.push(row.question_created_at);
      query.push(row.type_code);
      query.push(row.template_names);
      query.push(row.list_created_at);
      query.push(row.public_list_id);
      query.push(row.total_unique_teachers);
      query.push(row.abandonment_rate);
      query.push(row.avg_accuracy_is_outlier_list);
      query.push(row.avg_completion_rate_is_outlier_list);
      query.push(row.avg_time_taken_is_outlier_list);
      tree = func(tree, path, query);
    }


    visualise();

    function visualise() {

      function update_height(node) {
        var num_children = 0;
        var max_depth = node.depth + 3;
        node.each(function (d) {
          if (d.depth == max_depth) {
            num_children += 1;
          } else if (d.depth < max_depth && d.children == undefined) {
            num_children += 1;
          }
        })


        height = num_children * 20;
        if (height < 400) {
          height = 400;
        }
        return height;
      }




      var threshold_value = 0;
      var query_mode = 'completion_rate';

      function set_threshold() {
        if (query_mode == 'time_taken') {
          threshold_value = 80;
        } else if (query_mode == 'completion_rate' || query_mode == 'accuracy') {
          threshold_value = 0.3;
        } else if (query_mode == 'abandonment_rate') {
          threshold_value = 0.3;
        }
      }

      set_threshold();

      function define_slider_threshold() {
        if (thresholddata.length == 0) {
          thresholddata = [0]
        }
        var sliderThreshold = d3
          .sliderBottom()
          .min(d3.min(thresholddata))
          .max(d3.max(thresholddata))
          .width(300)
          .tickFormat(d3.format('.2'))
          .ticks(5)
          .default([0, threshold_value])
          .fill('#2196f3')
          .on('onchange', val => {
            threshold_value = val;
            d3.select('#value-threshold').text(val.map(d3.format('.2')).join('-'));
            rect.attr("fill", d => {
              //if (!d.depth) return "#ccc";

              if (query_mode == 'time_taken') {
                if (d.avg_time_taken >= threshold_value[0] && d.avg_time_taken <= threshold_value[1]) return "#df65b0";
              } else if (query_mode == 'completion_rate') {
                if (d.avg_completion_rate >= threshold_value[0] && d.avg_completion_rate <= threshold_value[1]) return "#df65b0";
              } else if (query_mode == 'abandonment_rate') {
                if (d.avg_abandonment_rate >= threshold_value[0] && d.avg_abandonment_rate <= threshold_value[1]) return "#df65b0";
              } else if (query_mode == 'accuracy') {
                if ((d.height == 0 && (d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) || (d.type == 'quiz')) {
                  if (d.avg_accuracy >= threshold_value[0] && d.avg_accuracy <= threshold_value[1]) return "#df65b0";
                }
              }


              if (query_mode == 'time_taken') {
                return thresholdScale_2(d.avg_time_taken)
              } else if (query_mode == 'completion_rate') {
                return thresholdScale_1(d.avg_completion_rate);
              } else if (query_mode == 'abandonment_rate') {
                return thresholdScale_1(d.avg_abandonment_rate);
              } else if (query_mode == 'accuracy') {
                if ((d.height == 0 && !(d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) || (d.type == 'no_quiz')) {
                  return ordinalScale(-1);
                }
                return thresholdScale_1(d.avg_accuracy);
              }
            })
            tabulate(['name', 'path', 'analysis', 'number_of_attempts', 'number_of_teachers'], threshold_value);
          });
        return sliderThreshold;
      }

      var data = {
        "name": "Modules",
        "children": tree
      };

      var width = 975,
        height = 400;

      var max_num_children = 0;
      var max_height = 0;

      var max = 0;
      var min = Number.MAX_VALUE;
      partition = data => {
        const root = d3.hierarchy(data)
          .count()
          .each(d => d.count = d.value)
          .sum(d => d.size)
          .each(function (d) {
            d.avg_attempts = d.value / d.count;
          })
          .sum(d => d.number_of_teachers)
          .each(function (d) {
            d.avg_num_teachers = d.value / d.count;
          })
          // time taken
          .sum(d => d.size)
          .each(d => d.temp = d.value)
          .sum(d => d.time_taken * d.size)
          .each(function (d) {
            if (d.temp != 0) {
              d.avg_time_taken = d.value / d.temp;
              d.value = d.avg_time_taken;
            } else {
              d.avg_time_taken = 0;
              d.value = d.avg_time_taken;
            }
          })
          .each(d => d.value_time_taken = d.value)


          // completion rate
          .sum(d => d.size)
          .each(d => d.temp = d.value)
          .sum(d => d.completion_rate * d.size)
          .each(function (d) {
            if (d.temp != 0) {
              d.avg_completion_rate = d.value / d.temp;
              d.value = d.avg_completion_rate;
            } else {
              d.avg_completion_rate = 0;
              d.value = d.avg_completion_rate;
            }
          })
          .each(d => d.value_completion_rate = d.value)


          // abandonment rate
          .sum(d => d.size)
          .each(d => d.temp = d.value)
          .sum(d => d.abandonment_rate * d.size)
          .each(function (d) {
            if (d.temp != 0) {
              d.avg_abandonment_rate = d.value / d.temp;
              d.value = d.avg_abandonment_rate;
            } else {
              d.avg_abandonment_rate = 0;
              d.value = d.avg_abandonment_rate;
            }
          })
          .each(d => d.value_abandonment_rate = d.value)

          // accuracy 
          .each(function (d) {
            if (d.height == 0 && (d.data.type_code == 1 || d.data.type_code == 2 || d.data.type_code == 5)) {
              d.data.temp_size = 0
            } else d.data.temp_size = d.data.size
          })

          .sum(d => d.temp_size)
          .each(d => d.temp = d.value)
          .sum(d => d.accuracy * d.temp_size)
          .each(function (d) {
            if (d.temp != 0) {
              d.avg_accuracy = d.value / d.temp;

            } else {
              d.avg_accuracy = 0;
            }
            d.value = d.avg_accuracy;
          })
          .each(d => d.value_accuracy = d.value)

          .each(d => d.scaled_value_avg_attempts = d.avg_attempts)
          .each(function (d) {
            if (d.height == 0) {
              d.public_list_id = d.data.public_list_id;
            } else if (d.height == 1) {
              sec_children = d.children
              d.public_list_id = sec_children[0].data.public_list_id;
            }
            if (d.height == 2) {
              sec_children = d.children
              q_children = sec_children[0].children
              d.list_created_at = q_children[0].data.list_created_at;
              d.public_list_id = q_children[0].data.public_list_id;
            }
          })
          .each(function (d) {
            if (d.height > 0) {
              var child_sum = 0;
              for (child of d.children) {
                child_sum += child.scaled_value_avg_attempts;
              }
              if (child_sum == 0) {
                if (d.scaled_value_avg_attempts == 0) {
                  d.scaled_value_avg_attempts = update_height(d)
                }
                child_sum = d.scaled_value_avg_attempts;
                for (child of d.children) {
                  child.scaled_value_avg_attempts = child_sum / d.children.length;
                }
              } else {
                var min_display_perc = Math.min((7 / (update_height(d))), (100 / d.children.length));
                var repeat;
                do {
                  repeat = false;
                  for (child of d.children) {
                    var perc = child.scaled_value_avg_attempts / child_sum;
                    if (perc < min_display_perc) {
                      let incr;
                      if (child.scaled_value_avg_attempts == 0) {
                        incr = child_sum * min_display_perc;
                      } else {
                        incr = (child.scaled_value_avg_attempts * 0.1)
                      }
                      child.scaled_value_avg_attempts += incr;
                      child_sum += incr;
                      repeat = true;
                    }
                  }
                } while (repeat);
                for (child of d.children) {
                  var perc = child.scaled_value_avg_attempts / child_sum;
                  child.scaled_value_avg_attempts = d.scaled_value_avg_attempts * perc;
                }
              }
            }
          })

          //default value is accuracy
          .each(d => d.value = d.scaled_value_avg_attempts)

          .each(function (d) {
            var leaf_nodes = d.leaves()
            all_info = true;
            for (leaf of leaf_nodes) {
              if (leaf.data.type_code == 3 || leaf.data.type_code == 4 || leaf.data.type_code == 6) {
                all_info = false;
                break;
              }
            }
            if (all_info)
              d.type = 'no_quiz'
            else
              d.type = 'quiz'

          })

          .sort(function (a, b) {
            if (a.height == 0 && b.height == 0) {
              return d3.ascending(a.data.content_id_sort_order, b.data.content_id_sort_order)
            }
            if (a.height == 1 && b.height == 1) {
              return d3.ascending(a.children[0].data.section_sort_order, b.children[0].data.section_sort_order)
            }
            if (a.depth == 1) {
              var a_data_name = (String(a.data.name).toLowerCase()).split(') ')[1];
              var b_data_name = String(b.data.name).toLowerCase().split(') ')[1];
              return a_data_name.localeCompare(b_data_name)
            }

            return String(a.data.name).toLowerCase().localeCompare(String(b.data.name).toLowerCase());
          })

        height = update_height(root)

        var leaf_nodes = root.leaves()
        for (i = 0; i < leaf_nodes.length; i++) {
          ancestors_nodes = leaf_nodes[i].ancestors();
          for (j = 0; j < ancestors_nodes.length; j++) {
            if (ancestors_nodes[j].depth != 0)
              ancestors_nodes[j].templates = leaf_nodes[i].data.templates
          }
        }


        root.eachBefore(function (d) {
          var path = [];
          var temp = d.ancestors();
          for (var i = temp.length - 1; i >= 1; i--) {
            path.push(temp[i].data.name)
          }
          d.path = path.join("/");
        });

        return d3.partition()
          .size([height, (root.height + 1) * width / 4])
          (root);

      }



      var format1 = d3.format(".2f");
      var format2 = d3.format(",d");



      thresholdScale_1 = d3.scaleThreshold()
        .domain([0, 0.6, 0.7, 0.8, 0.9, 1.01])
        .range(['#ccc', '#d7191c', '#fdae61', '#ffffbf', '#abd9e9', '#2c7bb6', '#ccc']);

      ordinalScale = d3.scaleOrdinal()
        .domain(['N/A'])
        .range(['#cccccc']);

      thresholdScale_2 = d3.scaleThreshold()
        .domain([0, 50, 100, 150, 200])
        .range(['#d7191c', '#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c']);

      thresholdScale_3 = d3.scaleThreshold()
        .domain([0, 0.6, 0.7, 0.8, 0.9, 1])
        .range(['#ccc', '#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c', '#ccc']);

      thresholdScale_4 = d3.scaleThreshold()
        .domain([0, 0.2, 0.4, 0.6, 0.8, 1])
        .range(['#ccc', '#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c', '#ccc']);

      console.log(tree)

      var root = partition(data);
      if (root.height == 0) {
        var no_modules = d3.select("body").append("div");
        no_modules.style("margin-left", 30 + 'px');
        no_modules.html('<b>No modules yet</b>');
        return;
      }


      var radios_query_mode = d3.select("#threshold_container").append("div")
        .attr("id", "radio_btns_query_mode")


      //var query_mode;
      add_radio_query_mode("accuracy", "Accuracy");
      add_radio_query_mode("completion_rate", "Completion rate");
      add_radio_query_mode("time_taken", "Time taken");
      add_radio_query_mode("abandonment_rate", "Abandonment rate");

      function add_radio_query_mode(id, text) {
        radios_query_mode.append("input")
          .attr("type", "radio")
          .attr("id", id)
          .attr("name", "query_mode_selection")
          .attr("value", "accuracy")
          .on("change", function (event, d) {

            query_mode = id;

            d3.select("#colour_legend").remove();
            colour_legend()

            svg.selectAll("*").remove();


            root.each(d => d.value = d.scaled_value_avg_attempts)

            height = update_height(root)
            svg.attr("viewBox", [0, 0, width, height])

            root = d3.partition()
              .size([height, (root.height + 1) * width / 4])
              (root);




            set_threshold();
            find_min_max();
            thresholddata = d3.range(min, max + 0.000001, (max - min) / 2);


            var sliderThreshold = define_slider_threshold();

            document.getElementById("slider_svg").innerHTML = "";

            gThreshold = d3
              .select('#slider_svg')
              .attr('width', 500)
              .attr('height', 100)
              .append('g')
              .attr('transform', 'translate(30,30)');

            gThreshold.call(sliderThreshold);

            d3.select('#value-threshold').text(sliderThreshold.value().map(d3.format('.2')).join('-'));

            update_cells();
            tabulate(['name', 'path', 'analysis', 'number_of_attempts', 'number_of_teachers'], threshold_value);


          });
        radios_query_mode.append("label")
          .attr("for", id)
          .text(text)
      };

      radios_query_mode.select("#completion_rate")
        .attr("checked", "checked");
      query_mode = "completion_rate";


      function find_min_max() {
        max = 0;
        min = Number.MAX_VALUE;
        if (query_mode == 'completion_rate') {
          root.each(function (d) {
            if (d.depth > 0) {
              if (d.avg_completion_rate > max) {
                max = d.avg_completion_rate;
              }
              if (d.avg_completion_rate < min) {
                min = d.avg_completion_rate;
              }
            }
          })
        } else if (query_mode == 'abandonment_rate') {
          root.each(function (d) {
            if (d.depth > 0) {
              if (d.avg_abandonment_rate > max) {
                max = d.avg_abandonment_rate;
              }
              if (d.avg_abandonment_rate < min) {
                min = d.avg_abandonment_rate;
              }


            }
            min = 0;

          })
        } else if (query_mode == 'time_taken') {
          root.each(function (d) {
            if (d.depth > 0) {
              if (d.avg_time_taken > max) {
                max = d.avg_time_taken;
              }
              if (d.avg_time_taken < min) {
                min = d.avg_time_taken;
              }
            }
          })
        } else if (query_mode == 'accuracy') {
          root.each(function (d) {
            if (d.depth > 0) {
              if (d.avg_accuracy > max) {
                max = d.avg_accuracy;
              }
              if ((d.height == 0 && (d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) || (d.height == 1 && d.type == 'quiz') || d.height > 1) {
                if (d.avg_accuracy < min) {
                  min = d.avg_accuracy;
                }
              }
            }
          })
        }
      }

      find_min_max();
      var thresholddata = d3.range(min, max + 0.000001, (max - min) / 2);


      var sliderThreshold = define_slider_threshold();
      var slider_container = d3.select("#threshold_container")
        .append("div")
        .attr("id", "slider_container")

      var slider_label = slider_container.append("div");

      slider_label.append("span")
        .html("<b>Threshold</b>")
        .style("padding-left", "5px")
        .style("padding-right", "10px");

      slider_label.append("span")
        .attr("id", "value-threshold");

      var gThreshold = d3
        .select('#slider_container')
        .append('svg')
        .attr("id", "slider_svg")
        .attr('width', 500)
        .attr('height', 100)
        .append('g')
        .attr('transform', 'translate(30,30)');

      gThreshold.call(sliderThreshold);

      d3.select('#value-threshold').text(sliderThreshold.value().map(d3.format('.2')).join('-'));


      var legend_data_set1 = [{
        "label": "N/A",
        "colour": "#cccccc"
      }, {
        "label": "0-59.9%",
        "colour": "#d7191c"
      }, {
        "label": "60-69.9%",
        "colour": "#fdae61"
      }, {
        "label": "70-79.9%",
        "colour": "#ffffbf"
      }, {
        "label": "80-89.9%",
        "colour": "#abd9e9"
      }, {
        "label": "90-100%",
        "colour": "#2c7bb6"
      }]

      var legend_data_set2 = [{
        "label": "0-59.9%",
        "colour": "#d7191c"
      }, {
        "label": "60-69.9%",
        "colour": "#fdae61"
      }, {
        "label": "70-79.9%",
        "colour": "#ffffbf"
      }, {
        "label": "80-89.9%",
        "colour": "#abd9e9"
      }, {
        "label": "90-100%",
        "colour": "#2c7bb6"
      }]
      var legend_data_set4 = [{
        "label": "0-19.9%",
        "colour": "#2c7bb6"
      }, {
        "label": "20-39.9%",
        "colour": "#abd9e9"
      }, {
        "label": "40-59.9%",
        "colour": "#ffffbf"
      }, {
        "label": "60-89.9%",
        "colour": "#fdae61"
      }, {
        "label": "90-100%",
        "colour": "#d7191c"
      }]

      var legend_data_set3 = [{
        "label": "0-49.9s",
        "colour": "#2c7bb6"
      }, {
        "label": "50-99.9s",
        "colour": "#abd9e9"
      }, {
        "label": "100-149.9s",
        "colour": "#ffffbf"
      }, {
        "label": "150-199.9s",
        "colour": "#fdae61"
      }, {
        "label": ">= 200s",
        "colour": "#d7191c"
      }]

      var legend_data;

      function colour_legend() {

        if (query_mode == "accuracy") {
          legend_data = legend_data_set1
        } else if (query_mode == "completion_rate") {
          legend_data = legend_data_set2
        } else if (query_mode == "abandonment_rate") {
          legend_data = legend_data_set4
        } else if (query_mode == "time_taken") {
          legend_data = legend_data_set3;
        }

        d3.select("#threshold_container").append("div")
          .attr("id", "colour_legend")
        var s = d3.select("#colour_legend").append("svg")
          .attr('width', 500)
          .attr('height', 40)
          .style("font", "10px sans-serif");

        var g = s.selectAll(".rect")
          .data(legend_data)
          .enter()
          .append("g")
          .classed('rect', true)

        g.append("rect")
          .attr("width", 80)
          .attr("height", 20)
          .attr("x", function (d, i) {
            return 80 * i
          })
          .attr("y", 0)
          .attr("fill", d => d.colour)

        g.append("text")
          .attr("x", function (d, i) {
            return 80 * i + 20
          })
          .attr("y", 12)
          .text(d => d.label)
      }
      colour_legend();



      var show_path = d3.select("#svg_container").append("div");
      show_path.style("margin-left", 30 + 'px');


      let focus = root;

      var svg = d3.select("#svg_container").append("svg")
        .attr("viewBox", [0, 0, width, height])
        .style("font", "10px sans-serif");

      var cell, rect, text, tspan;

      function update_cells() {
        cell = svg
          .selectAll(".cell")
          .data(root.descendants())
          .enter()
          .append('g')
          .attr("transform", d => `translate(${d.y0},${d.x0})`);

        rect = cell.append("rect")
          .attr("width", d => d.y1 - d.y0 - 1)
          .attr("height", d => rectHeight(d))
          .attr("fill-opacity", function (d) {
            if (d.height == 0 && (d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) {
              return 0.45;
            } else if (d.height == 0) {
              return 0.25;
            }
            return 0.65;
          })
          .attr("fill", d => {
            if (query_mode == 'time_taken') {
              return thresholdScale_2(d.avg_time_taken)
            } else if (query_mode == 'completion_rate') {
              return thresholdScale_1(d.avg_completion_rate)
            } else if (query_mode == 'abandonment_rate') {
              return thresholdScale_4(d.avg_abandonment_rate)
            } else if (query_mode == 'accuracy') {
              if ((d.height == 0 && !(d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) || (d.type == 'no_quiz')) {
                return ordinalScale(-1)
              }
              return thresholdScale_1(d.avg_accuracy)
            }
          })
          .attr("stroke", d => {
            if (query_mode == 'time_taken' && d.height == 0 && (d.data.time_taken_list_outlier == 1)) {
              return "#800000";
            } else if (query_mode == 'completion_rate' && d.height == 0 && (d.data.completion_rate_list_outlier == 1)) {
              return "#800000";
            } else if (query_mode == 'accuracy' && d.height == 0 && (d.data.accuracy_list_outlier == 1)) {
              return "#800000";
            }
          })
          .style("cursor", "pointer")
          .on("click", clicked);

        text = cell.append("text")
          .style("user-select", "none")
          .attr("pointer-events", "none")
          .attr("x", 4)
          .attr("y", 13)
          .attr("fill-opacity", d => +labelVisible(d))
          .style("class", "wrap");

        var max_length = 35; //todo find max_length
        text.append("tspan")
          .text(function (d) {
            var info;
            if (d.height == 1) {
              info = 'Section: ';
            } else if (d.height == 2) {
              info = 'Lesson: ';
            } else if (d.depth == 1) {
              info = 'Module:';
            } else if (d.depth == 0 || d.height == 0) {
              info = '';
            } else {
              info = 'Subfolder: ';
            }

            var label;

            if (query_mode == 'time_taken') {
              label = format1(d.avg_time_taken);
            } else if (query_mode == 'completion_rate') {
              label = format1(d.avg_completion_rate * 100) + '%';
            } else if (query_mode == 'abandonment_rate') {
              if (d.height != 0 && d.height != 1) {
                label = format1(d.avg_abandonment_rate * 100) + '%';
              } else label = '';
            } else if (query_mode == 'accuracy') {
              label = format1(d.avg_accuracy * 100) + '%';
            }
            label += '\n' + format2(Math.floor(d.avg_attempts));

            if (d.data.name.length + label.length > max_length) {
              return info + '\n' + d.data.name.slice(0, (max_length - label.length)) + '...';
            }
            return info + '\n' + d.data.name;
          });

        tspan = text.append("tspan")
          .attr("fill-opacity", d => labelVisible(d) * 0.7)
          .text(function (d) {
            var label;
            if (query_mode == 'time_taken') {
              label = format1(d.avg_time_taken);
            } else if (query_mode == 'completion_rate') {
              label = format1(d.avg_completion_rate * 100) + '%';
            } else if (query_mode == 'abandonment_rate') {
              if (d.height != 0 && d.height != 1) {
                label = format1(d.avg_abandonment_rate * 100) + '%';
              } else label = ''
            } else if (query_mode == 'accuracy') {
              if ((d.height == 0 && !(d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) || (d.type == 'no_quiz'))
                label = 'N/A';
              else
                label = format1(d.avg_accuracy * 100) + '%';
            }
            return ` ${label}`
          });

        cell.append("title")
          .text(function (d) {
            var label = '';
            if (d.height == 0) {
              label += 'created_at ' + d.data.question_created_at + '\n';
            }
            if (d.height == 2) {
              label += 'created_at ' + d.list_created_at + '\n';
            }
            if ((d.height == 0 && !(d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) || (d.type == 'no_quiz'))
              label += 'accuracy N/A';
            else
              label += 'accuracy ' + format1(d.avg_accuracy * 100) + '%'

            label += '\ncompletion_rate ' + format1(d.avg_completion_rate * 100) + '%';
            label += '\ntime_taken ' + format1(d.avg_time_taken)
            if (d.height != 0 && d.height != 1) {
              label += '\nabandonment_rate ' + format1(d.avg_abandonment_rate * 100) + '%';
            }
            if (query_mode == 'time_taken' && d.height == 0) {
              if (d.data.time_taken_list_outlier == 1) {
                label += '\nlesson outlier';
              }
            } else if (query_mode == 'completion_rate' && d.height == 0) {
              if (d.data.completion_rate_list_outlier == 1) {
                label += '\nlesson outlier';
              }
            } else if (query_mode == 'accuracy' && d.height == 0) {
              if (d.data.accuracy_list_outlier == 1) {
                label += '\nlesson outlier';
              }
            }
            if (d.depth != 0) {
              label += '\n' + 'number of attempts  ' + format2(Math.floor(d.avg_attempts));
              label += '\n' + 'number of teachers ' + format2(Math.floor(d.avg_num_teachers));
              label += '\n' + 'templates  ' + d.templates;
            }

            return `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${label}`
          });
      }

      update_cells();

      function clicked(event, p) {
        if (!p.parent) return;
        focus = focus === p ? p = p.parent : p;
        if (focus != root) {
          //show_path.html('<b>' + `${focus.ancestors().map(d => d.data.name).reverse().join("/")}` + '</b>');
          temp_path = `${focus.ancestors().map(d => d.data.name).reverse().join("/")}`
          if (focus.height <= 2) {
            show_path.html('<b>' + '<a href="https://www.educationperfect.com/controlpanel/#/content/activity/' + focus.public_list_id + '" target="_blank">' + temp_path + '</a>' + '</b>');
          } else {
            show_path.html('<b>' + temp_path + '</b>');
          }
        } else
          show_path.html('')
        height = update_height(focus);
        tabulate(['name', 'path', 'analysis', 'number_of_attempts', 'number_of_teachers'], threshold_value);

        svg.attr("viewBox", [0, 0, width, height])

        root.each(d => d.target = {
          x0: (d.x0 - p.x0) / (p.x1 - p.x0) * height,
          x1: (d.x1 - p.x0) / (p.x1 - p.x0) * height,
          y0: d.y0 - p.y0,
          y1: d.y1 - p.y0
        });

        const t = cell.transition().duration(250)
          .attr("transform", d => `translate(${d.target.y0},${d.target.x0})`);

        rect.transition(t).attr("height", d => rectHeight(d.target));
        text.transition(t).attr("fill-opacity", d => +labelVisible(d.target));
        tspan.transition(t).attr("fill-opacity", d => labelVisible(d.target) * 0.7);
      }


      function rectHeight(d) {
        return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
      }

      function labelVisible(d) {
        return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
      }



      var radios_triage_mode = d3.select("#table_container").append("div")
        .attr("id", "radio_btns_triage_mode")
      var triage_mode;
      add_radio_triage_mode("modules", "Modules")
      add_radio_triage_mode("lessons", "Lessons")
      add_radio_triage_mode("sections", "Sections")
      add_radio_triage_mode("questions", "Questions")

      function add_radio_triage_mode(id, text) {
        radios_triage_mode.append("input")
          .attr("type", "radio")
          .attr("id", id)
          .attr("name", "triage_mode_selection")
          .attr("value", "modules")
          .on("change", function (event, d) {

            triage_mode = id;
            tabulate(['name', 'path', 'analysis', 'number_of_attempts', 'number_of_teachers'], threshold_value);
          });
        radios_triage_mode.append("label")
          .attr("for", id)
          .text(text)
      };

      radios_triage_mode.select("#modules")
        .attr("checked", "checked");
      triage_mode = "modules";


      var include_zeros_div = d3.select("#table_container").append("div")
        .attr("id", "include_zeros_div")

      include_zeros_div.append("input")
        .attr("type", "checkbox")
        .attr("id", "include_zeros")
        .attr("name", "include_zeros")
        .attr("value", "include")
        .on("change", function (event, d) {
          var is_checked = document.getElementById('include_zeros')
          if (is_checked.checked == true) {
            include_zero_values = true;
          } else {
            include_zero_values = false;
          }
          tabulate(['name', 'path', 'analysis', 'number_of_attempts', 'number_of_teachers'], threshold_value);
        })
      include_zeros_div.append("label")
        .attr("for", "include_zeros")
        .text("Include zero values")

      var include_zero_values = false;

      //setup table
      var table = d3.select('#table_container').append('table');
      var thead = table.append('thead').attr('id', 'table_head');
      var tbody = table.append('tbody').attr('id', 'table_body');


      function tabulate(columns, filtered_value) {

        var new_data = []
        focus.eachBefore(function (d) {

          if (triage_mode == 'modules') {
            if (d.depth == 0) {
              for (var i = 0; i < d.children.length; i++) {
                var a;
                var valid = true;
                if (query_mode == 'time_taken') {
                  a = d.children[i].avg_time_taken;
                } else if (query_mode == 'completion_rate') {
                  a = d.children[i].avg_completion_rate;
                } else if (query_mode == 'abandonment_rate') {
                  a = d.children[i].avg_abandonment_rate;
                } else if (query_mode == 'accuracy' && d.children[i].type == 'quiz') {
                  a = d.children[i].avg_accuracy;
                } else if (query_mode == 'accuracy' && d.children[i].type != 'quiz') {
                  valid = false;
                }
                if (valid) {
                  var item = {
                    'name': d.children[i].data.name,
                    'path': d.children[i].path,
                    'analysis': a,
                    'number_of_attempts': format2(Math.floor(d.children[i].avg_attempts)),
                    'number_of_teachers': format2(Math.floor(d.children[i].avg_num_teachers))
                  }
                  new_data.push(item)
                }
              }
            } else if (focus.parent == root && d.depth == 1) {
              var a;
              var valid = true;
              if (query_mode == 'time_taken') {
                a = d.avg_time_taken;
              } else if (query_mode == 'completion_rate') {
                a = d.avg_completion_rate;
              } else if (query_mode == 'abandonment_rate') {
                a = d.avg_abandonment_rate;
              } else if (query_mode == 'accuracy' && d.type == 'quiz') {
                a = d.avg_accuracy;
              } else if (query_mode == 'accuracy' && d.type != 'quiz') {
                valid = false;
              }
              if (valid) {
                var item = {
                  'name': d.data.name,
                  'path': d.path,
                  'analysis': a,
                  'number_of_attempts': format2(Math.floor(d.avg_attempts)),
                  'number_of_teachers': format2(Math.floor(d.avg_num_teachers))
                }
                new_data.push(item)
              }
            }
          } else if (triage_mode == 'lessons') {
            if (d.height == 2) {
              var a;
              var valid = true;
              if (query_mode == 'time_taken') {
                a = d.avg_time_taken;
              } else if (query_mode == 'completion_rate') {
                a = d.avg_completion_rate;
              } else if (query_mode == 'abandonment_rate') {
                a = d.avg_abandonment_rate;
              } else if (query_mode == 'accuracy' && d.type == 'quiz') {
                a = d.avg_accuracy;
              } else if (query_mode == 'accuracy' && d.type != 'quiz') {
                valid = false;
              }
              if (valid) {
                var item = {
                  'name': d.data.name,
                  'path': d.path,
                  'analysis': a,
                  'number_of_attempts': format2(Math.floor(d.avg_attempts)),
                  'number_of_teachers': format2(Math.floor(d.avg_num_teachers))
                }
                new_data.push(item)
              }

            }
          } else if (triage_mode == 'sections') {
            if (d.height == 1) {
              var a;
              var valid = true;
              if (query_mode == 'time_taken') {
                a = d.avg_time_taken;
              } else if (query_mode == 'completion_rate') {
                a = d.avg_completion_rate;
              } else if (query_mode == 'accuracy' && d.type == 'quiz') {
                a = d.avg_accuracy;
              } else if (query_mode == 'accuracy' && d.type != 'quiz') {
                valid = false;
              }
              if (valid) {
                var item = {
                  'name': d.data.name,
                  'path': d.path,
                  'analysis': a,
                  'number_of_attempts': format2(Math.floor(d.avg_attempts)),
                  'number_of_teachers': format2(Math.floor(d.avg_num_teachers))
                }
                new_data.push(item)
              }

            }
          } else if (triage_mode == 'questions') {
            if (d.height == 0) {
              var a;
              var valid = true;
              if (query_mode == 'time_taken') {
                a = d.avg_time_taken;
              } else if (query_mode == 'completion_rate') {
                a = d.avg_completion_rate;
              } else if (query_mode == 'accuracy' && (d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) {

                a = d.avg_accuracy;
              } else if (query_mode == 'accuracy' && !(d.data.type_code == 3 || d.data.type_code == 4 || d.data.type_code == 6)) {
                valid = false;
              }
              if (valid) {
                var item = {
                  'name': d.data.name,
                  'path': d.path,
                  'analysis': a,
                  'number_of_attempts': format2(Math.floor(d.avg_attempts)),
                  'number_of_teachers': format2(Math.floor(d.avg_num_teachers))
                }
                new_data.push(item)
              }

            }
          }


        });





        document.getElementById("table_head").innerHTML = "";
        document.getElementById("table_body").innerHTML = "";

        thead.innerHTML = "";
        // append the header row
        thead.append('tr')
          .selectAll('th')
          .data(columns).enter()
          .append('th')
          .text(function (column) {
            return column;
          });

        function filterByValue(item) {
          if (!include_zero_values)
            if (item.analysis == 0)
              return false

          if (query_mode == 'time_taken' && item.analysis >= filtered_value[0] && item.analysis <= filtered_value[1]) {
            return true;
          } else if (query_mode == 'accuracy' && item.analysis >= filtered_value[0] && item.analysis <= filtered_value[1]) {
            return true;
          } else if (query_mode == 'completion_rate' && item.analysis >= filtered_value[0] && item.analysis <= filtered_value[1]) {
            return true;
          } else if (query_mode == 'abandonment_rate' && item.analysis >= filtered_value[0] && item.analysis <= filtered_value[1]) {
            return true;
          }

          return false;
        }
        filtered_data = new_data.filter(filterByValue)

        // sort based on analysis value
        filtered_data = filtered_data.sort(function (a, b) {
          return a.analysis - b.analysis;
        });

        // create a row for each object in the data
        var rows = tbody.selectAll('tr')
          .data(filtered_data)
          .enter()
          .append('tr');

        // create a cell in each row for each column
        var cells = rows.selectAll('td')
          .data(function (row) {
            return columns.map(function (column) {
              return {
                column: column,
                value: row[column]
              };
            });
          })
          .enter()
          .append('td')
          .text(function (d) {
            if (isFloat(d.value)) {
              if (query_mode == 'accuracy' || query_mode == 'completion_rate' || query_mode == 'abandonment_rate') {
                return format1(d.value * 100) + '%';
              }
              return format1(d.value);
            }
            return d.value;
          });

        return table;
      }

      // load table
      tabulate(['name', 'path', 'analysis', 'number_of_attempts', 'number_of_teachers'], threshold_value);

    }
  }

  build_report();
}