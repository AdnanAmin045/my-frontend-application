import { registerRootComponent } from 'expo';
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import App from './App';

const Root = () => (
  <StripeProvider publishableKey="pk_test_51QSvzYKypTY7oIgzOOL1YmzYuVdsVWV283maYMsfdVmVzx3qWx9fjrMZjZtFZ1r3rBdPLTgy7mjWyPALuMSgt4XD00hWi1v66Z">
    <App />
  </StripeProvider>
);

registerRootComponent(Root);
