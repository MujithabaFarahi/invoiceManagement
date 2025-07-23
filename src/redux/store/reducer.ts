import { combineReducers } from '@reduxjs/toolkit';
import paymentSlice from '../features/paymentSlice';
import invoiceSlice from '../features/invoiceSlice';

const rootReducer = combineReducers({
  payment: paymentSlice,
  invoice: invoiceSlice,
});

export default rootReducer;
