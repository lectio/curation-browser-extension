import React, { Component } from 'react';
import style from './CustomForm.css';
import ExtractedContent from './ExtractedContent';
import { Tabs, TabPanel } from '@cmsgov/design-system-core';
import * as config  from '../constants/config.json';
import * as APIDATA from '../constants/apidata';
import Cookies from 'js-cookie';
// import apiData, { APIDATA.Base_Url } from '../constants/apidata';
import shareImageInactive from '../../chrome/assets/img/share-inactive.png';
import editActiveImage from '../../chrome/assets/img/edit-active.png';
import imgIconInactive from '../../chrome/assets/img/imgIcon-inactive.png';
import notificationIconInactive from '../../chrome/assets/img/notification-inactive.png';
import attachmentIconInactive from '../../chrome/assets/img/attachment-inactive.png';
import messageIconInactive from '../../chrome/assets/img/message-inactive.png';
import shareImageActive from '../../chrome/assets/img/share-active.png';
import editInactiveImage from '../../chrome/assets/img/edit-inactive.png';
import imgIconActive from '../../chrome/assets/img/imgIcon-active.png';
import notificationIconActive from '../../chrome/assets/img/notification-active.png';
import attachmentIconActive from '../../chrome/assets/img/attachment-active.png';
import messageIconActive from '../../chrome/assets/img/message-active.png';
import logo from '../../chrome/assets/img/logo-small.png';
import jsonTreeViewerActive from '../../chrome/assets/img/metadata-active.png';
import jsonTreeViewerInActive from '../../chrome/assets/img/metadata-inactive.png';
import settingsActiveIcon from '../../chrome/assets/img/settings-active.png';
import settingsInActiveIcon from '../../chrome/assets/img/settings-inactive.png';

