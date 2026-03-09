import React from 'react';

export default function Toast({ message, type }) {
  return <div className={`toast ${type}`}>{message}</div>;
}
