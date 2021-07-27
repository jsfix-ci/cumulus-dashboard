import { createReducer } from '@reduxjs/toolkit';
import {
  SORTS,
} from '../actions/types';

export const initialState = {
  granulesTable: [],
};
export default createReducer(initialState, {
  [SORTS]: (state, action) => {
    state[action.tableID] = action.sortBy;
    console.log(action);
  },
});
