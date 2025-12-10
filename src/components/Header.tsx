import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <header className="absolute bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8  ">
        <div className="h-14 flex items-center justify-center">
          <nav className="flex items-center space-x-4 ">
            <Link
              to="/privacy"
              className="text-md  text-[#e1252f] hover:text-[#430e10] "
            >
              Privacy Policy
            </Link>
            <span
              className="inline-block h-6 w-px bg-gray-300"
              aria-hidden="true"
            />
            <Link
              to="/terms"
              className="text-md  text-[#e1252f] hover:text-[#430e10] "
            >
              Terms of Use
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
