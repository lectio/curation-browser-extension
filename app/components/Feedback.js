import React from 'react';
import * as APIDATA from '../constants/apidata';
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export default class Feedback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      feedbackId: '',
      webUrl: '',
      message: '',
      subject: '',
      description: '',
      osName: '',
      browser: '',
      browserVersion: '',
      ipAddress: ''
    };
    this.handleType = this.handleType.bind(this);
    this.handleSubject = this.handleSubject.bind(this);
    this.handleDescription = this.handleDescription.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  componentDidMount() {
    this.getTelemetry();
  }
  getTelemetry() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    const browserName = 'Chrome';
    const nAgt = navigator.userAgent;
    let version = '';
    let os = null;
    const verOffset = nAgt.indexOf('Chrome');
    version = nAgt.substring(verOffset + 7);
    version = version.split(' ');
    version = version[0];
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
    let descriptionData = `* (Clean URL)[${this.props.cleanUrl}]\n`;
    descriptionData = `${descriptionData}* (Source URL)[${this.props.siteUrl}]`;
    this.setState({
      description: descriptionData,
      osName: os,
      browser: browserName,
      browserVersion: version
    });
    fetch('https://api.ipify.org/?format=json')
      .then(response => response.json())
      .then((resData) => {
        const ip = resData.ip;
        this.setState({
          ipAddress: ip
        });
      });
  }
  handleType(event) {
    this.setState({ type: event.target.value });
  }
  handleSubject(event) {
    this.setState({ subject: event.target.value });
  }
  handleDescription(event) {
    this.setState({ description: event.target.value });
  }
  handleSubmit(event) {
    event.preventDefault();
    this.setState({ loading: true });
    const params = JSON.stringify({
      subject: this.state.subject,
      description: {
        format: 'text/html',
        raw: this.state.description,
        html: ''
      },
      _links: {
        type: {
          href: `${APIDATA.API_URL}/types/${APIDATA.FEEDBACK_TYPE}`,
          title: 'Feedback'
        },
      }
    });
    const data = {
      method: 'POST',
      body: params,
      credentials: 'include',
      headers: {
        // Authorization: 'Basic ' + btoa('apikey:' + this.state.apiKey),
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json;charset=UTF-8',
      }
    };
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/projects/${APIDATA.FEEDBACK_PROJECT_ID}/work_packages/`, data)
      .then((response) => {
        if (response.status === 201) {
          // this.setState({ message: 'Saved Successfully.' });
        }
        return response.json();
      }).then((catdata) => {
        const webPackageId = catdata.id;
        const manifestData = chrome.runtime.getManifest();
        const telemetryInfo = {
          'Extension Version': manifestData.version,
          'Os Name': this.state.osName,
          'Browser Name': this.state.browser,
          'Browser Version': this.state.browserVersion,
          'IP Address': this.state.ipAddress
        };
        const telemetryData = new Blob([JSON.stringify(telemetryInfo)], { type: 'application/json' });
        const fr = new FileReader();
        fr.readAsText(telemetryData);
        const databody = JSON.stringify({ fileName: 'Curated Telemetry.json', description: { raw: 'Telemetry information!' } });
        const formBody = new FormData();
        formBody.append('metadata', databody);
        formBody.append('file', telemetryData, 'telemetryData.json');
        const authdata = {
          method: 'POST',
          body: formBody,
          credentials: 'include',
          headers: {
            // 'Authorization': 'Basic ' + btoa('apikey:' + this.state.apiKey),
            'X-Requested-With': 'XMLHttpRequest'
          }
        };
        fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/work_packages/${webPackageId}/attachments`, authdata);
        this.setState({ feedbackId: webPackageId });
        this.setState({ webUrl: APIDATA.SITE_URL });
        this.setState({ message: 'Feedback Submited ' });
      });
  }
  render() {
    return (
      <section className="ds-l-container">
        <form onSubmit={this.handleSubmit} id="feedbackForm">
          <div className="ds-l-row ds-u-margin-top--2">
            <div className="ds-l-col">
              <input type="text" className="ds-c-field preview__label ds-u-font-size--small ds-u-font-style--normal ds-u-border--1" name="Subject" placeholder="Subject" value={this.state.subject} onChange={this.handleSubject} required />
            </div>
          </div>
          <div className="ds-l-row  ds-u-margin-top--0">
            <div className="ds-l-col preview__label ds-u-font-size--small ds-u-font-style--normal">
              <CKEditor
                editor={ClassicEditor}
                config={{
                  toolbar: ['heading', 'bold', 'italic', 'link', 'undo', 'redo', 'bulletedList', 'numberedList', 'blockQuote']
                }}
                data={this.state.description}
                onInit={(editor) => {
                  editor.setData(this.state.description);
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  this.setState({ description: data });
                }}
              />
              {/* <textarea className="ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1" name="Description" rows="25" value={this.state.description} onChange={this.handleDescription} /> */}
            </div>
          </div>
          <hr className="on ds-u-fill--gray-lightest" />
          <div className="ds-l-row  ds-u-margin-top--0">
            <div className="ds-l-col--auto">
              <input type="submit" value="Submit" className="ds-c-button ds-c-button--primary" />
            </div>
            {this.state.message !== '' ?
              <div className="ds-l-col">
                <div className="ds-c-alert ds-c-alert--success">
                  <div className="ds-c-alert__body">
                    <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={APIDATA.BASE_URL + APIDATA.SITE_URL + this.state.feedbackId} rel="noopener noreferrer">{this.state.feedbackId ? `#${this.state.feedbackId}` : null}</a></p>
                  </div>
                </div>
              </div> : null}
          </div>
        </form>
      </section>
    );
  }
}
