
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-venus-dark text-white px-4">
      <div className="text-center">
        <h1 className="text-venus-blue text-6xl font-bold mb-6">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-slate-300 mb-8 max-w-md">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>
        <Button 
          className="bg-venus-blue hover:bg-blue-600 text-white px-8 py-6 text-lg"
          onClick={() => navigate('/')}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
