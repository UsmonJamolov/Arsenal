const { createInitialState } = require("../data/seed");

let state = createInitialState();

function getState() {
  return state;
}

function resetState() {
  state = createInitialState();
  return state;
}

function pushNotification(message) {
  state.notifications = [message, ...state.notifications.slice(0, 3)];
}

module.exports = {
  getState,
  resetState,
  pushNotification,
};
