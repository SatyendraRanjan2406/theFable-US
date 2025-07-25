import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-[#333333] font-poppins">
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl md:text-4xl font-dm-serif mb-6 text-[#8D4BE5] text-center">Terms & Conditions — Storymaker by Jcool.in</h1>
        <p className="mb-6 text-lg text-gray-700 text-center">Effective Date: July 7, 2025</p>
        <p className="mb-6 text-gray-700">Welcome to Storymaker, brought to you by Parable Studios. These Terms explain how you can use our platform to create personalized storybooks for your child.</p>
        <p className="mb-6 text-gray-700">By using Storymaker, you agree to follow these Terms. If you don’t agree, please don’t use our platform.</p>

        <ol className="list-decimal list-inside space-y-6 text-gray-800">
          <li>
            <span className="font-semibold">Using Storymaker</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>You can use Storymaker to create fun, personalized stories featuring your child.</li>
              <li>You’re responsible for providing correct details (like name, gender, or photos) during the process.</li>
              <li>Stories and images are generated using AI, so small variations or changes may occur.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Orders & Payment</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Payments are handled securely via trusted partners like Shopify, Razorpay, or PayPal.</li>
              <li>Prices are shown in your local currency where possible.</li>
              <li>Orders must be paid in full before your storybook is prepared.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Approvals & Delivery</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>You’ll get a preview of your personalized story after payment.</li>
              <li>You can request changes during the preview window (up to 12 hours).</li>
              <li>If no changes are requested, your book is auto-approved and sent for download or delivery.</li>
              <li>Printed book deliveries usually take 7–8 working days (times may vary by location).</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Refunds & Changes</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>Each book is custom-made just for you — once approved (or auto-approved), we can’t offer refunds or cancellations.</li>
              <li>Please review your story carefully before confirming.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Intellectual Property</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>All images, stories, and illustrations generated on Storymaker are the property of Parable Studios.</li>
              <li>You can enjoy your story personally, but you cannot resell, copy, or redistribute the content.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Respectful Use</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>You agree to use Storymaker responsibly.</li>
              <li>Don’t upload offensive, harmful, or illegal content.</li>
              <li>We reserve the right to block misuse of the platform.</li>
            </ul>
          </li>
          <li>
            <span className="font-semibold">Updates to These Terms</span>
            <p className="ml-6 mt-2 text-gray-600">We may update these Terms from time to time. Using Storymaker after updates means you accept the new Terms.</p>
          </li>
          <li>
            <span className="font-semibold">Need Help?</span>
            <ul className="list-disc list-inside ml-6 mt-2 text-gray-600">
              <li>📧 care@jcool.in</li>
              <li>🏢 Parable Studios, Gurugram, India</li>
            </ul>
          </li>
        </ol>
      </main>
    </div>
  );
} 