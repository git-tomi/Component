import React from 'react';
import { Icon, Balloon } from '@alife/next';
import './index.scss';
import html2canvas from 'html2canvas';

const PropTypes = React.PropTypes;

class DownloadableChartContainer extends React.Component {
    static propTypes = {
        children: PropTypes.func.isRequired,
        imageName: PropTypes.string
    }

    static defaultProps = {
        imageName: '图表'
    }

    constructor() {
        super(...arguments);
        this.state = {
            showLabel: false,
            id: this._idGenerator()
        };
    }

    _idGenerator = (n = 6) => {
        const candidates = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
        const max = candidates.length - 1;
        let result = '';
        for (let i = 0; i < n; i++) {
            const rand = Math.floor(Math.random() * (max + 1));
            result += candidates[rand];
        }
        return result;
    }

    _onMouseOver = () => {
        this.setState({ showLabel: true });
    }

    _onMouseOut = () => {
        this.setState({ showLabel: false });
    }

    _download = () => {
        const { imageName } = this.props;
        const { id } = this.state;
        const target = document.querySelector(`.downloadable-chart-container > #${id}`);
        html2canvas(target, {
            backgroundColor: null,
            logging: false
        }).then(canvas => {
            this._saveAs(canvas.toDataURL('image/png'), `${imageName}.png`);
        });
    }

    _saveAs = (uri, filename) => {
        var link = document.createElement('a');
        link.href = uri;
        link.download = filename;
        link.click();
    }

    render() {
        const { showLabel, id } = this.state;
        return (
            <div className="downloadable-chart-container">
                <span className="download-button" onMouseOver={this._onMouseOver} onMouseOut={this._onMouseOut}>
                    <Balloon
                        trigger={
                            <Icon
                                type="download"
                                className="icon"
                                onClick={this._download}
                            />
                        }
                        closable={false}
                        align="tl"
                        style={{ lineHeight: "5px", height: "5px" }}
                    >
                        保存为图片
                        </Balloon>
                </span>
                <div id={id}>
                    {this.props.children(showLabel)}
                </div>
            </div>
        );
    }
};

export default DownloadableChartContainer;
