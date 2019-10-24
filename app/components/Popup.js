import React from 'react';
import htmlToImage from 'html-to-image';
import { Tabs, TabPanel } from '@cmsgov/design-system-core';
import style from './CustomForm.css';

export default class Popup extends React.Component {
  constructor(props) {
    super(props);
    const selectedIndex = this.props.selectedImage;
    this.state = {
      src: this.props.images[Number(selectedIndex)],
      selected: this.props.selectedImage,
      configData: this.props.configdata,
      apiUrl: this.props.apiUrl,
      baseUrl: this.props.baseUrl,
      probs: this.props,
      articleTab: true,
      customTab: false,
      imgHeight: '',
      imgWidth: '',
      text: '',
      templateImages: [],
      createImage: false,
      externalImage: '',
      imageAttachError: false
    };
    this.handleClick = this.handleClick.bind(this);
    this.openTab = this.openTab.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
    this.templateSelected = this.templateSelected.bind(this);
    this.convertHtmlToPng = this.convertHtmlToPng.bind(this);
    this.handleExternalImage = this.handleExternalImage.bind(this);
    this.attachImage = this.attachImage.bind(this);
  }
  componentDidMount() {
    if (this.props.images.length > 0) {
      const selectedIndex = this.props.selectedImage;
      const theImage = new Image();
      theImage.src = this.props.images[Number(selectedIndex)];
      const self = this;
      theImage.onload = function () {
        self.setState({
          imgHeight: theImage.height,
          imgWidth: theImage.width
        });
      };
      this.setState({ src: theImage.src });
    }
    document.addEventListener('click', this.openTab);
  }
  componentWillUnmount() {
    document.removeEventListener('click', this.openTab);
  }
  getTemplateImages() {
    fetch(`${this.state.apiUrl}/work_packages/${this.state.configData.Asset.templateAssetId}`).then(response => response.json()).then((responsoData) => {
      const responseObject = responsoData._embedded.attachments;
      if (Number(responseObject.total) > 0) {
        const attachments = responseObject._embedded.elements;
        const images = [];
        attachments.map((attachment, i) => {
          const temp = {
            path: this.state.baseUrl + attachment._links.downloadLocation.href,
            name: attachment._links.self.title
          };
          images.push(temp);
        });
        this.setState({ templateImages: images });
      }
    });
  }
  convertHtmlToPng(nodeId) {
    const self = this;
    return new Promise(((resolve, reject) => {
      const node = document.getElementById(nodeId);
      const clone = node.cloneNode(true);
      clone.id = 'temp';
      clone.className = 'temp';
      clone.style['min-height'] = '210px';
      clone.style['max-height'] = '210px';
      clone.style.position = 'relative';
      const parentNode = document.getElementById('createTemplateTemp');
      parentNode.appendChild(clone);
      setTimeout(() => {
        htmlToImage.toPng(clone)
          .then((dataUrl) => {
            const img = new Image();
            img.src = dataUrl;
            self.setState({ src: dataUrl, createImage: true });
            parentNode.innerHTML = '';
            resolve(dataUrl);
          })
          .catch((error) => {
            reject(error);
          });
      }, 500);
    }));
  }
  templateSelected = (event) => {
    if (!event.detail || event.detail == 1) {
      const param = event.target.dataset;
      this.setState({ src: '' });
      const self = this;
      const htmlToPng = this.convertHtmlToPng(param.param);
      htmlToPng.then((response) => {
        const tempObject = {
          src: response,
          index: null
        };
        self.state.probs.onChangeValue(tempObject);
      });
    }
  }
  fileChangedHandler = (event) => {
    this.setState({ src: URL.createObjectURL(event.target.files[0]) });
    const tempObject = {
      src: URL.createObjectURL(event.target.files[0]),
      index: null
    };
    this.setState({ createImage: true });
    this.state.probs.onChangeValue(tempObject);
  }
  attachImage() {
    if (this.state.externalImage) {
      let url = this.state.externalImage;
      url = url.split('?');
      url = url[0];
      if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
        this.setState({ imageAttachError: false });
        this.setState({ src: this.state.externalImage });
        const tempObject = {
          src: this.state.externalImage,
          index: event.target.alt
        };
        this.state.probs.onChangeValue(tempObject);
      } else {
        this.setState({ imageAttachError: true });
      }
    } else {
      this.setState({ imageAttachError: true });
    }
  }
  textChangedHandler = (event) => {
    this.setState({ text: event.target.value });
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
    const tempObject = {
      src: event.target.src,
      index: event.target.alt
    };
    this.state.probs.onChangeValue(tempObject);
  }

  openTab(event) {
    if (event.target.id === 'ds-c-tabs__item--custom') {
      this.setState({ createImage: false });
    } else if (event.target.id === 'ds-c-tabs__item--article') {
      this.setState({ createImage: false });
    } else if (event.target.id === 'ds-c-tabs__item--create') {
      this.getTemplateImages();
    }
  }
  handleExternalImage(event) {
    this.setState({ externalImage: event.target.value });
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
            >Feature page image
            </button>
          </h4>
          <div id="featurePage" className="usa-accordion__content usa-prose">
            <p className="ds-u-margin-top--0" id="createTemplateTemp" />
            {this.state.src ? <p className="ds-u-margin-top--0">
              <img src={this.state.src} className={this.state.createImage ? style.ogCreateImage : style.ogImages} />
              {this.state.createImage ? null : <span className={[style.imgSizeDisplay, 'preview__label ds-u-font-size--base ds-u-font-style--normal'].join(' ')}>{this.state.imgHeight} x {this.state.imgWidth} px</span>}
            </p> : null}
            <Tabs>
              <TabPanel id="article" className={style.imageGallery} tab="Article images">
                <div className="ds-u-clearfix">
                  <section className="ds-l-container">
                    <div className="ds-l-row">
                      {this.props.images.map((value, index) => <div className={this.state.src == value ? 'ds-l-col--4 ds-u-padding--1 ds-u-border--dark ds-u-border--1' : 'ds-l-col--4 ds-u-padding--1 ds-u-border--1'}><img id="editTab" onClick={this.handleClick} alt={index} className={style.object_fit_cover} src={value} width="100" height="100" /></div>)}
                    </div>
                  </section>
                </div>
              </TabPanel>
              <TabPanel id="custom" tab="Custom image">
                <div className="ds-l-row">
                  <div className="ds-l-col--9">
                    <input className={this.state.imageAttachError ? [style.titleError, 'ds-c-field'].join(' ') : 'ds-c-field ds-u-border--1'} id="external-attachment" type="text" value={this.state.externalImage} onChange={e => this.handleExternalImage(e)} placeholder="External Image URL to download and attach" required />
                  </div>
                  <div className="ds-l-col--3">
                    <button onClick={this.attachImage} className="ds-u-margin-top--1 ds-c-button ds-c-button--small ds-c-button--primary">Attach</button>
                  </div>
                </div>
                <div className="ds-l-row">
                  <div className="ds-l-col">
                    <input className="ds-c-field" id="input-file" type="file" onChange={this.fileChangedHandler} />
                  </div>
                </div>
              </TabPanel>
              <TabPanel id="create" tab="Create image" className={this.state.createImage ? style.imageGalleryCreateImage : style.imageGallery}>
                <div className="ds-u-clearfix">
                  <input className="ds-c-field ds-u-border--1" id="input-text" value={this.state.text} onChange={this.textChangedHandler} type="text" />
                  <section className="ds-l-container">
                    <div className="ds-l-row">
                      {this.state.templateImages.map((value, index) => <div className={this.state.src == value.path ? 'ds-l-col--6 ds-u-padding--1 ds-u-border--dark ds-u-border--1' : 'ds-l-col--6 ds-u-padding--1 ds-u-border--1'} data-param={`template_${index}`} onClick={this.templateSelected}><div data-param={`template_${index}`} className={style.teamplateContainer} id={`template_${index}`}><img alt={index} data-param={`template_${index}`} src={value.path} /><div data-param={`template_${index}`} className={style.templateText}>{this.state.text}</div></div></div>)}
                    </div>
                  </section>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}
