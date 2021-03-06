/**
 * Created by Liang Liu on 2019/4/23.
 */

para_coor_all();

function para_coor_all(){
    $.ajax({
        url: day_url+"_stay",    //请求的url地址
        dataType: "json",   //返回格式为json
        async: true, //请求是否异步，默认为异步，这也是ajax重要特性
        type: "GET",   //请求方式
        contentType: "application/json",
        beforeSend: function () {//请求前的处理
        },
        success: function (data, textStatus) {
            //console.log(data);
            para_coor(data);
        },
        complete: function () {//请求完成的处理
        },
        error: function () {//请求出错处理
        }
    })
}

function para_coor_group(group,param) {

    $.ajax({
        url: day_url+"_group_stay",    //请求的url地址
        data:{group:group},
        dataType: "json",   //返回格式为json
        async: true, //请求是否异步，默认为异步，这也是ajax重要特性
        type: "GET",   //请求方式
        contentType: "application/json",
        beforeSend: function () {//请求前的处理
        },
        success: function (data, textStatus) {
            //console.log(data);
            para_coor(data,param);
        },
        complete: function () {//请求完成的处理
        },
        error: function () {//请求出错处理
        }
    })
}

function para_coor(data,param) {

    let _charts = {};
    let chart = $("#para_coor_main");
    chart.html("");
    _charts.areas = [
        "area_A","area_B","area_C","area_D",
        "area_sign","area_poster",
        //"area_wc1","area_wc2","area_wc3",
        "area_room1","area_room2","area_room3","area_room4","area_room5","area_room6",
        "area_serve", "area_disc","area_main",
        "area_canteen","area_leisure",
        "area_other"
    ];

    _charts.margin = {top: 20, right: 30, bottom: 10, left: 30};
    _charts.width = chart.width()  - _charts.margin.left - _charts.margin.right;
    _charts.height = chart.height() - _charts.margin.top - _charts.margin.bottom;

    _charts.svg = d3.select("#para_coor_main").append("svg")
        .attr("width", _charts.width + _charts.margin.left + _charts.margin.right)
        .attr("height", _charts.height + _charts.margin.top + _charts.margin.bottom);

    _charts.svg.append("text")
        .attr("x",10)
        .attr("y",30)
        .text("停留时间")
        .style({
            //"font-family":"Microsoft YaHei",
            "fill":"#fff",
            "font-size":20,
            "font-weight":700
        });

    _charts.x_scale = d3.scale.ordinal()
        .domain(_charts.areas)
        .rangePoints([0, _charts.width], .5);

    _charts.y_scale ={};

    _charts.areas.forEach((d)=>{
        _charts.y_scale[d] = d3.scale.sqrt()
            .domain([40000,0])
            .range([0, _charts.height*0.8]);
    });

    _charts.x_axis = d3.svg.axis()
        .scale(_charts.x_scale)
        .orient("bottom");

    _charts.y_axis = d3.svg.axis()
        .orient("left");

    _charts.line = d3.svg.line().interpolate("monotone");

    _charts.svg.append("g")
        .attr("class", "x axis")
        .attr("transform","translate("+_charts.margin.left*1.7+","+(_charts.height) +")")
        .call(_charts.x_axis)
        .selectAll("text")
        .text((d)=>d.replace("area_",""))
        //.attr("transform", "rotate(45)")
        //.style("text-anchor", "start");

    _charts.g = _charts.svg.selectAll(".area_extent")
        .data(_charts.areas)
        .enter()
        .append("g")
        .attr("class", "area_extent")
        .attr("transform", function(d) { return "translate(" + (_charts.x_scale(d) + _charts.margin.left*1.7)+ ")"; });

    _charts.g.append("g")
        .attr("class", "axis")
        .each(function(d,i) {
            if(i === 0)
                d3.select(this).call(_charts.y_axis.scale(_charts.y_scale[d]));
            else
                d3.select(this).call(_charts.y_axis.tickFormat("").scale(_charts.y_scale[d]));
        })
        .attr("transform", function(d) { return "translate(0,"+_charts.height*0.2+")"; });


// Add grey background lines for context.
    _charts.background = _charts.svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("transform", function(d) { return "translate(" + _charts.margin.left*1.7 + "," + _charts.height * 0.2 + ")"; });

// Add blue foreground lines for focus.
    _charts.foreground = _charts.svg.append("g")
    //.attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", path)
        .style({
            "stroke-width": 0.5,
            "stroke-opacity": 0.5,
            "fill":"none",
            "stroke":param?param:"#ff5549"
        })
        .attr("transform", function(d) { return "translate(" + _charts.margin.left*1.7 + "," + _charts.height * 0.2 + ")"; });

// Returns the path for a given data point.
    function path(d) {
        let coor =[];
        _charts.areas.forEach((p)=>{
            coor.push([_charts.x_scale(p), _charts.y_scale[p](d[p])]);
        });
        return _charts.line(coor);
    }

// Add and store a brush for each axis.
    _charts.g.append("g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this).call(_charts.y_scale[d].brush = d3.svg.brush().y(_charts.y_scale[d]).on("brushend", brush)); })
        .attr("transform", function(d) { return "translate(0," + _charts.height * 0.2 + ")"; })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

    function brush(){
        let brush_data = [];
        let actives = _charts.areas.filter(function(p) { return !_charts.y_scale[p].brush.empty(); }),
            extents = actives.map(function(p) { return _charts.y_scale[p].brush.extent(); });
        _charts.foreground.style("display", function(d) {
            return actives.every(function(p, i) {
                if(extents[i][0] <= d[p] && d[p] <=  extents[i][1])
                    brush_data.push(d.id);
                return extents[i][0] <= d[p] && d[p] <=  extents[i][1];
            }) ? null : "none";
        });
        console.log(brush_data);
    }

// Handles a brush event, toggling the display of foreground lines.
}