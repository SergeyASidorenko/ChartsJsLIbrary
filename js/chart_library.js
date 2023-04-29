/**
 * Chart Класс для построения графиков и гистограмм
 * @param {int} id 
 * @param {float} width 
 * @param {float} height 
 * @param {string} type 
 * @param {array} xValues 
 * @param {array} yValues 
 * @param {string} xAxisTitle 
 * @param {string} yAxisTitle 
 * @param {boolean} isReversedAxis 
 */
let Chart = function (id, width, height, type, xValues, yValues, xAxisTitle, yAxisTitle, isReversedAxis) {
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
    const CHART_TYPE_GRAPH = 'graph';
    const CHART_TYPE_HYSTOGRAM = 'hystogram';
    const AXIS_X = 'x';
    const AXIS_Y = 'y';
    this.id = id;
    this.width = width;
    this.height = height;
    this.type = type;
    this.xValues = xValues;
    this.yValues = yValues;
    this.container = document.getElementById(this.id);
    this.svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    this.chartGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.mainGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    // Размер оси абсцисс в пикселах
    this.xAxisWidth = 0;
    // Размер оси ординат в пикселах
    this.yAxisHeight = 0;
    // Размер легенды для оси X в пикселах
    this.xAxisLegendHeight = 0;
    // Размер легенды для оси Y в пикселах
    this.yAxisLegendWidth = 0;
    this.isReversedAxis = isReversedAxis;
    // Размер пустых промежутков между плитками гистограммы в пикселах
    this.hystogramBarGap = 10;
    this.axisLabelTextAndAxisGap = 20;
    // Ширина штрихов разметки на осях впикселах
    this.axisLabelHatchWidth = 10;
    // Рассчитываемый масштаб по оси X
    this.xAxisScale = 0;
    // Рассчитываемый масштаб по оси Y
    this.yAxisScale = 0;
    this.defaultAxisValueLabelsAmount = 10;
    // Значение ширины плитки гистрограммы по умолчанию в пикселах
    this.hystogramBarWidth = 50;
    this.hintContainer = document.createElement('div');
    this.xValueHint = document.createElement('span');
    this.yValueHint = document.createElement('span');
    this.xValueHintLabel = xAxisTitle;
    this.yValueHintLabel = yAxisTitle;
    // Отсортированные метки оси X
    this.xAxisSortedLabels = [];
    // Отсортированные метки оси Y
    this.yAxisSortedLabels = [];
    // Подготовленные для отображения метки оси X в виде SVG-узлов <text>
    this.xAxisLabelTextNodes = new Map();
    // Подготовленные для отображения метки оси Y в виде SVG-узлов <text>
    this.yAxisLabelTextNodes = new Map();
    this.offsetByX = 0;
    this.offsetByY = 0;
    this.svgXPadding = 0;
    this.svgYPadding = 0;
    this.draw = function () {
        if (this.xValues.length === 0 || this.yValues.length === 0) {
            return;
        }
        this.chartGroup.setAttribute('id', 'chart-group');
        this.mainGroup.setAttribute('id', 'main-group');
        this.mainGroup.appendChild(this.chartGroup);
        this.svg.appendChild(this.mainGroup);
        this.container.appendChild(this.svg);
        this.hintContainer.id = `hint-container-${this.id}`;
        this.hintContainer.classList.add('hint-container');
        this.xValueHint.id = `x-value-hint-${this.id}`;
        this.yValueHint.id = `y-value-hint-${this.id}`;
        if (this.isReversedAxis) {
            this.hintContainer.appendChild(this.yValueHint);
            this.hintContainer.appendChild(this.xValueHint);
        } else {
            this.hintContainer.appendChild(this.xValueHint);
            this.hintContainer.appendChild(this.yValueHint);
        }
        this.container.appendChild(this.hintContainer);

        // Если размеры графика переданы как проценты
        if ((new String(this.width)).indexOf("%") !== -1) {
            this.width = this.container.offsetWidth * parseInt(this.width) / 100;
        }
        if ((new String(this.height)).indexOf("%") !== -1) {
            this.height = this.container.offsetHeight * parseInt(this.height) / 100;
        }
        // Устанавливаем размеры контейнеров
        if (this.height == 'auto') {
            this.container.style.height = 'auto';
        } else {
            this.container.style.height = this.height + 'px';
            this.svg.setAttribute('height', this.height);

        }
        if (this.width == 'auto') {
            this.container.style.width = 'auto';
        } else {
            this.container.style.width = this.width + 'px';
            this.svg.setAttribute('width', this.width);

        }
        this.xAxisLegendHeight = this.drawXAxisLegend();
        this.svgXPadding = 30;
        this.yAxisLegendWidth = this.drawYAxisLegend();
        this.svgYPadding = 30;
        if (this.type == CHART_TYPE_HYSTOGRAM && this.isReversedAxis) {
            if (this.height != 'auto') {
                let freeSpace = this.svg.getAttribute('height') - 2 * this.svgYPadding - this.xAxisLegendHeight - this.axisLabelTextAndAxisGap;
                this.hystogramBarWidth = 4 * freeSpace / (5 * this.yValues.length);
                this.hystogramBarGap = freeSpace / (5 * this.yValues.length);
            }
            this.yAxisHeight = this.yValues.length * (this.hystogramBarWidth + this.hystogramBarGap);
        } else {
            this.yAxisHeight = (this.svg.clientHeight - (this.xAxisLegendHeight + this.axisLabelTextAndAxisGap)) - 2 * this.svgYPadding;
        }
        if (this.type == CHART_TYPE_HYSTOGRAM && !this.isReversedAxis) {
            if (this.width != 'auto') {
                let freeSpace = this.svg.getAttribute('width') - 2 * this.svgXPadding - this.yAxisLegendWidth - this.axisLabelTextAndAxisGap;
                this.hystogramBarWidth = 4 * freeSpace / (5 * this.xValues.length);
                this.hystogramBarGap = freeSpace / (5 * this.xValues.length);
            }
            this.xAxisWidth = this.xValues.length * (this.hystogramBarWidth + this.hystogramBarGap);
        } else {
            this.xAxisWidth = (this.svg.clientWidth - (this.yAxisLegendWidth + this.axisLabelTextAndAxisGap)) - 2 * this.svgXPadding;
        }
        if (this.width == 'auto') {
            this.svg.setAttribute('width', this.xAxisWidth + this.yAxisLegendWidth + this.axisLabelTextAndAxisGap + 2 * this.svgXPadding);
        }
        if (this.height == 'auto') {
            this.svg.setAttribute('height', this.yAxisHeight + this.xAxisLegendHeight + this.axisLabelTextAndAxisGap + 2 * this.svgYPadding);
        }
        this.drawAxises();
        this.addMouseEnterHystogramBarHandler();
        this.addMouseLeaveHystogramBarHandler();
    };

    this.drawAxises = function () {
        let xLabelCoord = 0;
        let yLabelCoord = 0;
        this.xAxisScale = this.xAxisWidth / (this.xAxisSortedLabels[this.xAxisSortedLabels.length - 1] - this.xAxisSortedLabels[0]);
        this.yAxisScale = this.yAxisHeight / (this.yAxisSortedLabels[this.yAxisSortedLabels.length - 1] - this.yAxisSortedLabels[0]);
        this.offsetByX = this.svgXPadding + this.yAxisLegendWidth + this.axisLabelTextAndAxisGap;
        this.offsetByY = this.svgYPadding;
        // ---------------------------------- Рисуем каркас графика -------------------------------------------
        // ------------------------------------- Обработка оси X --------------------------------------------
        for (i = 0; i < this.xAxisSortedLabels.length; i++) {
            let xLabelHatch = document.createElementNS(SVG_NAMESPACE, 'line');
            xLabelHatch.setAttribute('y1', this.offsetByY + this.yAxisHeight + this.axisLabelHatchWidth / 2);
            xLabelHatch.setAttribute('y2', this.offsetByY + this.yAxisHeight - this.axisLabelHatchWidth / 2);
            this.chartGroup.appendChild(xLabelHatch);
            let xAxisLabelTextNode = this.xAxisLabelTextNodes.get(this.xAxisSortedLabels[i]);
            let xLabelTextDimensions = xAxisLabelTextNode.getBBox();
            if (!this.isReversedAxis && this.type == CHART_TYPE_HYSTOGRAM) {
                xLabelCoord = (i + 1) * (this.xAxisWidth / this.xValues.length) - this.xAxisWidth / (2 * this.xValues.length);
            } else {
                xLabelCoord = i * (this.xAxisWidth / this.defaultAxisValueLabelsAmount);
            }
            xLabelHatch.setAttribute('x1', this.offsetByX + xLabelCoord);
            xLabelHatch.setAttribute('x2', this.offsetByX + xLabelCoord);
            if (xAxisLabelTextNode.getAttribute('is-multiline')) {
                xAxisLabelTextNode.setAttribute('x', this.offsetByX + xLabelCoord + xLabelTextDimensions.width / 2);
                let tspans = xAxisLabelTextNode.getElementsByTagName('tspan');
                for (let i = 0; i < tspans.length; i++) {
                    tspans[i].setAttribute('y', this.offsetByY + this.yAxisHeight + this.axisLabelTextAndAxisGap);
                }
            } else {
                xAxisLabelTextNode.setAttribute('x', this.offsetByX + xLabelCoord);
            }
            xAxisLabelTextNode.setAttribute('y', this.offsetByY + this.yAxisHeight + this.axisLabelTextAndAxisGap);
            if (this.type != CHART_TYPE_HYSTOGRAM || (this.type == CHART_TYPE_HYSTOGRAM && this.isReversedAxis)) {
                let xGridLine = document.createElementNS(SVG_NAMESPACE, 'line');
                xGridLine.setAttribute('x1', this.offsetByX + xLabelCoord);
                xGridLine.setAttribute('x2', this.offsetByX + xLabelCoord);
                xGridLine.setAttribute('y1', this.offsetByY + this.yAxisHeight);
                xGridLine.setAttribute('y2', this.offsetByY);
                xGridLine.setAttribute('stroke', '#e5e5e5');
                this.chartGroup.appendChild(xGridLine);
            }
        }
        let xAxis = document.createElementNS(SVG_NAMESPACE, 'line');
        xAxis.setAttribute('id', 'axis-x');
        xAxis.setAttribute('x1', this.offsetByX);
        xAxis.setAttribute('x2', this.offsetByX + this.xAxisWidth);
        xAxis.setAttribute('y1', this.offsetByY + this.yAxisHeight);
        xAxis.setAttribute('y2', this.offsetByY + this.yAxisHeight);
        // ------------------------------------- Обработка оси Y --------------------------------------------
        for (i = 0; i < this.yAxisSortedLabels.length; i++) {
            let yLabelHatch = document.createElementNS(SVG_NAMESPACE, 'line');
            yLabelHatch.setAttribute('x1', this.offsetByX - this.axisLabelHatchWidth / 2);
            yLabelHatch.setAttribute('x2', this.offsetByX + this.axisLabelHatchWidth / 2);
            this.chartGroup.appendChild(yLabelHatch);
            if (this.isReversedAxis && this.type == CHART_TYPE_HYSTOGRAM) {
                yLabelCoord = (i + 1) * (this.yAxisHeight / this.yValues.length) - this.yAxisHeight / (2 * this.yValues.length);
            } else {
                yLabelCoord = (this.yAxisSortedLabels.length - 1 - i) * (this.yAxisHeight / this.defaultAxisValueLabelsAmount);
            }
            yLabelHatch.setAttribute('y1', this.offsetByY + yLabelCoord);
            yLabelHatch.setAttribute('y2', this.offsetByY + yLabelCoord);
            let yAxisLabelTextNode = this.yAxisLabelTextNodes.get(this.yAxisSortedLabels[i]);
            let yLabelTextDimensions = yAxisLabelTextNode.getBBox();
            yAxisLabelTextNode.setAttribute('x', this.svgXPadding);
            yAxisLabelTextNode.setAttribute('y', this.offsetByY + yLabelCoord - yLabelTextDimensions.height / 2);
            if (this.type != CHART_TYPE_HYSTOGRAM || (this.type == CHART_TYPE_HYSTOGRAM && !this.isReversedAxis)) {
                let yGridLine = document.createElementNS(SVG_NAMESPACE, 'line');
                yGridLine.setAttribute('x1', this.offsetByX);
                yGridLine.setAttribute('x2', this.offsetByX + this.xAxisWidth);
                yGridLine.setAttribute('y1', this.offsetByY + yLabelCoord);
                yGridLine.setAttribute('y2', this.offsetByY + yLabelCoord);
                yGridLine.setAttribute('stroke', '#e5e5e5');
                this.chartGroup.appendChild(yGridLine);
            }
        }
        let yAxis = document.createElementNS(SVG_NAMESPACE, 'line');
        yAxis.setAttribute('id', 'axis-y');
        yAxis.setAttribute('x1', this.offsetByX);
        yAxis.setAttribute('x2', this.offsetByX);
        yAxis.setAttribute('y1', this.offsetByY);
        yAxis.setAttribute('y2', this.offsetByY + this.yAxisHeight);
        this.chartGroup.appendChild(yAxis);
        this.chartGroup.appendChild(xAxis);
        // ---------------------------- Рисуем сам график ----------------------------
        // ------------------------------- Гистрограмма ------------------------------
        let sourceAxisLableIndex = 0;
        if (this.type == CHART_TYPE_HYSTOGRAM) {
            if (this.isReversedAxis) {
                for (i = 0; i < this.yValues.length; i++) {
                    sourceAxisLableIndex = this.yAxisSortedLabels.indexOf(this.yValues[i]);
                    let hystogramBar = document.createElementNS(SVG_NAMESPACE, 'rect');
                    hystogramBar.setAttribute('x', this.offsetByX);
                    hystogramBar.setAttribute('y', this.offsetByY + sourceAxisLableIndex * (this.yAxisHeight / this.yValues.length) + this.hystogramBarGap / 2);
                    hystogramBar.setAttribute('height', this.yAxisHeight / this.yValues.length - this.hystogramBarGap);
                    hystogramBar.setAttribute('width', (this.xValues[i] - this.xAxisSortedLabels[0]) * this.xAxisScale);
                    hystogramBar.setAttribute('fill', '#58a1e6');
                    hystogramBar.setAttribute('stroke', 'none');
                    hystogramBar.setAttribute('data-x-value', this.xValues[i]);
                    hystogramBar.setAttribute('data-y-value', this.yValues[i]);
                    hystogramBar.setAttribute('class', 'hystogram-bar');
                    this.chartGroup.appendChild(hystogramBar);
                }
            } else {
                for (i = 0; i < this.xValues.length; i++) {
                    sourceAxisLableIndex = this.xAxisSortedLabels.indexOf(this.xValues[i]);
                    let hystogramBar = document.createElementNS(SVG_NAMESPACE, 'rect');
                    hystogramBar.setAttribute('x', this.offsetByX + sourceAxisLableIndex * (this.xAxisWidth / this.xValues.length) + this.hystogramBarGap / 2);
                    hystogramBar.setAttribute('y', this.offsetByY + (this.yAxisHeight - (this.yValues[i] - this.yAxisSortedLabels[0]) * this.yAxisScale));
                    hystogramBar.setAttribute('width', this.xAxisWidth / this.xValues.length - this.hystogramBarGap);
                    hystogramBar.setAttribute('height', (this.yValues[i] - this.yAxisSortedLabels[0]) * this.yAxisScale);
                    hystogramBar.setAttribute('fill', '#58a1e6');
                    hystogramBar.setAttribute('stroke', 'none');
                    hystogramBar.setAttribute('data-x-value', this.xValues[i]);
                    hystogramBar.setAttribute('data-y-value', this.yValues[i]);
                    hystogramBar.setAttribute('class', 'hystogram-bar');
                    this.chartGroup.appendChild(hystogramBar);
                }
            }
        }
        this.chartGroup.setAttribute("stroke", "#c9c9c9");
    };
    /**
     * 
     * @param {array} values 
     * @param {boolean} isSequence 
     * @returns 
     */
    this.getSortedAxisLabelValueRange = function (values, isSequence) {
        let valuesAsString = JSON.stringify(values);
        let copiedValues = JSON.parse(valuesAsString);
        let sortedValues = [];
        if (!isSequence) {
            sortedValues = copiedValues.sort(function (a, b) {
                return a - b;
            });
            let minValue = Math.round(sortedValues[0]);
            let maxValue = Math.round(sortedValues[sortedValues.length - 1]);
            if (this.getAmountOfDigits(maxValue) > this.getAmountOfDigits(minValue) && minValue > 0) {
                minValue = 0;
            } else {
                minValue = this.smartFloor(minValue);
            }
            maxValue = this.smartCeil(maxValue);
            amplitude = maxValue - minValue;
            sortedValues = [];
            let axisLabelValue = 0;
            let step = amplitude / this.defaultAxisValueLabelsAmount;
            for (let i = 0; i <= this.defaultAxisValueLabelsAmount; i++) {
                axisLabelValue = minValue + i * step;
                sortedValues.push(axisLabelValue.toFixed(2));
            }
        } else {
            sortedValues = copiedValues.sort();
        }
        return sortedValues;
    };
    this.displayHint = function (xValue, yValue, x, y) {
        this.xValueHint.textContent = `${this.xValueHintLabel}: ${xValue}`;
        this.yValueHint.textContent = `${this.yValueHintLabel}: ${yValue}`;
        this.hintContainer.style.left = x + 'px';
        this.hintContainer.style.top = y + 'px';
        this.hintContainer.style.display = 'flex';
    };
    this.hideHint = function () {
        this.hintContainer.style.display = 'none';
    };
    this.addMouseEnterHystogramBarHandler = function (e) {
        let bars = this.container.getElementsByClassName('hystogram-bar');
        let chart = this;
        for (let i = 0; i < bars.length; i++) {
            bars[i].addEventListener('mouseenter', function (e) {
                let bar = e.target;
                bar.classList.add('highlighted');
                let xCoord = e.clientX + window.scrollX;
                let yCoord = e.clientY + window.scrollY;
                chart.displayHint(bar.getAttribute('data-x-value'), bar.getAttribute('data-y-value'), xCoord, yCoord);
            })
        }

    };
    this.addMouseLeaveHystogramBarHandler = function (e) {
        let bars = document.getElementsByClassName('hystogram-bar');
        let chart = this;
        for (let i = 0; i < bars.length; i++) {
            bars[i].addEventListener('mouseleave', function (e) {
                let bar = e.target;
                bar.classList.remove('highlighted');
                chart.hideHint();
            })
        }
    };
    /**
     * @param {int} number
     * @returns {int}
     */
    this.getAmountOfDigits = function (number) {
        number = Math.abs(number);
        let amount = 1;
        while (number > 10) {
            amount++;
            number = number / 10;
        }
        return amount;
    };
    /**
     * Умное округление вверх
     * @returns {int}
     */
    this.smartCeil = function (number) {
        let digits = this.getAmountOfDigits(number);
        let mostValuedDigit = Math.trunc(number / Math.pow(10, digits - 2 > 0 ? digits - 2 : 0));
        return (mostValuedDigit + 1) * Math.pow(10, digits - 2 > 0 ? digits - 2 : 0);
    };
    /**
     * Умное округление вниз
     * @returns {int}
     */
    this.smartFloor = function (number) {
        let digits = this.getAmountOfDigits(number);
        let mostValuedDigit = Math.trunc(number / Math.pow(10, digits - 2 > 0 ? digits - 2 : 0));
        return (mostValuedDigit - 1) * Math.pow(10, digits - 2 > 0 ? digits - 2 : 0);
    };
    /**
     * 
     * @param {string} text
     * @param {string} axis
     * @returns {DomElement}
     */
    this.createAxisLableTextNode = function (text, axis) {
        text = new String(text);
        text = text.trim();
        let axisLabelTextNode = document.createElementNS(SVG_NAMESPACE, "text");
        let tspan = null;
        this.mainGroup.appendChild(axisLabelTextNode);
        let words = text.split(' ');
        let arrayOfTwoWords = [];
        for (let i = 0; i < words.length; i = i + 2) {
            if (i + 1 <= words.length - 1) {
                arrayOfTwoWords.push(words[i] + ' ' + words[i + 1]);
            } else {
                arrayOfTwoWords.push(words[i]);
            }
        }
        if (arrayOfTwoWords.length > 1) {
            axisLabelTextNode.setAttribute('is-multiline', 1);
        }
        for (let i = 0; i < arrayOfTwoWords.length; i++) {
            if (arrayOfTwoWords.length == 1) {
                axisLabelTextNode.textContent = arrayOfTwoWords[i];
            } else {
                tspan = document.createElementNS(SVG_NAMESPACE, "tspan");
                tspan.textContent = arrayOfTwoWords[i];
                if (axis == AXIS_X) {
                    tspan.setAttribute('dx', i === 0 ? 0 : -14);
                } else {
                    tspan.setAttribute('x', this.svgXPadding);
                    tspan.setAttribute('dy', i === 0 ? 0 : 14);
                }
                axisLabelTextNode.appendChild(tspan);
            }
        }
        return axisLabelTextNode;
    };
    /**
     * 
     * @returns int
     */
    this.drawXAxisLegend = function () {
        let xAxisLegendHeight = 0;
        this.xAxisSortedLabels = this.getSortedAxisLabelValueRange(this.xValues, this.type == CHART_TYPE_HYSTOGRAM && !this.isReversedAxis);
        for (let xAxisLabel of this.xAxisSortedLabels) {
            let xAxisLabelTextNode = this.createAxisLableTextNode(xAxisLabel, AXIS_X);
            this.mainGroup.appendChild(xAxisLabelTextNode);
            xAxisLabelTextNode.setAttribute('fill', "#818181");
            xAxisLabelTextNode.setAttribute('font-size', "12");
            if (this.type == CHART_TYPE_HYSTOGRAM && !this.isReversedAxis) {
                xAxisLabelTextNode.setAttribute('writing-mode', 'tb');
                xAxisLabelTextNode.setAttribute('dominant-baseline', 'middle');
                xAxisLabelTextNode.setAttribute('text-anchor', 'left');
            } else {
                xAxisLabelTextNode.setAttribute('dominant-baseline', 'hanging');
                xAxisLabelTextNode.setAttribute('text-anchor', 'middle');
            }
            let dimensions = xAxisLabelTextNode.getBBox();
            if (dimensions.height > xAxisLegendHeight) {
                xAxisLegendHeight = dimensions.height;
            }
            this.xAxisLabelTextNodes.set(xAxisLabel, xAxisLabelTextNode);
        }
        return xAxisLegendHeight;
    };
    /**
     * 
     * @returns int
     */
    this.drawYAxisLegend = function () {
        let yAxisLegendWidth = 0;
        this.yAxisSortedLabels = this.getSortedAxisLabelValueRange(this.yValues, this.type == CHART_TYPE_HYSTOGRAM && this.isReversedAxis);
        for (let yAxisLabel of this.yAxisSortedLabels) {
            let yAxisLabelTextNode = this.createAxisLableTextNode(yAxisLabel, AXIS_Y);
            this.mainGroup.appendChild(yAxisLabelTextNode);
            yAxisLabelTextNode.setAttribute('fill', "#818181");
            yAxisLabelTextNode.setAttribute('font-size', "12");
            yAxisLabelTextNode.setAttribute('dominant-baseline', 'hanging');
            yAxisLabelTextNode.setAttribute('text-anchor', 'left');
            this.yAxisLabelTextNodes.set(yAxisLabel, yAxisLabelTextNode);
            let dimensions = yAxisLabelTextNode.getBBox();
            if (dimensions.width > yAxisLegendWidth) {
                yAxisLegendWidth = dimensions.width;
            }
        }
        return yAxisLegendWidth;
    };
}