import React from 'react';
import { DatePicker, Radio, moment } from '@alife/next';
import './index.scss';

const PropTypes = React.PropTypes;
const RadioGroup = Radio.Group;
const RangePicker = DatePicker.RangePicker;

// const PERIOD_TYPES = ['DAY', 'WEEK', 'MONTH'];
const PERIOD_TYPES = ['WEEK', 'MONTH'];
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PER_SECOND = 1000;

class TimingPicker extends React.Component {
    static propTypes = {
        periodTypes: PropTypes.arrayOf(PropTypes.oneOf(PERIOD_TYPES)),
        defaultPeriodType(props, propName) {
            const types = props.periodTypes || PERIOD_TYPES;
            if (props[propName] && !types.includes(props[propName])) {
                return new Error(`The defaultPeriodType '${props[propName]}' is not available since it's not one of ${
                    props.periodTypes ? 'the periodTypes you provided.' : '[\'WEEK\', \'MONTH\']'
                    }.`
                );
            }
        },
        defaultValue(props) {
            const { defaultPeriodType, defaultValue } = props;
            if (defaultValue && defaultValue.some(date => !(date instanceof Date))) {
                throw new Error('The dates in defaultValue must be instances of Date.');
            }
            if (defaultValue && defaultValue[0].getTime() > defaultValue[1].getTime()) {
                throw new Error('DefaultValue[0] should be a date that not later than defaultValue[1]');
            }
            if (defaultValue && defaultValue[1].getTime() > new Date().getTime()) {
                throw new Error('DefaultValue[1] should not be earlier than today.');
            }
            if (
                defaultPeriodType === 'WEEK' &&
                defaultValue &&
                (defaultValue[0].getDay() !== 1 || defaultValue[1].getDay() !== 0)
            ) {
                throw new Error('DefaultValue[0] should be a Monday and defaultValue[1] should be a Sunday when the defaultPeriodType is \'WEEK\'.');
            } else if (
                defaultPeriodType === 'MONTH' &&
                defaultValue &&
                (defaultValue[0].getDate() !== 1 || moment(defaultValue[1]).add(1, 'days').date() !== 0)
            ) {
                throw new Error('DefaultValue[0] should be 1st and defaultValue[1] should be the last day of a month when the defaultPeriodType is \'MONTH\'.');
            }
        },
        onChange: PropTypes.func,
        type: PropTypes.oneOf(['TIMING', 'PERIOD']),
        returnType: PropTypes.oneOf(['string', 'array']),
        getInitResult: PropTypes.func,
        allowEmptyResult: PropTypes.bool,
        defaultDayCount: PropTypes.number,
        defaultWeekCount: PropTypes.number,
        defaultMonthCount: PropTypes.number
    }

    static defaultProps = {
        type: 'TIMING',
        returnType: 'string',
        allowEmptyResult: false,
        defaultWeekCount: 4,
        defaultMonthCount: 4,
        defaultDayCount: 7
    }

    constructor() {
        super(...arguments);
        const { defaultPeriodType, defaultValue, periodTypes } = this.props;
        this.state = {
            radioList: this._buildRadioList(),
            currentPeriodType: defaultPeriodType || (periodTypes && periodTypes[0]) || PERIOD_TYPES[0],
            result: null,
            value: defaultValue,
            startDate: null,
            enableAll: false
        };
    }

    componentWillMount() {
        const { defaultValue, getInitResult } = this.props;
        if (defaultValue && getInitResult) {
            this._onDateChange(defaultValue, getInitResult);
        }
    }

    componentDidMount() {
        const { defaultValue } = this.props;
        this.state.enableAll = true;
        this.state.startDate = defaultValue[0];
    }

    _buildRadioList = () => {
        let radioList = [
            { label: '按天', value: 'DAY' },
            { label: '按周', value: 'WEEK' },
            { label: '按月', value: 'MONTH' }
        ];
        const { periodTypes } = this.props;
        if (periodTypes) {
            radioList = radioList.filter(radio => periodTypes.includes(radio.value));
        }
        return radioList;
    }

    _buildLastNDaysPeriod = n => {
        const today = new Date(new Date().toLocaleDateString());
        const todayTime = today.getTime();
        const NDaysAgo = todayTime - MS_PER_DAY * n;
        return [new Date(NDaysAgo), today];
    }