export default class Customform extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      summary: '',
      message: '',
      image: '',
      categories: [],
      selectedCat: '',
      multiSelect: [],
      optionClicked: [],
      url: '',
      allImages: [],
      showPopup: false,
      selectedImage: -1,
      showEdit: true,
      showShare: false,
      showAttachmentTab: false,
      showImgTab: false,
      showMsgTab: false,
      showNotificationTab: false,
      showJsonTree: false,
      showSettings: false,
      ogData: [],
      metaData: [],
      taskId: '',
      siteUrl: '',
      isLogin: true,
      metaDataJSON: '',
      loader: false,
      fetchingContents: true
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleValidate = this.handleValidate.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSummary = this.handleSummary.bind(this);
    this.activateTabs = this.activateTabs.bind(this);
    this.getCookies = this.getCookies.bind(this);
  }
  componentDidMount() {
    let selectedContent = '';
    chrome.tabs.executeScript({
      code: 'window.getSelection().toString();'
    }, function (selection) {
      if (selection[0]) {
        selectedContent = selection[0];
      }
    });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const data = {
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + btoa(APIDATA.API_KEY),
          'Content-Type': 'application/json;charset=UTF-8',
        }
      };
      fetch(APIDATA.BASE_URL + '/projects/' + APIDATA.PROJECT_ID + '/work_packages/', data)
        .then((results) => {
          return results.json();
        }).then((catdata) => {
          const catTmp = catdata._embedded.elements;
          const categoryFromApi = catTmp.map(cat => { return { value: cat.id, display: cat.subject } });
          const multi = catTmp.map(cat => { return { value: cat.id, label: cat.subject } });
          this.setState({ categories: [{ value: '', display: '(Select Category)' }].concat(categoryFromApi) });
          this.setState({ multiSelect: multi });
        });

      const url = tabs[0].url;
      this.setState({ url: url });
      const x = new XMLHttpRequest();
      x.open('GET', url);
      x.responseType = 'document';
      x.onload = function (e) {
        const doc = x.response;
        let title = doc.querySelector('meta[property="og:title"]');
        let desc = doc.querySelector('meta[property="og:description"]');
        let image = doc.querySelector('meta[property="og:image"]');
        const ogData = [];
        const og = doc.querySelectorAll("meta[property^='og']");
        let i = 0;
        for (i = 0; i < og.length; i++) {
          ogData.push({ 'name': og[i].attributes.property.nodeValue, content: og[i].attributes.content.nodeValue });
        }
        this.setState({ ogData: ogData });
        
        const metaDataOb = [];
        const meta = doc.getElementsByTagName('meta');
        let j = 0;
        for (j = 0; j < meta.length; j++) {
          if (meta.item(j).name != '') {
            metaDataOb.push({ 'name': meta.item(j).name, content: meta.item(j).content });
          }
        }
        this.setState({ metaData: metaDataOb });
        this.generateJSON(doc);
        if (x.readyState === 4) {
          this.setState({ fetchingContents: false });
          if (x.status === 200) {
            if (desc) {
              desc = desc.getAttribute('content');
              if (selectedContent !== '') {
                this.setState({ summary: selectedContent });
              } else {
                this.setState({ summary: desc });
              }
            }
            if (title) {
              title = title.getAttribute('content');
              this.setState({ value: title });
            }
            if (image) {
              image = image.getAttribute('content');
              this.setState({ image: image });
            }
          }
        }
        const images = doc.getElementsByTagName('img');
        const srcList = [];
        srcList.push(image);
        for (let i = 0; i < images.length; i++) {
          const img = images[i].src;
          const res = img.match(/ajax|email|icon|FB|social|small|facebook|logo/gi);
          if ((res == null) && (srcList.indexOf(img) === -1)) {
            // if((res==null)&&(width >=150)&&(height>=75)&&($.inArray(img, srcList) === -1)) {
            srcList.push(img);
          }
        }
        this.setState({ allImages: srcList });
      }.bind(this);
      x.onerror = function (e) {
      };
      x.send(null);
    }.bind(this));
  }
  handleChange(event) {
    this.setState({ value: event.target.value });
  }
  handleUrl(event) {
    this.setState({ url: event.target.value });
  }
  handleSummary(event) {
    this.setState({ summary: event.target.value });
  }

  togglePopup() {
    this.setState({
      showPopup: !this.state.showPopup
    });
  }
  handleChangeValue = e => {
    this.setState({ showPopup: e.target.value });
    this.setState({ selectedImage: e.target.alt });
    this.setState({ image: this.state.allImages[Number(e.target.alt)] });
  }
  handleValidate(event) {
    return false;
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.handleValidate()) {
      this.setState({ message: 'Duplicate Entry.' });
      return false;
    }
    this.setState({ loader: true });
    let params = 'title=' + this.state.value +
      '&url=' + this.state.value +
      '&summary=' + this.state.summary +
      '&tags=' + this.state.value;
    // Replace any instances of the URLEncoded space char with +
    params = params.replace(/%20/g, '+');
    params = JSON.stringify({
      subject: this.state.value,
      description: {
        format: 'markdown',
        raw: this.state.summary,
        html: ''
      },
      customField1: this.state.url,
      customField2: this.generateCleanURL(this.state.url),
      _links: {
        type: {
          href: '/api/v3/types/8',
          title: 'Post'
        },
      }
    });
    const data = {
      method: 'POST',
      body: params,
      headers: {
        Authorization: 'Basic ' + btoa(APIDATA.API_KEY),
        'Content-Type': 'application/json;charset=UTF-8',
      }
    };
    fetch(APIDATA.BASE_URL + '/projects/' + APIDATA.PROJECT_ID + '/work_packages/', data)
      .then(response => {
        if (response.status === 201) {
          // this.setState({ message: 'Saved Successfully.' });
        }
        return response.json();
      }).then((catdata) => {
        const webPackageId = catdata.id;
        this.setState({ taskId: webPackageId });
        this.toDataUrl(this.state.image, (myBase64) => {
          this.uploadImage(webPackageId, myBase64);
        });
        this.setState({ siteUrl: APIDATA.SITE_URL });
        this.setState({ message: 'Saved in ' + APIDATA.DOMAIN_NAME + ' as' });
        this.setState({ loader: false });
        this.uploadOgData(webPackageId);
        this.uploadMetaData(webPackageId);
      });
  }
  // eslint-disable-next-line camelcase
  // eslint-disable-next-line class-methods-use-this
  stripQsVar(sourcestr, url, key) {
    if (String.prototype.indexOf(url, sourcestr) > 0) {
      return preg_replace('/(' + key + '=.*?)&/', '', url);
    } else {
      return url;
    }
  }

  removeUrlParameters(sourcestr, url, key) {
    if (String.prototype.indexOf(url, sourcestr) > 0) {
      return preg_replace('/utm_.*?(&|$)/g', '', url);
    } else {
      return url;
    }
  }

  stripQsVarMatch(sourcestr, url, key) {
    if (String.prototype.indexOf(url, sourcestr) > 0) {
      const parts = parse_url(html_entity_decode(url));
      parse_str(parts['query'], query);
      return query[key];
    } else {
      return url;
    }
  }

  generateJSON(doc) {

    const twitterData = [];
    const twitter = doc.querySelectorAll("meta[property^='twitter']");
    let i = 0;
    for (i = 0; i < twitter.length; i++) {
      twitterData.push({ 'name': twitter[i].attributes.property.nodeValue, content: twitter[i].attributes.content.nodeValue });
    }
    const metaData = [];
    metaData.push({ 'name': 'Curated OpenGraph', content: this.state.ogData });
    metaData.push({ 'name': 'Curated Twitter', content: twitterData });
    metaData.push({ 'name': 'Curated Meta Data', content: this.state.metaData });
    const databody = JSON.stringify(metaData);
    this.setState({ metaDataJSON: databody });
  }

  generateCleanURL(url) {
    let thisLink = this.stripQsVarMatch('news.google.com', url, 'url');
    thisLink = this.stripQsVarMatch('bing.com', url, 'tid');
    thisLink = this.removeUrlParameters('bing.com', url, 'tid');
    return thisLink;
  }

  toDataUrl = (url, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        callback(this.response);
        const img = document.getElementById('img');
        const objUrl = window.URL || window.webkitURL;
        img.src = objUrl.createObjectURL(this.response);
      }
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  }

  uploadImage(id, data) {
    const databody = JSON.stringify({ "fileName": "Curated Featured Image.png", "description": { "raw": "A cute kitty, cuddling with its friends!" } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', data, 'opengraph-logo.72382e605ce3.png');
    const authdata = {
      method: 'POST',
      body: formBody,
      headers: {
        'Authorization': 'Basic ' + btoa(APIDATA.API_KEY),
      }
    };
    fetch(APIDATA.BASE_URL + '/work_packages/' + id + '/attachments', authdata);
  }
  uploadOgData(id) {
    const ogFile = new Blob([JSON.stringify(this.state.ogData)], { type: 'application/json' });
    const fr = new FileReader();
    fr.readAsText(ogFile);
    const databody = JSON.stringify({ 'fileName': 'Curated OpenGraph.json', 'description': { 'raw': 'A cute kitty, cuddling with its friends!' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', ogFile, 'ogData.json');
    const authdata = {
      method: 'POST',
      body: formBody,
      headers: {
        'Authorization': 'Basic ' + btoa(APIDATA.API_KEY),
      }
    };
    fetch(APIDATA.BASE_URL + '/work_packages/' + id + '/attachments', authdata);
  }
  uploadMetaData(id) {
    const ogFile = new Blob([JSON.stringify(this.state.metaData)], { type: 'application/json' });
    const fr = new FileReader();
    fr.readAsText(ogFile);
    const databody = JSON.stringify({ 'fileName': 'Curated MetaData.json', 'description': { 'raw': 'A cute kitty, cuddling with its friends!' } });
    const formBody = new FormData();
    formBody.append('metadata', databody);
    formBody.append('file', ogFile, 'ogData.json');
    const authdata = {
      method: 'POST',
      body: formBody,
      headers: {
        'Authorization': 'Basic ' + btoa(APIDATA.API_KEY),
      }
    };
    fetch(APIDATA.BASE_URL + '/work_packages/' + id + '/attachments', authdata);
  }
  activateTabs(event) {
    event.preventDefault();
    let editTab = false;
    let shareTab = false;
    let attachmentTab = false;
    let imgTab = false;
    let msgTab = false;
    let notificationTab = false;
    let jsonTreeTab = false;
    let showSettingsTab = false;
    if (String(event.target.id) === 'editTab') {
      editTab = true;
    } else if (String(event.target.id) === 'shareTab') {
      shareTab = true;
    } else if (event.target.id === 'attachmentTab') {
      attachmentTab = true;
    } else if (event.target.id === 'imgTab') {
      imgTab = true;
    } else if (event.target.id === 'msgTab') {
      msgTab = true;
    } else if (event.target.id === 'notificationTab') {
      notificationTab = true;
    } else if (event.target.id === 'jsonTree') {
      jsonTreeTab = true;
    } else if (event.target.id === 'settingsTab') {
      showSettingsTab = true;
    }
    this.setState({
      showEdit: editTab,
      showShare: shareTab,
      showAttachmentTab: attachmentTab,
      showImgTab: imgTab,
      showMsgTab: msgTab,
      showNotificationTab: notificationTab,
      showJsonTree: jsonTreeTab,
      showSettings: showSettingsTab
    });
  }
  getCookies(domain, name, callback) {
    chrome.cookies.get({ 'url': domain, 'name': name }, function (cookie) {
      if (callback) {
        if (cookie) {
          callback(cookie.value);
        } else {
          callback(null);
        }
      }
    });
  }
  render() {
    return (
      <section>
        {this.state.isLogin ? <div className="ds-l-container">

          <div className="ds-l-row">
            <div className="ds-u-padding--0 ds-l-col--11">
              <div>
                {this.state.showEdit ?
                  <div id="panel-edit">
                    <form onSubmit={this.handleSubmit}>
                      <p><label>
                        <textarea className={[style.textareaTitle, 'preview__label ds-u-font-size--h4 ds-u-font-style--normal'].join(' ')} value={this.state.value} onChange={this.handleChange} />
                      </label></p>
                      <hr />
                      {this.state.fetchingContents ? <p className="ds-u-text-align--center">
                        <button className="ds-c-button">
                          <span className="ds-c-spinner ds-c-spinner--small" aria-valuetext="Fetching Contents" role="progressbar"></span> Fetching Contents
                        </button>
                      </p> : null}
                      <p><label>
                        <textarea className={[style.textareaDesc, 'preview__label ds-u-font-size--small ds-u-font-style--normal'].join(' ')} value={this.state.summary} onChange={this.handleSummary} />
                      </label></p>
                      {this.state.image.length > 0 &&
                        <p>
                          <img id="imgTab" onClick={this.activateTabs} src={this.state.image} className={style.ogImages} alt="Og Image"></img>
                        </p>
                      }
                      <p><label>
                        <textarea className={[style.textareaLink, 'preview__label ds-u-font-style--normal'].join(' ')} value={this.generateCleanURL(this.state.url)} onChange={this.handleUrl} />
                      </label></p>
                      <hr />
                      <div className={style.sucessBlock}>
                        {this.state.loader ? <button className="ds-u-margin--2 ds-c-button ds-c-button--primary">
                          <span className="ds-c-spinner ds-c-spinner--small ds-c-spinner--inverse" aria-valuetext="Saving" role="progressbar"></span> Saving
                        </button> : null}
                        {this.state.message == '' && this.state.loader == false ? <input type="submit" value="Post to Lectio" className="ds-u-margin--2 ds-c-button ds-c-button--primary" /> : null}
                        {this.state.message != '' ?
                          <div className="ds-c-alert ds-c-alert--success">
                            <div className="ds-c-alert__body">
                              <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={this.state.siteUrl + this.state.taskId}>{this.state.taskId ? "#" + this.state.taskId : null}</a></p>
                            </div>
                          </div> : null}
                      </div>
                    </form>
                  </div>
                  : null}
                {this.state.showJsonTree ? <div id="panel-meta"><ExtractedContent jsonData={this.state.metaDataJSON} ></ExtractedContent></div> : null}
                {this.state.showShare ? <div id="panel-share"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                {this.state.showAttachmentTab ? <div id="panel-attachment"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                {this.state.showImgTab ? <div id="panel-img"><Popup
                  text='Close'
                  closePopup={this.togglePopup.bind(this)}
                  images={this.state.allImages}
                  selectedImage={this.state.allImages}
                  onChangeValue={this.handleChangeValue}
                />
                </div> : null}
                {this.state.showMsgTab ? <div id="panel-msg"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                {this.state.showNotificationTab ? <div id="panel-notification"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
                {this.state.showSettings ? <div id="panel-notification"><p className="ds-u-text-align--center ds-u-font-size--h3">Coming Soon !!</p></div> : null}
              </div>
            </div>
            <div className="ds-u-padding--0 ds-l-col--1 ds-u-border-left--1">
              <div >
                <div>
                  <ul className="ds-c-vertical-nav">
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="editTab" className={[style.imgIcons, 'ds-u-margin-top--2'].join(' ')} src={this.state.showEdit ? editActiveImage : editInactiveImage} alt="Edit" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="jsonTree" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showJsonTree ? jsonTreeViewerActive : jsonTreeViewerInActive} alt="Json Tree" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="imgTab" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showImgTab ? imgIconActive : imgIconInactive} alt="Json Tree" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="shareTab" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showShare ? shareImageActive : shareImageInactive} alt="Json Tree" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="notificationTab" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showNotificationTab ? notificationIconActive : notificationIconInactive} alt="Json Tree" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="attachmentTab" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showAttachmentTab ? attachmentIconActive : attachmentIconInactive} alt="Json Tree" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="msgTab" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showMsgTab ? messageIconActive : messageIconInactive} alt="Json Tree" /></a>
                    </li>
                    <li className="ds-c-vertical-nav__item" onClick={this.activateTabs}>
                      <a className="ds-c-vertical-nav__label ds-u-padding--0" href="#"><img id="settingsTab" className={[style.imgIcons, 'ds-u-margin-top--1'].join(' ')} src={this.state.showSettings ? settingsActiveIcon : settingsInActiveIcon} alt="Json Tree" /></a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div> : <div>
            <div>
              <img id="logoIcon" className={style.logoSmall} src={logo} alt="Lectio" />
            </div>
            <div className="ds-u-font-size--h3 ds-u-text-align--center ds-u-margin-bottom--3">
              You are not authenticated yet, <br />please log in to continue.
          </div>
            <hr />
            <div className="ds-u-text-align--center ds-u-margin-top--4">
              <div claasName="ds-u-margin-top--4"><a className="ds-c-button ds-c-button--primary" target="_blank" href={APIDATA.OPENPROJECT_DOMAIN}>Sign in</a></div>
              <div className="ds-u-font-style--italic ds-u-margin-top--4 ds-u-margin-bottom--2">
                After you’ve signed in, <br />please click the extension button again.
            </div>
            </div>
          </div>}
      </section>
    );
  }
}

class Popup extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      src: this.props.selectedImage,
      probs: this.props,
      articleTab: true,
      customTab: false,
    };
    this.handleClick = this.handleClick.bind(this);
    this.openTab = this.openTab.bind(this);
    this.fileChangedHandler = this.fileChangedHandler.bind(this);
  }
  componentDidMount() {

    if (this.props.images.length > 0) {
      this.setState({ src: this.props.images[0] });
    }
  }
  fileChangedHandler = event => {
    this.setState({ src: event.target.files[0] });
  }
  handleClick(event) {
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
              aria-controls="featurePage">
              Feature page image
              </button>
          </h4>
          <div id="featurePage" className="usa-accordion__content usa-prose">
            <p className="ds-u-margin-top--0">
              <img src={this.state.src} className={style.ogImages}></img>
            </p>
            <Tabs>
              <TabPanel id="article" className={style.imageGallery} tab="Article images">
                <div className="ds-u-clearfix ">
                  <section className="ds-l-container">
                    <div className="ds-l-row">
                      {this.props.images.map((value, index) => {
                        return <div className="ds-l-col--4 ds-u-padding--1 ds-u-border--1"><img id="editTab" onClick={this.handleClick} alt={index} className={style.object_fit_cover} src={value} width="100" height="100"></img></div>;
                      })}
                    </div>
                  </section>
                </div>
              </TabPanel>
              <TabPanel id="custom" tab="Custom image">
                <div>
                  <input className="ds-c-field" id="input-text" type="text"></input>
                  <input className="ds-c-field" id="input-file" type="file" onChange={this.fileChangedHandler}></input>
                </div>
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}
