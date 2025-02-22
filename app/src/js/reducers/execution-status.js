import { createReducer } from '@reduxjs/toolkit';
import {
  EXECUTION_STATUS,
  EXECUTION_STATUS_INFLIGHT,
  EXECUTION_STATUS_ERROR,
  SEARCH_EXECUTION_EVENTS,
  CLEAR_EXECUTION_EVENTS_SEARCH,
} from '../actions/types';

export const initialState = {
  execution: null,
  executionHistory: null,
  stateMachine: null,
  searchString: null,
  inflight: false,
  error: false,
  meta: {},
  map: {}
};

const typeContains = (string) => ({ type }) => type.toLowerCase().includes(string.toLowerCase());

export default createReducer(initialState, {
  [EXECUTION_STATUS]: (state, action) => {
    const { data } = action;
    state.inflight = false;
    state.error = false;
    state.execution = data.execution;
    state.executionHistory = data.executionHistory;
    state.stateMachine = data.stateMachine;
    state.warning = data.warning;

    if (state.searchString) {
      state.executionHistory.events = data.executionHistory.events.filter(
        typeContains(state.searchString)
      );
    }

    const { map, ...restOfState } = state;

    state.map[action.id] = restOfState;
  },
  [EXECUTION_STATUS_INFLIGHT]: (state, action) => {
    state.inflight = true;
    state.map[action.id] = { inflight: true };
  },
  [EXECUTION_STATUS_ERROR]: (state, action) => {
    state.inflight = false;
    state.error = action.error;
    state.map[action.id] = {
      inflight: false,
      error: action.error,
    };
  },
  [SEARCH_EXECUTION_EVENTS]: (state, action) => {
    state.searchString = action.searchString;
  },
  [CLEAR_EXECUTION_EVENTS_SEARCH]: (state) => {
    state.searchString = null;
  },
});