    _buildLastNWeeksPeriod = n => {
        this.state.enableAll = true;
        const today = new Date(new Date().toLocaleDateString());
        const todayTime = today.getTime();
        const day = today.getDay();
        const MondayTimeOfThisWeek = todayTime - (day - 1) * MS_PER_DAY;
        const MondayNWeeksAgo = MondayTimeOfThisWeek - MS_PER_DAY * n * 7;
        return [new Date(MondayNWeeksAgo), new Date(MondayTimeOfThisWeek - MS_PER_DAY)];
    }

    _buildLastNMonthsPeriod = n => {
        this.state.enableAll = true;
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const thisMonth1st = new Date(year, month, 0);
        const the1stNMonthsAgo = new Date(year, month - n, 1);
        return [the1stNMonthsAgo, thisMonth1st];
    }

    _onDateChange = (range, callback) => {
        this.setState({ value: range });
        const { currentPeriodType } = this.state;
        const { type, returnType } = this.props;
        const [start, end] = range;
        let result = [];
        const _end = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
        if (type === 'TIMING' && range.length) {
            result = this._buildTimingResult(currentPeriodType, start, _end);
        } else if (type === 'PERIOD' && range.length) {
            result = this._buildPeriodResult(currentPeriodType, start, _end);
        }
        // console.log(result.map(_ => moment(_).format('YY-MM-DD HH:mm:ss')).join(','));
        // console.log(result.map(sub => moment(sub[0]).format('YY-MM-DD HH:mm:ss') + '到' + moment(sub[1]).format('YY-MM-DD HH:mm:ss')).join(','));
        if (callback) {
            if (returnType === 'array') {
                return callback(result);
            } else if (returnType === 'string') {
                return callback(this._arrayToString(type, result));
            }
        }
    }

    _arrayToString = (type, list) => {
        if (type === 'TIMING') {
            return list.join(',');
        } else if (type === 'PERIOD') {
            return list.map(period => period.join('-')).join(',');
        }
    }

    _buildBaseTimeResult = (type, start, end) => {
        if (!start && !end) {
            return [];
        };
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        const startMonth = start.getMonth() + 1;
        const endMonth = end.getMonth() + 1;
        const result = [];
        let boundary = MS_PER_DAY;
        // ↓ 清除组件返回时间的偏移量
        const endTimestamp = Math.round(end.getTime() / 10000) * 10000;
        const startTimestamp = Math.round(start.getTime() / 10000) * 10000;
        const firstTimestamp = startTimestamp;
        const diffDays = parseInt((endTimestamp - startTimestamp) / 1000 / 60 / 60 / 24) + 1;
        if (type === 'DAY') {
            // 按需求，按天暂时取到当天的23:59:59
            const length = diffDays;
            for (let i = 0; i < length; i++) {
                result.push(firstTimestamp + boundary * (i + 1));
            }
        }
        if (type === 'WEEK') {
            // 按需求，按周时间点取到周一00:00:00
            const boundary = MS_PER_DAY * 7;
            const length = diffDays / 7;
            for (let i = 0; i <= length; i++) {
                result.push(firstTimestamp + boundary * i);
            }
        }
        if (type === 'MONTH') {
            // 按需求，按月时间点取到1号00:00:00
            // ↓ 月的跨年情况有所不同，各月天数不同
            const yearDiff = endYear - startYear;
            const monthDiff = endMonth - startMonth;
            const length = yearDiff * 12 + monthDiff;
            let currentMonth = startMonth;
            let currentYear = start.getFullYear();
            for (let i = 0; i <= length; i++) {
                const timestamp = new Date(currentYear, currentMonth - 1, 1).getTime();
                currentMonth + 1 > 12 && (currentYear += 1);
                currentMonth = currentMonth + 1 > 12 ? 1 : currentMonth + 1;
                result.push(timestamp);
            }
        }
        return result;
    }

    _buildTimingResult = (type, start, end) => {
        if (!start && !end) {
            return [];
        };
        const timingResult = this._buildBaseTimeResult(type, start, end);
        const { currentPeriodType } = this.state;
        const result = [];
        timingResult.forEach((timing, index, list) => {
            if (index > 0) {
                result.push(timing - PER_SECOND);
            }
        });
        return result;
    }

    _buildPeriodResult = (type, start, end) => {
        if (!start && !end) {
            return [];
        };
        const timingResult = this._buildBaseTimeResult(type, start, end);
        const { currentPeriodType } = this.state;
        const result = [];
        timingResult.forEach((timing, index, list) => {
            if (currentPeriodType !== 'DAY' && index < list.length - 1) {
                const periodStart = timing;
                const periodEnd = list[index + 1] - PER_SECOND;
                result.push([periodStart, periodEnd]);
            } else if (currentPeriodType === 'DAY') {
                const periodStart = timing - MS_PER_DAY;
                const periodEnd = timing - PER_SECOND;
                result.push([periodStart, periodEnd]);
            }
        });
        return result;
    }

