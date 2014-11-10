$(document).ready(function () {

    var currentFile = "";
    var fileNames = [];
    var progressCount = 0;
    var filesCount = 0;
    var updating = false;

    if ($("#new-files-table").length != 0) {
        updateFilesList();
    }

    if ($(".mainContent").length != 0) {
        accountPageInitializing();
    }

    function accountPageInitializing() {
        $.getJSON("/api/accountInformation", function (data) {
            if (!data) {
                window.location.replace("/account")
            }
            clearMainContent();
            var accountInformationTable = d3.select(".mainContent")
                .html("Account Information")
                .append("table")
                .attr("class", "table table-responsive")
                .append("tbody");

            var emailtr = accountInformationTable.append("tr");
            emailtr.append("td")
                .text("Email: ");
            emailtr.append("td")
                .text(data["data"]["email"]);

            var firstNametr = accountInformationTable.append("tr");
            firstNametr.append("td")
                .text("First Name: ");
            firstNametr.append("td")
                .text(data["data"]["firstName"]);

            var lastNametr = accountInformationTable.append("tr");
            lastNametr.append("td")
                .text("Last Name: ");
            lastNametr.append("td")
                .text(data["data"]["lastName"]);

        }).error(function () {
            location.reload();
        });
    }

    function updateFilesList() {
        if (!updating) {
            updating = true;
            $.getJSON("/api/files", function (data) {
                if (!data) {
                    window.location.replace("/account")
                }
                var fileTable = d3.select(".user-files-list");
                fileNames = data["names"];
                filesCount = data["names"].length;
                fileTable.html("");
                data["data"].forEach(function (elem) {
                    var liMain = fileTable
                        .append("li")
                        .attr("class", function () {
                            switch (elem["state"]) {
                                case "rendered":
                                    return "";
                                default:
                                    return "disabled";
                            }
                        });
                    var a = liMain.append("a").style("cursor", "pointer");
                    a.on("mouseover", function () {
                        if (!liMain.classed("disabled") && !liMain.classed("waitForRender")) {
                            $(this).find(".fa-trash").css("visibility", "visible");
                        }
                    })
                        .on("mouseout", function () {
                            $(this).find(".fa-trash").css("visibility", "hidden");
                        })
                        .on("click", function () {
                            if (elem["state"] == "rendered") {
                                fileComputationResults(elem["fileName"]);
                                d3.select(".user-files-list").selectAll("li").classed("active", false);
                                liMain.classed("active", true);
                            }
                        })
                        .text(function () {
                            switch (elem["state"]) {
                                case "rendered":
                                    return elem["fileName"];
                                case "rendering":
                                    return elem["fileName"] + " | File is rendering";
                                case "wait":
                                    return elem["fileName"] + " | In queue"
                            }
                        });

                    a.append("i").attr("class", "fa fa-trash pull-right")
                        .style("visibility", "hidden")
                        .style("cursor", "pointer")
                        .on("click", function () {
                            d3.event.stopPropagation();
                            if (currentFile == elem["fileName"]) {
                                accountPageInitializing();
                            }
                            $.ajax({
                                url: "/api/delete",
                                type: "post",
                                contentType: 'application/json; charset=utf-8',
                                data: JSON.stringify({
                                    "action": "delete",
                                    "fileName": elem["fileName"]
                                }),
                                success: function () {
                                    updateFilesList();
                                }
                            })
                        });
                });
                if (filesCount == 0) {
                    fileTable.append("li")
                        .append("a")
                        .text("You have no files");
                } else {
                    fileTable.append("hr");
                    var liDiversity = fileTable.append("li");

                    liDiversity.style("cursor", "pointer")
                        .append("a")
                        .on("click", function () {
                            getData(diversityStats, "diversity", "all");
                            d3.select(".user-files-list")
                                .selectAll("li")
                                .classed("active", false);
                            liDiversity.classed("active", true);
                        })
                        .text("Diversity")
                        .append("i")
                        .attr("class", "fa fa-area-chart pull-right");
                    var liSummary = fileTable.append("li");

                    liSummary.append("a")
                        .style("cursor", "pointer")
                        .on("click", function () {
                            getData(basicStats, "basicStats", "all");
                            d3.select(".user-files-list")
                                .selectAll("li")
                                .classed("active", false);
                            liSummary.classed("active", true);
                        })
                        .text("Summary")
                        .append("i")
                        .attr("class", "fa fa-th-list pull-right");
                    fileTable.append("hr");
                    fileTable.append("li")
                        .style("cursor", "pointer")
                        .append("a")
                        .on("click", function () {
                            $.ajax({
                                url: "/api/delete",
                                type: "post",
                                contentType: 'application/json; charset=utf-8',
                                data: JSON.stringify({
                                    "action": "deleteAll"
                                }),
                                success: function () {
                                    accountPageInitializing();
                                    updateFilesList();
                                }
                            })
                        })
                        .text("Delete all");
                }
                if (progressCount != 0) {
                    d3.select(".add-new-files-button").classed("fa-plus", false);
                    d3.select(".add-new-files-button").classed("fa-refresh", true);
                } else {
                    d3.select(".add-new-files-button").classed("fa-plus", true);
                    d3.select(".add-new-files-button").classed("fa-refresh", false);
                }
                updating = false;
            }).error(function () {
                location.reload();
            });
        }
    }

    function clearVisualisation() {
        d3.select(".visualisation").html("");
    }

    function clearMainContent() {
        d3.select(".mainContent").html("");
    }

    function hideVisualisationContent() {
        d3.select(".visualisation")
            .transition()
            .style("opacity", "0");
    }

    function showVisualisationContent() {
        d3.select(".visualisation")
            .transition()
            .style("opacity", "1");
    }

    function fileComputationResults(fileName) {
        currentFile = fileName;
        clearMainContent();
        var header = d3.select(".mainContent")
            .append("ul")
            .attr("class", "nav nav-pills")
            .style("cursor", "pointer");

        header.append("li")
            .style("width", "19%")
            .attr("class", "computationResultsButton")
            .append("a")
            .attr("class", "text-center")
            .on("click", function () {
                clearVisualisation();
                d3.selectAll(".computationResultsButton").classed("active", false);
                d3.select(this.parentNode).classed("active", true);
                getData(vjUsage, "vjusage", fileName);
            })
            .html("V-J Usage");
        header.append("li")
            .attr("class", "active computationResultsButton")
            .style("width", "19%")
            .append("a")
            .attr("class", "text-center")
            .on("click", function () {
                clearVisualisation();
                d3.selectAll(".computationResultsButton").classed("active", false);
                d3.select(this.parentNode).classed("active", true);
                getData(spectrotype, "spectrotype", fileName);
            })
            .html("Spectrotype")
            .append("i")
            .attr("class", "fa fa-bar-chart-o pull-right");
        header.append("li")
            .style("width", "19%").
            attr("class", "computationResultsButton")
            .append("a")
            .attr("class", "text-center")
            .on("click", function () {
                clearVisualisation();
                d3.selectAll(".computationResultsButton").classed("active", false);
                d3.select(this.parentNode).classed("active", true);
                getData(spectrotypeV, "spectrotypeV", fileName);
            })
            .html("SpectrotypeV")
            .append("i")
            .attr("class", "fa fa-bar-chart-o pull-right");
        header.append("li")
            .style("width", "19%")
            .attr("class", "computationResultsButton")
            .append("a")
            .attr("class", "text-center")
            .on("click", function () {
                clearVisualisation();
                d3.selectAll(".computationResultsButton").classed("active", false);
                d3.select(this.parentNode).classed("active", true);
                getData(kernelDensity, "kernelDensity", fileName);
            })
            .html("Kernel Density");
        header.append("li")
            .style("width", "19%")
            .attr("class", "computationResultsButton")
            .append("a")
            .attr("class", "text-center")
            .on("click", function () {
                clearVisualisation();
                d3.selectAll(".computationResultsButton").classed("active", false);
                d3.select(this.parentNode).classed("active", true);
                getData(annotationTable, "annotation", fileName);
            })
            .html("Annotation")
            .append("i")
            .attr("class", "fa fa-th-list pull-right");

        d3.select(".mainContent")
            .append("div")
            .attr("class", "loadingMainContent")
            .style("display", "none");

        d3.select(".mainContent").append("div")
            .attr("class", "hero-unit")
            .append("div")
            .attr("class", "visualisation")
            .style("top", "50px")
            .style("width", "100%")
            .style("position", "relative")
            .style("height", "50%");

        getData(spectrotype, "spectrotype", fileName);
    }

    function loading(place) {
        d3.select(place).style("display", "block");
        var loading = d3.select(place).append("div").attr("class", "loading");
        loading.append("div").attr("class", "wBall").attr("id", "wBall_1").append("div").attr("class", "wInnerBall");
        loading.append("div").attr("class", "wBall").attr("id", "wBall_2").append("div").attr("class", "wInnerBall");
        loading.append("div").attr("class", "wBall").attr("id", "wBall_3").append("div").attr("class", "wInnerBall");
        loading.append("div").attr("class", "wBall").attr("id", "wBall_4").append("div").attr("class", "wInnerBall");
        loading.append("div").attr("class", "wBall").attr("id", "wBall_5").append("div").attr("class", "wInnerBall");
    }

    function loaded(place) {
        d3.select(place)
            .style("display", "none")
            .select(".loading")
            .remove();
    }

    function diversityStats(data) {
        clearMainContent();
        console.log(data);
        d3.select(".mainContent")
            .append("div")
            .attr("class", "visualisation")
            .append("div")
            .attr("id", "chart")
            .append("svg")
            .style("height", "900px");

        nv.addGraph(function () {
            var chart = nv.models.lineChart()
                .margin({left: 100})
                .useInteractiveGuideline(true)
                .transitionDuration(350)
                .showLegend(true)
                .showYAxis(true)
                .showXAxis(true)
                .height(700);

            chart.xAxis
                .axisLabel('Count')
                .tickFormat(d3.format(',r'));

            chart.yAxis
                .axisLabel('CDR3AA')
                .tickFormat(d3.format('.02f'));


            d3.select("#chart svg")
                .datum(data)
                .call(chart);

            nv.utils.windowResize(function () {
                chart.update()
            });
            return chart;
        });
    }

    function kernelDensity(data) {
        nv.addGraph(function () {

            var svg = d3.select(".visualisation")
                .html("")
                .append("div")
                .attr("id", "chart")
                .append("svg")
                .style("height", "800px");

            var chart = nv.models.lineChart()
                .margin({left: 100})
                .useInteractiveGuideline(true)
                .transitionDuration(350)
                .showLegend(true)
                .showYAxis(true)
                .showXAxis(true)
                .height(700)
                .xScale(d3.scale.log())
                .yScale(d3.scale.log());

            chart.xAxis
                .axisLabel('Clonotype size')
                .tickFormat(d3.format(',r'));

            chart.yAxis
                .axisLabel('1-CDF')
                .tickFormat(d3.format('.02e'));

            d3.select('#chart svg')
                .datum(data)
                .call(chart);
            nv.utils.windowResize(function () {
                chart.update()
            });
            return chart;
        });
    }

    function spectrotype(data) {
        nv.addGraph(function () {
            var svg = d3.select(".visualisation")
                .append("div")
                .attr("id", "chart")
                .append("svg")
                .style("height", "800px")
                .style("overflow", "visible");

            var chart = nv.models.multiBarChart()
                    .transitionDuration(350)
                    .reduceXTicks(false)   //If 'false', every single x-axis tick label will be rendered.
                    .rotateLabels(0)      //Angle to rotate x-axis labels.
                    .showControls(false)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
                    .showLegend(true)
                    .groupSpacing(0.1)    //Distance between each group of bars.
                    .height(700)
                    .stacked(true)
                    .tooltip(function (key, x, y, e, graph) {
                        if (key != "Other") {
                            return '<h3>' + e.series.name + '</h3>' +
                                '<p>Length : ' + x + '</p>' +
                                '<p>Frequency : ' + e.series.values[e.pointIndex].y + '</p>' +
                                '<p>CDR3AA : ' + e.series.cdr3aa + '</p>' +
                                '<p>V : ' + e.series.v + '</p>' +
                                '<p>J : ' + e.series.j + '</p>';
                        } else {
                            return '<h3>Other</h3>' +
                                '<p>Length : ' + x + '</p>' +
                                '<p>Frequency : ' + e.series.values[e.pointIndex].y + '</p>';
                        }
                    })
                ;

            var xValues = [];
            for (var i = 0; i < 100; i++) {
                if (i % 3 == 0) {
                    xValues.push(i);
                }
            }

            chart.xAxis
                .tickValues(xValues)
                .tickFormat(d3.format(',f'));

            chart.yAxis
                .tickFormat(d3.format('%'));

            d3.select('#chart svg')
                .datum(data)
                .call(chart);

            nv.utils.windowResize(chart.update);
            return chart;
        });
    }

    function spectrotypeV(data) {
        nv.addGraph(function () {
            var svg = d3.select(".visualisation")
                .append("div")
                .attr("id", "chart")
                .append("svg")
                .style("height", "800px")
                .style("overflow", "visible");

            var chart = nv.models.multiBarChart()
                    .transitionDuration(350)
                    .reduceXTicks(false)   //If 'false', every single x-axis tick label will be rendered.
                    .rotateLabels(0)      //Angle to rotate x-axis labels.
                    .showControls(false)   //Allow user to switch between 'Grouped' and 'Stacked' mode.
                    .showLegend(true)
                    .groupSpacing(0.1)    //Distance between each group of bars.
                    .height(700)
                    .stacked(true)
                    .tooltip(function (key, x, y, e, graph) {
                        return '<h3>' + key + '</h3>' +
                            '<p>Length : ' + x + '</p>' +
                            '<p>Frequency : ' + e.series.values[e.pointIndex].y + '</p>';
                    })
                ;

            var xValues = [];
            for (var i = 0; i < 100; i++) {
                if (i % 3 == 0) {
                    xValues.push(i);
                }
            }

            chart.xAxis
                .tickValues(xValues)
                .tickFormat(d3.format(',f'));

            chart.yAxis
                .tickFormat(function (d) {
                    return Math.round(d * 10) + "%"
                });

            d3.select('#chart svg')
                .datum(data)
                .call(chart);

            loaded(".loadingMainContent");
            showVisualisationContent();
            nv.utils.windowResize(chart.update);
            return chart;
        });
    }

    function basicStats(data) {
        clearMainContent();
        currentFile = "";
        var header = Object.keys(data[0]);
        var svg = d3.select(".mainContent")
            .append("div")
            .attr("class", "visualisation")
            .append("div")
            .attr("class", "svg");
        var table = svg
                .append("table")
                .attr("id", "basicStatsTable")
                .attr("class", "table table-striped table-hover"),
            thead = table.append("thead")
                .append("tr")
                .selectAll("th")
                .data(header)
                .enter()
                .append("th")
                .html(function (d) {
                    return d;
                });
        var column = [];
        for (var i = 0; i < header.length; i++) {
            column.push({"data": header[i.toString()]});
        }
        $('#basicStatsTable').dataTable({
            dom: 'T<"clear">lfrtip',
            tableTools: {
                "sSwfPath": "../assets/lib/dataTable/extensions/TableTools/swf/copy_csv_xls_pdf.swf"
            },
            data: data,
            "columnDefs": [
                {
                    "width": "10%",
                    "targets": 0
                },
                {
                    "render": function (data) {
                        return parseFloat(data).toExponential(2);
                    },
                    "targets": 4
                },
                {
                    "render": function (data) {
                        return parseFloat(data).toExponential(2);
                    },
                    "targets": 5
                },
                {
                    "render": function (data) {
                        return parseFloat(data).toFixed(2);
                    },
                    "targets": 6
                },
                {
                    "render": function (data) {
                        return parseFloat(data).toFixed(2);
                    },
                    "targets": 7
                },
                {
                    "render": function (data) {
                        return parseFloat(data).toExponential(2);
                    },
                    "targets": 8
                }
            ],
            "columns": column,
            'iDisplayLength': 100,
            'order': [
                [0, "asc"]
            ],
            responsive: true
        });
    }

    function annotationTable(data) {
        var svg = d3.select(".visualisation")
            .append("div")
            .attr("class", "svg");

        var table = svg
                .append("table")
                .attr("id", "annotation_table")
                .attr("class", "table table-striped table-hover"),
            thead = table.append("thead").append("tr");

        thead.append("th").html("Frequency");
        thead.append("th").html("Count");
        thead.append("th").html("CDR3AA");
        thead.append("th").html("J");
        thead.append("th").html("V");

        var column = [
            {"data": "freq"},
            {"data": "count"},
            {"data": "query_cdr3aa"},
            {"data": "query_J"},
            {"data": "query_V"}
        ];

        for (var i = 0; i < data["header"].length; i++) {
            thead.append("th").html(data["header"][i]);
            column.push({"data": data["header"][i]});
        }

        var dataTable = $('#annotation_table').dataTable({
            "data": data["data"],
            "columns": column,
            'iDisplayLength': 10000,
            'order': [
                [0, "decs"]
            ],
            "scrollY": "600px",
            dom: 'T<"clear">frtiS',
            responsive: true,
            tableTools: {
                "sSwfPath": "../../assets/lib/dataTable/extensions/TableTools/swf/copy_csv_xls_pdf.swf"
            },
            "columnDefs": [
                {
                    "width": "6%",
                    "targets": 0
                },
                {
                    "width": "6%",
                    "targets": 1
                },
                {
                    "render": function (data) {
                        var cdr3aa = data["cdr3aa"];
                        var vend = data["vend"] / 3;
                        var jstart = data["jstart"] / 3;
                        var pos = data["pos"];
                        if (vend >= 0 && jstart >= 0) {
                            var str = [
                                data["cdr3aa"].substring(0, vend + 1),
                                data["cdr3aa"].substring(vend + 1, jstart),
                                data["cdr3aa"].substring(jstart, data["cdr3aa"].length),
                            ];
                            if (pos != -1) {
                                if (pos <= vend) {
                                    str[0] = str[0].substring(0, pos) + "<b><u>" + str[0].substring(pos, pos + 1) + "</u></b>" + str[0].substring(pos + 1, str[0].length);
                                } else if (pos > vend && pos < jstart) {
                                    str[1] = str[1].substring(0, pos - vend) + "<b><u>" + str[1].substring(pos - vend, pos - vend + 1) + "</u></b>" + str[1].substring(pos - vend + 1, str[1].length);
                                } else if (pos >= jstart) {
                                    str[2] = str[2].substring(0, pos - jstart) + "<b><u>" + str[2].substring(pos - jstart, pos - jstart + 1) + "</u></b>" + str[2].substring(pos - jstart + 1, str[2].length);
                                }
                            }
                            str[0] = "<text style='color : #31a354'>" + str[0] + "</text>";
                            str[2] = "<text style='color : #3182bd'>" + str[2] + "</text>";
                            return str.join("")
                        } else {
                            if (pos != -1) {
                                return data["cdr3aa"].substring(0, pos) + "<b><u>" + data["cdr3aa"].substring(pos, pos + 1) + "</u></b>" + data["cdr3aa"].substring(pos + 1, data["cdr3aa"].length)
                            } else {
                                return data["cdr3aa"];
                            }
                        }
                    },
                    "width": "20%",
                    "targets": 2
                },
                {
                    "render": function (data) {
                        if (!data["match"]) {
                            return "<div style='color: red;'>" + data["j"] + "</div>";
                        } else {
                            return data["j"];
                        }
                    },
                    "width": "10%",
                    "targets": 3
                },
                {
                    "render": function (data) {
                        if (!data["match"]) {
                            return "<div style='color: red;'>" + data["v"] + "</div>";
                        } else {
                            return data["v"];
                        }
                    },
                    "width": "10%",
                    "targets": 4
                }
            ]
        });
    }

    function vjUsage(vjUsageData) {
        var height = 600, margin = {b: 0, t: 40, l: 170, r: 50};

        var svg = d3.select(".visualisation")
            .append("svg")
            .attr('height', (height + margin.b + margin.t))
            .append("g")
            .attr("transform", "translate(" + $(".visualisation").width() / 4.5 + "," + margin.t + ")");
        var bP = createbP();
        var data = [
            {data: bP.partData(vjUsageData, 2), id: 'V-J-Usage', header: ["V", "J", "V-J Usage"]}
        ];
        bP.draw(data, svg);
    }

    function createbP() {
        var b = 30, bb = $(".visualisation svg").width() / 2, height = 600, buffMargin = 5, minHeight = 5;
        var c1 = [-165, 50], c2 = [-50, 160], c3 = [-10, 250]; //Column positions of labels.
        var colors = d3.scale.category20().range();
        var bP = {};

        bP.partData = function (data, p) {
            var sData = {};

            sData.keys = [
                d3.set(data.map(function (d) {
                    return d[0];
                })).values().sort(function (a, b) {
                    return ( a < b ? -1 : a > b ? 1 : 0);
                }),
                d3.set(data.map(function (d) {
                    return d[1];
                })).values().sort(function (a, b) {
                    return ( a < b ? -1 : a > b ? 1 : 0);
                })
            ];

            sData.data = [sData.keys[0].map(function (d) {
                return sData.keys[1].map(function (v) {
                    return 0;
                });
            }),
                sData.keys[1].map(function (d) {
                    return sData.keys[0].map(function (v) {
                        return 0;
                    });
                })
            ];

            data.forEach(function (d) {
                sData.data[0][sData.keys[0].indexOf(d[0])][sData.keys[1].indexOf(d[1])] = d[p];
                sData.data[1][sData.keys[1].indexOf(d[1])][sData.keys[0].indexOf(d[0])] = d[p];
            });

            return sData;
        };

        function visualize(data) {
            var vis = {};

            function calculatePosition(a, s, e, b, m) {
                var total = d3.sum(a);
                var sum = 0, neededHeight = 0, leftoverHeight = e - s - 2 * b * a.length;
                var ret = [];

                a.forEach(
                    function (d) {
                        var v = {};
                        v.percent = (total == 0 ? 0 : d / total);
                        v.value = d;
                        v.height = Math.max(v.percent * (e - s - 2 * b * a.length), m);
                        (v.height == m ? leftoverHeight -= m : neededHeight += v.height );
                        ret.push(v);
                    }
                );

                var scaleFact = leftoverHeight / Math.max(neededHeight, 1), sum = 0;

                ret.forEach(
                    function (d) {
                        d.percent = scaleFact * d.percent;
                        d.height = (d.height == m ? m : d.height * scaleFact);
                        d.middle = sum + b + d.height / 2;
                        d.y = s + d.middle - d.percent * (e - s - 2 * b * a.length) / 2;
                        d.h = d.percent * (e - s - 2 * b * a.length);
                        d.percent = (total == 0 ? 0 : d.value / total);
                        sum += 2 * b + d.height;
                    }
                );
                return ret;
            }

            vis.mainBars = [
                calculatePosition(data.data[0].map(function (d) {
                    return d3.sum(d);
                }), 0, height, buffMargin, minHeight),
                calculatePosition(data.data[1].map(function (d) {
                    return d3.sum(d);
                }), 0, height, buffMargin, minHeight)
            ];

            vis.subBars = [
                [],
                []
            ];
            vis.mainBars.forEach(function (pos, p) {
                pos.forEach(function (bar, i) {
                    calculatePosition(data.data[p][i], bar.y, bar.y + bar.h, 0, 0).forEach(function (sBar, j) {
                        sBar.key1 = (p == 0 ? i : j);
                        sBar.key2 = (p == 0 ? j : i);
                        vis.subBars[p].push(sBar);
                    });
                });
            });
            vis.subBars.forEach(function (sBar) {
                sBar.sort(function (a, b) {
                    return (a.key1 < b.key1 ? -1 : a.key1 > b.key1 ?
                        1 : a.key2 < b.key2 ? -1 : a.key2 > b.key2 ? 1 : 0 )
                });
            });

            vis.edges = vis.subBars[0].map(function (p, i) {
                return {
                    key1: p.key1,
                    key2: p.key2,
                    y1: p.y,
                    y2: vis.subBars[1][i].y,
                    h1: p.h,
                    h2: vis.subBars[1][i].h
                };
            });
            vis.keys = data.keys;
            return vis;
        }

        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function (t) {
                return edgePolygon(i(t));
            };
        }

        function drawPart(data, id, p) {
            d3.select("#" + id).append("g").attr("class", "part" + p)
                .attr("transform", "translate(" + ( p * (bb + b)) + ",0)");
            d3.select("#" + id).select(".part" + p).append("g").attr("class", "subbars");
            d3.select("#" + id).select(".part" + p).append("g").attr("class", "mainbars");

            var mainbar = d3.select("#" + id).select(".part" + p).select(".mainbars")
                .selectAll(".mainbar").data(data.mainBars[p])
                .enter().append("g").attr("class", "mainbar");

            mainbar.append("rect").attr("class", "mainrect")
                .attr("x", 0).attr("y", function (d) {
                    return d.middle - d.height / 2;
                })
                .attr("width", b).attr("height", function (d) {
                    return d.height;
                })
                .style("shape-rendering", "auto")
                .style("fill-opacity", 0).style("stroke-width", "0.5")
                .style("stroke", "black").style("stroke-opacity", 0);

            mainbar.append("text").attr("class", "barlabel")
                .attr("x", c1[p]).attr("y", function (d) {
                    return d.middle + 5;
                })
                .text(function (d, i) {
                    return data.keys[p][i];
                })
                .attr("text-anchor", "start");

            mainbar.append("text").attr("class", "barvalue")
                .attr("x", c2[p]).attr("y", function (d) {
                    return d.middle + 5;
                })
                .text(function (d, i) {
                    return d.value;
                })
                .attr("text-anchor", "end");

            mainbar.append("text").attr("class", "barpercent")
                .attr("x", c3[p]).attr("y", function (d) {
                    return d.middle + 5;
                })
                .text(function (d, i) {
                    return "( " + Math.round(100 * d.percent) + "%)";
                })
                .attr("text-anchor", "end").style("fill", "grey");

            d3.select("#" + id).select(".part" + p).select(".subbars")
                .selectAll(".subbar").data(data.subBars[p]).enter()
                .append("rect").attr("class", "subbar")
                .attr("x", 0).attr("y", function (d) {
                    return d.y
                })
                .attr("width", b).attr("height", function (d) {
                    return d.h
                })
                .style("fill", function (d) {
                    return colors[d.key1];
                });
        }

        function drawEdges(data, id) {
            d3.select("#" + id).append("g").attr("class", "edges").attr("transform", "translate(" + b + ",0)");

            d3.select("#" + id).select(".edges").selectAll(".edge")
                .data(data.edges).enter().append("polygon").attr("class", "edge")
                .attr("points", edgePolygon).style("fill", function (d) {
                    return colors[d.key1];
                })
                .style("opacity", 0.5).each(function (d) {
                    this._current = d;
                });
        }

        function drawHeader(header, id) {
            d3.select("#" + id).append("g").attr("class", "header").append("text").text(header[2])
                .style("font-size", "20").attr("x", 108).attr("y", -20).style("text-anchor", "middle")
                .style("font-weight", "bold");

            [0, 1].forEach(function (d) {
                var h = d3.select("#" + id).select(".part" + d).append("g").attr("class", "header");

                h.append("text").text(header[d]).attr("x", (c1[d] - 5))
                    .attr("y", -5).style("fill", "grey");

                h.append("text").text("Count").attr("x", (c2[d] - 10))
                    .attr("y", -5).style("fill", "grey");

                h.append("line").attr("x1", c1[d] - 10).attr("y1", -2)
                    .attr("x2", c3[d] + 10).attr("y2", -2).style("stroke", "black")
                    .style("stroke-width", "1").style("shape-rendering", "crispEdges");
            });
        }

        function edgePolygon(d) {
            return [0, d.y1, bb, d.y2, bb, d.y2 + d.h2, 0, d.y1 + d.h1].join(" ");
        }

        function transitionPart(data, id, p) {
            var mainbar = d3.select("#" + id).select(".part" + p).select(".mainbars")
                .selectAll(".mainbar").data(data.mainBars[p]);

            mainbar.select(".mainrect").transition().duration(500)
                .attr("y", function (d) {
                    return d.middle - d.height / 2;
                })
                .attr("height", function (d) {
                    return d.height;
                });

            mainbar.select(".barlabel").transition().duration(500)
                .attr("y", function (d) {
                    return d.middle + 5;
                });

            mainbar.select(".barvalue").transition().duration(500)
                .attr("y", function (d) {
                    return d.middle + 5;
                }).text(function (d, i) {
                    return d.value;
                });

            mainbar.select(".barpercent").transition().duration(500)
                .attr("y", function (d) {
                    return d.middle + 5;
                })
                .text(function (d, i) {
                    return "( " + Math.round(100 * d.percent) + "%)";
                });

            d3.select("#" + id).select(".part" + p).select(".subbars")
                .selectAll(".subbar").data(data.subBars[p])
                .transition().duration(500)
                .attr("y", function (d) {
                    return d.y
                }).attr("height", function (d) {
                    return d.h
                });
        }

        function transitionEdges(data, id) {
            d3.select("#" + id).append("g").attr("class", "edges")
                .attr("transform", "translate(" + b + ",0)");

            d3.select("#" + id).select(".edges").selectAll(".edge").data(data.edges)
                .transition().duration(500)
                .attrTween("points", arcTween)
                .style("opacity", function (d) {
                    return (d.h1 == 0 || d.h2 == 0 ? 0 : 0.5);
                });
        }

        function transition(data, id) {
            transitionPart(data, id, 0);
            transitionPart(data, id, 1);
            transitionEdges(data, id);
        }

        bP.draw = function (data, svg) {
            data.forEach(function (biP, s) {
                svg.append("g")
                    .attr("id", biP.id)
                    .attr("transform", "translate(" + (550 * s) + ",0)");

                var visData = visualize(biP.data);
                drawPart(visData, biP.id, 0);
                drawPart(visData, biP.id, 1);
                drawEdges(visData, biP.id);
                drawHeader(biP.header, biP.id);

                [0, 1].forEach(function (p) {
                    d3.select("#" + biP.id)
                        .select(".part" + p)
                        .select(".mainbars")
                        .selectAll(".mainbar")
                        .on("mouseover", function (d, i) {
                            return bP.selectSegment(data, p, i);
                        })
                        .on("mouseout", function (d, i) {
                            return bP.deSelectSegment(data, p, i);
                        });
                });
            });
        };

        bP.selectSegment = function (data, m, s) {
            data.forEach(function (k) {
                var newdata = {keys: [], data: []};

                newdata.keys = k.data.keys.map(function (d) {
                    return d;
                });

                newdata.data[m] = k.data.data[m].map(function (d) {
                    return d;
                });

                newdata.data[1 - m] = k.data.data[1 - m]
                    .map(function (v) {
                        return v.map(function (d, i) {
                            return (s == i ? d : 0);
                        });
                    });

                transition(visualize(newdata), k.id);

                var selectedBar = d3.select("#" + k.id).select(".part" + m).select(".mainbars")
                    .selectAll(".mainbar").filter(function (d, i) {
                        return (i == s);
                    });

                selectedBar.select(".mainrect").style("stroke-opacity", 1);
                selectedBar.select(".barlabel").style('font-weight', 'bold');
                selectedBar.select(".barvalue").style('font-weight', 'bold');
                selectedBar.select(".barpercent").style('font-weight', 'bold');
            });
        };

        bP.deSelectSegment = function (data, m, s) {
            data.forEach(function (k) {
                transition(visualize(k.data), k.id);

                var selectedBar = d3.select("#" + k.id).select(".part" + m).select(".mainbars")
                    .selectAll(".mainbar").filter(function (d, i) {
                        return (i == s);
                    });

                selectedBar.select(".mainrect").style("stroke-opacity", 0);
                selectedBar.select(".barlabel").style('font-weight', 'normal');
                selectedBar.select(".barvalue").style('font-weight', 'normal');
                selectedBar.select(".barpercent").style('font-weight', 'normal');
            });
        };

        return bP;
    }

    $('#fileupload').fileupload({
        url: '/api/upload',
        dataType: 'json',
        add: function (e, data) {
            var originalFileName = data.files[0].name;
            var create = true;
            var fileName = originalFileName.substr(0, originalFileName.lastIndexOf('.')) || originalFileName;
            var fileExtension = originalFileName.substr((~-originalFileName.lastIndexOf(".") >>> 0) + 2);
            if (fileExtension != "txt" && fileExtension != "gz") {
                fileName += fileExtension;
                fileExtension = "txt";
            }
            if (fileNames.indexOf(fileName) != -1 || filesCount >= 10) {
                create = false;
            }
            if (create) {
                filesCount++;
                data.context = d3.select(".modal-file-table tbody.main-tbody-files")
                    .append("tr");

                data.context.append("td")
                    .attr("class", "fileName")
                    .append("input")
                    .attr("type", "text")
                    .attr("class", "fileNameInput")
                    .attr("name", "fileNameInput")
                    .attr("value", fileName);

                var optionValues = data.context.append("td")
                    .attr("class", "software-td")
                    .append("select")
                    .attr("id", "softwareTypeName")
                    .attr("name", "softwareTypeName");

                optionValues.append("option").attr("value", "mitcr").text("MiTcr");
                optionValues.append("option").attr("value", "migec").text("MiGec");
                optionValues.append("option").attr("value", "simple").text("Simple");
                optionValues.append("option").attr("value", "igblast").text("IgBlast");

                data.context.append("td")
                    .style("width", "40%")
                    .attr("class", "progress-td")
                    .append("div")
                    .attr("class", "progress progress-striped active")
                    .append("div")
                    .attr("class", "progress-bar")
                    .style("width", "0%");

                data.context.append("td")
                    .attr("class", "td-upload-button")
                    .style("width", "10%")
                    .append("button")
                    .attr("class", "unit-file-upload btn btn-default")
                    .text("Upload")
                    .on("click", function () {
                        var softwareTypeName = data.context.select("#softwareTypeName").node().value;
                        var inputFileName = data.context.select("td .fileNameInput").node().value;
                        data.context.select("td.fileName").html(inputFileName);
                        data.context.select("td.software-td").html(softwareTypeName);
                        data.formData = {
                            softwareTypeName: softwareTypeName,
                            fileName: inputFileName,
                            fileExtension: fileExtension
                        };
                        progressCount++;
                        updateFilesList();
                        data.submit();
                    });
            } else {
                data.context = d3.select(".modal-file-table tbody.main-tbody-files")
                    .append("tr")
                    .attr("class", "danger");

                data.context.append("td")
                    .attr("class", "fileName")
                    .append("div")
                    .text(fileName);

                data.context.append("td");

                data.context.append("td")
                    .style("width", "40%")
                    .append("div")
                    .text(function () {
                        if (fileNames.indexOf(fileName) != -1) {
                            return "You should use unique names for your files"
                        } else if (filesCount >= 10) {
                            return "You have exceeded the limit of the number of files"
                        } else {
                            return "Unknown error"
                        }
                    });

                data.context.append("td")
                    .append("i")
                    .attr("class", "fa  fa-remove fa-2x pull-right")
                    .style("color", "red");
            }
        },
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 50, 10);
            data.context.select(".td-upload-button")
                .html("Uploading...");
            data.context.select(".progress-bar")
                .style("width", progress + "%");
        },
        done: function (e, data) {
            progressCount--;
            updateFilesList();
            switch (data.result["result"]) {
                case "success" :
                    progressCount++;
                    var socket = new WebSocket("ws://" + location.host + "/api/ws");
                    socket.onopen = function () {
                        var msg = {
                            type: "message",
                            action: "render",
                            data: {
                                fileName: data.formData.fileName
                            }
                        };
                        socket.send(JSON.stringify(msg));
                    };
                    socket.onmessage = function (message) {
                        var event = JSON.parse(message["data"]);
                        switch (event["result"]) {
                            case "ok" :
                                switch (event["progress"]) {
                                    case "start" :
                                        updateFilesList();
                                        data.context.select(".td-upload-button")
                                            .html("Computation...");
                                        break;
                                    case "end" :
                                        updateFilesList();
                                        data.context.select(".td-upload-button")
                                            .html("")
                                            .append("i")
                                            .attr("class", "fa  fa-check fa-2x pull-right")
                                            .style("color", "green");
                                        data.context.select(".progress-bar")
                                            .attr("class", "progress-bar progress-bar-success");
                                        data.context.select(".progress")
                                            .attr("class", "progress progress-striped");
                                        data.context
                                            .attr("class", "success");
                                        progressCount--;
                                        socket.close();
                                        break;
                                    default:
                                        data.context.select(".progress-bar")
                                            .style("width", 50 + (event["progress"] / 2) + "%");

                                }
                                break;
                            case "error" :
                                data.context.select(".td-upload-button")
                                    .html("")
                                    .append("i")
                                    .attr("class", "fa  fa-remove fa-2x pull-right")
                                    .style("color", "red");
                                data.context.select(".progress-bar")
                                    .attr("class", "progress-bar progress-bar-danger");
                                data.context
                                    .attr("class", "danger computation-fail");
                                data.context.select(".progress-td")
                                    .html(event["message"]);
                                for (var i = 0; i < fileNames.length; i++) {
                                    if (fileNames[i] == event["fileName"]) {
                                        fileNames.splice(i, 1);
                                    }
                                }
                                progressCount--;
                                socket.close();
                                break;
                            default:
                                data.context
                                    .attr("class", "danger computation-fail")
                                    .select(".td-upload-button")
                                    .html("Server unavailable");
                                break;
                        }

                    };
                    break;
                case "error" :
                    data.context.select(".td-upload-button")
                        .html("").append("i")
                        .attr("class", "fa  fa-remove fa-2x pull-right")
                        .style("color", "red");
                    data.context.select(".progress-bar")
                        .attr("class", "progress-bar progress-bar-danger");
                    data.context
                        .attr("class", "danger upload-fail");
                    data.context
                        .select(".progress-td")
                        .html(data.result["message"]);
                    break;
                default:
                    data.context.select(".td-upload-button")
                        .html("Server unavailable");
            }
        }
    });

    $('#new-files-table').on('hidden.bs.modal', function () {
        $(this).find("tr.success").remove();
        $(this).find("tr.danger").remove();
        updateFilesList();
    });

    $(".upload-all-button").click(function () {
        $(".unit-file-upload").click();
    });

    $(".choose-files-button").click(function () {
        $("form input[type=file]").click();
    });

    $("#common-software-type").change(function () {
        var softwareType = d3.select("#common-software-type").node().value;
        d3.selectAll("#softwareTypeName")
            .selectAll("option")
            .attr("selected", null);
        d3.selectAll("#softwareTypeName")
            .select("option[value=" + softwareType + "]")
            .attr("selected", "selected");
    });

    $(".fileDeleteButton").click(function () {
        $.ajax({
            url: "/api/delete",
            type: "post",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                "action": "delete",
                "fileName": $(this).attr("id")
            }),
            success: function () {
                updateFilesList();
            }
        })
    });

    function errorData(message) {
        d3.select(".visualisation")
            .append("div")
            .attr("class", "error-message")
            .text(message);
    }

    function getData(handleData, type, fileName) {
        hideVisualisationContent();
        loading(".loadingMainContent");
        $.ajax({
            url: "/api/data",
            type: "post",
            contentType: 'application/json; charset=utf-8',
            data: JSON.stringify({
                "action": "data",
                "fileName": fileName,
                "type": type
            }),
            success: function (data) {
                if (!data) {
                    location.reload();
                }
                switch (data["result"]) {
                    case "success" :
                        handleData(data["data"]);
                        break;
                    case "error" :
                        errorData(data["message"]);
                        break;
                    default :
                        window.location.replace("/");
                        break;
                }
                loaded(".loadingMainContent");
                showVisualisationContent();
            },
            error: function () {
                location.reload();
            }
        });
    }

    $('.bxslider').bxSlider({
        mode: 'horizontal',
        adaptiveHeight: true,
        responsive: true
    });

});


