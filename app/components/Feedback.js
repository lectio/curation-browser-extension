import React from 'react';
import * as APIDATA from '../constants/apidata';

export default class Feedback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
	  loading: false,
	  feedbackId: '',
	  webUrl: '',
	  message: '',
      type: 'Bug',
      subject: 'Subject',
      description: this.props.siteUrl
    };
    this.handleType = this.handleType.bind(this);
    this.handleSubject = this.handleSubject.bind(this);
    this.handleDescription = this.handleDescription.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
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
          href: '/api/v3/types/19',
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
    fetch(`${APIDATA.BASE_URL + APIDATA.API_URL}/projects/4/work_packages/`, data)
      .then((response) => {
        if (response.status === 201) {
          // this.setState({ message: 'Saved Successfully.' });
        }
        return response.json();
      }).then((catdata) => {
        const webPackageId = catdata.id;
        this.setState({ feedbackId: webPackageId });
        this.setState({ webUrl: APIDATA.SITE_URL });
        this.setState({ message: `Saved in ${APIDATA.DOMAIN_NAME} as` });
      });
  }
  render() {
    return (
      <section className="ds-l-container">
        <form onSubmit={this.handleSubmit}>
          <div className="ds-l-row ds-u-margin-top--2">
            <div className="ds-l-col">
              <select className="ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1" value={this.state.type} onChange={this.handleType}>
                <option value="bug">Bug</option>
              </select>
            </div>
          </div>
          <div className="ds-l-row ds-u-margin-top--2">
            <div className="ds-l-col">
              <input type="text" className="ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1" name="Subject" value={this.state.subject} onChange={this.handleSubject} />
            </div>
          </div>
          <div className="ds-l-row  ds-u-margin-top--2">
            <div className="ds-l-col">
              <textarea className="ds-c-field ds-u-font-size--small ds-u-font-style--normal ds-u-border--1" name="Description" rows="17" value={this.state.description} onChange={this.handleDescription} />
            </div>
          </div>
          <hr className="on ds-u-fill--gray-lightest" />
          <div className="ds-l-row  ds-u-margin-top--0">
            <div className="ds-l-col--auto">
              <input type="submit" value="Submit" className="ds-c-button ds-c-button--primary" />
            </div>
            {this.state.message !== '' ?
              <div className="ds-c-alert ds-c-alert--success">
                <div className="ds-c-alert__body">
                  <p className="ds-c-alert__text">{this.state.message} <a target="_blank" href={APIDATA.BASE_URL + APIDATA.SITE_URL + this.state.feedbackId} rel="noopener noreferrer">{this.state.feedbackId ? `#${  this.state.feedbackId}` : null}</a></p>
                </div>
              </div> : null}
          </div>
        </form>
      </section>
    );
  }
}
