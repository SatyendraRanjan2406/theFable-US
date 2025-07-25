import React from 'react';
import { Link } from 'react-router-dom';
import { useContact } from '@/context/ContactContext';

const Footer: React.FC = () => {
  const { openContactModal } = useContact();

  return (
    <footer className="relative bg-[#18181B] text-white mt-16 pt-12 pb-4 w-full">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#8D4BE5] via-[#D946EF] to-[#EC6B43] rounded-t-lg" />
      <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 pb-10 bg-[#18181B] rounded-2xl shadow-lg px-6 md:px-10 pt-10">
        {/* Quick Links */}
        <div>
          <h3 className="uppercase tracking-wider font-semibold mb-6 text-gray-100 text-lg">Quick Links</h3>
          <ul className="space-y-3 text-gray-400 text-base">
            <li><Link to="/privacy" className="hover:text-[#8D4BE5] hover:underline transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-[#8D4BE5] hover:underline transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/payment-refund-policy" className="hover:text-[#8D4BE5] hover:underline transition-colors">Payment & Refund Policy</Link></li>
            <li><a href="mailto:care@jcool.in" className="hover:text-[#8D4BE5] hover:underline transition-colors">Contact Us</a></li>
          </ul>
        </div>
        {/* Contact Us */}
        <div>
          <h3 className="uppercase tracking-wider font-semibold mb-6 text-gray-100 text-lg">Contact Us</h3>
          <div className="space-y-4 text-gray-400 text-base">
            <div>
              <p className="mb-2">Write to us at:</p>
              <a href="mailto:care@jcool.in" className="text-[#8D4BE5] hover:underline transition-colors font-medium">care@jcool.in</a>
            </div>
            <div>
              <p className="mb-2">Pick up the phone and call us at:</p>
              <a href="tel:+918826194899" className="text-[#8D4BE5] hover:underline transition-colors font-medium">+91 8826194899</a>
            </div>
            <div className="mt-4">
              <p className="text-gray-300">Parable Studios, Gurugram, India</p>
            </div>
          </div>
        </div>
        {/* Support */}
        <div>
          <h3 className="uppercase tracking-wider font-semibold mb-6 text-gray-100 text-lg">Support</h3>
          <div className="space-y-4 text-gray-400 text-base">
            <p>Need help with payments or have questions about our refund policy?</p>
            <button 
              onClick={openContactModal}
              className="bg-gradient-to-r from-[#8D4BE5] to-[#D946EF] text-white px-4 py-2 rounded-lg hover:from-[#6B21A8] hover:to-[#C026D6] transition-all duration-300 text-sm font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
      {/* Cookie Notice Bar */}
      <div className="text-center text-xs text-gray-400 bg-[#232326] py-3 mt-8 rounded-b-lg shadow-inner">
        We use cookies to improve your experience. By using this site, you agree to our use of cookies.
      </div>
      {/* Copyright Bar */}
      <div className="text-center text-xs text-gray-500 mt-2 pb-2">
        StoryMaker.jcool.in © 2025 Parable Studios Private Limited. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer; 