import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingFlowPage from './pages/BookingFlowPage';
import ConfirmationPage from './pages/ConfirmationPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import AdminPanelWrapperPage from './pages/AdminPanelWrapperPage';
import { AuthContext, LanguageContext } from './contexts';

const App = () => {
  const { authState } = useContext(AuthContext);
  const { languageState, setLanguageState } = useContext(LanguageContext);

  return (
    <Router>
      <nav>
        <button onClick={() => setLanguageState(languageState === 'EN' ? 'AR' : 'EN')}>
          {languageState}
        </button>
        {authState.isAuthenticated ? (
          <Link to="/logout">Logout</Link>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </nav>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/book" component={BookingFlowPage} />
        <Route path="/booking/:id" component={ConfirmationPage} />
        <Route path="/my-bookings" component={CustomerDashboardPage} />
        <Route path="/admin" component={AdminPanelWrapperPage} />
      </Switch>
    </Router>
  );
};

export default App;

Note: This is a simplified version of your code. You need to define the pages and contexts in separate files, handle authentication logic, create context providers, etc. Also, this does not include any styling or UI library like Material-UI or Bootstrap, which you would typically use for a production application.