import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#333333] font-poppins">
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl md:text-4xl font-dm-serif mb-6 text-[#8D4BE5] text-center">Privacy Policy — Storymaker by Jcool.in</h1>
        <p className="mb-6 text-lg text-gray-700 text-center">Effective Date: 7th July 2025</p>
        <p className="mb-6 text-gray-700">At <span className="font-semibold">Parable Studios</span>, your privacy is our priority. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use <span className="font-semibold">Storymaker by Jcool.in</span>, our platform that allows you to create magical, personalized storybooks for children.</p>

        <ol className="list-decimal list-inside space-y-6 text-gray-800">
          <li>
            <span className="font-semibold">Information We Collect</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Your child’s name and gender (to personalize the story)</li>
              <li>Uploaded images of your child (optional, for character illustrations)</li>
              <li>Parent or guardian's email address</li>
              <li>Order details, including delivery information and payment status (via Shopify, Razorpay, or PayPal)</li>
              <li>IP address and general location (for compliance and platform security)</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">How We Use Your Information</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Generate personalized stories and illustrations featuring your child</li>
              <li>Process orders, send confirmation emails, and provide delivery updates</li>
              <li>Ensure secure transactions and prevent fraud</li>
              <li>Improve our platform experience, design, and functionality</li>
              <li>Comply with legal, regulatory, or contractual requirements</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Legal Basis for Processing</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Your explicit consent when uploading personal information</li>
              <li>Our legitimate interest in providing a seamless, personalized experience</li>
              <li>Fulfilling contractual obligations to process and deliver your order</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Data Retention</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>We retain your personal information only as long as necessary to fulfill your order, provide after-sales support, and improve our services (using anonymized or aggregated data).</li>
              <li>Uploaded images and personal details may be deleted after a defined period, except where retention is required for legal or operational reasons.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Sharing with Third Parties</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>We only share your information with trusted service partners essential to fulfilling your order, including payment processors (e.g., PayPal, Razorpay), order and fulfillment platforms (e.g., Shopify), and cloud hosting, storage, and image generation services.</li>
              <li>All third-party partners follow strict confidentiality and security standards. We never sell or rent your personal data.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Your Rights</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>✔ Access the personal data we hold about you</li>
              <li>✔ Request correction, update, or deletion of your data</li>
              <li>✔ Withdraw your consent at any time</li>
              <li>✔ Raise concerns with a relevant data protection authority</li>
            </ul>
            <p className="mt-2 text-gray-600">To exercise your rights, please contact us at <a href="mailto:care@jcool.in" className="text-[#8D4BE5] underline">care@jcool.in</a>.</p>
          </li>
          <li>
            <span className="font-semibold">Data Security</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Encryption of sensitive information</li>
              <li>Secure file storage systems</li>
              <li>Restricted internal access to personal data</li>
              <li>Continuous monitoring and improvement of our data protection practices</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Children's Privacy</span>
            <p className="ml-6 mt-2 text-gray-600">Storymaker is intended for use by parents and guardians. We do not knowingly collect personal information directly from children. All submissions must be made by a consenting adult.</p>
          </li>
          <li>
            <span className="font-semibold">International Data Transfers</span>
            <p className="ml-6 mt-2 text-gray-600">If you are using Storymaker from outside India, your data may be transferred to, stored, and processed in India or other regions where our partners operate. We ensure these transfers comply with applicable data protection laws.</p>
          </li>
          <li>
            <span className="font-semibold">Changes to This Policy</span>
            <p className="ml-6 mt-2 text-gray-600">We may update this Privacy Policy periodically. Changes will be posted on this page with a revised Effective Date. We encourage you to review the policy regularly.</p>
          </li>
          <li>
            <span className="font-semibold">Contact Us</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Email: <a href="mailto:care@jcool.in" className="text-[#8D4BE5] underline">care@jcool.in</a></li>
              <li>Company: Parable Studios</li>
              <li>Address: Gurugram, India</li>
            </ul>
          </li>
        </ol>
      </main>
    </div>
  );
} 