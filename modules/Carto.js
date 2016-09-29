import React from 'react'
import * as d3 from 'd3';

import CartoMenu from './CartoMenu'

// To be redifined later to fit parent size
const w = 1000, h = 562;

export default React.createClass({
    getInitialState() {
        return { dataset: null }
    },
    handleSave(customName) {
        let result = fetch('http://128.178.116.122:31304/api/post/custom', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'omit',
            body: JSON.stringify({ label: `${customName} (${this.props.data.process.label})`, dataset: this.state.dataset })
        })

        result
            .then(res => {
                return res.json()
            })
            .then(json => {
                this.props.addCustom({ ID: json, Label: `${customName} (${this.props.data.process.label})`, type: 'custom' })
            })
            .catch(ex => {
                console.log('failed', ex)
            })
    },
    render() {
        return <div>
            <div style={{
                width: '100%',
                height: '100%'
            }}>
                <CartoMenu handleSave={this.handleSave} />
                <svg id={"carto"} ></svg>
            </div>
        </div>
    },
    componentDidMount() {
        if (!_.isEmpty(this.props.data) && _.isEmpty(this.props.dataset)) {
            this.drawGraph(this.parseData(this.props.data))
        }
    },
    componentWillReceiveProps(nextProps) {
        if (!_.isEmpty(nextProps) && _.isEmpty(this.props.dataset)) {
            this.drawGraph(this.parseData(nextProps.data))
        }
    },
    parseData(data) {
        var systems = []
        var services = [data.process, ...data.services]

        services.forEach((serv) => {

            var sys = systems.find((s) => {
                return s.id == serv.systemId;
            });

            if (sys === undefined) {
                var newSystem = {
                    id: serv.systemId,
                    services: [{id: 0, serv: serv}],
                    label: serv.systemId
                };

                systems = systems.concat(newSystem);

            } else {
                sys.services = sys.services.concat({id: sys.services.length, serv: serv});

            }
        })

        const dataset = {
            systems: systems,
            edges: systems.slice(1).map((s, i) => {
                return { source: 0, target: i+1 };
            }),
            servEdges: services.slice(1).map((s, i) => {
                return { source: 0, target: i+1 };
            })
        }
        
        console.log(dataset);

        dataset.systems[0].fx = w / 2;
        dataset.systems[0].fy = h / 2;

        this.setState({ dataset: dataset })
        return dataset
    },
    clearGraph() {
        d3.selectAll("svg > *").remove()
    },
    drawGraph(dataset) {
        this.clearGraph()

        // init color pick
        var colors = d3.scaleOrdinal(d3.schemeCategory10);

        // init simulation
        var simulation = d3.forceSimulation(dataset.systems)
            .force("link", d3.forceLink(dataset.edges).strength(0.1))
            .force("central", d3.forceCenter(w / 2, h / 2))
            .force("charge", d3.forceManyBody().strength([-100]))
            .force("colliding", d3.forceCollide(70))

        // init svg
        var svg = d3.select("svg#carto")
            .attr("width", w)
            .attr("height", h);

        // init edges and systems
        var edges = svg.selectAll("line.proc")
            .data(dataset.edges)
            .enter()
            .append("line")
            .style("stroke", "#ccc")
            .style("stroke-width", 1);

        var systems = svg.selectAll("g")
            .data(dataset.systems)
            .enter()
            .append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("drag", (d) => {
                    if (!d.selected) {
                        event = d3.event;
                        d.fx = event.x;
                        d.fy = event.y;
                        simulation.alpha(0.5).restart();
                    }
                })
                .on("end", (d) => {
                    if (!d.selected) {
                        simulation.alpha(0.3).restart();
                    }
                })
            )
            .on("click", (d) => {
                systems.each((d) => { d.fx = null; d.fy = null })
                d.fx = w / 2;
                d.fy = h / 2;
                simulation.alpha(0.3).restart();
            })
        
        systems
            .append("rect")
            .attr("width", 100)
            .attr("height", 100)
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("class", "system")
            .attr("transform", function (d) { return `translate(-50, -50)`; });

        systems
            .append("text")
            .attr("text-anchor", "start")
            .attr("alignment-baseline", "before-edge")
            .attr("transform", function (d) { return `translate(-40, -40)`; })            
            .text((d) => {
                return d.label;
            });


        var services = systems.selectAll("text")
            .data( (d) => {
                return d.services;
            })
            .enter()
            .append("text")
            .text((d) => {
                return d.serv.label
            })
            .attr("transform", function (d, i) { 
                return `translate(-40, ${-30 + i * 20})`; 
            }) 

        // horloge du système
        simulation.on("tick", function () {
            edges
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            systems
                .attr("transform", function (d) { return `translate(${d.x}, ${d.y})`; });
        });
    }
})
