/**
 * Created by Liang Liu on 2019/4/1.
 */
let colorScale = {"area_A":"#306bff","area_B":"#34a8ff","area_C":"#44caff","area_D":"#5afaff",
    "area_canteen":"#ffd172",
    "area_leisure":"#c8ff32",
    "area_sign":"#ffb48f","area_poster":"#fff277",
    "area_wc1":"#ffd2a6","area_wc2":"#ffd2a6","area_wc3":"#ffd2a6",
    "area_room1":"#8409ff","area_room2":"#a143ff","area_room3":"#c180ff","area_room4":"#ccb1ff","area_room5":"#8409ff","area_room6":"#a143ff",
    "area_ladder1":"#ff7e50","area_ladder2":"#ff7e50", "area_ladder3":"#ff7e50","area_ladder4":"#ff7e50",
    "area_serve":"#ff6c22","area_disc":"#ff5821","area_main":"#306bff",
    "area_in":"#16ff3c","area_out":"#ff2c31",
    "area_other":"#c8c8c7"
};

Date.prototype.Format = function (fmt) {
    let o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

function date_slice(start,end,stick) {
    let extent = [];
    for(let i = new Date(start).getTime();i<new Date(end).getTime();i += stick*60*1000) {
        let date_start = new Date(i).Format("yyyy-MM-dd H:mm:ss");
        let date_end = new Date(i + stick*60*1000).Format("yyyy-MM-dd H:mm:ss");
        extent.push([date_start,date_end]);
    }
    return extent;
}
get_data();

function get_data(){

    let areas=["area_ladder1","area_ladder2","area_ladder3","area_ladder4"];
    let stack_data = [];
    let date_extent = [new Date("2019-01-01 7:00:00"), new Date("2019-01-01 18:10:00")];
    let nest = d3.nest()
        .key(function(d) { return d.area; });

    areas.forEach((area)=>{
        $.ajax({
            url: "/day1_data_pro_area",    //请求的url地址
            dataType: "json",   //返回格式为json
            data:{area:area.toLocaleString()},
            async: true, //请求是否异步，默认为异步，这也是ajax重要特性
            type: "GET",   //请求方式
            contentType: "application/json",
            beforeSend: function () {//请求前的处理
            },
            success: function (data, textStatus) {

                let date_10min= [];

                for(let i = date_extent[0].getTime();i<date_extent[1].getTime();i+=600000){
                    date_10min.push({area:area,date:new Date(i),value:0});
                }
                data.forEach((d)=>{
                    d.date = new Date(d.date);
                    for(let i=0;i<date_10min.length-1;i++) {
                        if((d.date.getTime()>date_10min[i].date.getTime())&&(d.date.getTime()<date_10min[i+1].date.getTime())) {
                            date_10min[i].value++;
                            break;
                        }
                    }
                });
                date_10min.forEach((d)=>{
                    stack_data.push(d);
                });
            },
            complete: function () {//请求完成的处理
            },
            error: function () {//请求出错处理
            }
        });
    });

    let check_null = setInterval(function () {

        let nested = nest.entries(stack_data);

        if(nested.length === areas.length) {
            stack_graph(stack_data);
            clearInterval(check_null);
        }
    },1000)

}

function stack_graph(data) {

    let margin = {top: 40, right: 20, bottom: 40, left: 60},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        lineheight = height;

    let yScaleStacked = d3.scale.linear().range([height, 0]),
        yScaleMultiples = d3.scale.linear().range([height, 0]),
        xScale = d3.time.scale()
            .range([0, width]);

    let stack = d3.layout.stack()
        .offset("wiggle")
        .values(function(d) { return d.values; })
        .x(function(d) { return d.date; })
        .y(function(d) { return d.value; });

    let areaStacked = d3.svg.area()
        .interpolate("basis")
        .x(function(d) { return xScale(d.date); })
        .y0(function(d) { return yScaleStacked(d.y0); })
        .y1(function(d) { return yScaleStacked(d.y0 + d.y); });

    let areaMultiples = d3.svg.area()
        .interpolate("basis")
        .x(function(d) { return xScale(d.date); })
        .y0(function(d) { return yScaleMultiples(0); })
        .y1(function(d) { return yScaleMultiples(d.value); });

    xScale.domain(d3.extent(data, function(d) { return d.date; }));

    let zoom = d3.behavior.zoom()
        .x(xScale)
        .scaleExtent([1, 16])
        .on("zoom", zoomed);

    let svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(zoom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let tooltip = d3.select("body")
        .append("div")
        .attr("class", "label")
        .style("position", "absolute")
        .style("z-index", "20")
        //.style("visibility", "hidden")
        .style("top", "30px")
        .style("left", "55px");

    let vertical = d3.select("body")
        .append("div")
        .attr("class", "remove")
        .style("position", "absolute")
        .style("z-index", "19")
        .style("width", "1px")
        .style("height", height)
        .style("top", "10px")
        .style("bottom", "0px")
        .style("left", "0px")
        .style("pointer-events","none")
        .style("background", "#fff");

    d3.select("body")
        .on("mousemove", function(){
            let mousex = d3.mouse(this);
            mousex = mousex[0] + 1;
            vertical.style("left", mousex + "px" )})
        .on("mouseover", function(){
            let mousex = d3.mouse(this);
            mousex = mousex[0] + 1;
            vertical.style("left", mousex + "px")});

    let nest = d3.nest()
        .key(function(d) { return d.area; });
    let nested = nest.entries(data);
    let layers = stack(nested);

    lineheight = height / nested.length;

    yScaleStacked.domain([0, d3.max(data, function(d) { return d.y0 + d.y; })]);
    yScaleMultiples.domain([0, d3.max(data, function(d) { return d.value; })]).range([lineheight, 0]);

    let xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickFormat(d3.time.format("%H:%M"))
    //.ticks(20);

    let area = svg.selectAll(".area")
        .data(layers)
        .enter()
        .append("g")
        .attr("class", "area")
        .attr("id", function(d){ return d.key})
        .attr('transform', function(d, i){ return "translate(0," + (height - (i+1) * lineheight) +")"; });

    area.append("text")
        .attr("class", "area-label")
        .attr("x", -6)
        .attr('transform', function(d, i){ return "translate(0," + (lineheight - 6) +")"; })
        .text(function(d) { return d.key; });

    area.append("path")
        .attr("class", "layer")
        .attr("d", function(d) { return areaMultiples(d.values); })
        .style("fill", function(d, i) {
            return colorScale[d.key];
        })
        .attr("opacity",0.7)
        .on("mouseover",function (d,i) {
            d3.select(this)
                .transition()
                .duration(200)
                .ease("bounce")
                .attr("opacity",1);

            let mousex = d3.mouse(this)[0];

            let invert_x = xScale.invert(mousex);
            let min = invert_x.getMinutes();
            min = (min%10>=5)?(parseInt(min/10 + 1)*10):(parseInt(min/10)*10);
            invert_x.setSeconds(0);
            invert_x.setMinutes(min);

            console.log(invert_x);

            d.values.forEach((s)=>{
                if(invert_x.getTime() === s.date.getTime()){
                    tooltip.html( "<p>" +d.key +":   "+ s.value + "</p>" ).style("visibility", "visible");
                    return false;
                }
            });

        })
        .on("mouseout",function (d,i) {
            d3.select(this)
                .transition()
                .duration(200)
                .ease("bounce")
                .attr("opacity",.7);

            tooltip.html( "<p>" +d.key + "</p>" ).style("visibility", "hidden");
        });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (height+10) + ")")
        .call(xAxis);

    d3.selectAll("input").on("change", change);

    let area_type = 'multiples';

    function change() {
        if (this.value === "multiples") {
            transitionMultiples();
            area_type = 'multiples';
        }
        else {
            transitionStacked();
            area_type = 'stacked';
        }
    }

    function transitionMultiples() {
        let t = svg.transition().duration(750),
            g = t.selectAll(".area").attr('transform', function(d, i){ return "translate(0," + (height - (i+1) * lineheight) +")"; });
        g.selectAll(".layer").attr("d", function(d) { return areaMultiples(d.values); });
        g.selectAll(".area-label").style("display","block");
        g.select(".area-label").attr('transform', function(d, i){ return "translate(0," + (lineheight - 6) +")"; });
    }

    function transitionStacked() {
        let t = svg.transition().duration(750),
            g = t.selectAll(".area").attr('transform', function(){ return "translate(0,0)"; });
        g.selectAll(".layer").attr("d", function(d) { return areaStacked(d.values); });
        g.selectAll(".area-label").style("display","none");
    }

    function zoomed() {
        svg.select(".x.axis").call(xAxis);
        if(area_type === 'multiples')
            svg.selectAll(".layer").attr("d", function(d) { return areaMultiples(d.values); });
        else
            svg.selectAll(".layer").attr("d", function(d) { return areaStacked(d.values); });

    }
}


/*function remove_element(arr) {
    let data=[];
    data.push(arr[0]);
    for(let i =1;i<arr.length;i++) {
        if(arr[i].area === data[data.length-1].area){
            //let pop = data.pop();
            data[data.length-1].stay += arr[i].stay;
            data[data.length-1].date = arr[i].date;
            //console.log(data[data.length-1].stay);
        }
        else
            data.push(arr[i]);
    }
    return data;
}*/


