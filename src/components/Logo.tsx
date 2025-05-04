
import React from 'react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-venus-blue text-3xl font-bold">
        <span className="flex items-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path
              d="M24 4L18 10L12 4L6 10L0 4V22L6 16L12 22L18 16L24 22V4Z"
              fill="#33C3F0"
            />
          </svg>
          VENUS
        </span>
      </div>
    </div>
  );
};

export default Logo;
