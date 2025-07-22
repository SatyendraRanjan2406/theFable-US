import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Phone, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BASE_URL } from '@/config/api';
import { useContact } from '@/context/ContactContext';

interface ContactFormData {
  full_name: string;
  email: string;
  phone_no: string;
  message: string;
}

const ContactFloatingButton: React.FC = () => {
  const { isContactModalOpen, openContactModal, closeContactModal } = useContact();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState<{x: number, y: number}>({ 
    x: window.innerWidth - 80, 
    y: window.innerHeight - 80 
  });
  
  // Debug log to verify component is rendering
  // console.log('ContactFloatingButton rendering, position:', position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    full_name: '',
    email: '',
    phone_no: '',
    message: ''
  });

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isContactModalOpen) return; // Don't drag when modal is open
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep button within viewport bounds
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isContactModalOpen) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart]);

  // Handle screen resize to keep button in bounds
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Thank you! Your message has been sent successfully.');
        setFormData({
          full_name: '',
          email: '',
          phone_no: '',
          message: ''
        });
        closeContactModal();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = () => {
    if (!isDragging) {
      openContactModal();
    }
  };

  return (
    <>
      {/* Breathing Animation CSS */}
      <style>{`
        @keyframes breathe {
          0% { 
            transform: scale(1);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            background: linear-gradient(135deg, #EC6B43, #D946EF);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
            background: linear-gradient(135deg, #F97316, #E879F9);
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            background: linear-gradient(135deg, #EC6B43, #D946EF);
          }
        }
      `}</style>
      
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleButtonClick}
        className={`fixed z-[9999] w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 ${isDragging ? 'cursor-grabbing' : 'cursor-grab hover:cursor-pointer'} select-none`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
          animation: 'breathe 3s ease-in-out infinite',
          background: 'linear-gradient(135deg, #EC6B43, #D946EF)'
        }}
        aria-label="Contact Us"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Contact Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#EC6B43] to-[#D946EF] text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Contact Us</h2>
                <button
                  onClick={closeContactModal}
                  className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-purple-100 text-sm mt-2">
                We'd love to hear from you! Send us a message or reach out directly.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Get in touch directly:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href="mailto:care@jcool.in" className="text-blue-600 hover:underline">
                      care@jcool.in
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-green-600" />
                    <a href="tel:+918826194899" className="text-green-600 hover:underline">
                      +91 88261 94899
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone_no" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="phone_no"
                    name="phone_no"
                    type="tel"
                    value={formData.phone_no}
                    onChange={handleInputChange}
                    className="mt-1"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message *
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1 min-h-[100px]"
                    placeholder="Tell us how we can help you..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#EC6B43] to-[#D946EF] hover:from-[#D55A3A] hover:to-[#C026D6] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactFloatingButton; 