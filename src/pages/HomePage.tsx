import React from 'react';
import { 
  QrCode, 
  Users, 
  CalendarCheck, 
  Mail, 
  BarChart, 
  Lock, 
  Check
} from 'lucide-react';

const HomePage = () => {
  
  const features = [
    { 
      id: "qrcodes", 
      icon: <QrCode className="h-6 w-6" />, 
      title: "QR Code Management", 
      description: "Generate secure and unique QR codes for up to 1,000 participants with customizable usage limits." 
    },
    { 
      id: "participants", 
      icon: <Users className="h-6 w-6" />, 
      title: "Participant Registration", 
      description: "Add participants individually or import them in bulk via CSV files with automatic duplicate detection." 
    },
    { 
      id: "checkin", 
      icon: <CalendarCheck className="h-6 w-6" />, 
      title: "Real-time Check-in", 
      description: "Scan and validate QR codes on the spot with immediate feedback and attendance tracking." 
    },
    { 
      id: "email", 
      icon: <Mail className="h-6 w-6" />, 
      title: "Email Communications", 
      description: "Create custom email templates and send QR codes to participants with personalized messages." 
    },
    { 
      id: "analytics", 
      icon: <BarChart className="h-6 w-6" />, 
      title: "Attendance Analytics", 
      description: "View real-time statistics and export detailed reports of event attendance." 
    },
    { 
      id: "security", 
      icon: <Lock className="h-6 w-6" />, 
      title: "Enhanced Security", 
      description: "Secure access control with usage limits, IP tracking, and QR code revocation capabilities." 
    }
  ];
  
  const eventTypes = [
    "Corporate Conferences",
    "Music Festivals",
    "Academic Symposiums",
    "Sports Competitions",
    "Networking Events",
    "Workshops & Training",
    "Product Launches",
    "Private Parties"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {/* Consider replacing with a more subtle pattern or removing */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTBoMnY2eiIvPjwvZz48L2c+PC9zdmc+')] bg-center" />
        </div>
        <div className="relative container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="text-center md:text-left md:w-1/2">
              <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
                QR Access Manager
              </h1>
              <p className="mt-6 text-xl text-primary-foreground/90 max-w-lg mx-auto md:mx-0">
                Streamline event access control with secure QR codes, real-time check-ins, and comprehensive attendance tracking.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <a
                  href="/signup" // Changed to signup
                  className="rounded-md bg-primary-foreground px-8 py-3 text-base font-medium text-primary shadow hover:bg-primary-foreground/90"
                >
                  Get Started
                </a>
                {/* Consider adding a link to a public demo page if available */}
                {/* <a
                  href="/demo"
                  className="rounded-md bg-primary/80 px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/70"
                >
                  View Demo
                </a> */}
              </div>
            </div>
            <div className="mt-10 md:mt-0 md:w-1/2 flex justify-center md:justify-end">
              <div className="relative w-64 h-64 md:w-80 md:h-80">
                <div className="absolute inset-0 bg-card rounded-lg shadow-lg flex items-center justify-center">
                  <QrCode className="w-32 h-32 md:w-40 md:h-40 text-primary" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-success rounded-full p-4 shadow-lg">
                  <Check className="w-6 h-6 text-success-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Everything you need for seamless event access
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
              From registration to check-in, our platform simplifies every step of the event management process.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div 
                key={feature.id} 
                className="relative rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-primary-foreground">
                      {feature.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-foreground">{feature.title}</h3>
                  </div>
                </div>
                <p className="mt-4 text-base text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* How It Works */}
      <div className="py-16 bg-muted/30"> {/* Adjusted background */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
              A simple three-step process for managing your event access
            </p>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Create & Configure",
                description: "Set up your event with customizable parameters including participant limits and QR code usage restrictions.",
                icon: <CalendarCheck className="h-8 w-8 text-primary" />
              },
              {
                step: 2,
                title: "Register & Distribute",
                description: "Add participants manually or via bulk import, then send personalized QR codes via email.",
                icon: <QrCode className="h-8 w-8 text-primary" />
              },
              {
                step: 3,
                title: "Scan & Track",
                description: "Use our web-based scanner for check-ins and monitor attendance analytics in real-time.",
                icon: <BarChart className="h-8 w-8 text-primary" />
              }
            ].map((step) => (
              <div key={step.step} className="relative flex flex-col items-center p-6 bg-card rounded-lg shadow-sm border border-border"> {/* Adjusted background and border */}
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold"> {/* Adjusted background and text color */}
                  {step.step}
                </div>
                <h3 className="mt-8 text-xl font-medium text-foreground">{step.title}</h3>
                <div className="mt-2 mb-6">{step.icon}</div>
                <p className="text-center text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Use Cases */}
      <div className="py-16 bg-background"> {/* Adjusted background */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              Perfect For All Event Types
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
              Our flexible platform adapts to various event formats and sizes
            </p>
          </div>
          
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {eventTypes.map((type) => (
              <div key={type} className="bg-muted/50 rounded-lg p-4 text-center border border-border"> {/* Adjusted background and border */}
                <span className="text-foreground font-medium">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-primary"> {/* Adjusted background */}
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-primary-foreground/90">Manage your next event with ease.</span> {/* Adjusted text color */}
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="/signup"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-primary-foreground hover:bg-primary-foreground/90"
              >
                Sign up for free
              </a>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary/80 hover:bg-primary/70"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-card"> {/* Adjusted background */}
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Product</h3> {/* Adjusted text color */}
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Features</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Pricing</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Demo</a></li> {/* Adjusted text colors */}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Support</h3> {/* Adjusted text color */}
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Documentation</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Help Center</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Contact</a></li> {/* Adjusted text colors */}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Company</h3> {/* Adjusted text color */}
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">About</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Blog</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Careers</a></li> {/* Adjusted text colors */}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-wider uppercase">Legal</h3> {/* Adjusted text color */}
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Privacy</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Terms</a></li> {/* Adjusted text colors */}
                <li><a href="#" className="text-base text-muted-foreground hover:text-foreground">Security</a></li> {/* Adjusted text colors */}
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-border pt-8"> {/* Adjusted border color */}
            <p className="text-base text-muted-foreground text-center"> {/* Adjusted text color */}
              &copy; {new Date().getFullYear()} QR Access Manager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
