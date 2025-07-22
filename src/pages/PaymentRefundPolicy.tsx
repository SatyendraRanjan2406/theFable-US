import React from 'react';
import { Link } from 'react-router-dom';

export default function PaymentRefundPolicy() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#333333] font-poppins">
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl md:text-4xl font-dm-serif mb-6 text-[#8D4BE5] text-center">Payment and Refund Policy — Storymaker by Jcool.in</h1>
        <p className="mb-6 text-lg text-gray-700 text-center">Effective Date: January 1, 2025</p>
        
        <p className="mb-6 text-gray-700">Welcome to Storymaker.jcool.in, a platform that brings storytelling to life through personalized digital content. Please read this Payment and Refund Policy carefully before making any purchases.</p>

        <div className="space-y-8">
          {/* Payment Policy Section */}
          <div>
            <h2 className="text-2xl font-dm-serif mb-4 text-[#8D4BE5]">💳 Payment Policy</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">1. Pricing & Currency</h3>
                <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                  <li>All prices displayed on the platform are in Indian Rupees (INR) by default.</li>
                  <li>We also accept payments in USD and other international currencies as made available and set by the company from time to time.</li>
                  <li>Currency selection may be based on your location or choice at checkout.</li>
                  <li>Prices are inclusive of applicable taxes unless specified otherwise.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2. Payment Methods</h3>
                <p className="text-gray-600 mb-2">We accept payments through secure and reliable payment gateways including:</p>
                <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                  <li>Credit/Debit Cards</li>
                  <li>UPI</li>
                  <li>Net Banking</li>
                  <li>Wallets</li>
                  <li>International cards</li>
                  <li>Other supported local and global payment methods</li>
                </ul>
                <p className="text-gray-600 mt-2">All transactions are encrypted and securely processed.</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3. Billing and Receipts</h3>
                <p className="text-gray-600">Upon successful payment, you will receive a confirmation email and receipt at your registered email address. Please retain this for your records.</p>
              </div>
            </div>
          </div>

          {/* Refund Policy Section */}
          <div>
            <h2 className="text-2xl font-dm-serif mb-4 text-[#8D4BE5]">🔁 Refund Policy</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-gray-700">All stories and digital experiences offered on Storymaker.jcool.in are delivered instantly online. Once a product is accessed, it is considered delivered and non-refundable.</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">❌ Non-Refundable Scenarios</h3>
                <p className="text-gray-600 mb-2">We do not offer refunds for:</p>
                <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                  <li>Story downloads or creations once accessed</li>
                  <li>Accidental purchases</li>
                  <li>Dissatisfaction due to personal preferences</li>
                  <li>Incompatibility with user's device or browser (unless platform-wide issue)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">✅ Refunds May Be Considered If:</h3>
                <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                  <li>You were charged more than once for the same purchase</li>
                  <li>A technical issue on our platform prevented access to the purchased content</li>
                  <li>There was an unauthorized or fraudulent charge</li>
                </ul>
                <p className="text-gray-600 mt-2">In such cases, please contact us within 5 days of the transaction.</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">📧 Contact for Refund Requests:</h3>
                <p className="text-gray-600 mb-2">Email: <a href="mailto:care@jcool.in" className="text-blue-600 hover:underline">care@jcool.in</a></p>
                <p className="text-gray-600 mb-2">Include:</p>
                <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                  <li>Transaction ID</li>
                  <li>Registered email address</li>
                  <li>Description of the issue</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🕒 Processing Time:</h3>
                <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
                  <li>Approved refunds will be processed within 5–7 business days</li>
                  <li>Refunds will be credited to the original method of payment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <h2 className="text-2xl font-dm-serif mb-4 text-[#8D4BE5]">🧠 Questions?</h2>
            <p className="text-gray-700 mb-4">If you have any concerns regarding payments or refunds, please don't hesitate to contact:</p>
            <ul className="list-disc list-inside ml-6 text-gray-600 space-y-1">
              <li>📧 <a href="mailto:care@jcool.in" className="text-blue-600 hover:underline">care@jcool.in</a></li>
              <li>🏢 Parable Studios, Gurugram, India</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
} 