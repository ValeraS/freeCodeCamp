import React from 'react';
import PropTypes from 'prop-types';

import FlashMessage from './FlashMessage';

import './flash.css';

function createDismissHandler(fn, id) {
  return () => fn(id);
}

function Flash({ messages, onClose }) {
  return (
    <div className='flash-container top-right'>
      {messages.map(({ type, message, id }) => (
        <FlashMessage
          key={id}
          onClose={createDismissHandler(onClose, id)}
          timeout={5000}
          type={type}
        >
          <div dangerouslySetInnerHTML={{ __html: message }} />
        </FlashMessage>
      ))}
    </div>
  );
}

Flash.displayName = 'FlashMessages';
Flash.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      message: PropTypes.string
    })
  ),
  onClose: PropTypes.func.isRequired
};

export default Flash;
