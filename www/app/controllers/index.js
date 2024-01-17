function formatDate(date, format) {
    date = new Date(date);
    var formattedDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1,
        day: date.getDate() < 10 ? "0" + date.getDate() : date.getDate(),
        hours: date.getHours() < 10 ? "0" + date.getHours() : date.getHours(),
        minutes: date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes(),
        seconds: date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds(),
    };
    for (var key in formattedDate) {
        format = format.replace(key, formattedDate[key]);
    }
    return format;
}

function formatHashrate(hashrate, showUnit) {
    var units = ["H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s"];
    var index = 0;
    while (hashrate > 1e3) {
        hashrate /= 1e3;
        index++;
    }
    return showUnit
        ? hashrate.toFixed(2) + " " + units[index]
        : hashrate.toFixed(2) + " " + units[index];
}

function formatNumber(number) {
    var units = ["H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s"];
    var index = 0;
    while (number >= 1e3) {
        number /= 1e3;
        index++;
    }
    number = number < 10 ? number.toFixed(2) : number.toFixed(2);
    return number.replace(".00", "") + " " + units[index];
}

import Ember from "ember";

export default Ember.Controller.extend({
    applicationController: Ember.inject.controller("application"),
    stats: Ember.computed.reads("applicationController"),
    config: Ember.computed.reads("applicationController.config"),

    cachedLogin: Ember.computed("login", {
        get() {
            return this.get("login") || Ember.$.cookie("login");
        },
        set(key, value) {
            Ember.$.cookie("login", value);
            this.set("model.login", value);
            return value;
        },
    }),

    chartOptions: Ember.computed("model.hashrate", "model.poolCharts", "model.netCharts", {
        get() {
            var now = new Date();
            var e = this,
                t = e.getWithDefault("model.poolCharts", []),
                netCharts = e.getWithDefault("model.netCharts", []),
                a = {
                    chart: {
                        backgroundColor: "rgba(48, 97, 63, 0.0)  ",
                        type: "areaspline",
                        height: 270,
                        ignoreHiddenSeries: !1,
                        events: {
                            load: function () {
                                var self = this;

                                var chartInterval = setInterval(function () {
                                    var series = self.series;
                                    if (!series) {
                                        clearInterval(chartInterval);
                                        return;
                                    }

                                    t = e.getWithDefault("model.poolCharts", []);
                                    netCharts = e.getWithDefault("model.netCharts", []);

                                    // Hashrate chart
                                    var hashData = [];
                                    t.forEach(function (entry) {
                                        var x = new Date(1000 * entry.x);
                                        var l = x.toLocaleString();
                                        var y = entry.y;
                                        hashData.push({ x: x, y: y, d: l });
                                    });

                                    // Point for now 
                                    var now = new Date();
                                    var l = now.toLocaleString();
                                    var y = e.getWithDefault("model.hashrate");
                                    var lastHash = { x: now, y: y, d: l };
                                    { hashData.push(lastHash); }

                                    // Network Difficulty chart
                                    var netDiffData = [];
                                    netCharts.forEach(function (entry) {
                                        var x = new Date(1000 * entry.x);
                                        var l = x.toLocaleString();
                                        var y = entry.y;
                                        netDiffData.push({ x: x, y: y, d: l });
                                    });

                                    series[0].setData(hashData, true, {}, true);
                                    series[1].setData(netDiffData, true, {}, true);

                                }, 88 * 1000);
                            },
                        },
                    },
                    title: {
                        text: '<b>Ethereum Classic - PPLNS </b>',
                        align: 'center',
                        x: 0,
                        y: 15,
                        useHTML: false,
                        style: {
                            color: "rgba(255,255,255,0)",
                            fontSize: '15px',
                            fontFamily: 'Arial',
                            fontWeight: '400'
                        }
                    },
                    xAxis: {
                        ordinal: false,
                        gridLineWidth: 1,
                        type: "datetime",
                        labels: {
                            style: {
                                color: "#fff",
                            },
                            formatter: function () {
                                return formatDate(this.value, "hours:minutes");
                            },
                        },
                    },
                    yAxis: [
                        {
                            index: 0,
                            tickAmount: 4,
                            title: {
                                text: "Pool Hashrate",
                                style: {
                                    color: "#32e400",
                                },
                            },
                            min: 0,
                            labels: {
                                enabled: true,
                                style: {
                                    color: "#fff",
                                },
                                formatter: function () {
                                    return formatNumber(this.value);
                                },
                            },
                        },
                        {
                            index: 1,
                            tickAmount: 4,
                            title: {
                                text: "NETWORK DIFFICULTY",
                                style: {
                                    color: "#007BFF",
                                },
                            },
                            min: 0,
                            labels: {
                                enabled: true,
                                style: {
                                    color: "#fff",
                                },
                                formatter: function () {
                                    return formatNumber(this.value);
                                },
                            },
                            opposite: true,
                        },
                    ],
                    plotOptions: {
                        areaspline: {
                            marker: {
                                enabled: false,
                            },
                        },
                    },
                    plotLines: [
                        {
                            value: 0,
                            width: 1,
                            color: "#fff",
                        },
                    ],
                    legend: {
                        symbolRadius: 4,
                        borderWidth: 1,
                        itemStyle: {
                            color: "#ffffff",
                        },
                        itemHoverStyle: {
                            color: "#777777",
                        },
                        itemHiddenStyle: {
                            color: "#d7d7d7",
                        },
                    },
                    tooltip: {
                        borderRadius: 7,
                        borderWidth: 1,
                        shared: false,
                        headerFormat: "",
                        shared: false,
                        headerFormat: "",
                    },
                    exporting: {
                        enabled: false,
                    },
                    series: [
                        {
                            yAxis: 0,
                            name: "Pool Hashrate",
                            fillColor: "rgba(49, 227, 0, 0.22)",
                            color: "#32e400",
                            tooltip: {
                                pointFormatter: function () {
                                    return (
                                        formatDate(this.x, "day.month.year hours:minutes") +
                                        "<br><b>Pool Hashrate: " +
                                        formatHashrate(this.y, true) +
                                        "</b>"
                                    );
                                },
                            },
                            states: {
                                inactive: {
                                    opacity: 0.1,
                                },
                            },
                            data: function () {
                                var hashData = [];
                                if (null != t) {
                                    t.forEach(function (entry) {
                                        var x = new Date(1000 * entry.x);
                                        var l = x.toLocaleString();
                                        var y = entry.y;
                                        hashData.push({ x: x, y: y, d: l });
                                    });
                                }

                                var l = now.toLocaleString();
                                var y = e.getWithDefault("model.hashrate");
                                var lastHash = { x: now, y: y, d: l };
                                { hashData.push(lastHash); }

                                return hashData;
                            }()
                        },
                        {
                            yAxis: 1,
                            name: "NETWORK DIFFICULTY",
                            fillColor: "rgba(212, 175, 55, 0.35)",
                            color: "#007BFF",
                            tooltip: {
                                pointFormatter: function () {
                                    return (
                                        formatDate(this.x, "day.month.year hours:minutes") +
                                        "<br><b>NETWORK DIFFICULTY: " +
                                        formatNumber(this.y) +
                                        "</b>"
                                    );
                                },
                            },
                            states: {
                                inactive: {
                                    opacity: 0.1,
                                },
                            },
                            data: function () {
                                var netDiffData = [];
                                if (null != netCharts) {
                                    netCharts.forEach(function (entry) {
                                        var x = new Date(1000 * entry.x);
                                        var l = x.toLocaleString();
                                        var y = entry.y;
                                        netDiffData.push({ x: x, y: y, d: l });
                                    });
                                }

                                return netDiffData;
                            }()
                        },
                    ],
                };
            return a;
        },
    }),

    dag: Ember.computed("stats", "model", {
        get() {
            var percent = (this.get("epoch") * 8192) / 1024 / 1024 + 1;
            if (!percent) {
                return 0;
            }
            return percent;
        },
    }),

    epoch: Ember.computed("model.stats", {
        get() {
            return parseInt(this.get("applicationController.height") / 30000);
        },
    }),
});
