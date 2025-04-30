import React, { useState } from 'react';
import UserFetcher from './components/UserFetcher';
import Dashboard from './components/Dashboard';

function App() {
  const [profileUrl, setProfileUrl] = useState('');

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <header className="py-8">
        <h1 className="text-3xl font-bold text-center text-zinc-200">Reddit User Data Viewer</h1>
      </header>

      <main className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Pass setProfileUrl to UserFetcher */}
          <UserFetcher setProfileUrl={setProfileUrl} />
          
          {/* Pass profileUrl to Dashboard */}
          <Dashboard profileUrl={profileUrl} />
        </div>
      </main>

      <footer className="py-4 text-center text-zinc-500">
        <p>&copy; 2025 Reddit Data Viewer. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;