    _onTypeChange = currentPeriodType => {
        if (currentPeriodType === this.state.currentPeriodType) return;
        this.setState({ currentPeriodType }, () => {
            const { onChange, defaultMonthCount, defaultWeekCount, defaultDayCount } = this.props;
            if (currentPeriodType === 'DAY') {
                const defaultForDays = this._buildLastNDaysPeriod(defaultDayCount);
                this._onDateChange(defaultForDays, onChange);
            } else if (currentPeriodType === 'WEEK') {
                const defaultForWeek = this._buildLastNWeeksPeriod(defaultWeekCount);
                this._onDateChange(defaultForWeek, onChange);
            } else if (currentPeriodType === 'MONTH') {
                const defaultForMonth = this._buildLastNMonthsPeriod(defaultMonthCount);
                this._onDateChange(defaultForMonth, onChange);
            }
        });
    }

    _onStartChange = startDate => {
        this.state.startDate = startDate;
    }

    _onEndChange = endDate => {
        this.state.enableAll = true;
        this.state.startDate = null;
    }

    _onOpenChange = isOpen => {
        this.state.startDate = null;
        this.state.enableAll = !isOpen;
    }

    _disabledDate = calendar => {
        const { currentPeriodType, startDate, enableAll } = this.state;
        if (enableAll) return false;
        const { timestamp, date, year, month } = calendar;
        const theDaysTimestamp = new Date(year, month, date).getTime();
        const isFuture = timestamp > new Date().getTime();
        if (isFuture) return true;
        if (startDate && Math.round(startDate.getTime() / 10000) * 10000 === theDaysTimestamp) {
            return true;
        }
        if (currentPeriodType === 'WEEK') {
            const theDay = new Date(timestamp).getDay();
            if (!startDate) {
                const isAfterThisWeek = moment().diff(moment([year, month, date]), 'days') < 7;
                const isNotMonday = theDay !== 1;
                return isAfterThisWeek || (isNotMonday);
            } else {
                const startTimestamp = Math.round(startDate.getTime() / 10000) * 10000;
                const isNotStartDate = theDaysTimestamp !== startTimestamp;
                const isBeforeStart = timestamp < startTimestamp;
                const isNotSunday = theDay !== 0;
                return isNotStartDate && isNotSunday || isBeforeStart;
            }
        } else if (currentPeriodType === 'MONTH') {
            if (!startDate) {
                const isAfterThisMonth = month >= new Date().getMonth();
                const isNotMonth1st = date !== 1;
                return isAfterThisMonth || isNotMonth1st;
            } else {
                const startTimestamp = Math.round(startDate.getTime() / 10000) * 10000;
                const isNotStartDate = theDaysTimestamp !== startTimestamp;
                const isBeforeStart = timestamp < startTimestamp;
                const isNotMonthEnd = date !== new Date(year, month + 1, 0).getDate();
                return isNotStartDate && isNotMonthEnd || isBeforeStart;
            }
        }
    }

    _calcDefaultBase = () => {
        const { defaultValue } = this.props;
        if (defaultValue && defaultValue[0]) {
            return moment(defaultValue[0]).toISOString();
        }
        return moment().subtract(1, 'months').toISOString();
    }

    render() {
        const { radioList, currentPeriodType, value } = this.state;
        const { onChange, allowEmptyResult } = this.props;
        return (
            <div className="comp-date-picker">
                <RangePicker
                    ref={comp => this.rangePicker = comp}
                    size="small"
                    defaultBase={this._calcDefaultBase()}
                    disabledDate={this._disabledDate}
                    onChange={(range) => this._onDateChange(range, onChange)}
                    onStartChange={this._onStartChange}
                    onEndChange={this._onEndChange}
                    onOpenChange={this._onOpenChange}
                    hasClear={allowEmptyResult}
                    value={value}
                />
                <RadioGroup
                    shape="button"
                    size="small"
                    value={currentPeriodType}
                    defaultValue={currentPeriodType}
                    onChange={this._onTypeChange}
                >
                    {radioList.map(radio => <Radio key={radio.value} value={radio.value}>{radio.label}</Radio>)}
                </RadioGroup>
            </div>
        );
    }
}

export default TimingPicker;
