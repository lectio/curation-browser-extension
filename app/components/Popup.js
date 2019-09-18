import React from 'react';
import { Tabs, TabPanel } from '@cmsgov/design-system-core';
import style from './CustomForm.css';

export default class Popup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            src: this.props.selectedImage.length > 0 ? this.props.selectedImage : null,
            probs: this.props,
            articleTab: true,
            customTab: false,
            imgHeight: '',
            imgWidth: ''
        };
        this.handleClick = this.handleClick.bind(this);
        this.openTab = this.openTab.bind(this);
        this.fileChangedHandler = this.fileChangedHandler.bind(this);
    }
    componentDidMount() {
        if (this.props.images.length > 0) {
            const theImage = new Image();
            theImage.src = this.props.images[0];
            const self = this;
            theImage.onload = function () {
                self.setState({
                    imgHeight: theImage.height,
                    imgWidth: theImage.width
                });
            };
            this.setState({ src: this.props.images[0] });
        }
    }
    fileChangedHandler = (event) => {
        this.setState({ src: event.target.files[0] });
    }
    handleClick(event) {
        const theImage = new Image();
        const self = this;
        theImage.src = event.target.src;
        theImage.onload = function () {
            self.setState({
                imgHeight: theImage.height,
                imgWidth: theImage.width
            });
        };
        this.setState({ src: event.target.src });
        this.state.probs.onChangeValue(event);
    }

    openTab(event) {
        event.preventDefault();
        let article = false;
        let custom = false;
        if (String(event.target.id) === 'articleTab') {
            article = true;
        } else if (String(event.target.id) === 'customTab') {
            custom = true;
        }
        this.setState({
            articleTab: article,
            customTab: custom
        });
    }
    render() {
        return (
            <div>
                <div className="usa-accordion site-accordion-code">
                    <h4 className="usa-accordion__heading site-accordion-code">
                        <button
                            className="usa-accordion__button"
                            aria-expanded="true"
                            aria-controls="featurePage"
                        >
                            Feature page image
            </button>
                    </h4>
                    <div id="featurePage" className="usa-accordion__content usa-prose">
                        {this.state.src ? <p className="ds-u-margin-top--0">
                            <img src={this.state.src} className={style.ogImages} />
                            <span className={[style.imgSizeDisplay, 'preview__label ds-u-font-size--base ds-u-font-style--normal'].join(' ')}>{this.state.imgHeight} x {this.state.imgWidth} px</span>
                        </p> : null}
                        <Tabs>
                            <TabPanel id="article" className={style.imageGallery} tab="Article images">
                                <div className="ds-u-clearfix ">
                                    <section className="ds-l-container">
                                        <div className="ds-l-row">
                                            {this.props.images.map((value, index) => <div className={this.state.src == value ? 'ds-l-col--4 ds-u-padding--1 ds-u-border--dark ds-u-border--1' : 'ds-l-col--4 ds-u-padding--1 ds-u-border--1'}><img id="editTab" onClick={this.handleClick} alt={index} className={style.object_fit_cover} src={value} width="100" height="100" /></div>)}
                                        </div>
                                    </section>
                                </div>
                            </TabPanel>
                            <TabPanel id="custom" tab="Custom image">
                                <div>
                                    <input className="ds-c-field ds-u-border--1" id="input-text" type="text" />
                                    <input className="ds-c-field" id="input-file" type="file" onChange={this.fileChangedHandler} />
                                </div>
                            </TabPanel>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}
