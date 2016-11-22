/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual.PBI_CV_820a1803_8e00_4869_b083_b47eeec8aff2  {
    
    /**
     * Interface for bladeRingCharts viewmodel.
     *
     * @interface
     * @property {bladeRingDataPoint[]} dataPoints - Set of data points the visual will render.
     * @property {number} dataMax                 - Maximum data value in the set of data points.
     */
    interface bladeRingChartViewModel {
        dataPoints: bladeRingDataPoint[];
        dataPointTooltips: string[];
        ringMax: number[];
        ringMin: number[];
        settings: bladeRingChartSettings;
    };

    /**
     * Interface for bladeRingChart data points.
     *
     * @interface
     * @property {number} value    - Data value for point.
     * @property {string} category - Coresponding category of data value.
     */
    interface bladeRingDataPoint {
        bladeLabel: string;
        blade: number;
        ringLabel: string;
        ring: number;
        value: number;        
        color: string;
        startPos: number;
        selectionId: ISelectionId;
    };
    
    /**
     * Interface for bladeRingChart settings.
     *
     * @interface
     * @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
     */
    interface bladeRingChartSettings {
        enableAxis: {
            show: boolean;
        };
        rScale;
        sizeDegrees:number;
        bladeAngles:number[];
        fillValue: d3.scale.Linear<number, number>[];
        ringConfig:bladeRingChartConfig;
        l:number;
        alignmentPos:number;
        bladeList:string[];
        ringList: string[];
        arcFills: number;

    }

    /**
     * Interface for bladeRingChartConfig.
     *
     * @interface
     * @property {{show:boolean}} enableAxis - Object property that allows axis to be enabled.
     */
    interface bladeRingChartConfig {
        radius:number;
        width:number;
        offset:number;
    }
    
    /**
     * Function that converts queried data into a view model that will be used by the visual.
     *
     * @function
     * @param {VisualUpdateOptions} options - Contains references to the size of the container
     *                                        and the dataView which contains all the data
     *                                        the visual had queried.
     * @param {IVisualHost} host            - Contains references to the host which contains services
     */
    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): bladeRingChartViewModel {
        let dataViews = options.dataViews;
        let defaultSettings: bladeRingChartSettings = {
            enableAxis: {
                show: false,
            },
            rScale: null,
            sizeDegrees:0,
            bladeAngles:[],
            fillValue: [],
            ringConfig: <bladeRingChartConfig>{},
            l:0,
            alignmentPos:-1,
            bladeList:[],
            ringList:[],
            arcFills:0

        };
        let viewModel: bladeRingChartViewModel = {
            dataPoints: [],
            dataPointTooltips: [],
            ringMax: [],
            ringMin: [],
            settings: <bladeRingChartSettings>{}
        };

        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories[0]
            || !dataViews[0].categorical.values[0])
            return viewModel;

        let categorical = dataViews[0].categorical;
        let categories = categorical.categories;
        let values = categorical.values;

        let bladeRingDataPoints: bladeRingDataPoint[] = [];
        let bladeRingDataPointTts: string[] = [];
        let dataMax: number = 0;
        let dataMin: number = 99999;

        let colorPalette: IColorPalette = createColorPalette(host.colors).reset();
        let objects = dataViews[0].metadata.objects;
        let bladeRingChartSettings: bladeRingChartSettings = {
            enableAxis: {
                show: getValue<boolean>(objects, 'enableAxis', 'show', defaultSettings.enableAxis.show),
            },
            rScale:null,
            sizeDegrees:0,
            bladeAngles:[],
            fillValue:[],
            ringConfig:null,
            l:0,
            alignmentPos:-1,
            bladeList:[],
            ringList:[],
            arcFills:0
        }

        var ringConfig = {radius: 40, width: 20, offset: 1}; //TODO: move to Objects
        var ringMin = [];
        var ringMax = [];
        var bladeList:Array<string> = [];
        var ringList:Array<string> = [];
        var r;
        var b;
        var bladeAngles: Array<number> = [];
        var fillValue: Array<d3.scale.Linear<number, number>> = [];

        function deepIndexOf(arr, obj) {
            return arr.findIndex(function (cur) {
                return Object.keys(obj).every(function (key) {
                return obj[key] === cur[key];
                });
            });
        }

        function degreesToRadians(d){
            var r = 0;
            r = d * (Math.PI / 180);
            return r;
        }
        function radiansToDegrees(d){
            return d*57.2958;
        }

        for (let i = 0, lenC = categories[0].values.length; i < lenC; i++) {            
            for(let j = 0, lenV = values.length; j < lenV; j++){
                let defaultColor: Fill = {
                    solid: {
                        color: colorPalette.getColor(categories[0].values[i]).value
                    }
                }
                let blade = categories[0].values[i] == null ? "null" : categories[0].values[i];
                let value = values[j].values[i] == null ? 0 : values[j].values[i];
                let ring  = values[j].source.groupName;

                if(bladeList.map(function(x){ return x; }).indexOf(blade) == -1){
                    bladeList[bladeList.length]=blade;
                }

                if(ringList.map(function(x){ return x; }).indexOf(ring) == -1){
                    ringList[ringList.length]=ring;
                }

                b = bladeList.map(function(x){ return x; }).indexOf(blade);
                r = ringList.map(function(x){ return x; }).indexOf(ring);

                ringMin[r] = isNaN(ringMin[r]) || ringMin[r] > Number(value) ? Number(value) : ringMin[r];
                ringMax[r] = isNaN(ringMax[r]) || ringMax[r] < Number(value) ? Number(value) : ringMax[r];

                bladeRingDataPoints.push({
                    bladeLabel: blade,
                    blade: b,
                    ringLabel: ring,
                    ring: r,
                    value: value,
                    color: getCategoricalObjectValue<Fill>(blade, b, 'colorSelector', 'fill', defaultColor).solid.color,
                    startPos: 0,
                    selectionId: host.createSelectionIdBuilder()
                        //.withMeasure(values[j].source.queryName)
                        //.withSeries(categorical.values, categorical.values[j])
                        .withCategory(categorical.categories[0], j)
                        .createSelectionId()
                });
                dataMax = <number>value > dataMax ? <number>value : dataMax;
                dataMin = <number>value < dataMin && <number>value > 0 ? <number>value : dataMin;

                bladeRingDataPointTts.push("Blade = "+blade+"; Ring = "+ring+"; Value = "+value);
            }            
        }

        bladeRingChartSettings.sizeDegrees = 360/bladeList.length;

        bladeRingDataPoints.sort(function(a, b)
        {
            if(a.ring === b.ring)
            {
                var x = a.value, y = b.value;        
                return x > y ? -1 : x < y ? 1 : 0;
            }
            return a.ring - b.ring;
        });

        bladeRingDataPoints.forEach(function(d,i){   
            if(bladeAngles[d.blade] != null) return;
            bladeAngles[d.blade] = Math.floor(radiansToDegrees(degreesToRadians((d.blade*bladeRingChartSettings.sizeDegrees-.15*d.ring))));
        });

        for(var i=0; i<ringMax.length; i++){
            fillValue[i] = d3.scale.linear().domain([ringMin[i],ringMax[i]]).range([2,ringConfig.width]);
        }

        bladeRingChartSettings.rScale = d3.scale.linear().domain([dataMin,dataMax]).range([5,20]); //todo: fix hardcoding
        bladeRingChartSettings.bladeAngles = bladeAngles;
        bladeRingChartSettings.ringConfig = ringConfig;
        bladeRingChartSettings.l = bladeList.length > ringList.length ? bladeAngles.length-1 : ringList.length-1;
        bladeRingChartSettings.bladeList = bladeList;
        bladeRingChartSettings.ringList = ringList;
        bladeRingChartSettings.arcFills=0;
        bladeRingChartSettings.fillValue = fillValue;

        return {
            dataPoints: bladeRingDataPoints,
            dataPointTooltips: bladeRingDataPointTts,
            ringMax: ringMax,
            ringMin: ringMin,
            settings: bladeRingChartSettings
        };
    }

    function collide(n) {
        var r = n.radius + 100,
            nx1 = n.x - r,
            nx2 = n.x + r,
            ny1 = n.y - r,
            ny2 = n.y + r;
        return function(quad, x1, y1, x2, y2) {
            if (quad.point && (quad.point !== n)) {
            var x = n.x - quad.point.x,
                y = n.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = n.radius + quad.point.radius;
            if (l < r) {
                l = (l - r) / r * 0.5;
                n.x -= x *= l;
                n.y -= y *= l;
                quad.point.x += x;
                quad.point.y += y;
            }
            }
            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        };
    }
        
    export class Visual implements IVisual {
        private svg: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private selectionManager: ISelectionManager;
        private bladeRingChartContainer: d3.Selection<SVGElement>;
        private bladeRingContainer: d3.Selection<SVGElement>;
        private xAxis: d3.Selection<SVGElement>;
        private bladeRingDataPoints: bladeRingDataPoint[];
        private bladeRingChartSettings: bladeRingChartSettings;

        private dataColors: d3.scale.Ordinal<String, String>;
        private ringMax: number;
        private sizeDegrees: number;
        private bladeAngles: number[];
        private bladeOffset: number[];
        private ringList: string[];
        private bladeList: string[];
        private pos: number;
        private l: number;
        private slices: d3.Selection<SVGElement>;

        private updateCount: number;

        static Config = {
            xScalePadding: 0.1,
            solidOpacity: 1,
            transparentOpacity: 0.5,
            margins: {
                top: 0,
                right: 0,
                bottom: 25,
                left: 30,
            },
            xAxisFontMultiplier: 0.04,
        };

        /**
         * Creates instance of bladeRingChart. This method is only called once.
         *
         * @constructor
         * @param {VisualConstructorOptions} options - Contains references to the element that will
         *                                             contain the visual and a reference to the host
         *                                             which contains services.
         */
        constructor(options: VisualConstructorOptions) {
            var data = [];
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            let svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('bladeRingChart', true);

            this.bladeRingContainer = svg.append('g')
                .classed('bladeRingContainer', true)
                .attr("transform", "translate(250,250)");

            this.slices = this.bladeRingContainer.selectAll("path");

            this.dataColors = d3.scale.category20();

            this.updateCount = 0;
        }

        /**
         * Updates the state of the visual. Every sequential databinding and resize will call update.
         *
         * @function
         * @param {VisualUpdateOptions} options - Contains references to the size of the container
         *                                        and the dataView which contains all the data
         *                                        the visual had queried.
         */
        public update(options: VisualUpdateOptions) {

            let width = options.viewport.width;
            let height = options.viewport.height;

            function arcFillValue(j){
                for(var i=0; i<viewModel.ringMax.length; i++){
                    fillValue[i] = d3.scale.linear().domain([viewModel.ringMin[i],viewModel.ringMax[i]]).range([2,settings.ringConfig.width]);
                }
            }

            function innerRadius(i){ 
                return settings.ringConfig.radius + (i*settings.ringConfig.width) + (i*settings.ringConfig.offset);
            }
            function fillRadius(i,d){ 
                return settings.ringConfig.width+(d.ring+1<= fillValue.length ? fillValue[d.ring](d.value) : 50) + ((i+1)*settings.ringConfig.width) + (i*settings.ringConfig.offset);
            }
            function degreesToRadians(d){
                var r = 0;
                r = d * (Math.PI / 180);
                return r;
            }
            function radiansToDegrees(d){
                return d*57.2958;
            }
            function uniq(a) {
                return a.sort().filter(function(item, pos, ary) {
                    return !pos || item != ary[pos - 1];
                });
            }

            let viewModel: bladeRingChartViewModel = visualTransform(options, this.host);
            let selectionManager = this.selectionManager;
            let settings = this.bladeRingChartSettings = viewModel.settings;
            this.bladeRingDataPoints = viewModel.dataPoints;
            let bladeRingDataPoints = this.bladeRingDataPoints;
            let fillValue = settings.fillValue;
            let sizeDegrees = this.bladeRingChartSettings.sizeDegrees;

            this.ringMax;
            this.sizeDegrees;
            this.bladeOffset = [];
            this.pos=-1;
            this.l;

            //early bail-out in case we're still setting up data
            if(bladeRingDataPoints.length == 0)
                return;

            var arcFills = d3.svg.arc<d3.svg.arc.Arc>()
                    .innerRadius(function(d, i){ return innerRadius(bladeRingDataPoints[i].ring);})
                    .outerRadius(function(d, i){ return fillRadius(bladeRingDataPoints[i].ring,bladeRingDataPoints[i]);})
                    .startAngle(function(d, i){ return degreesToRadians(i*sizeDegrees-.15*bladeRingDataPoints[i].ring);})
                    .endAngle(function(d, i){ return degreesToRadians((i*sizeDegrees)+sizeDegrees-2);});

            this.svg.attr({
                width: width,
                height: height,
            });

        if(this.updateCount == 0 )//if first update, or reset
        {
            //initial setup (counting on having a chance to draw svg's before data changes)
            this.bladeAngles = settings.bladeAngles;
            this.ringList = settings.ringList;
            this.bladeList = settings.bladeList;
            this.l = settings.l;
            let that = this;

            for(var i=0; i<viewModel.ringMax.length; i++){
                fillValue[i] = d3.scale.linear().domain([viewModel.ringMin[i],viewModel.ringMax[i]]).range([1,settings.ringConfig.width]);
            }
            this.slices = <any>this.slices.data(this.bladeRingDataPoints)
                    .enter()
                    .append("g");
            
            this.slices.append("svg:title").text(function(d,i){ return "Province: ["+bladeRingDataPoints[i].bladeLabel+"] Category: ["+bladeRingDataPoints[i].ringLabel+"] Value: ["+bladeRingDataPoints[i].value+"]";});
            
            this.slices.append("svg:path")
                .attr("id",function(d,i){ return "b"+bladeRingDataPoints[i].blade+"r"+bladeRingDataPoints[i].ring+"f"; })
                .attr("bladeLabel",function(d,i){ return bladeRingDataPoints[i].bladeLabel; })
                .attr("ringLabel",function(d,i){ return bladeRingDataPoints[i].ringLabel; })
                .attr("v",function(d,i){return bladeRingDataPoints[i].value;})
                .attr("f",function(d,i){return fillValue[bladeRingDataPoints[i].ring](bladeRingDataPoints[i].value);})
                .attr("currPos",function(d,i){
                        bladeRingDataPoints[i].startPos = i- (bladeRingDataPoints[i].ring*(settings.bladeList.length-1))-bladeRingDataPoints[i].ring;//set starting position based on sorted position
                        return bladeRingDataPoints[i].startPos;
                    })
                .style("fill", function(d,i){ 
                    return bladeRingDataPoints[i].color; 
                })
                .attr("d", <any>arcFills);

            this.slices.on("click",function(d, i){
                selectionManager.select(bladeRingDataPoints[i].selectionId);
                that.updateCount++;
                that.update(options);
            }); 
            //setup end
        }else{
            this.reDraw(bladeRingDataPoints,settings);           
        }             
        this.updateCount++;        
    }

            public reDraw(bladeRingDataPoints: bladeRingDataPoint[], settings: bladeRingChartSettings){
                var activeblade = this.bladeList.indexOf(bladeRingDataPoints[0].bladeLabel);
                var samebladePrefix = "b"+activeblade+"r";
                //var sameblade = d3.selectAll('[id*='+samebladePrefix+']')._groups[0]; //d3v4
                var sameblade = d3.selectAll('[id*='+samebladePrefix+']')[0]; //d3v3
                var bladeOffsets = [];
                var bladeAngles = this.bladeAngles;
                //shade all, according to selection
                if(bladeRingDataPoints.length > this.bladeList.length)
                {
                    this.slices.style("fill-opacity","1"); //no selection
                }else{
                    this.slices.style("fill-opacity","0.25"); //selection
                }

                sameblade.forEach(function(r,i){
                    //bladeOffsets[i]=d3.select(d3.selectAll('[id*='+samebladePrefix+']')._groups[0][i]).attr("currPos"); //d3v4
                    bladeOffsets[i]=d3.selectAll('[id*='+samebladePrefix+i+']').attr("currPos"); //d3v3         
                    //unshade selected
                    d3.select(d3.selectAll('[id*='+samebladePrefix+i+']').node().parentNode).style("fill-opacity","1");           
                });
                

                for(var i=0;i<bladeOffsets.length; i++){
                    do{
                        if(bladeOffsets[i]>this.l) bladeOffsets[i]-=this.l;
                    }while(bladeOffsets[i]>this.l)
                    bladeOffsets[i]=0-bladeOffsets[i];
                }
                
                //apply transition
                for(var r=0; r <= this.l; r++)
                {
                    d3.selectAll("[id$=r"+r+"f]")
                        .transition()
                            .duration(750)
                            .attr("transform", function(p,h) {  
                                var currPos = parseInt(d3.select("#b"+activeblade+"r"+p.ring+"f").attr("currPos"))+parseInt(bladeOffsets[r]);
                                var rotateBy = Math.abs(bladeOffsets[r]+settings.alignmentPos) > bladeAngles.length-1 ? Math.abs(bladeOffsets[r]+settings.alignmentPos)-(bladeAngles.length) : bladeOffsets[r]+settings.alignmentPos;
                                var appliedAngle = 0;
                                if(bladeRingDataPoints.length > settings.ringList.length){ //reset
                                    appliedAngle = bladeAngles[bladeRingDataPoints[i].startPos];
                                }else{ //regular selection
                                    appliedAngle = 0 + (bladeOffsets[r]+settings.alignmentPos > 0 ? bladeAngles[Math.abs(rotateBy)] : -1*bladeAngles[Math.abs(rotateBy)].valueOf());
                                }
                                return "rotate("+(appliedAngle)+")"; //default rotation ends arc angles right-hand edge at 90 degrees
                            });
                }
        }

        public defaultSort(arr: bladeRingDataPoint[]): bladeRingDataPoint[]{
            return arr.sort(function(a, b)
            {
                if(a.ring === b.ring)
                {
                    var x = a.value, y = b.value;        
                    return x > y ? -1 : x < y ? 1 : 0;
                }
                return a.ring - b.ring;
            });
        }

        /**
         * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
         *
         * @function
         * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
            switch(objectName) {
                case 'enableAxis':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            show: this.bladeRingChartSettings.enableAxis.show,
                        },
                        selector: null
                    });
                    break;
                case 'colorSelector':
                    for(let bladeRingDataPoint of this.bladeRingDataPoints) {
                        objectEnumeration.push({
                            objectName: objectName,
                            displayName: bladeRingDataPoint.bladeLabel,
                            properties: {
                                fill: {
                                    solid: {
                                        color: bladeRingDataPoint.color
                                    }
                                }
                            },
                            selector: bladeRingDataPoint.selectionId.getSelector()
                        });
                    }
                    break;
            };

            return objectEnumeration;
        }

        /**
         * Destroy runs when the visual is removed. Any cleanup that the visual needs to
         * do should be done here.
         *
         * @function
         */
        public destroy(): void {
            //Perform any cleanup tasks here
        }
    }
}