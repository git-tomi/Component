# 组件props说明

## ``periodTyps``

&emsp;&emsp;数组，表示可选的"按X"选项，默认``['WEEK', 'MONTH']``，也只支持这三种。数组元素对应“按天”、“按周”、“按月”。如果不需要“按天”，可以传入``periodTypes={['WEEK', 'MONTH']}``

## ``defaultPeriodType``

&emsp;&emsp;字符串，只能传入“WEEK”、“MONTH”二者之一。如果没有传入``periodTypes``则默认“按周”，即``'WEEK'``；如果有传入``periodTypes``，则默认使用``periodTypes[0]``，此时要做指定的话，则只能传``periodTypes``中存在的值。

## ``defaultValue``

&emsp;&emsp;数组，表示默认已选的startDate和endDate，无默认值。数组元素必须为日期对象，即``new Date()``创建的。

## ``type``

&emsp;&emsp;字符串，影响``onChange``事件传出的数据，可选``TIMING``(时间点)和``PERIOD``(时间段)之一，默认为``TIMING``。

## ``returnType``

&emsp;&emsp;字符串，影响``onChange``事件传出的数据类型，可选``string``和``array``之一，默认``string``。

## ``onChange``

&emsp;&emsp;function(value)，用于接收数据。当``returnType``为``string``时，时间点传出符合接口要求的`'1532620800000,1532707200000'`字符串，时间段传出`'1532620800000-1532707200000,1532707200000-1532708200000'`；当``returnType``为``array``时，时间点传出`[1532620800000,1532707200000]`，时间段传出`[[1532620800000, 1532707200000], [1532707200000, 1532708200000]]`。

## ``getInitResult``

&emsp;&emsp;function(value)，在有``defaultValue``的情况下，该函数可以接收由初始值生成的result，在组件``componentWillMount``时触发，结果与正常``onChange``事件的表现一致。可以用于给接口参数赋初始值。由于``defaultValue``只需要起始日和结束日两个时间点，而接口要求的dateTimes要求中间时间点的时间戳，还是有必要有这样一个接收函数的。

## ``allowEmptyResult``

&emsp;&emsp;布尔值，默认``false``，当为``true``时，允许``onChange``事件传出空的结果，同时会开放清空按钮。

## ``defaultWeekCount``、``defaultMonthCount``

&emsp;&emsp;数字，默认为2/2，用于在切换按周/月时修改已选时间，分别表示最近2周、最近1月。