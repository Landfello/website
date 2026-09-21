import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import SavingsProgram from './pages/SavingsProgram';
import About from './pages/About';
import BuyLand from './pages/BuyLand';
import AddProperty from './pages/AddProperty';
import MyProperties from './pages/MyProperties';
import EditProperty from './pages/EditProperty';
import Settings from './pages/Settings';
import Sell from './pages/Sell';
import Legal from './pages/Legal';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import OwnerListingEntry from './pages/ownerListing/OwnerListingEntry';
import OwnerListingFlow from './pages/ownerListing/OwnerListingFlow';
import OwnerListingReview from './pages/ownerListing/OwnerListingReview';
import OwnerListingSuccess from './pages/ownerListing/OwnerListingSuccess';
import SellerDashboard from './pages/ownerListing/SellerDashboard';
import VerificationFeedback from './pages/ownerListing/VerificationFeedback';
import OfferReceived from './pages/ownerListing/OfferReceived';
import ClosingWorkspace from './pages/ownerListing/ClosingWorkspace';
import EscrowFlow from './pages/ownerListing/EscrowFlow';
import SaleCompleted from './pages/ownerListing/SaleCompleted';
import { Component, ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-account" element={<SignUp />} />
            <Route path="/how-it-works" element={<Navigate to="/about" replace />} />
            <Route path="/partner-program" element={<SavingsProgram />} />
            <Route path="/savings-program" element={<SavingsProgram />} />
            <Route path="/about" element={<About />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/buy" element={<BuyLand />} />
            <Route path="/buy-land" element={<BuyLand />} />
            <Route path="/add-property" element={<AddProperty />} />
            <Route path="/my-properties" element={<MyProperties />} />
            <Route path="/edit-property/:propertyId" element={<EditProperty />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/sell/owner" element={<OwnerListingEntry />} />
            <Route path="/sell/owner/dashboard" element={<SellerDashboard />} />
            <Route path="/sell/owner/listing/:id" element={<OwnerListingFlow />} />
            <Route path="/sell/owner/listing/:id/review" element={<OwnerListingReview />} />
            <Route path="/sell/owner/listing/:id/success" element={<OwnerListingSuccess />} />
            <Route path="/sell/owner/listing/:id/feedback" element={<VerificationFeedback />} />
            <Route path="/sell/owner/listing/:id/offers" element={<OfferReceived />} />
            <Route path="/sell/owner/listing/:id/closing" element={<ClosingWorkspace />} />
            <Route path="/sell/owner/listing/:id/escrow" element={<EscrowFlow />} />
            <Route path="/sell/owner/listing/:id/completed" element={<SaleCompleted />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;



