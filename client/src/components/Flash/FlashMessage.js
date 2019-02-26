import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Transition } from 'react-transition-group';
import { Alert } from '@freecodecamp/react-bootstrap';

const propTypes = {
  children: PropTypes.any,
  onClose: PropTypes.func.isRequired,
  timeout: PropTypes.number,
  type: PropTypes.string
};

class FlashMessage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true
    };
    this.timer = null;

    this.onDismiss = this.onDismiss.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  onDismiss() {
    clearTimeout(this.timer);
    this.setState({ show: false });
  }

  handleExit() {
    this.props.onClose();
  }

  componentDidMount() {
    if (this.props.timeout) {
      this.timer = setTimeout(() => this.onDismiss(), this.props.timeout);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    return (
      <Transition
        appear={true}
        in={this.state.show}
        onExited={this.handleExit}
        timeout={{
          enter: 0,
          exit: 500
        }}
      >
        {state => (
          <div className={`flash-message ${state}`}>
            <Alert
              bsStyle={this.props.type}
              className='flash-message'
              onDismiss={this.onDismiss}
            >
              <div className='message-container'>{this.props.children}</div>
            </Alert>
          </div>
        )}
      </Transition>
    );
  }
}

FlashMessage.displayName = 'FlashMessage';
FlashMessage.propTypes = propTypes;

export default FlashMessage;
