import React from 'react';
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
      ipAddress: '',
      configData: this.props.configdata,
      apiUrl: this.props.apiUrl,
      siteUrl: this.props.siteUrl,
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
    const manifestData = chrome.runtime.getManifest();
    let descriptionData = `<p></p><p></p><a href=${this.props.cleanUrl}>Clean URL</a>`;
    descriptionData = `${descriptionData} | ` + `<a href=${this.props.siteUrl}>Source URL</a>`;
    descriptionData = `${descriptionData} | Version ${manifestData.version} on ${os},${browserName} ${version}`;
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
    const feedBackType = this.state.configData.Feedback.packageType.id;
    const feedBackProjectId = this.state.configData.Feedback.projectId;
    const params = JSON.stringify({
      subject: this.state.subject,
      description: {
        format: 'text/html',
        raw: this.state.description,
        html: ''
      },
      _links: {
        type: {
          href: `${this.state.apiUrl}/types/${feedBackType}`,
          title: 'Feedback'
        },
        assignee: {
          "href": `${this.state.apiUrl}/users/${ this.state.configData.Feedback.assigneeId}`,
          title: 'Assignee'
      }
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
    fetch(`${this.state.apiUrl}/projects/${feedBackProjectId}/work_packages/`, data)
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
        fetch(`${this.state.apiUrl}/work_packages/${webPackageId}/attachments`, authdata);
        this.setState({ feedbackId: webPackageId });
        this.setState({ webUrl: this.state.siteUrl });
        this.setState({ message: 'Feedback Submited ' });
      });
  }
  render() {
    return (
      <div className="usa-accordion site-accordion-code">
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="true"
            aria-controls="feedBackContent"
          >Feedback</button>
        </h4>
        <div id="feedBackContent" className="usa-accordion__content usa-prose ds-u-padding-left--1 ds-u-padding-top--0">
          <section className="ds-l-container ds-u-overflow--hidden">
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
              {/* <hr className="on ds-u-fill--gray-lightest" /> */}
              <div className="ds-l-row  ds-u-margin-top--0">
                <div className="ds-l-col--auto">
                  <input type="submit" value="Submit" className="ds-c-button ds-c-button--primary" />
                </div>
                {this.state.message !== '' ?
                  <div className="ds-l-col">
                    <div className="ds-c-alert ds-c-alert--success">
                      <div className="ds-c-alert__body">
                        <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={this.state.siteUrl + '/work_packages/' + this.state.feedbackId} rel="noopener noreferrer">{this.state.feedbackId ? `#${this.state.feedbackId}` : null}</a></p>
                      </div>
                    </div>
                  </div> : null}
              </div>
            </form>
          </section>
        </div>
        <h4 className="usa-accordion__heading site-accordion-code">
          <button
            className="usa-accordion__button"
            aria-expanded="false"
            aria-controls="whatsNewContent"
          >What's New</button>
        </h4>
        <div id="whatsNewContent" className="usa-accordion__content usa-prose ds-u-padding-left--1 ds-u-padding-top--0" hidden>
          <ul className="ds-c-list preview__label ds-u-font-size--base ds-u-font-style--normal">
            <li>Release 3.6.0 January 22, 2020.</li>
            <ul>
              <li>Feature</li>
              <ul>
                <li>Populated the event dates and location from the schema </li>
                <li>The extension will be loaded on the right mouse click </li>
                <li>The extension injected to every tab like a widget </li>
              </ul>
            </ul>
          </ul>
        </div>
      </div>
    );
  }
}
